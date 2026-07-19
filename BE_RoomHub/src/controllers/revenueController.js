import mongoose from "mongoose";

import UserPayment from "../models/userPayment.js";
import RefundRequest from "../models/refundRequest.js";
import BoardingHouse from "../models/boardingHouse.js";

const PAID_STATUSES = ["Paid", "Done"];
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

  if (!Number.isInteger(parsedYear)) {
    return null;
  }

  if (parsedYear < 2000 || parsedYear > currentYear + 1) {
    return null;
  }

  return parsedYear;
};

const createEmptyMonthlyRevenue = () => {
  return Array.from(
    {
      length: MONTH_COUNT,
    },
    (_, index) => ({
      month: index + 1,
      depositRevenue: 0,
      rentRevenue: 0,
      grossRevenue: 0,
      refundAmount: 0,
      netRevenue: 0,
      transactionCount: 0,
    })
  );
};

const getBoardingHouseFromPayment = (payment) => {
  return (
    payment.depositRoomId?.roomId?.boardingHouseId ||
    payment.paymentBillId?.roomId?.boardingHouseId ||
    null
  );
};

const getPaymentType = (payment) => {

  if (payment.paymentBillId) {
    return "rent";
  }

  if (payment.depositRoomId) {
    return "deposit";
  }

  return null;
};

const getActualRefundAmount = (refundRequest) => {
  return Math.max(
    0,
    Number(refundRequest.originalDepositAmount || 0) -
      Number(refundRequest.totalDamageAmount || 0)
  );
};

const getRefundDate = (refundRequest) => {
  return (
    refundRequest.processedAt ||
    refundRequest.updatedAt ||
    refundRequest.createdAt
  );
};

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

class RevenueController {
  async getBoardingHouseOptions(req, res) {
    try {
      const boardingHouses = await BoardingHouse.find({})
        .select("name address images")
        .sort({
          name: 1,
        });

      return res.status(200).json({
        success: true,
        data: boardingHouses,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to load boarding houses",
      });
    }
  }

  async getTotalRevenue(req, res) {
    try {
      const selectedYear =
        validateYear(req.query.year) ||
        new Date().getFullYear();

      const { fromDate, toDate } =
        getYearRange(selectedYear);

      const payments = await UserPayment.find({
        status: {
          $in: PAID_STATUSES,
        },
        createdAt: {
          $gte: fromDate,
          $lt: toDate,
        },
      }).populate(paymentPopulate);

      const refunds = await RefundRequest.find({
        status: "accepted",
        $or: [
          {
            processedAt: {
              $gte: fromDate,
              $lt: toDate,
            },
          },
          {
            processedAt: null,
            updatedAt: {
              $gte: fromDate,
              $lt: toDate,
            },
          },
        ],
      }).populate(refundPopulate);

      const monthlyRevenue =
        createEmptyMonthlyRevenue();

      let depositRevenue = 0;
      let rentRevenue = 0;
      let grossRevenue = 0;
      let refundAmount = 0;
      let transactionCount = 0;

      const boardingHouseIds = new Set();

      for (const payment of payments) {
        const paymentDate = new Date(
          payment.createdAt
        );

        const monthIndex =
          paymentDate.getMonth();

        const amount = Number(
          payment.paymentAmount || 0
        );

        const paymentType =
          getPaymentType(payment);

        const boardingHouse =
          getBoardingHouseFromPayment(payment);

        if (boardingHouse?._id) {
          boardingHouseIds.add(
            boardingHouse._id.toString()
          );
        }

        if (paymentType === "deposit") {
          depositRevenue += amount;
          monthlyRevenue[
            monthIndex
          ].depositRevenue += amount;
        }

        if (paymentType === "rent") {
          rentRevenue += amount;
          monthlyRevenue[
            monthIndex
          ].rentRevenue += amount;
        }

        grossRevenue += amount;
        transactionCount += 1;

        monthlyRevenue[
          monthIndex
        ].grossRevenue += amount;

        monthlyRevenue[
          monthIndex
        ].transactionCount += 1;
      }

      for (const refund of refunds) {
        const refundDate = new Date(
          getRefundDate(refund)
        );

        if (
          Number.isNaN(
            refundDate.getTime()
          )
        ) {
          continue;
        }

        const monthIndex =
          refundDate.getMonth();

        const amount =
          getActualRefundAmount(refund);

        refundAmount += amount;

        monthlyRevenue[
          monthIndex
        ].refundAmount += amount;
      }

      for (const monthItem of monthlyRevenue) {
        monthItem.netRevenue =
          monthItem.grossRevenue -
          monthItem.refundAmount;
      }

      return res.status(200).json({
        success: true,
        message:
          "Fetched total revenue successfully",
        data: {
          year: selectedYear,

          summary: {
            boardingHouseCount:
              boardingHouseIds.size,

            depositRevenue,
            rentRevenue,
            grossRevenue,
            refundAmount,

            netRevenue:
              grossRevenue - refundAmount,

            transactionCount,
            refundCount: refunds.length,
          },

          monthlyRevenue,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to load total revenue",
      });
    }
  }

  async getBoardingHouseMonthlyRevenue(
    req,
    res
  ) {
    try {
      const { boardingHouseId } =
        req.params;

      const selectedYear =
        validateYear(req.query.year) ||
        new Date().getFullYear();

      if (
        !mongoose.Types.ObjectId.isValid(
          boardingHouseId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid boarding house ID",
        });
      }

      const boardingHouse =
        await BoardingHouse.findById(
          boardingHouseId
        ).select("name address images");

      if (!boardingHouse) {
        return res.status(404).json({
          success: false,
          message:
            "Boarding house not found",
        });
      }

      const { fromDate, toDate } =
        getYearRange(selectedYear);

      const allPayments =
        await UserPayment.find({
          status: {
            $in: PAID_STATUSES,
          },
          createdAt: {
            $gte: fromDate,
            $lt: toDate,
          },
        }).populate(paymentPopulate);

      const payments =
        allPayments.filter((payment) => {
          const paymentBoardingHouse =
            getBoardingHouseFromPayment(
              payment
            );

          return (
            paymentBoardingHouse?._id?.toString() ===
            boardingHouseId
          );
        });

      const allRefunds =
        await RefundRequest.find({
          status: "accepted",
          $or: [
            {
              processedAt: {
                $gte: fromDate,
                $lt: toDate,
              },
            },
            {
              processedAt: null,
              updatedAt: {
                $gte: fromDate,
                $lt: toDate,
              },
            },
          ],
        }).populate(refundPopulate);

      const refunds =
        allRefunds.filter((refund) => {
          const refundBoardingHouse =
            refund.depositRoomId?.roomId
              ?.boardingHouseId;

          return (
            refundBoardingHouse?._id?.toString() ===
            boardingHouseId
          );
        });

      const monthlyRevenue =
        createEmptyMonthlyRevenue();

      let depositRevenue = 0;
      let rentRevenue = 0;
      let grossRevenue = 0;
      let refundAmount = 0;
      let transactionCount = 0;

      for (const payment of payments) {
        const paymentDate = new Date(
          payment.createdAt
        );

        const monthIndex =
          paymentDate.getMonth();

        const amount = Number(
          payment.paymentAmount || 0
        );

        const paymentType =
          getPaymentType(payment);

        if (paymentType === "deposit") {
          depositRevenue += amount;

          monthlyRevenue[
            monthIndex
          ].depositRevenue += amount;
        }

        if (paymentType === "rent") {
          rentRevenue += amount;

          monthlyRevenue[
            monthIndex
          ].rentRevenue += amount;
        }

        grossRevenue += amount;
        transactionCount += 1;

        monthlyRevenue[
          monthIndex
        ].grossRevenue += amount;

        monthlyRevenue[
          monthIndex
        ].transactionCount += 1;
      }

      for (const refund of refunds) {
        const refundDate = new Date(
          getRefundDate(refund)
        );

        if (
          Number.isNaN(
            refundDate.getTime()
          )
        ) {
          continue;
        }

        const monthIndex =
          refundDate.getMonth();

        const amount =
          getActualRefundAmount(refund);

        refundAmount += amount;

        monthlyRevenue[
          monthIndex
        ].refundAmount += amount;
      }

      for (const monthItem of monthlyRevenue) {
        monthItem.netRevenue =
          monthItem.grossRevenue -
          monthItem.refundAmount;
      }

      return res.status(200).json({
        success: true,
        message:
          "Fetched boarding house revenue successfully",

        data: {
          boardingHouse,
          year: selectedYear,

          summary: {
            depositRevenue,
            rentRevenue,
            grossRevenue,
            refundAmount,

            netRevenue:
              grossRevenue - refundAmount,

            transactionCount,
            refundCount: refunds.length,
          },

          monthlyRevenue,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to load boarding house revenue",
      });
    }
  }
}

export default new RevenueController();