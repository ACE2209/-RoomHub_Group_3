import moment from "moment";

import RefundRequest from "../models/refundRequest.js";
import DepositRoom from "../models/depositRoom.js";
import UserPayment from "../models/userPayment.js";
import Room from "../models/room.js";
import BoardingHouse from "../models/boardingHouse.js";
import paymentController from "./paymentController.js";

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id || ""));

const formatDate = (date) =>
  date ? moment(date).format("DD/MM/YYYY HH:mm:ss") : null;

const getActualRefundAmount = (refundRequest) => {
  return Math.max(
    0,
    Number(refundRequest.originalDepositAmount || 0) -
      Number(refundRequest.totalDamageAmount || 0)
  );
};

class RefundRequestController {
  async createRefundRequest(req, res) {
    try {
      const userId = req.user.userId;
      const { depositRoomId, reason } = req.body;

      if (!isValidObjectId(depositRoomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid depositRoomId",
        });
      }

      if (!reason || !String(reason).trim()) {
        return res.status(400).json({
          success: false,
          message: "Reason is required",
        });
      }

      const deposit = await DepositRoom.findOne({
        _id: depositRoomId,
        accountId: userId,
      }).populate({
        path: "roomId",
        select: "roomNumber boardingHouseId",
        populate: {
          path: "boardingHouseId",
          select: "name address",
        },
      });

      if (!deposit) {
        return res.status(404).json({
          success: false,
          message: "Deposit not found",
        });
      }

      if (deposit.status !== "confirmed") {
        return res.status(400).json({
          success: false,
          message: "Only confirmed deposits can request refund",
        });
      }

      const unpaidRent = await UserPayment.exists({
        depositRoomId: deposit._id,
        paymentBillId: { $ne: null },
        status: { $in: ["Pending", "Overdue", "Failed"] },
      });

      if (unpaidRent) {
        return res.status(400).json({
          success: false,
          message:
            "You must complete all monthly rent payments before requesting a refund",
        });
      }

      const existed = await RefundRequest.findOne({
        depositRoomId: deposit._id,
        userId,
        status: { $in: ["pending", "accepted"] },
      });

      if (existed) {
        return res.status(400).json({
          success: false,
          message: "Refund request already exists",
        });
      }

      const refundRequest = await RefundRequest.create({
        depositRoomId: deposit._id,
        userId,
        originalDepositAmount: deposit.amount,
        reason: String(reason).trim(),
        status: "pending",
      });

      return res.status(201).json({
        success: true,
        message: "Refund request created successfully",
        data: refundRequest,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMyRefundRequests(req, res) {
    try {
      const userId = req.user.userId;
      const { status = "all" } = req.query;

      const filter = { userId };

      if (status !== "all") {
        filter.status = status;
      }

      const requests = await RefundRequest.find(filter)
        .populate({
          path: "depositRoomId",
          populate: {
            path: "roomId",
            select: "roomNumber boardingHouseId",
            populate: {
              path: "boardingHouseId",
              select: "name address",
            },
          },
        })
        .populate("processedBy", "fullname email")
        .sort({ createdAt: -1 });

      const data = requests.map((item) => ({
        _id: item._id,
        depositRoomId: item.depositRoomId?._id,
        room: {
          _id: item.depositRoomId?.roomId?._id,
          roomNumber: item.depositRoomId?.roomId?.roomNumber || "N/A",
        },
        boardingHouse: {
          _id: item.depositRoomId?.roomId?.boardingHouseId?._id,
          name: item.depositRoomId?.roomId?.boardingHouseId?.name || "N/A",
          address: item.depositRoomId?.roomId?.boardingHouseId?.address || null,
        },
        originalDepositAmount: item.originalDepositAmount,
        totalDamageAmount: item.totalDamageAmount || 0,
        actualRefundAmount: getActualRefundAmount(item),
        status: item.status,
        reason: item.reason,
        reasonForCancel: item.reasonForCancel || "",
        damageAssessment: item.damageAssessment || [],
        processedBy: item.processedBy || null,
        processedByRole: item.processedByRole || null,
        createdAt: formatDate(item.createdAt),
        processedAt: formatDate(item.processedAt),
      }));

      return res.status(200).json({
        success: true,
        message: "Fetched refund requests successfully",
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  async checkRefundRequestExists(req, res) {
    try {
      const userId = req.user.userId;
      const { depositRoomId } = req.params;

      if (!isValidObjectId(depositRoomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid depositRoomId",
        });
      }

      const existed = await RefundRequest.findOne({
        depositRoomId,
        userId,
        status: { $in: ["pending", "accepted"] },
      });

      return res.status(200).json({
        success: true,
        message: "Checked refund request successfully",
        data: {
          exists: !!existed,
          refundRequest: existed || null,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  async getManagedRefundRequests(req, res) {
    try {
      const userId = req.user.userId;
      const { status = "all" } = req.query;

      const boardingHouses = await BoardingHouse.find({
        $or: [{ ownerId: userId }, { staffId: userId }],
      }).select("_id");

      const boardingHouseIds = boardingHouses.map((item) => item._id);

      const rooms = await Room.find({
        boardingHouseId: { $in: boardingHouseIds },
      }).select("_id");

      const roomIds = rooms.map((item) => item._id);

      const deposits = await DepositRoom.find({
        roomId: { $in: roomIds },
      }).select("_id");

      const depositIds = deposits.map((item) => item._id);

      const filter = {
        depositRoomId: { $in: depositIds },
      };

      if (status !== "all") {
        filter.status = status;
      }

      const requests = await RefundRequest.find(filter)
        .populate("userId", "fullname email phoneNumber")
        .populate("processedBy", "fullname email")
        .populate({
          path: "depositRoomId",
          populate: {
            path: "roomId",
            select: "roomNumber boardingHouseId",
            populate: {
              path: "boardingHouseId",
              select: "name address ownerId staffId",
            },
          },
        })
        .sort({ createdAt: -1 });

      const data = requests.map((item) => ({
        _id: item._id,
        user: {
          _id: item.userId?._id,
          fullname: item.userId?.fullname || "N/A",
          email: item.userId?.email || "N/A",
          phoneNumber: item.userId?.phoneNumber || "N/A",
        },
        depositRoomId: item.depositRoomId?._id,
        room: {
          _id: item.depositRoomId?.roomId?._id,
          roomNumber: item.depositRoomId?.roomId?.roomNumber || "N/A",
        },
        boardingHouse: {
          _id: item.depositRoomId?.roomId?.boardingHouseId?._id,
          name: item.depositRoomId?.roomId?.boardingHouseId?.name || "N/A",
          address: item.depositRoomId?.roomId?.boardingHouseId?.address || null,
        },
        originalDepositAmount: item.originalDepositAmount,
        totalDamageAmount: item.totalDamageAmount || 0,
        actualRefundAmount: getActualRefundAmount(item),
        status: item.status,
        reason: item.reason,
        reasonForCancel: item.reasonForCancel || "",
        damageAssessment: item.damageAssessment || [],
        processedBy: item.processedBy || null,
        processedByRole: item.processedByRole || null,
        createdAt: formatDate(item.createdAt),
        processedAt: formatDate(item.processedAt),
      }));

      return res.status(200).json({
        success: true,
        message: "Fetched managed refund requests successfully",
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async rejectRefundRequest(req, res) {
    try {
      const userId = req.user.userId;
      const role = req.user.role;
      const { refundRequestId } = req.params;
      const { reasonForCancel } = req.body;

      if (!isValidObjectId(refundRequestId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid refundRequestId",
        });
      }

      if (!reasonForCancel || !String(reasonForCancel).trim()) {
        return res.status(400).json({
          success: false,
          message: "Reject reason is required",
        });
      }

      const refundRequest = await RefundRequest.findById(refundRequestId)
        .populate({
          path: "depositRoomId",
          populate: {
            path: "roomId",
            populate: {
              path: "boardingHouseId",
              select: "ownerId staffId name",
            },
          },
        });

      if (!refundRequest) {
        return res.status(404).json({
          success: false,
          message: "Refund request not found",
        });
      }

      if (refundRequest.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending refund requests can be rejected",
        });
      }

      const boardingHouse = refundRequest.depositRoomId?.roomId?.boardingHouseId;

      const isOwner = boardingHouse?.ownerId?.toString() === userId;
      const isStaff = boardingHouse?.staffId?.toString() === userId;

      if (!isOwner && !isStaff) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to reject this refund request",
        });
      }

      refundRequest.status = "rejected";
      refundRequest.reasonForCancel = String(reasonForCancel).trim();
      refundRequest.processedBy = userId;
      refundRequest.processedByRole = role;
      refundRequest.processedAt = new Date();

      await refundRequest.save();

      return res.status(200).json({
        success: true,
        message: "Refund request rejected successfully",
        data: refundRequest,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async createRefundPayment(req, res) {
    try {
      const userId = req.user.userId;
      const role = req.user.role;
      const { refundRequestId } = req.params;
      const { paymentMethod, damageAssessment = [] } = req.body;

      if (!isValidObjectId(refundRequestId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid refundRequestId",
        });
      }

      if (!["VNPay", "ZaloPay", "vnpay", "zalopay"].includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: "Payment method must be VNPay or ZaloPay",
        });
      }

      const refundRequest = await RefundRequest.findById(refundRequestId)
        .populate("userId", "fullname email")
        .populate({
          path: "depositRoomId",
          populate: {
            path: "roomId",
            populate: {
              path: "boardingHouseId",
              select: "ownerId staffId name",
            },
          },
        });

      if (!refundRequest) {
        return res.status(404).json({
          success: false,
          message: "Refund request not found",
        });
      }

      if (refundRequest.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending refund requests can be accepted",
        });
      }

      const boardingHouse = refundRequest.depositRoomId?.roomId?.boardingHouseId;

      const isOwner = boardingHouse?.ownerId?.toString() === userId;
      const isStaff = boardingHouse?.staffId?.toString() === userId;

      if (!isOwner && !isStaff) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to accept this refund request",
        });
      }

      refundRequest.damageAssessment = Array.isArray(damageAssessment)
        ? damageAssessment
            .filter((item) => item.damageName || item.estimatedCost)
            .map((item) => ({
              damageName: String(item.damageName || "").trim(),
              estimatedCost: Math.max(0, Number(item.estimatedCost) || 0),
            }))
        : [];

      refundRequest.processedBy = userId;
      refundRequest.processedByRole = role;

      await refundRequest.save();

      const actualRefundAmount = getActualRefundAmount(refundRequest);

      if (actualRefundAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Actual refund amount must be greater than 0",
        });
      }

      const paymentResult = await paymentController.createRefundPaymentUrl({
        req,
        refundRequest,
        amount: actualRefundAmount,
        method: paymentMethod,
      });

      return res.status(200).json({
        success: true,
        message: "Refund payment URL created",
        data: paymentResult,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new RefundRequestController();