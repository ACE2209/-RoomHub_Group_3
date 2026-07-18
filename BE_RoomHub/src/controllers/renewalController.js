import mongoose from "mongoose";
import ExtensionRequest from "../models/extensionRequest.js";
import Room from "../models/room.js";
import BoardingHouse from "../models/boardingHouse.js";
import DepositRoom from "../models/depositRoom.js";
import paginate from "../utils/pagination.js";

const REQUEST_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

const RENEWABLE_DEPOSIT_STATUSES = ["accepted", "confirmed"];

const getManagedBoardingHouseIds = async (userId) => {
  const boardingHouses = await BoardingHouse.find({
    $or: [{ ownerId: userId }, { staffId: userId }],
  })
    .select("_id")
    .lean();

  return boardingHouses.map((bh) => bh._id.toString());
};

class RenewalController {
  async getMyRenewalRequests(req, res) {
    try {
      const accountId = req.user.userId;

      const paginationOptions = {
        defaultPage: 1,
        defaultLimit: 5,
        maxLimit: 100,
        sortField: "createdAt",
        sortOrder: "desc",
        filter: { accountId },
        allowQueryFilters: ["status"],
        populate: [
          {
            path: "roomId",
            select: "roomNumber boardingHouseId",
            populate: {
              path: "boardingHouseId",
              select: "name address images",
            },
          },
          {
            path: "depositRoomId",
            select: "amount startDate endDate status",
          },
        ],
        includeTotalData: true,
      };

      const result = await paginate(ExtensionRequest, paginationOptions, req);

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async createRenewalRequest(req, res) {
    try {
      const accountId = req.user.userId;
      const { depositRoomId, requestedEndDate, tenantNote } = req.body;

      if (!mongoose.isValidObjectId(depositRoomId) || !requestedEndDate) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const newEndDate = new Date(requestedEndDate);

      if (Number.isNaN(newEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid requested end date",
        });
      }

      const deposit = await DepositRoom.findOne({
        _id: depositRoomId,
        accountId,
        status: { $in: RENEWABLE_DEPOSIT_STATUSES },
      });

      if (!deposit) {
        return res.status(404).json({
          success: false,
          message: "Deposit not found or not eligible for renewal",
        });
      }

      if (newEndDate <= new Date(deposit.endDate)) {
        return res.status(400).json({
          success: false,
          message: "Requested end date must be after the current end date",
        });
      }

      const pendingRequest = await ExtensionRequest.findOne({
        depositRoomId,
        status: REQUEST_STATUS.PENDING,
      });

      if (pendingRequest) {
        return res.status(400).json({
          success: false,
          message: "A pending renewal request already exists for this deposit",
        });
      }

      const renewalRequest = await ExtensionRequest.create({
        accountId,
        roomId: deposit.roomId,
        depositRoomId,
        currentEndDate: deposit.endDate,
        requestedEndDate,
        tenantNote: tenantNote || "",
        status: REQUEST_STATUS.PENDING,
      });

      return res.status(201).json({
        success: true,
        message: "Renewal request created successfully",
        data: renewalRequest,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getManagedRenewalRequests(req, res) {
    try {
      const userId = req.user.userId;
      const { boardingHouseId } = req.query;

      const boardingHouseIds = await getManagedBoardingHouseIds(userId);

      if (boardingHouseId && !boardingHouseIds.includes(boardingHouseId)) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to view renewal requests of this boarding house",
        });
      }

      const rooms = await Room.find({
        boardingHouseId: boardingHouseId
          ? boardingHouseId
          : { $in: boardingHouseIds },
      })
        .select("_id")
        .lean();

      const roomIds = rooms.map((room) => room._id);

      const paginationOptions = {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
        sortField: "createdAt",
        sortOrder: "desc",
        filter: { roomId: { $in: roomIds } },
        allowQueryFilters: ["status"],
        populate: [
          {
            path: "accountId",
            select: "fullname email",
          },
          {
            path: "roomId",
            select: "roomNumber boardingHouseId",
            populate: {
              path: "boardingHouseId",
              select: "name",
            },
          },
          {
            path: "depositRoomId",
            select: "amount startDate endDate status",
          },
        ],
        includeTotalData: true,
      };

      const result = await paginate(ExtensionRequest, paginationOptions, req);

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async handleRenewalRequestDecision(req, res) {
    try {
      const userId = req.user.userId;
      const { requestId } = req.params;
      const { action, reasonForCancel } = req.body;

      if (!mongoose.isValidObjectId(requestId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid request ID",
        });
      }

      if (![REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.REJECTED].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Invalid action. Use 'accepted' or 'rejected'",
        });
      }

      const renewalRequest = await ExtensionRequest.findById(requestId).populate(
        "roomId",
        "boardingHouseId"
      );

      if (!renewalRequest) {
        return res.status(404).json({
          success: false,
          message: "Renewal request not found",
        });
      }

      if (renewalRequest.status !== REQUEST_STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          message: "Only pending requests can be processed",
        });
      }

      const boardingHouseIds = await getManagedBoardingHouseIds(userId);
      const requestBhId = renewalRequest.roomId?.boardingHouseId?.toString();

      if (!requestBhId || !boardingHouseIds.includes(requestBhId)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to process this renewal request",
        });
      }

      if (action === REQUEST_STATUS.ACCEPTED) {
        const deposit = await DepositRoom.findById(renewalRequest.depositRoomId);

        if (!deposit) {
          return res.status(404).json({
            success: false,
            message: "Deposit record not found for this renewal request",
          });
        }

        deposit.endDate = renewalRequest.requestedEndDate;
        await deposit.save();

        renewalRequest.status = REQUEST_STATUS.ACCEPTED;
      } else {
        renewalRequest.status = REQUEST_STATUS.REJECTED;
        renewalRequest.reasonForCancel = reasonForCancel || "";
      }

      await renewalRequest.save();

      return res.status(200).json({
        success: true,
        message: `Renewal request ${action} successfully`,
        data: renewalRequest,
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

export default new RenewalController();
