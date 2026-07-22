import mongoose from "mongoose";

import UserPayment from "../models/userPayment.js";
import RefundRequest from "../models/refundRequest.js";
import BoardingHouse from "../models/boardingHouse.js";

const PAID_STATUSES = ["Paid", "Done"];
const PAID_METHODS = ["Cash", "Bank Transfer", "Momo", "MoMo", "VNPay", "ZaloPay"];
const MONTH_COUNT = 12;

const getYearRange = (year) => {
  const parsedYear = Number(year);

  return {
    fromDate: new Date(parsedYear, 0, 1, 0, 0, 0, 0),
    toDate: new Date(parsedYear + 1, 0, 1, 0, 0, 0, 0),
  };
};

const validateYear = (year) => {
  const parsedYear = Number(year);
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(parsedYear)) return null;
  if (parsedYear < 2000 || parsedYear > currentYear + 1) return null;

  return parsedYear;
};

const createEmptyMonthlyRevenue = () =>
  Array.from({ length: MONTH_COUNT }, (_, index) => ({
    month: index + 1,
    depositRevenue: 0,
    rentRevenue: 0,
    grossRevenue: 0,
    refundAmount: 0,
    netRevenue: 0,
    transactionCount: 0,
  }));

const getBoardingHouseFromPayment = (payment) =>
  payment.depositRoomId?.roomId?.boardingHouseId ||
  payment.paymentBillId?.roomId?.boardingHouseId ||
  null;

const getPaymentType = (payment) => {
  if (payment.paymentBillId) return "rent";
  if (payment.depositRoomId) return "deposit";
  return null;
};

const getActualRefundAmount = (refundRequest) =>
  Math.max(
    0,
    Number(refundRequest.originalDepositAmount || 0) -
      Number(refundRequest.totalDamageAmount || 0)
  );

const getRefundDate = (refundRequest) =>
  refundRequest.processedAt || refundRequest.updatedAt || refundRequest.createdAt;

const getPaidDate = (payment) =>
  payment.paidAt || payment.updatedAt || payment.createdAt;

const isActuallyPaid = (payment) =>
  PAID_STATUSES.includes(payment.status) &&
  PAID_METHODS.includes(payment.paymentMethod) &&
  Number(payment.paymentAmount || 0) > 0 &&
  Boolean(getPaymentType(payment));

const buildPaidPaymentFilter = (fromDate, toDate) => ({
  status: { $in: PAID_STATUSES },
  paymentMethod: { $in: PAID_METHODS },
  $or: [
    {
      paidAt: {
        $gte: fromDate,
        $lt: toDate,
      },
    },
    {
      paidAt: null,
      updatedAt: {
        $gte: fromDate,
        $lt: toDate,
      },
    },
    {
      paidAt: { $exists: false },
      updatedAt: {
        $gte: fromDate,
        $lt: toDate,
      },
    },
  ],
});

const paymentPopulate = [
  {
    path: "depositRoomId",
    populate: {
      path: "roomId",
      populate: {
        path: "boardingHouseId",
        select: "name address images",
      },
    },
  },
  {
    path: "paymentBillId",
    populate: {
      path: "roomId",
      populate: {
        path: "boardingHouseId",
        select: "name address images",
      },
    },
  },
];

const refundPopulate = {
  path: "depositRoomId",
  populate: {
    path: "roomId",
    populate: {
      path: "boardingHouseId",
      select: "name address images",
    },
  },
};

const applyPaymentsToRevenue = (payments, monthlyRevenue) => {
  let depositRevenue = 0;
  let rentRevenue = 0;
  let grossRevenue = 0;
  let transactionCount = 0;
  const boardingHouseIds = new Set();

  for (const payment of payments) {
    if (!isActuallyPaid(payment)) continue;

    const paidDate = new Date(getPaidDate(payment));
    if (Number.isNaN(paidDate.getTime())) continue;

    const monthIndex = paidDate.getMonth();
    const amount = Number(payment.paymentAmount || 0);
    const paymentType = getPaymentType(payment);
    const boardingHouse = getBoardingHouseFromPayment(payment);

    if (boardingHouse?._id) {
      boardingHouseIds.add(boardingHouse._id.toString());
    }

    if (paymentType === "deposit") {
      depositRevenue += amount;
      monthlyRevenue[monthIndex].depositRevenue += amount;
    } else if (paymentType === "rent") {
      rentRevenue += amount;
      monthlyRevenue[monthIndex].rentRevenue += amount;
    }

    grossRevenue += amount;
    transactionCount += 1;
    monthlyRevenue[monthIndex].grossRevenue += amount;
    monthlyRevenue[monthIndex].transactionCount += 1;
  }

  return {
    depositRevenue,
    rentRevenue,
    grossRevenue,
    transactionCount,
    boardingHouseIds,
  };
};

const applyRefundsToRevenue = (refunds, monthlyRevenue) => {
  let refundAmount = 0;

  for (const refund of refunds) {
    const refundDate = new Date(getRefundDate(refund));
    if (Number.isNaN(refundDate.getTime())) continue;

    const amount = getActualRefundAmount(refund);
    const monthIndex = refundDate.getMonth();

    refundAmount += amount;
    monthlyRevenue[monthIndex].refundAmount += amount;
  }

  return refundAmount;
};

const finalizeMonthlyRevenue = (monthlyRevenue) => {
  for (const monthItem of monthlyRevenue) {
    monthItem.netRevenue = monthItem.grossRevenue - monthItem.refundAmount;
  }
};

class RevenueController {
  async getBoardingHouseOptions(req, res) {
    try {
      const boardingHouses = await BoardingHouse.find({})
        .select("name address images")
        .sort({ name: 1 });

      return res.status(200).json({ success: true, data: boardingHouses });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to load boarding houses",
      });
    }
  }

  async getTotalRevenue(req, res) {
    try {
      const selectedYear = validateYear(req.query.year) || new Date().getFullYear();
      const { fromDate, toDate } = getYearRange(selectedYear);

      // Chỉ lấy giao dịch đã thanh toán thật. Pending/Overdue/Failed/Unpaid
      // không bao giờ được cộng vào doanh thu.
      const payments = await UserPayment.find(
        buildPaidPaymentFilter(fromDate, toDate)
      ).populate(paymentPopulate);

      const refunds = await RefundRequest.find({
        status: "accepted",
        $or: [
          { processedAt: { $gte: fromDate, $lt: toDate } },
          {
            processedAt: null,
            updatedAt: { $gte: fromDate, $lt: toDate },
          },
        ],
      }).populate(refundPopulate);

      const monthlyRevenue = createEmptyMonthlyRevenue();
      const paymentTotals = applyPaymentsToRevenue(payments, monthlyRevenue);
      const refundAmount = applyRefundsToRevenue(refunds, monthlyRevenue);
      finalizeMonthlyRevenue(monthlyRevenue);

      return res.status(200).json({
        success: true,
        message: "Fetched total revenue successfully",
        data: {
          year: selectedYear,
          summary: {
            boardingHouseCount: paymentTotals.boardingHouseIds.size,
            depositRevenue: paymentTotals.depositRevenue,
            rentRevenue: paymentTotals.rentRevenue,
            grossRevenue: paymentTotals.grossRevenue,
            refundAmount,
            netRevenue: paymentTotals.grossRevenue - refundAmount,
            transactionCount: paymentTotals.transactionCount,
            refundCount: refunds.length,
          },
          monthlyRevenue,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to load total revenue",
      });
    }
  }

  async getBoardingHouseMonthlyRevenue(req, res) {
    try {
      const { boardingHouseId } = req.params;
      const selectedYear = validateYear(req.query.year) || new Date().getFullYear();

      if (!mongoose.Types.ObjectId.isValid(boardingHouseId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid boarding house ID",
        });
      }

      const boardingHouse = await BoardingHouse.findById(boardingHouseId).select(
        "name address images"
      );

      if (!boardingHouse) {
        return res.status(404).json({
          success: false,
          message: "Boarding house not found",
        });
      }

      const { fromDate, toDate } = getYearRange(selectedYear);

      const allPayments = await UserPayment.find(
        buildPaidPaymentFilter(fromDate, toDate)
      ).populate(paymentPopulate);

      const payments = allPayments.filter((payment) => {
        if (!isActuallyPaid(payment)) return false;

        const paymentBoardingHouse = getBoardingHouseFromPayment(payment);
        return paymentBoardingHouse?._id?.toString() === boardingHouseId;
      });

      const allRefunds = await RefundRequest.find({
        status: "accepted",
        $or: [
          { processedAt: { $gte: fromDate, $lt: toDate } },
          {
            processedAt: null,
            updatedAt: { $gte: fromDate, $lt: toDate },
          },
        ],
      }).populate(refundPopulate);

      const refunds = allRefunds.filter(
        (refund) =>
          refund.depositRoomId?.roomId?.boardingHouseId?._id?.toString() ===
          boardingHouseId
      );

      const monthlyRevenue = createEmptyMonthlyRevenue();
      const paymentTotals = applyPaymentsToRevenue(payments, monthlyRevenue);
      const refundAmount = applyRefundsToRevenue(refunds, monthlyRevenue);
      finalizeMonthlyRevenue(monthlyRevenue);

      return res.status(200).json({
        success: true,
        message: "Fetched boarding house revenue successfully",
        data: {
          boardingHouse,
          year: selectedYear,
          summary: {
            depositRevenue: paymentTotals.depositRevenue,
            rentRevenue: paymentTotals.rentRevenue,
            grossRevenue: paymentTotals.grossRevenue,
            refundAmount,
            netRevenue: paymentTotals.grossRevenue - refundAmount,
            transactionCount: paymentTotals.transactionCount,
            refundCount: refunds.length,
          },
          monthlyRevenue,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to load boarding house revenue",
      });
    }
  }
}

export default new RevenueController();
