import cron from "node-cron";
import DepositRoom from "../models/depositRoom.js";
import PaymentBill from "../models/paymentBill.js";
import UserPayment from "../models/userPayment.js";
import Room from "../models/room.js";
import { Account } from "../models/account.js";
import {
  AUTO_RELEASE_OVERDUE_RENT,
  MAX_UNPAID_RENT_MONTHS,
  RENT_ARREARS_WARNING_MONTHS,
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

    // Hết thời hạn thuê: dừng tạo rent mới nhưng KHÔNG tự giải phóng phòng.
    // Người thuê vẫn có thể thanh toán hóa đơn cũ và gửi yêu cầu gia hạn.
    const endedContracts = await DepositRoom.find({
      status: "confirmed",
      endDate: { $lt: now },
    }).select("_id roomId accountId endDate");

    for (const deposit of endedContracts) {
      await DepositRoom.updateOne(
        { _id: deposit._id, status: "confirmed" },
        {
          $set: {
            status: "expired",
            expiredAt: now,
            reasonForCancel: "Thời hạn thuê đã kết thúc. Chờ gia hạn hoặc xác nhận trả phòng.",
          },
        }
      );

      const account = await Account.findById(deposit.accountId).select("fullname email");
      const room = await Room.findById(deposit.roomId).select("roomNumber");
      await sendEmailSafe(
        account?.email,
        "Thời hạn thuê phòng đã kết thúc",
        `<p>Xin chào <strong>${account?.fullname || "bạn"}</strong>,</p>
         <p>Thời hạn thuê phòng <strong>${room?.roomNumber || ""}</strong> đã kết thúc.</p>
         <p>Hệ thống đã dừng tạo kỳ tiền thuê mới. Bạn vẫn có thể thanh toán hóa đơn cũ và gửi yêu cầu gia hạn.</p>`
      );
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
      // Không còn đuổi người thuê ngay sau 1 kỳ quá hạn. Hệ thống cảnh báo từ
      // kỳ thứ 4 và chỉ chấm dứt thuê khi đủ 5 kỳ chưa thanh toán, đồng thời
      // kỳ thứ 5 đã hết thời gian gia hạn.
      const unresolvedBills = await PaymentBill.find({
        status: { $in: ["Pending", "Overdue"] },
        depositRoomId: { $ne: null },
      })
        .sort({ periodStart: 1, createdAt: 1 })
        .lean();

      const billsByDeposit = unresolvedBills.reduce((result, bill) => {
        const depositId = bill.depositRoomId?.toString();
        if (!depositId) return result;

        if (!result[depositId]) result[depositId] = [];
        result[depositId].push(bill);
        return result;
      }, {});

      for (const [depositId, bills] of Object.entries(billsByDeposit)) {
        const deposit = await DepositRoom.findOne({
          _id: depositId,
          status: "confirmed",
        }).populate("accountId", "fullname email");

        if (!deposit) continue;

        const unpaidMonths = bills.length;
        const room = await Room.findById(deposit.roomId);
        if (!room) continue;

        if (unpaidMonths >= RENT_ARREARS_WARNING_MONTHS) {
          const warningMarker = `RENT_ARREARS_WARNING_${unpaidMonths}`;
          const markerPayment = await UserPayment.findOne({
            depositRoomId: deposit._id,
            paymentBillId: { $in: bills.map((bill) => bill._id) },
          }).sort({ createdAt: -1 });

          if (
            markerPayment &&
            !String(markerPayment.orderInfo || "").includes(warningMarker)
          ) {
            const sent = await sendEmailSafe(
              deposit.accountId?.email,
              unpaidMonths >= MAX_UNPAID_RENT_MONTHS
                ? "Cảnh báo cuối: công nợ tiền thuê đã đạt giới hạn"
                : "Cảnh báo công nợ tiền thuê",
              `
                <p>Xin chào <strong>${
                  deposit.accountId?.fullname || "bạn"
                }</strong>,</p>
                <p>Bạn đang có <strong>${unpaidMonths}/${MAX_UNPAID_RENT_MONTHS}</strong>
                kỳ tiền thuê chưa thanh toán tại phòng <strong>${
                  room.roomNumber || ""
                }</strong>.</p>
                <p>Từ ${RENT_ARREARS_WARNING_MONTHS} kỳ hệ thống sẽ cảnh báo.
                Khi đủ ${MAX_UNPAID_RENT_MONTHS} kỳ và kỳ thứ ${MAX_UNPAID_RENT_MONTHS}
                hết thời gian gia hạn, hợp đồng sẽ bị chấm dứt và chỗ ở được mở lại.</p>
                <p>Các khoản nợ vẫn được giữ lại và vẫn có thể thanh toán sau khi hợp đồng bị chấm dứt.</p>
                <p><a href="${
                  process.env.CLIENT_URL || "http://localhost:3001"
                }/monthly-rents">Mở trang thanh toán</a></p>
              `
            );

            if (sent) {
              markerPayment.orderInfo = `${
                markerPayment.orderInfo || ""
              } ${warningMarker}`.trim();
              await markerPayment.save();
            }
          }
        }

        if (unpaidMonths < MAX_UNPAID_RENT_MONTHS) continue;

        const thresholdBill = bills[MAX_UNPAID_RENT_MONTHS - 1];
        if (
          !thresholdBill?.gracePeriodEnd ||
          new Date(thresholdBill.gracePeriodEnd) > now
        ) {
          continue;
        }

        room.rentBy = (room.rentBy || []).filter(
          (id) => id.toString() !== deposit.accountId?._id?.toString()
        );
        await room.save();

        deposit.status = "terminated";
        deposit.terminatedAt = now;
        deposit.reasonForCancel = `Chấm dứt thuê do còn ${unpaidMonths} kỳ tiền thuê chưa thanh toán.`;
        await deposit.save();

        // Không chuyển các khoản nợ sang Cancel. Chúng vẫn là Overdue để người
        // thuê có thể thanh toán sau khi đã bị chấm dứt hợp đồng.
        await sendEmailSafe(
          deposit.accountId?.email,
          "Hợp đồng thuê đã bị chấm dứt do nợ tiền thuê",
          `
            <p>Xin chào <strong>${
              deposit.accountId?.fullname || "bạn"
            }</strong>,</p>
            <p>Hợp đồng thuê phòng <strong>${room.roomNumber || ""}</strong>
            đã bị chấm dứt vì có <strong>${unpaidMonths}</strong> kỳ tiền thuê
            chưa thanh toán và kỳ thứ ${MAX_UNPAID_RENT_MONTHS} đã hết thời gian gia hạn.</p>
            <p>Tài khoản của bạn đã được xóa khỏi danh sách người đang ở để phòng có thể nhận người mới.</p>
            <p>Các hóa đơn còn nợ không bị xóa; bạn vẫn có thể vào trang tiền thuê để thanh toán.</p>
          `
        );

        await syncRoomAvailabilityWithReservations(room._id);
      }
    }

    // Tự sửa dữ liệu cũ: bill Overdue chỉ được đóng khi đã có ít nhất một
    // giao dịch thanh toán thành công. Các lần thử Failed không được xem là nợ
    // mới và cũng không được xem là đã thanh toán.
    const overdueBills = await PaymentBill.find({ status: "Overdue" });
    for (const bill of overdueBills) {
      const successfulPayment = await UserPayment.exists({
        paymentBillId: bill._id,
        status: { $in: ["Paid", "Done"] },
      });

      if (successfulPayment) {
        bill.status = "Done";
        bill.closedAt = now;
        await bill.save();
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
