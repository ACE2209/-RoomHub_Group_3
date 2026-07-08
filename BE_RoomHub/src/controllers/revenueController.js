import UserPayment from "../models/userPayment.js";
import RefundRequest from "../models/refundRequest.js";

const isPaid = (status) => ["Paid", "Done"].includes(status);

const getPaymentBoardingHouseId = (payment) => {
  if (payment.depositRoomId?.roomId?.boardingHouseId?._id) {
    return payment.depositRoomId.roomId.boardingHouseId._id.toString();
  }

  if (payment.paymentBillId?.roomId?.boardingHouseId?._id) {
    return payment.paymentBillId.roomId.boardingHouseId._id.toString();
  }

  return null;
};

const getPaymentBoardingHouseInfo = (payment) => {
  const bh =
    payment.depositRoomId?.roomId?.boardingHouseId ||
    payment.paymentBillId?.roomId?.boardingHouseId;

  if (!bh) return null;

  return {
    _id: bh._id,
    name: bh.name,
    address: bh.address || null,
  };
};

const filterByDate = (query) => {
  const filter = {};

  if (query.fromDate || query.toDate) {
    filter.createdAt = {};

    if (query.fromDate) {
      filter.createdAt.$gte = new Date(query.fromDate);
    }

    if (query.toDate) {
      const to = new Date(query.toDate);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  return filter;
};

class RevenueController {
  async getTotalRevenue(req, res) {
    try {
      const dateFilter = filterByDate(req.query);

      const payments = await UserPayment.find({
        status: { $in: ["Paid", "Done"] },
        ...dateFilter,
      })
        .populate({
          path: "depositRoomId",
          populate: {
            path: "roomId",
            populate: {
              path: "boardingHouseId",
              select: "name address",
            },
          },
        })
        .populate({
          path: "paymentBillId",
          populate: {
            path: "roomId",
            populate: {
              path: "boardingHouseId",
              select: "name address",
            },
          },
        });

      const acceptedRefunds = await RefundRequest.find({
        status: "accepted",
      });

      const grossRevenue = payments.reduce((sum, item) => {
        if (!isPaid(item.status)) return sum;
        return sum + Number(item.paymentAmount || 0);
      }, 0);

      const totalRefundAmount = acceptedRefunds.reduce((sum, item) => {
        const actualRefundAmount = Math.max(
          0,
          Number(item.originalDepositAmount || 0) -
            Number(item.totalDamageAmount || 0)
        );

        return sum + actualRefundAmount;
      }, 0);

      return res.status(200).json({
        success: true,
        message: "Fetched total revenue successfully",
        data: {
          grossRevenue,
          totalRefundAmount,
          netRevenue: grossRevenue - totalRefundAmount,
          transactionCount: payments.length,
          refundCount: acceptedRefunds.length,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getRevenuePerBoardingHouse(req, res) {
    try {
      const dateFilter = filterByDate(req.query);

      const payments = await UserPayment.find({
        status: { $in: ["Paid", "Done"] },
        ...dateFilter,
      })
        .populate({
          path: "depositRoomId",
          populate: {
            path: "roomId",
            populate: {
              path: "boardingHouseId",
              select: "name address",
            },
          },
        })
        .populate({
          path: "paymentBillId",
          populate: {
            path: "roomId",
            populate: {
              path: "boardingHouseId",
              select: "name address",
            },
          },
        });

      const revenueMap = {};

      for (const payment of payments) {
        const boardingHouseId = getPaymentBoardingHouseId(payment);
        const boardingHouse = getPaymentBoardingHouseInfo(payment);

        if (!boardingHouseId || !boardingHouse) continue;

        if (!revenueMap[boardingHouseId]) {
          revenueMap[boardingHouseId] = {
            boardingHouse,
            depositRevenue: 0,
            rentRevenue: 0,
            grossRevenue: 0,
            totalRefundAmount: 0,
            netRevenue: 0,
            transactionCount: 0,
          };
        }

        const amount = Number(payment.paymentAmount || 0);

        if (payment.depositRoomId) {
          revenueMap[boardingHouseId].depositRevenue += amount;
        }

        if (payment.paymentBillId) {
          revenueMap[boardingHouseId].rentRevenue += amount;
        }

        revenueMap[boardingHouseId].grossRevenue += amount;
        revenueMap[boardingHouseId].transactionCount += 1;
      }

      const acceptedRefunds = await RefundRequest.find({
        status: "accepted",
      }).populate({
        path: "depositRoomId",
        populate: {
          path: "roomId",
          populate: {
            path: "boardingHouseId",
            select: "name address",
          },
        },
      });

      for (const refund of acceptedRefunds) {
        const boardingHouse = refund.depositRoomId?.roomId?.boardingHouseId;
        if (!boardingHouse?._id) continue;

        const boardingHouseId = boardingHouse._id.toString();

        if (!revenueMap[boardingHouseId]) {
          revenueMap[boardingHouseId] = {
            boardingHouse: {
              _id: boardingHouse._id,
              name: boardingHouse.name,
              address: boardingHouse.address || null,
            },
            depositRevenue: 0,
            rentRevenue: 0,
            grossRevenue: 0,
            totalRefundAmount: 0,
            netRevenue: 0,
            transactionCount: 0,
          };
        }

        const actualRefundAmount = Math.max(
          0,
          Number(refund.originalDepositAmount || 0) -
            Number(refund.totalDamageAmount || 0)
        );

        revenueMap[boardingHouseId].totalRefundAmount += actualRefundAmount;
      }

      const data = Object.values(revenueMap).map((item) => ({
        ...item,
        netRevenue: item.grossRevenue - item.totalRefundAmount,
      }));

      return res.status(200).json({
        success: true,
        message: "Fetched revenue per boarding house successfully",
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new RevenueController();