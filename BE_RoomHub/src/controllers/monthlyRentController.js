import PaymentBill from "../models/paymentBill.js";
import UserPayment from "../models/userPayment.js";
import Room from "../models/room.js";
import RoomAdditionalFees from "../models/roomAdditionalFees.js";
import DepositRoom from "../models/depositRoom.js";
import { buildRentDeadlines } from "../utils/paymentPolicy.js";
import {
  formatDateTimeVi,
  formatVnd,
  sendPaymentEmail,
} from "../utils/paymentEmail.js";

const BILL_STATUS = {
  PENDING: "Pending",
  OVERDUE: "Overdue",
  DONE: "Done",
  CANCEL: "Cancel",
};

const LEGACY_PAID_STATUS = "Paid";
const MANAGED_BILL_STATUSES = Object.values(BILL_STATUS);
const RENT_DEPOSIT_STATUSES = ["confirmed"];

const roundMoney = (value) => Math.round(Number(value || 0));

const getPreviousPeriod = () => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

const getPeriodRange = (month, year) => {
  const periodStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

  return {
    periodStart,
    periodEnd,
  };
};

const getBillRoomId = (bill) => bill?.roomId?._id || bill?.roomId;

const getUserDepositFilterForBill = (userId, bill) => {
  const roomId = getBillRoomId(bill);

  if (!userId || !roomId || !bill?.month || !bill?.year) {
    return null;
  }

  const { periodStart, periodEnd } = getPeriodRange(bill.month, bill.year);

  return {
    accountId: userId,
    roomId,
    status: { $in: RENT_DEPOSIT_STATUSES },
    startDate: { $lte: periodEnd },
    endDate: { $gte: periodStart },
  };
};

const isDepositMatchedWithBill = (deposit, bill) => {
  const roomId = getBillRoomId(bill);

  if (!deposit || !roomId || !bill?.month || !bill?.year) {
    return false;
  }

  const { periodStart, periodEnd } = getPeriodRange(bill.month, bill.year);

  return (
    deposit.roomId?.toString() === roomId.toString() &&
    new Date(deposit.startDate) <= periodEnd &&
    new Date(deposit.endDate) >= periodStart
  );
};

const hasRentedRoomForBill = async (userId, bill, depositRoomId = null) => {
  if (depositRoomId) {
    const deposit = await DepositRoom.findOne({
      _id: depositRoomId,
      accountId: userId,
      status: { $in: RENT_DEPOSIT_STATUSES },
    }).lean();

    if (isDepositMatchedWithBill(deposit, bill)) {
      return true;
    }
  }

  const depositFilter = getUserDepositFilterForBill(userId, bill);

  return depositFilter ? Boolean(await DepositRoom.exists(depositFilter)) : false;
};

class MonthlyRentController {
  async getManagedRentPayments(req, res) {
    try {
      const { boardingHouseId, roomId, tenantId, month, year, status } =
        req.query;

      const paymentFilter = {};
      const billFilter = {};

      if (tenantId) {
        paymentFilter.accountId = tenantId;
      }

      if (status) {
        paymentFilter.status = status;
      }

      if (month) {
        billFilter.month = Number(month);
      }

      if (year) {
        billFilter.year = Number(year);
      }

      if (roomId) {
        billFilter.roomId = roomId;
      }

      const userPayments = await UserPayment.find(paymentFilter)
        .populate("accountId", "fullname email phoneNumber username")
        .populate({
          path: "paymentBillId",
          match: billFilter,
          populate: {
            path: "roomId",
            populate: [
              {
                path: "roomTypeId",
                select: "typeName price peopleNumber",
              },
              {
                path: "boardingHouseId",
                select: "name ownerId staffId electricityPrice waterPrice",
              },
            ],
          },
        })
        .sort({ createdAt: -1 });

      const userId = req.user.userId;
      const managedPayments = userPayments.filter((payment) => {
        const bill = payment.paymentBillId;
        const room = bill?.roomId;
        const boardingHouse = room?.boardingHouseId;

        if (!bill || !room || !boardingHouse) {
          return false;
        }

        if (
          boardingHouseId &&
          boardingHouse._id?.toString() !== boardingHouseId
        ) {
          return false;
        }

        return (
          boardingHouse.ownerId?.toString() === userId ||
          boardingHouse.staffId?.toString() === userId
        );
      });

      const summary = managedPayments.reduce(
        (result, payment) => {
          const amount = Number(payment.paymentAmount || 0);
          result.totalAmount += amount;
          result.totalPayments += 1;

          if ([BILL_STATUS.DONE, LEGACY_PAID_STATUS].includes(payment.status)) {
            result.paidAmount += amount;
            result.paidPayments += 1;
          } else if (payment.status === BILL_STATUS.PENDING) {
            result.pendingAmount += amount;
            result.pendingPayments += 1;
          } else {
            result.failedPayments += 1;
          }

          return result;
        },
        {
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          totalPayments: 0,
          paidPayments: 0,
          pendingPayments: 0,
          failedPayments: 0,
        }
      );

      return res.status(200).json({
        success: true,
        data: managedPayments,
        summary,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getManagedMonthlyRents(req, res) {
    try {
      const { roomId, month, year, status } = req.query;

      const filter = {};

      if (roomId) {
        filter.roomId = roomId;
      }

      if (month) {
        filter.month = Number(month);
      }

      if (year) {
        filter.year = Number(year);
      }

      if (status) {
        filter.status = status;
      }

      const bills = await PaymentBill.find(filter)
        .populate({
          path: "roomId",
          populate: [
            {
              path: "roomTypeId",
              select: "typeName price peopleNumber",
            },
            {
              path: "boardingHouseId",
              select: "name electricityPrice waterPrice ownerId staffId",
            },
            {
              path: "rentBy",
              select: "fullname email phoneNumber",
            },
          ],
        })
        .sort({ year: -1, month: -1, createdAt: -1 });

      const userId = req.user.userId;
      const managedBills = bills.filter((bill) => {
        const boardingHouse = bill.roomId?.boardingHouseId;
        return (
          boardingHouse?.ownerId?.toString() === userId ||
          boardingHouse?.staffId?.toString() === userId
        );
      });

      const managedBillIds = managedBills.map((bill) => bill._id);
      const billPayments = await UserPayment.find({
        paymentBillId: { $in: managedBillIds },
      })
        .populate("accountId", "fullname username email phoneNumber")
        .lean();
      const tenantMap = billPayments.reduce((result, payment) => {
        const billId = payment.paymentBillId?.toString();
        const tenant = payment.accountId;

        if (!billId || !tenant) {
          return result;
        }

        if (!result[billId]) {
          result[billId] = [];
        }

        if (!result[billId].some((item) => item._id?.toString() === tenant._id?.toString())) {
          result[billId].push(tenant);
        }

        return result;
      }, {});
      const managedBillsWithTenants = managedBills.map((bill) => ({
        ...bill.toObject(),
        tenants: tenantMap[bill._id.toString()] || [],
      }));

      return res.status(200).json({
        success: true,
        data: managedBillsWithTenants,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getManagedMonthlyRentDetail(req, res) {
    try {
      const bill = await PaymentBill.findById(req.params.billId)
        .populate({
          path: "roomId",
          populate: [
            {
              path: "roomTypeId",
              select: "typeName price peopleNumber",
            },
            {
              path: "boardingHouseId",
              select: "name electricityPrice waterPrice ownerId staffId",
            },
            {
              path: "rentBy",
              select: "fullname email phoneNumber",
            },
          ],
        });

      if (!bill) {
        return res.status(404).json({
          success: false,
          message: "Payment bill not found",
        });
      }

      const boardingHouse = bill.roomId?.boardingHouseId;
      const userId = req.user.userId;

      if (
        boardingHouse?.ownerId?.toString() !== userId &&
        boardingHouse?.staffId?.toString() !== userId
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view this payment bill.",
        });
      }

      const userPayments = await UserPayment.find({
        paymentBillId: bill._id,
      }).populate("accountId", "fullname email phoneNumber");

      return res.status(200).json({
        success: true,
        data: {
          bill,
          userPayments,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async updateManagedMonthlyRentStatus(req, res) {
    try {
      const { billId } = req.params;
      const { status } = req.body;

      if (!MANAGED_BILL_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be Pending, Done, or Cancel.",
        });
      }

      const bill = await PaymentBill.findById(billId).populate({
        path: "roomId",
        populate: {
          path: "boardingHouseId",
          select: "ownerId staffId",
        },
      });

      if (!bill) {
        return res.status(404).json({
          success: false,
          message: "Payment bill not found",
        });
      }

      const boardingHouse = bill.roomId?.boardingHouseId;
      const userId = req.user.userId;

      if (
        boardingHouse?.ownerId?.toString() !== userId &&
        boardingHouse?.staffId?.toString() !== userId
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this payment bill.",
        });
      }

      bill.status = status;
      await bill.save();

      await UserPayment.updateMany(
        { paymentBillId: bill._id },
        {
          $set: {
            status,
            paymentMethod: status === BILL_STATUS.DONE ? "Cash" : "Unpaid",
          },
        }
      );

      const updatedBill = await PaymentBill.findById(bill._id).populate({
        path: "roomId",
        populate: [
          {
            path: "roomTypeId",
            select: "typeName price peopleNumber",
          },
          {
            path: "boardingHouseId",
            select: "name electricityPrice waterPrice ownerId staffId",
          },
          {
            path: "rentBy",
            select: "fullname email phoneNumber",
          },
        ],
      });

      const userPayments = await UserPayment.find({
        paymentBillId: bill._id,
      }).populate("accountId", "fullname email phoneNumber");

      return res.status(200).json({
        success: true,
        message: "Monthly rent status updated successfully",
        data: {
          bill: updatedBill,
          userPayments,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async calculateMonthlyRent(req, res) {
    try {
      const { roomId } = req.params;
      const {
        month,
        year,
        currentElectricityReading,
        currentWaterReading,
      } = req.body;

      const period = {
        month: Number(month || getPreviousPeriod().month),
        year: Number(year || getPreviousPeriod().year),
      };

      if (
        !Number.isInteger(period.month) ||
        period.month < 1 ||
        period.month > 12 ||
        !Number.isInteger(period.year) ||
        period.year < 2000
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid billing period. Month must be 1-12 and year must be valid.",
        });
      }

      const room = await Room.findById(roomId)
        .populate("rentBy", "fullname email phoneNumber")
        .populate("roomTypeId", "typeName price peopleNumber")
        .populate("boardingHouseId", "name electricityPrice waterPrice ownerId staffId");

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      const boardingHouse = room.boardingHouseId;
      const userId = req.user.userId;

      if (
        boardingHouse?.ownerId?.toString() !== userId &&
        boardingHouse?.staffId?.toString() !== userId
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to calculate rent for this room.",
        });
      }

      const existingBill = await PaymentBill.findOne({
        roomId,
        month: period.month,
        year: period.year,
      });

      if (existingBill) {
        return res.status(409).json({
          success: false,
          code: "MONTHLY_RENT_BILL_EXISTS",
          message: `Bill for ${period.month}/${period.year} already exists.`,
          data: {
            bill: existingBill,
          },
        });
      }

      const { periodStart, periodEnd } = getPeriodRange(
        period.month,
        period.year
      );
      const activeDeposits = await DepositRoom.find({
        roomId,
        status: { $in: RENT_DEPOSIT_STATUSES },
        startDate: { $lte: periodEnd },
        endDate: { $gte: periodStart },
      })
        .populate("accountId", "fullname email phoneNumber")
        .lean();

      if (!activeDeposits.length) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot calculate monthly rent because this room has no confirmed tenant for this billing period.",
          billingPeriod: {
            month: period.month,
            year: period.year,
            startDate: periodStart,
            endDate: periodEnd,
          },
        });
      }

      // rentBy has been populated above, so each item may be a Mongoose document
      // instead of a raw ObjectId. Always compare using the tenant _id.
      const renterIds = new Set(
        (room.rentBy || [])
          .map((tenant) => tenant?._id || tenant)
          .filter(Boolean)
          .map((tenantId) => tenantId.toString())
      );

      const acceptedTenants = [
        ...new Map(
          activeDeposits
            .filter(
              (deposit) =>
                deposit.accountId &&
                renterIds.has(deposit.accountId._id.toString())
            )
            .map((deposit) => [
              deposit.accountId._id.toString(),
              {
                account: deposit.accountId,
                depositRoomId: deposit._id,
              },
            ])
        ).values(),
      ];

      if (!acceptedTenants.length) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot calculate monthly rent because confirmed tenant information is missing.",
        });
      }

      const previousElectricityReading = Number(room.previousElectricityReading || 0);
      const previousWaterReading = Number(room.previousWaterReading || 0);
      const electricityReading = Number(
        currentElectricityReading ?? room.currentElectricityReading ?? 0
      );
      const waterReading = Number(currentWaterReading ?? room.currentWaterReading ?? 0);

      if (electricityReading < previousElectricityReading) {
        return res.status(400).json({
          success: false,
          message: "Current electricity reading must be greater than or equal to previous reading.",
        });
      }

      if (waterReading < previousWaterReading) {
        return res.status(400).json({
          success: false,
          message: "Current water reading must be greater than or equal to previous reading.",
        });
      }

      const additionalFees = await RoomAdditionalFees.find({
        roomId,
        month: period.month,
        year: period.year,
      }).lean();

      const additionalFee = additionalFees.map((fee) => ({
        feeName: fee.feeName,
        feeAmount: roundMoney(fee.feeAmount),
      }));

      const electricityQuantity = electricityReading - previousElectricityReading;
      const waterQuantity = waterReading - previousWaterReading;
      const electricalTotalAmount = roundMoney(
        electricityQuantity * Number(boardingHouse.electricityPrice || 0)
      );
      const waterTotalAmount = roundMoney(
        waterQuantity * Number(boardingHouse.waterPrice || 0)
      );
      const additionalFeeTotal = roundMoney(
        additionalFee.reduce((sum, fee) => sum + Number(fee.feeAmount || 0), 0)
      );
      const roomPrice = roundMoney(room.roomTypeId?.price);
      const paymentAmount = roundMoney(
        roomPrice + electricalTotalAmount + waterTotalAmount + additionalFeeTotal
      );
      const renterCount = acceptedTenants.length;
      const baseShare = Math.floor(paymentAmount / renterCount);
      const remainder = paymentAmount - baseShare * renterCount;

      const { dueDate, gracePeriodEnd } = buildRentDeadlines();

      const createdBill = await PaymentBill.create({
        roomId,
        paymentAmount,
        status: BILL_STATUS.PENDING,
        dueDate,
        gracePeriodEnd,
        additionalFee,
        electricalBill: {
          oldNumber: previousElectricityReading,
          newNumber: electricityReading,
          quantityConsumed: electricityQuantity,
          totalAmount: electricalTotalAmount,
        },
        waterBill: {
          oldNumber: previousWaterReading,
          newNumber: waterReading,
          quantityConsumed: waterQuantity,
          totalAmount: waterTotalAmount,
        },
        month: period.month,
        year: period.year,
      });

      const newUserPayments = acceptedTenants.map((tenant, index) => ({
        paymentBillId: createdBill._id,
        depositRoomId: tenant.depositRoomId,
        accountId: tenant.account._id,
        paymentAmount: baseShare + (index === renterCount - 1 ? remainder : 0),
        status: BILL_STATUS.PENDING,
        paymentMethod: "Unpaid",
      }));

      await UserPayment.insertMany(newUserPayments);

      room.previousElectricityReading = electricityReading;
      room.previousWaterReading = waterReading;
      room.currentElectricityReading = electricityReading;
      room.currentWaterReading = waterReading;
      await room.save();

      const userPayments = await UserPayment.find({
        paymentBillId: createdBill._id,
      }).populate("accountId", "fullname email phoneNumber");

      const paymentUrl = `${process.env.CLIENT_URL || "http://localhost:3001"}/monthly-rents`;
      await Promise.all(
        userPayments.map((userPayment) =>
          sendPaymentEmail({
            to: userPayment.accountId?.email,
            subject: `Hóa đơn tiền thuê tháng ${period.month}/${period.year}`,
            html: `
              <p>Xin chào <strong>${userPayment.accountId?.fullname || "bạn"}</strong>,</p>
              <p>Hóa đơn tiền thuê phòng <strong>${room.roomNumber}</strong> tháng
              <strong>${period.month}/${period.year}</strong> đã được tạo.</p>
              <p>Tổng hóa đơn phòng: <strong>${formatVnd(paymentAmount)}</strong></p>
              <p>Số người đang được chia: <strong>${renterCount}</strong></p>
              <p>Số tiền bạn cần thanh toán: <strong>${formatVnd(userPayment.paymentAmount)}</strong></p>
              <p>Hạn thanh toán: <strong>${formatDateTimeVi(dueDate)}</strong></p>
              <p>Thời gian gia hạn đến: <strong>${formatDateTimeVi(gracePeriodEnd)}</strong></p>
              <p><a href="${paymentUrl}">Mở trang thanh toán tiền thuê</a></p>
            `,
          })
        )
      );

      return res.status(201).json({
        success: true,
        message: "Monthly rent calculated successfully",
        data: {
          bill: createdBill,
          userPayments,
          calculation: {
            roomPrice,
            electricalTotalAmount,
            waterTotalAmount,
            additionalFeeTotal,
            paymentAmount,
            perUserBaseAmount: baseShare,
            renterCount,
          },
        },
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          code: "MONTHLY_RENT_BILL_EXISTS",
          message: "Bill for this month already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getMyMonthlyRents(req, res) {
    try {
      const userPayments = await UserPayment.find({
        accountId: req.user.userId,
      })
        .populate({
          path: "paymentBillId",
          populate: {
            path: "roomId",
            populate: [
              {
                path: "roomTypeId",
                select: "typeName price peopleNumber",
              },
              {
                path: "boardingHouseId",
                select: "name electricityPrice waterPrice",
              },
            ],
          },
        })
        .sort({ createdAt: -1 });

      const visiblePayments = [];

      for (const payment of userPayments) {
        const canView = await hasRentedRoomForBill(
          req.user.userId,
          payment.paymentBillId,
          payment.depositRoomId
        );

        if (canView) {
          visiblePayments.push(payment);
        }
      }

      return res.status(200).json({
        success: true,
        data: visiblePayments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getMyMonthlyRentDetail(req, res) {
    try {
      const userPayment = await UserPayment.findOne({
        _id: req.params.userPaymentId,
        accountId: req.user.userId,
      }).populate({
        path: "paymentBillId",
        populate: {
          path: "roomId",
          populate: [
            {
              path: "roomTypeId",
              select: "typeName price peopleNumber",
            },
            {
              path: "boardingHouseId",
              select: "name electricityPrice waterPrice",
            },
            {
              path: "rentBy",
              select: "fullname email phoneNumber",
            },
          ],
        },
      });

      if (!userPayment) {
        return res.status(404).json({
          success: false,
          message: "User payment not found",
        });
      }

      const canView = await hasRentedRoomForBill(
        req.user.userId,
        userPayment.paymentBillId,
        userPayment.depositRoomId
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: "You can only view monthly rent bills for your rented room.",
        });
      }

      return res.status(200).json({
        success: true,
        data: userPayment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async payMyMonthlyRent(req, res) {
    try {
      const { paymentMethod = "Cash" } = req.body;

      const userPayment = await UserPayment.findOne({
        _id: req.params.userPaymentId,
        accountId: req.user.userId,
      }).populate("paymentBillId");

      if (!userPayment) {
        return res.status(404).json({
          success: false,
          message: "User payment not found",
        });
      }

      const canPay = await hasRentedRoomForBill(
        req.user.userId,
        userPayment.paymentBillId,
        userPayment.depositRoomId
      );

      if (!canPay) {
        return res.status(403).json({
          success: false,
          message: "You can only pay monthly rent bills for your rented room.",
        });
      }

      if ([BILL_STATUS.DONE, LEGACY_PAID_STATUS].includes(userPayment.status)) {
        return res.status(400).json({
          success: false,
          message: "This monthly rent has already been paid.",
        });
      }

      if (userPayment.status === BILL_STATUS.CANCEL) {
        return res.status(400).json({
          success: false,
          message: "This monthly rent has been canceled.",
        });
      }

      userPayment.status = BILL_STATUS.DONE;
      userPayment.paymentMethod = paymentMethod;
      await userPayment.save();

      const billId = userPayment.paymentBillId?._id || userPayment.paymentBillId;
      const pendingPayment = await UserPayment.exists({
        paymentBillId: billId,
        status: { $nin: [BILL_STATUS.DONE, LEGACY_PAID_STATUS] },
      });

      if (!pendingPayment) {
        await PaymentBill.findByIdAndUpdate(billId, {
          status: BILL_STATUS.DONE,
        });
      }

      const updatedPayment = await UserPayment.findById(userPayment._id).populate({
        path: "paymentBillId",
        populate: {
          path: "roomId",
          populate: [
            {
              path: "roomTypeId",
              select: "typeName price peopleNumber",
            },
            {
              path: "boardingHouseId",
              select: "name electricityPrice waterPrice",
            },
          ],
        },
      });

      return res.status(200).json({
        success: true,
        message: "Monthly rent paid successfully",
        data: updatedPayment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
}

export default new MonthlyRentController();
