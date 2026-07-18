import cron from "node-cron";
import nodemailer from "nodemailer";
import DepositRoom from "../models/depositRoom.js";
import PaymentBill from "../models/paymentBill.js";
import UserPayment from "../models/userPayment.js";
import Room from "../models/room.js";
import { Account } from "../models/account.js";
import {
  AUTO_RELEASE_OVERDUE_RENT,
  syncRoomAvailabilityWithReservations,
} from "./paymentPolicy.js";

let running = false;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "trantnce180829@fpt.edu.vn",
    pass: "rjvs rqzj nsut asvr",
  },
});

const sendEmailSafe = async (to, subject, html) => {
  if (!to) return false;

  try {
    await transporter.sendMail({
      from: "trantnce180829@fpt.edu.vn",
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Payment expiration email failed:", error.message);
    return false;
  }
};


export const processExpiredPayments = async () => {
  if (running) return;
  running = true;

  try {
    const now = new Date();

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

        await DepositRoom.updateMany(
          {
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

        await syncRoomAvailabilityWithReservations(bill.roomId);
      }

      const overdueBills = await PaymentBill.find({ status: "Overdue" });
      for (const bill of overdueBills) {
        const unpaid = await UserPayment.exists({
          paymentBillId: bill._id,
          status: { $nin: ["Done", "Paid"] },
        });
        if (!unpaid) {
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
