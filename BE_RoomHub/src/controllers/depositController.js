import nodemailer from "nodemailer";
import moment from "moment";
import DepositRoom from "../models/depositRoom.js";
import Room from "../models/room.js";
import BoardingHouse from "../models/boardingHouse.js";
import { Account } from "../models/account.js";
import paginate from "../utils/pagination.js";
class DepositController {
  async getDepositsByOwnerOrStaff(req, res) {
    try {
      const userId = req.user.userId;

      const account = await Account.findById(userId);
      if (!account) {
        return res.status(404).json({
          message: "Account not found",
          success: false,
          error: true,
        });
      }

      const {
        status,
        boardingHouseId,
        roomId,
        rentalTime,
        startDate,
        endDate,
      } = req.query;

      const boardingHouses = await BoardingHouse.find({
        $or: [{ ownerId: userId }, { staffId: userId }],
      }).lean();

      const boardingHouseIds = boardingHouses.map((bh) => bh._id.toString());

      if (boardingHouseId && !boardingHouseIds.includes(boardingHouseId)) {
        return res.status(403).json({
          message: "You do not have permission to view this boarding house deposits.",
          success: false,
          error: true,
        });
      }

      let roomFilter = {
        boardingHouseId: { $in: boardingHouseIds },
      };

      if (boardingHouseId) {
        roomFilter = {
          boardingHouseId,
        };
      }

      const rooms = await Room.find(roomFilter).lean();

      const roomMap = new Map(
        rooms.map((room) => [
          room._id.toString(),
          {
            roomNumber: room.roomNumber,
            boardingHouseId: room.boardingHouseId.toString(),
          },
        ])
      );

      const roomIds = [...roomMap.keys()];

      if (roomId && roomId !== "all" && !roomIds.includes(roomId)) {
        return res.status(403).json({
          message: "You do not have permission to view this room deposits.",
          success: false,
          error: true,
        });
      }

      const filter = {
        roomId: { $in: roomIds },
      };

      if (roomId && roomId !== "all") {
        filter.roomId = roomId;
      }

      if (status && status !== "all") {
        filter.status = status;
      }

      if (rentalTime) {
        if (Array.isArray(rentalTime)) {
          const min = Number(rentalTime[0]);
          const max = Number(rentalTime[1]);

          if (!Number.isNaN(min) && !Number.isNaN(max)) {
            filter.rentalTime = { $gte: min, $lte: max };
          }
        } else if (typeof rentalTime === "string" && rentalTime.includes(",")) {
          const [min, max] = rentalTime.split(",").map(Number);

          if (!Number.isNaN(min) && !Number.isNaN(max)) {
            filter.rentalTime = { $gte: min, $lte: max };
          }
        } else {
          const value = Number(rentalTime);

          if (!Number.isNaN(value)) {
            filter.rentalTime = value;
          }
        }
      }

      if (startDate) {
        filter.startDate = { $gte: new Date(startDate) };
      }

      if (endDate) {
        filter.endDate = { $lte: new Date(endDate) };
      }

      const paginationOptions = {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
        sortField: req.query.sortField || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
        filter,
        populate: [{ path: "accountId", select: "fullname email" }],
        includeTotalData: true,
      };

      const paginatedResult = await paginate(
        DepositRoom,
        paginationOptions,
        req
      );

      const boardingHouseMap = new Map(
        boardingHouses.map((bh) => [bh._id.toString(), bh.name])
      );

      paginatedResult.data = paginatedResult.data.map((deposit) => {
        const roomInfo = roomMap.get(deposit.roomId.toString()) || {};
        const boardingHouseName =
          boardingHouseMap.get(roomInfo.boardingHouseId) || "Unknown";

        return {
          _id: deposit._id,
          name: deposit.accountId?.fullname || "Unknown",
          email: deposit.accountId?.email || "N/A",
          roomId: deposit.roomId,
          roomNumber: roomInfo.roomNumber || "N/A",
          boardingHouseName,
          boardingHouseId: roomInfo.boardingHouseId,
          amount: deposit.amount,
          status: deposit.status,
          rentalTime: deposit.rentalTime,
          startDate: deposit.startDate
            ? moment(deposit.startDate).format("DD/MM/YYYY")
            : "N/A",
          endDate: deposit.endDate
            ? moment(deposit.endDate).format("DD/MM/YYYY")
            : "N/A",
          createdAt: moment(deposit.createdAt).format("DD/MM/YYYY HH:mm:ss"),
        };
      });

      return res.status(200).json({
        message: "Fetched successfully",
        success: true,
        error: false,
        ...paginatedResult,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Server error",
        success: false,
        error: true,
        details: error.message,
      });
    }
  }

  async handleDepositDecision(req, res) {
    try {
      const { depositId } = req.params;
      const { action, reasonForCancel } = req.body;

      if (!["accept", "reject"].includes(action)) {
        return res.status(400).json({
          error: "Invalid action type.",
        });
      }

      const deposit = await DepositRoom.findById(depositId)
        .populate({
          path: "accountId",
          select: "fullname email",
        })
        .populate({
          path: "roomId",
          select: "roomNumber boardingHouseId roomTypeId",
          populate: [
            {
              path: "boardingHouseId",
              select: "name boardingHouseType ownerId staffId",
              populate: {
                path: "boardingHouseType",
                select: "codeName",
              },
            },
            {
              path: "roomTypeId",
              select: "typeName peopleNumber",
            },
          ],
        });

      if (!deposit) {
        return res.status(404).json({
          error: "Không tìm thấy khoản đặt cọc",
        });
      }

      if (deposit.status !== "pending") {
        return res.status(400).json({
          error: "Chỉ có thể xử lý yêu cầu đặt cọc đang chờ duyệt",
        });
      }

      const boardingHouse = deposit.roomId.boardingHouseId;
      const userId = req.user.userId;
      const isOwner = boardingHouse?.ownerId?.toString() === userId;
      const isStaff = boardingHouse?.staffId?.toString() === userId;

      if (!isOwner && !isStaff) {
        return res.status(403).json({
          error: "You do not have permission to handle this deposit request.",
        });
      }

      const boardingHouseName = boardingHouse?.name || "Không có tên nhà trọ";
      const boardingHouseTypeCode =
        boardingHouse?.boardingHouseType?.codeName || "";

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      const sendEmail = async (to, subject, html) => {
        await transporter.sendMail({
          from: process.env.MAIL_USER,
          to,
          subject,
          html,
        });
      };

      const sendEmailSafe = async (to, subject, html) => {
        try {
          await sendEmail(to, subject, html);
          return true;
        } catch (emailError) {
          console.error("Deposit email failed:", emailError.message);
          return false;
        }
      };

      if (action === "reject") {
        if (!reasonForCancel) {
          return res.status(400).json({
            error: "Reason for rejection is required.",
          });
        }

        deposit.status = "rejected";
        deposit.reasonForCancel = reasonForCancel;
        await deposit.save();

        const emailSent = await sendEmailSafe(
          deposit.accountId.email,
          "Đặt cọc phòng trọ đã bị từ chối",
          `
            <p>Xin chào <strong>${deposit.accountId.fullname}</strong>,</p>
            <p>Khoản đặt cọc của bạn cho phòng <strong>${deposit.roomId.roomNumber}</strong>
            tại nhà trọ <strong>${boardingHouseName}</strong> đã bị từ chối.</p>
            <p><strong>Lý do:</strong> ${reasonForCancel}</p>
          `
        );

        return res.status(200).json({
          message: "Đã từ chối khoản đặt cọc.",
          success: true,
          error: false,
          status: "rejected",
          depositId: deposit._id,
          emailSent,
        });
      }

      if (boardingHouseTypeCode === "nha_tro_kien_truc_xa") {
        const currentAcceptedCount = await DepositRoom.countDocuments({
          roomId: deposit.roomId._id,
          status: "accepted",
        });

        const limit = Number(deposit.roomId.roomTypeId?.peopleNumber || 0);

        if (currentAcceptedCount >= limit) {
          deposit.status = "rejected";
          deposit.reasonForCancel = "Phòng ký túc xá đã đủ số lượng người.";
          await deposit.save();

          const emailSent = await sendEmailSafe(
            deposit.accountId.email,
            "Yêu cầu đặt cọc đã bị từ chối",
            `
              <p>Xin chào <strong>${deposit.accountId.fullname}</strong>,</p>
              <p>Phòng <strong>${deposit.roomId.roomNumber}</strong>
              tại nhà trọ <strong>${boardingHouseName}</strong> đã đủ người.</p>
            `
          );

          return res.status(200).json({
            message: "Phòng đã đủ người, đơn đã bị từ chối.",
            success: true,
            error: false,
            status: "rejected",
            depositId: deposit._id,
            emailSent,
          });
        }
      }

      deposit.status = "accepted";
      await deposit.save();

      const emailSent = await sendEmailSafe(
        deposit.accountId.email,
        "Đặt cọc phòng trọ đã được chấp nhận",
        `
          <p>Xin chào <strong>${deposit.accountId.fullname}</strong>,</p>
          <p>Khoản đặt cọc của bạn cho phòng <strong>${deposit.roomId.roomNumber}</strong>
          tại nhà trọ <strong>${boardingHouseName}</strong> đã được chấp nhận.</p>
          <p>Vui lòng thanh toán tiền cọc để hoàn tất giữ phòng.</p>
        `
      );

      if (
        ["mini_house", "nha_tro_truyen_thong"].includes(boardingHouseTypeCode)
      ) {
        const otherPendingDeposits = await DepositRoom.find({
          _id: { $ne: depositId },
          roomId: deposit.roomId._id,
          status: "pending",
        }).populate({
          path: "accountId",
          select: "fullname email",
        });

        for (const item of otherPendingDeposits) {
          item.status = "rejected";
          item.reasonForCancel =
            "Phòng đã được đặt cọc bởi người khác.";
          await item.save();

          await sendEmailSafe(
            item.accountId.email,
            "Yêu cầu đặt cọc đã bị từ chối",
            `
              <p>Xin chào <strong>${item.accountId.fullname}</strong>,</p>
              <p>Phòng <strong>${deposit.roomId.roomNumber}</strong>
              tại nhà trọ <strong>${boardingHouseName}</strong>
              đã được người khác đặt cọc trước.</p>
            `
          );
        }
      }

      return res.status(200).json({
        message: "Đã chấp nhận khoản đặt cọc.",
        success: true,
        error: false,
        status: "accepted",
        depositId: deposit._id,
        emailSent,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Đã có lỗi xảy ra",
        detail: error.message,
      });
    }
  }

  async deleteDepositRoom(req, res) {
    try {
      const depositRoomId = req.params.depositRoomId || req.params.depositId;

      const depositRoom = await DepositRoom.findById(depositRoomId).populate({
        path: "roomId",
        populate: {
          path: "boardingHouseId",
          select: "ownerId staffId",
        },
      });

      if (!depositRoom) {
        return res.status(404).json({
          success: false,
          message: "Deposit room not found",
        });
      }

      const boardingHouse = depositRoom.roomId?.boardingHouseId;
      const userId = req.user.userId;
      const isOwner = boardingHouse?.ownerId?.toString() === userId;
      const isStaff = boardingHouse?.staffId?.toString() === userId;

      if (!isOwner && !isStaff) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this deposit request.",
        });
      }

      const status = String(depositRoom.status || "").toLowerCase();

      const deletableStatuses = ["rejected", "accepted", "confirmed"];

      if (!deletableStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Only rejected, accepted, or confirmed deposits can be deleted",
        });
      }

      if (status === "confirmed" && depositRoom.roomId?.rentBy) {
        depositRoom.roomId.rentBy = depositRoom.roomId.rentBy.filter(
          (id) => id.toString() !== depositRoom.accountId.toString()
        );

        await depositRoom.roomId.save();
      }

      await DepositRoom.deleteOne({
        _id: depositRoomId,
      });

      return res.status(200).json({
        success: true,
        message: "Deposit request deleted successfully",
        depositRoomId,
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

export default new DepositController();
