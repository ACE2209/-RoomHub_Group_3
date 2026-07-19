import cron from "node-cron";
import DepositRoom from "../models/depositRoom.js";
import PaymentBill from "../models/paymentBill.js";
import UserPayment from "../models/userPayment.js";
import Room from "../models/room.js";
import { Account } from "../models/account.js";
import {
  AUTO_RELEASE_OVERDUE_RENT,
  syncRoomAvailabilityWithReservations,
} from "./paymentPolicy.js";
import { updateBoardingHouseRoomCounts } from "./updateBoardingHouseRoomCounts.js";
import {
  completePayment,
  queryZaloPayStatus,
} from "../controllers/paymentController.js";
import {
  formatDateTimeVi,
  formatVnd,
  sendPaymentEmail,
} from "./paymentEmail.js";

let running = false;
let initialRoomReconciliationDone = false;

const sendEmailSafe = async (to, subject, html) =>
  sendPaymentEmail({ to, subject, html });


export const processExpiredPayments = async () => {
  if (running) return;
  running = true;

  try {
    const now = new Date();

    // Chạy một lần sau khi server khởi động để sửa dữ liệu cũ và đồng bộ
    // availableRooms bên ngoài với trạng thái từng phòng bên trong.
    if (!initialRoomReconciliationDone) {
      const boardingHouseIds = await Room.distinct("boardingHouseId");
      for (const boardingHouseId of boardingHouseIds) {
        await updateBoardingHouseRoomCounts(boardingHouseId);
      }
      initialRoomReconciliationDone = true;
    }

    // Khôi phục các giao dịch ZaloPay đã trừ tiền nhưng callback localhost bị
    // miss hoặc redirect trước đây báo sai checksum. Chỉ truy vấn giao dịch gần
    // đây để tránh quét vô hạn các giao dịch cũ.
    const recentThreshold = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const pendingZaloPayments = await UserPayment.find({
      paymentMethod: "ZaloPay",
      status: { $in: ["Pending", "Failed"] },
      orderId: { $exists: true, $ne: "" },
      updatedAt: { $gte: recentThreshold },
    })
      .sort({ updatedAt: -1 })
      .limit(50);

    for (const payment of pendingZaloPayments) {
      try {
        const zaloStatus = await queryZaloPayStatus(payment.orderId);
        const returnCode = Number(
          zaloStatus.returncode ?? zaloStatus.return_code
        );

        if (returnCode === 1) {
          await completePayment(payment, {
            ...zaloStatus,
            zp_trans_id:
              zaloStatus.zptransid ||
              zaloStatus.zp_trans_id ||
              payment.transactionNo,
          });
        } else if (returnCode === 2 && payment.status !== "Failed") {
          payment.status = "Failed";
          await payment.save();
        }
      } catch (zaloError) {
        console.error(
          `ZaloPay reconciliation failed for ${payment.orderId}:`,
          zaloError.message
        );
      }
    }

    const expiredDeposits = await DepositRoom.find({
      status: "accepted",
      paymentDeadline: { $lte: now },
    }).select("_id roomId accountId");

    for (const deposit of expiredDeposits) {
      await DepositRoom.updateOne(
        { _id: deposit._id, status: "accepted" },
        {
          $set: {
            status: "expired",
            expiredAt: now,
            reasonForCancel: "Quá hạn thanh toán tiền cọc.",
          },
        }
      );

      await UserPayment.updateMany(
        { depositRoomId: deposit._id, status: "Pending" },
        { $set: { status: "Expired" } }
      );

      await syncRoomAvailabilityWithReservations(deposit.roomId);

      const account = await Account.findById(deposit.accountId).select(
        "fullname email",
      );
      const room = await Room.findById(deposit.roomId).select("roomNumber");

      await sendEmailSafe(
        account?.email,
        "Yêu cầu đặt cọc đã hết hạn",
        `
          <p>Xin chào <strong>${account?.fullname || "bạn"}</strong>,</p>
          <p>Yêu cầu đặt cọc cho phòng <strong>${room?.roomNumber || ""}</strong>
          đã hết hạn vì chưa được thanh toán trong vòng 1 ngày.</p>
          <p>Phòng đã được mở lại để người khác có thể đặt.</p>
        `,
      );
    }

    // Gửi email riêng cho từng người chưa trả. Dùng orderInfo làm marker để
    // không gửi lặp lại ở mỗi lần cron chạy và không cần thêm field/model mới.
    const pendingRentPayments = await UserPayment.find({
      status: "Pending",
      paymentBillId: { $ne: null },
    })
      .populate("accountId", "fullname email")
      .populate({
        path: "paymentBillId",
        populate: { path: "roomId", select: "roomNumber" },
      });

    for (const payment of pendingRentPayments) {
      const bill = payment.paymentBillId;
      if (!bill?.dueDate) continue;

      const millisecondsUntilDue = new Date(bill.dueDate).getTime() - now.getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      let marker = null;
      let subject = null;
      let message = null;

      if (millisecondsUntilDue > 0 && millisecondsUntilDue <= oneDay) {
        marker = "RENT_REMINDER_BEFORE_DUE";
        subject = "Nhắc thanh toán tiền thuê sắp đến hạn";
        message = "Khoản tiền thuê của bạn sẽ đến hạn trong vòng 24 giờ.";
      } else if (millisecondsUntilDue <= 0) {
        marker = "RENT_REMINDER_OVERDUE";
        subject = "Tiền thuê đã quá hạn thanh toán";
        message = "Khoản tiền thuê của bạn đã quá hạn. Vui lòng thanh toán trong thời gian gia hạn.";
      }

      if (!marker || String(payment.orderInfo || "").includes(marker)) continue;

      const sent = await sendEmailSafe(
        payment.accountId?.email,
        subject,
        `
          <p>Xin chào <strong>${payment.accountId?.fullname || "bạn"}</strong>,</p>
          <p>${message}</p>
          <p>Phòng: <strong>${bill.roomId?.roomNumber || ""}</strong></p>
          <p>Số tiền cần thanh toán: <strong>${formatVnd(payment.paymentAmount)}</strong></p>
          <p>Hạn thanh toán: <strong>${formatDateTimeVi(bill.dueDate)}</strong></p>
          <p>Thời gian gia hạn đến: <strong>${formatDateTimeVi(bill.gracePeriodEnd)}</strong></p>
          <p><a href="${process.env.CLIENT_URL || "http://localhost:3001"}/monthly-rents">Mở trang thanh toán</a></p>
        `
      );

      if (sent) {
        payment.orderInfo = `${payment.orderInfo || ""} ${marker}`.trim();
        await payment.save();
      }
    }

    await PaymentBill.updateMany(
      {
        status: "Pending",
        dueDate: { $lt: now },
      },
      { $set: { status: "Overdue", overdueAt: now } }
    );

    await UserPayment.updateMany(
      {
        status: "Pending",
        paymentBillId: {
          $in: await PaymentBill.find({ status: "Overdue" }).distinct("_id"),
        },
      },
      { $set: { status: "Overdue" } }
    );

    if (AUTO_RELEASE_OVERDUE_RENT) {
      const overduePayments = await UserPayment.find({
        status: "Overdue",
        paymentBillId: { $ne: null },
      }).populate("paymentBillId");

      for (const payment of overduePayments) {
        const bill = payment.paymentBillId;
        if (!bill?.gracePeriodEnd || bill.gracePeriodEnd > now) continue;

        const room = await Room.findById(bill.roomId);
        if (!room) continue;

        room.rentBy = (room.rentBy || []).filter(
          (id) => id.toString() !== payment.accountId.toString()
        );
        await room.save();

        payment.status = "Cancel";
        payment.orderInfo = `${payment.orderInfo || ""} AUTO_RELEASE_OVERDUE_RENT`.trim();
        await payment.save();

        await DepositRoom.updateOne(
          {
            _id: payment.depositRoomId,
            accountId: payment.accountId,
            roomId: bill.roomId,
            status: "confirmed",
          },
          {
            $set: {
              status: "terminated",
              terminatedAt: now,
              reasonForCancel: "Chấm dứt thuê do quá hạn tiền thuê.",
            },
          }
        );

        const account = await Account.findById(payment.accountId).select("fullname email");
        await sendEmailSafe(
          account?.email,
          "Hợp đồng thuê đã bị chấm dứt",
          `
            <p>Xin chào <strong>${account?.fullname || "bạn"}</strong>,</p>
            <p>Hợp đồng thuê phòng <strong>${room.roomNumber || ""}</strong> đã bị chấm dứt
            do khoản tiền thuê quá hạn không được thanh toán trong thời gian gia hạn.</p>
            <p>Chỉ tài khoản của bạn được xóa khỏi phòng; các người thuê khác không bị ảnh hưởng.</p>
          `
        );

        await syncRoomAvailabilityWithReservations(bill.roomId);
      }

      const overdueBills = await PaymentBill.find({ status: "Overdue" });
      for (const bill of overdueBills) {
        const unresolved = await UserPayment.exists({
          paymentBillId: bill._id,
          status: { $in: ["Pending", "Overdue", "Failed"] },
        });
        if (!unresolved) {
          bill.status = "Done";
          bill.closedAt = now;
          await bill.save();
        }
      }
    }
  } catch (error) {
    console.error("Payment cron error:", error);
  } finally {
    running = false;
  }
};

export const startPaymentCron = () => {
  cron.schedule("*/5 * * * *", processExpiredPayments);
  processExpiredPayments();
  console.log("Payment expiration cron started (every 5 minutes)");
};
