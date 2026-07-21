import nodemailer from "nodemailer";
import moment from "moment";
import DepositRoom from "../models/depositRoom.js";
import Room from "../models/room.js";
import BoardingHouse from "../models/boardingHouse.js";
import { Account } from "../models/account.js";
import PaymentBill from "../models/paymentBill.js";
import UserPayment from "../models/userPayment.js";
import paginate from "../utils/pagination.js";
import { updateBoardingHouseRoomCounts } from "../utils/updateBoardingHouseRoomCounts.js";

const addRentalMonths = (startDate, months) => {
  const start = new Date(startDate);
  const end = new Date(
    start.getFullYear(),
    start.getMonth() + months,
    1,
    start.getHours(),
    start.getMinutes(),
    start.getSeconds(),
    start.getMilliseconds()
  );
  const lastDay = new Date(
    end.getFullYear(),
    end.getMonth() + 1,
    0
  ).getDate();
  end.setDate(Math.min(start.getDate(), lastDay));
  return end;
};

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
          message:
            "You do not have permission to view this boarding house deposits.",
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
        ]),
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
        req,
      );

      const boardingHouseMap = new Map(
        boardingHouses.map((bh) => [bh._id.toString(), bh.name]),
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
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "trantnce180829@fpt.edu.vn",
          pass: "rjvs rqzj nsut asvr",
        },
      });

      const sendEmail = async (to, subject, html) => {
        await transporter.sendMail({
          from: "trantnce180829@fpt.edu.vn",
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
          `,
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

      // Cả phòng đơn và ký túc xá đều phải kiểm tra số chỗ thực tế.
      // Phòng thường luôn có capacity = 1; ký túc xá lấy peopleNumber.
      const capacityState = await getRoomCapacityState(deposit.roomId._id, {
        excludeDepositId: deposit._id,
      });

      if (!capacityState || capacityState.availableSlots <= 0) {
        deposit.status = "rejected";
        deposit.reasonForCancel = capacityState?.isDormitory
          ? "Phòng ký túc xá đã đủ số lượng người."
          : "Phòng đã có người giữ chỗ hoặc đang thuê.";
        await deposit.save();

        const emailSent = await sendEmailSafe(
          recipientAccount.email,
          "Yêu cầu đặt cọc đã bị từ chối",
          `
            <p>Xin chào <strong>${recipientAccount.fullname}</strong>,</p>
            <p>Phòng <strong>${deposit.roomId.roomNumber}</strong>
            tại nhà trọ <strong>${boardingHouseName}</strong> hiện đã hết chỗ.</p>
          `,
        );

        return res.status(200).json({
          message: "Phòng đã hết chỗ, đơn đã bị từ chối.",
          success: true,
          error: false,
          status: "rejected",
          depositId: deposit._id,
          emailSent,
        });
      }

      deposit.status = "accepted";
      deposit.paymentDeadline = buildDepositPaymentDeadline();
      deposit.expiredAt = undefined;
      await deposit.save();

      await syncRoomAvailabilityWithReservations(deposit.roomId._id);

      const paymentUrl = `${process.env.CLIENT_URL || "http://localhost:3001"}/my-deposits`;
      const formattedDeadline = moment(deposit.paymentDeadline).format(
        "HH:mm [ngày] DD/MM/YYYY",
      );

      const emailSent = await sendEmailSafe(
        recipientAccount.email,
        "Đặt cọc phòng trọ đã được chấp nhận",
        `
          <p>Xin chào <strong>${recipientAccount.fullname}</strong>,</p>
          <p>Yêu cầu đặt cọc của bạn cho phòng <strong>${deposit.roomId.roomNumber}</strong>
          tại nhà trọ <strong>${boardingHouseName}</strong> đã được chấp nhận.</p>
          <p><strong>Số tiền cần thanh toán:</strong>
            ${Number(deposit.amount).toLocaleString("vi-VN")} VNĐ
          </p>
          <p><strong>Hạn thanh toán:</strong> ${formattedDeadline}</p>
          <p>Bạn có <strong>1 ngày</strong> để thanh toán tiền cọc.
          Sau thời hạn trên, yêu cầu sẽ tự động hết hạn và phòng sẽ được mở lại.</p>
          <p>
            <a href="${paymentUrl}"
              style="display:inline-block;padding:12px 20px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
              Thanh toán tiền cọc
            </a>
          </p>
        `,
      );

      // Không từ chối các yêu cầu khác ở bước Accept.
      // Chỉ khi thanh toán cọc thành công hệ thống mới chốt phòng và xử lý các yêu cầu còn lại.
      const otherPendingDeposits = await DepositRoom.countDocuments({
        _id: { $ne: depositId },
        roomId: deposit.roomId._id,
        status: "pending",
      });

      return res.status(200).json({
        message: "Đã chấp nhận khoản đặt cọc.",
        success: true,
        error: false,
        status: "accepted",
        depositId: deposit._id,
        pendingOtherDeposits: otherPendingDeposits,
        paymentDeadline: deposit.paymentDeadline,
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

      const room = await Room.findById(roomId)
        .populate({
          path: "roomTypeId",
          select: "typeName price peopleNumber roomSize",
        })
        .populate({
          path: "boardingHouseId",
          select: "boardingHouseType",
          populate: { path: "boardingHouseType", select: "codeName" },
        });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      const capacityState = await getRoomCapacityState(room._id);

      if (!capacityState || capacityState.availableSlots <= 0) {
        await syncRoomAvailabilityWithReservations(room._id);
        return res.status(400).json({
          success: false,
          message: "This room is full or currently held for payment",
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

      const end = addRentalMonths(start, rentalTimeNumber);

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

      const deletableStatuses = ["pending", "rejected", "expired", "cancelled"];

      if (!deletableStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Only pending, rejected, expired, or cancelled deposits can be deleted",
        });
      }

      if (["accepted", "confirmed"].includes(status) && depositRoom.roomId?.rentBy) {
        depositRoom.roomId.rentBy = depositRoom.roomId.rentBy.filter(
          (id) => id.toString() !== depositRoom.accountId.toString(),
        );

        await depositRoom.roomId.save();
      }

      const userPayments = await UserPayment.find({
        depositRoomId,
        paymentBillId: { $ne: null },
      }).select("paymentBillId");

      const paymentBillIds = [
        ...new Set(
          userPayments
            .map((payment) => payment.paymentBillId?.toString())
            .filter(Boolean),
        ),
      ];

      const deletedUserPayments = await UserPayment.deleteMany({
        depositRoomId,
        paymentBillId: { $ne: null },
      });

      let deletedPaymentBills = 0;

      for (const paymentBillId of paymentBillIds) {
        const hasOtherUserPayments = await UserPayment.exists({
          paymentBillId,
        });

        if (!hasOtherUserPayments) {
          const result = await PaymentBill.deleteOne({ _id: paymentBillId });
          deletedPaymentBills += result.deletedCount;
        }
      }

      await DepositRoom.deleteOne({
        _id: depositRoomId,
      });

      if (["accepted", "confirmed"].includes(status) && depositRoom.roomId?._id) {
        const hasOtherActiveDeposit = await DepositRoom.exists({
          roomId: depositRoom.roomId._id,
          status: { $in: ["accepted", "confirmed"] },
        });

        await Room.updateOne(
          { _id: depositRoom.roomId._id },
          { $set: { isAvailable: !hasOtherActiveDeposit } },
        );

        if (boardingHouse?._id) {
          await updateBoardingHouseRoomCounts(boardingHouse._id);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Deposit request deleted successfully",
        depositRoomId,
        deletedUserPayments: deletedUserPayments.deletedCount,
        deletedPaymentBills,
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
