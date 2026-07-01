import PaymentBill from "../models/paymentBill.js";
import UserPayment from "../models/userPayment.js";
import Room from "../models/room.js";
import RoomAdditionalFees from "../models/roomAdditionalFees.js";
import DepositRoom from "../models/depositRoom.js";

const BILL_STATUS = {
  PENDING: "Pending",
  PAID: "Paid",
};

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

          if (payment.status === BILL_STATUS.PAID) {
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

      return res.status(200).json({
        success: true,
        data: managedBills,
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

      if (!room.rentBy?.length) {
        return res.status(400).json({
          success: false,
          message: "Room has no renters.",
        });
      }

      const { periodStart, periodEnd } = getPeriodRange(
        period.month,
        period.year
      );
      const renterIds = room.rentBy.map((account) => account._id.toString());
      const activeDeposits = await DepositRoom.find({
        roomId,
        accountId: { $in: renterIds },
        status: "confirmed",
        startDate: { $lte: periodEnd },
        endDate: { $gte: periodStart },
      })
        .populate("accountId", "fullname email phoneNumber")
        .lean();
      const activeRenterIds = new Set(
        activeDeposits.map((deposit) => deposit.accountId?._id?.toString())
      );
      const inactiveRenters = room.rentBy.filter(
        (account) => !activeRenterIds.has(account._id.toString())
      );

      if (inactiveRenters.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot calculate monthly rent because one or more tenants do not have an active confirmed rental contract for this billing period.",
          inactiveTenants: inactiveRenters.map((account) => ({
            accountId: account._id,
            fullname: account.fullname,
            email: account.email,
          })),
          billingPeriod: {
            month: period.month,
            year: period.year,
            startDate: periodStart,
            endDate: periodEnd,
          },
        });
      }

      const existingBill = await PaymentBill.findOne({
        roomId,
        month: period.month,
        year: period.year,
      });

      if (existingBill) {
        return res.status(400).json({
          success: false,
          message: "Monthly rent has already been calculated for this room and period.",
          billId: existingBill._id,
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
      const renterCount = room.rentBy.length;
      const baseShare = Math.floor(paymentAmount / renterCount);
      const remainder = paymentAmount - baseShare * renterCount;

      const createdBill = await PaymentBill.create({
        roomId,
        paymentAmount,
        status: BILL_STATUS.PENDING,
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

      const newUserPayments = room.rentBy.map((account, index) => ({
        paymentBillId: createdBill._id,
        accountId: account._id,
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

      return res.status(200).json({
        success: true,
        data: userPayments,
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
      });

      if (!userPayment) {
        return res.status(404).json({
          success: false,
          message: "User payment not found",
        });
      }

      if (userPayment.status === BILL_STATUS.PAID) {
        return res.status(400).json({
          success: false,
          message: "This monthly rent has already been paid.",
        });
      }

      userPayment.status = BILL_STATUS.PAID;
      userPayment.paymentMethod = paymentMethod;
      await userPayment.save();

      const pendingPayment = await UserPayment.exists({
        paymentBillId: userPayment.paymentBillId,
        status: { $ne: BILL_STATUS.PAID },
      });

      if (!pendingPayment) {
        await PaymentBill.findByIdAndUpdate(userPayment.paymentBillId, {
          status: BILL_STATUS.PAID,
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
