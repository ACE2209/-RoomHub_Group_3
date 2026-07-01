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
        if (!to) {
          console.error("Deposit email failed: recipient email is missing");
          return false;
        }

        try {
          await sendEmail(to, subject, html);
          return true;
        } catch (emailError) {
          console.error("Deposit email failed:", emailError.message);
          return false;
        }
      };

      const getRecipientAccount = async (accountRef) => {
        if (!accountRef) {
          return null;
        }

        if (accountRef.email) {
          return accountRef;
        }

        const accountId = accountRef._id || accountRef;
        return Account.findById(accountId).select("fullname email");
      };

      const recipientAccount = await getRecipientAccount(deposit.accountId);

      if (!recipientAccount?.email) {
        return res.status(400).json({
          error: "Deposit account email not found.",
        });
      }

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
          recipientAccount.email,
          "Đặt cọc phòng trọ đã bị từ chối",
          `
            <p>Xin chào <strong>${recipientAccount.fullname}</strong>,</p>
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
            recipientAccount.email,
            "Yêu cầu đặt cọc đã bị từ chối",
            `
              <p>Xin chào <strong>${recipientAccount.fullname}</strong>,</p>
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
        recipientAccount.email,
        "Đặt cọc phòng trọ đã được chấp nhận",
        `
          <p>Xin chào <strong>${recipientAccount.fullname}</strong>,</p>
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
          const itemRecipientAccount = await getRecipientAccount(
            item.accountId
          );

          item.status = "rejected";
          item.reasonForCancel =
            "Phòng đã được đặt cọc bởi người khác.";
          await item.save();

          await sendEmailSafe(
            itemRecipientAccount?.email,
            "Yêu cầu đặt cọc đã bị từ chối",
            `
              <p>Xin chào <strong>${itemRecipientAccount?.fullname || "bạn"}</strong>,</p>
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
async createDeposit(req, res) {
  try {
    const accountId = req.user.userId;
    const { roomId, rentalTime, depositMonths, startDate, note } = req.body;

    if (!roomId || !rentalTime || !depositMonths || !startDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const allowedRentalTimes = [1, 3, 6, 12];
    const allowedDepositMonths = [1, 2];

    const rentalTimeNumber = Number(rentalTime);
    const depositMonthsNumber = Number(depositMonths);

    if (!allowedRentalTimes.includes(rentalTimeNumber)) {
      return res.status(400).json({
        success: false,
        message: "Rental time must be 1, 3, 6 or 12 months",
      });
    }

    if (!allowedDepositMonths.includes(depositMonthsNumber)) {
      return res.status(400).json({
        success: false,
        message: "Deposit must be 1 or 2 months",
      });
    }

    const room = await Room.findById(roomId).populate({
      path: "roomTypeId",
      select: "typeName price peopleNumber roomSize",
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (!room.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "This room is not available",
      });
    }

    const roomPrice = Number(room.roomTypeId?.price || 0);

    if (!roomPrice || roomPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Room price is invalid",
      });
    }

    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Start date is invalid",
      });
    }

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be in the past",
      });
    }

    const end = new Date(start);
    end.setMonth(end.getMonth() + rentalTimeNumber);

    const existedSameRoom = await DepositRoom.findOne({
      accountId,
      roomId,
      status: { $in: ["pending", "accepted", "confirmed"] },
    });

    if (existedSameRoom) {
      return res.status(400).json({
        success: false,
        message: "You already have a deposit request for this room",
      });
    }

    const roomHasAcceptedDeposit = await DepositRoom.findOne({
      roomId,
      status: { $in: ["accepted", "confirmed"] },
    });

    if (roomHasAcceptedDeposit) {
      return res.status(400).json({
        success: false,
        message: "This room already has an accepted or confirmed deposit",
      });
    }

    const totalPendingDeposits = await DepositRoom.countDocuments({
      accountId,
      status: "pending",
    });

    if (totalPendingDeposits >= 3) {
      return res.status(400).json({
        success: false,
        message: "You can only have up to 3 pending deposit requests",
      });
    }

    const amount = roomPrice * depositMonthsNumber;

    const deposit = await DepositRoom.create({
      accountId,
      roomId,
      amount,
      depositMonths: depositMonthsNumber,
      rentalTime: rentalTimeNumber,
      startDate: start,
      endDate: end,
      note: note || "",
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Deposit request created successfully",
      data: deposit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async getMyDeposits(req, res) {
  try {
    const deposits = await DepositRoom.find({
      accountId: req.user.userId,
    })
      .populate({
        path: "roomId",
        populate: [
          {
            path: "boardingHouseId",
            select: "name address",
          },
          {
            path: "roomTypeId",
            select: "typeName price peopleNumber roomSize",
          },
        ],
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: deposits,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
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
