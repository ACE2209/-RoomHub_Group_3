import crypto from "crypto";
import axios from "axios";
import moment from "moment";

import DepositRoom from "../models/depositRoom.js";
import PaymentBill from "../models/paymentBill.js";
import UserPayment from "../models/userPayment.js";

const sortObject = (obj) => {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
};

const makeOrderId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const getClientReturnUrl = ({ status, type, provider, message }) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3001";
  return `${clientUrl}/payment-result?status=${status}&type=${type}&provider=${provider}&message=${encodeURIComponent(
    message
  )}`;
};

const buildVNPayUrl = ({ req, orderId, amount, orderInfo }) => {
  const vnpUrl =
    process.env.VNP_URL ||
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

  const returnUrl =
    process.env.VNP_RETURN_URL ||
    `${process.env.SERVER_URL || "http://localhost:3000"}/payment/vnpay-return`;

  const ipAddr =
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "127.0.0.1";

  let params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: process.env.VNP_TMN_CODE,
    vnp_Amount: Number(amount) * 100,
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: moment().format("YYYYMMDDHHmmss"),
  };

  params = sortObject(params);

  const signData = new URLSearchParams(params).toString();

  const secureHash = crypto
    .createHmac("sha512", process.env.VNP_HASH_SECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  params.vnp_SecureHash = secureHash;

  return `${vnpUrl}?${new URLSearchParams(params).toString()}`;
};

const verifyVNPay = (query) => {
  const params = { ...query };
  const secureHash = params.vnp_SecureHash;

  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sorted = sortObject(params);
  const signData = new URLSearchParams(sorted).toString();

  const checkHash = crypto
    .createHmac("sha512", process.env.VNP_HASH_SECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  return secureHash === checkHash;
};

const buildMoMoUrl = async ({ orderId, amount, orderInfo }) => {
  const endpoint =
    process.env.MOMO_ENDPOINT ||
    "https://test-payment.momo.vn/v2/gateway/api/create";

  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;

  const redirectUrl =
    process.env.MOMO_RETURN_URL ||
    `${process.env.SERVER_URL || "http://localhost:3000"}/payment/momo-return`;

  const ipnUrl =
    process.env.MOMO_IPN_URL ||
    `${process.env.SERVER_URL || "http://localhost:3000"}/payment/momo-return`;

  const requestId = orderId;
  const requestType = "captureWallet";
  const extraData = "";

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const response = await axios.post(endpoint, {
    partnerCode,
    accessKey,
    requestId,
    amount: Number(amount),
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: "vi",
  });

  return response.data.payUrl;
};

const verifyMoMo = (query) => {
  const rawSignature =
    `accessKey=${process.env.MOMO_ACCESS_KEY}` +
    `&amount=${query.amount}` +
    `&extraData=${query.extraData || ""}` +
    `&message=${query.message}` +
    `&orderId=${query.orderId}` +
    `&orderInfo=${query.orderInfo}` +
    `&orderType=${query.orderType}` +
    `&partnerCode=${query.partnerCode}` +
    `&payType=${query.payType}` +
    `&requestId=${query.requestId}` +
    `&responseTime=${query.responseTime}` +
    `&resultCode=${query.resultCode}` +
    `&transId=${query.transId}`;

  const checkSignature = crypto
    .createHmac("sha256", process.env.MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest("hex");

  return checkSignature === query.signature;
};

const completePayment = async (payment, rawData) => {
  if (payment.status === "Paid") return payment;

  if (payment.depositRoomId) {
    const deposit = await DepositRoom.findById(payment.depositRoomId).populate(
      "roomId"
    );

    if (!deposit) throw new Error("Deposit not found");
    if (deposit.status !== "accepted") {
      throw new Error("Deposit must be accepted before payment");
    }

    deposit.status = "confirmed";

    const rentBy = deposit.roomId.rentBy.map((id) => id.toString());
    if (!rentBy.includes(deposit.accountId.toString())) {
      deposit.roomId.rentBy.push(deposit.accountId);
    }

    await deposit.roomId.save();
    await deposit.save();
  }

  if (payment.paymentBillId) {
    const bill = await PaymentBill.findById(payment.paymentBillId);
    if (!bill) throw new Error("Payment bill not found");

    bill.status = "Paid";
    await bill.save();
  }

  payment.status = "Paid";
  payment.transactionNo =
    rawData.vnp_TransactionNo || rawData.transId || payment.transactionNo;
  await payment.save();

  return payment;
};

class PaymentController {
  async payDeposit(req, res) {
    try {
      const { depositId } = req.params;
      const { method } = req.body;
      const accountId = req.user.userId;

      if (!["MoMo", "VNPay", "momo", "vnpay"].includes(method)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }

      const paymentMethod =
        method.toLowerCase() === "momo" ? "MoMo" : "VNPay";

      const deposit = await DepositRoom.findOne({
        _id: depositId,
        accountId,
      });

      if (!deposit) {
        return res.status(404).json({ message: "Deposit not found" });
      }

      if (deposit.status !== "accepted") {
        return res.status(400).json({
          message: "Owner must accept deposit before payment",
        });
      }

      const orderId = makeOrderId("DEP");
      const orderInfo = `DEPOSIT_${deposit._id}`;

      const userPayment = await UserPayment.create({
        depositRoomId: deposit._id,
        accountId,
        paymentAmount: deposit.amount,
        status: "Pending",
        paymentMethod,
        orderId,
        orderInfo,
      });

      const paymentUrl =
        paymentMethod === "VNPay"
          ? buildVNPayUrl({
              req,
              orderId,
              amount: deposit.amount,
              orderInfo,
            })
          : await buildMoMoUrl({
              orderId,
              amount: deposit.amount,
              orderInfo,
            });

      return res.status(200).json({
        success: true,
        message: "Payment URL created",
        data: {
          paymentUrl,
          payUrl: paymentUrl,
          payment: userPayment,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMyPaymentBills(req, res) {
    try {
      const accountId = req.user.userId;

      const bills = await PaymentBill.find()
        .populate({
          path: "roomId",
          match: { rentBy: accountId },
          populate: [
            { path: "boardingHouseId", select: "name address" },
            { path: "roomTypeId", select: "typeName price" },
          ],
        })
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: bills.filter((bill) => bill.roomId),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async payRent(req, res) {
    try {
      const { billId } = req.params;
      const { method } = req.body;
      const accountId = req.user.userId;

      if (!["MoMo", "VNPay", "momo", "vnpay"].includes(method)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }

      const paymentMethod =
        method.toLowerCase() === "momo" ? "MoMo" : "VNPay";

      const bill = await PaymentBill.findById(billId).populate("roomId");

      if (!bill || !bill.roomId) {
        return res.status(404).json({ message: "Payment bill not found" });
      }

      const isRenter = bill.roomId.rentBy
        .map((id) => id.toString())
        .includes(accountId);

      if (!isRenter) {
        return res.status(403).json({
          message: "You do not have permission to pay this bill",
        });
      }

      if (String(bill.status).toLowerCase() === "paid") {
        return res.status(400).json({ message: "Bill already paid" });
      }

      const orderId = makeOrderId("RENT");
      const orderInfo = `RENT_${bill._id}`;

      const userPayment = await UserPayment.create({
        paymentBillId: bill._id,
        accountId,
        paymentAmount: bill.paymentAmount,
        status: "Pending",
        paymentMethod,
        orderId,
        orderInfo,
      });

      const paymentUrl =
        paymentMethod === "VNPay"
          ? buildVNPayUrl({
              req,
              orderId,
              amount: bill.paymentAmount,
              orderInfo,
            })
          : await buildMoMoUrl({
              orderId,
              amount: bill.paymentAmount,
              orderInfo,
            });

      return res.status(200).json({
        success: true,
        message: "Payment URL created",
        data: {
          paymentUrl,
          payUrl: paymentUrl,
          payment: userPayment,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async vnpayReturn(req, res) {
    try {
      if (!verifyVNPay(req.query)) {
        return res.redirect(
          getClientReturnUrl({
            status: "failed",
            type: "unknown",
            provider: "vnpay",
            message: "Invalid VNPay signature",
          })
        );
      }

      const payment = await UserPayment.findOne({
        orderId: req.query.vnp_TxnRef,
      });

      if (!payment) {
        return res.redirect(
          getClientReturnUrl({
            status: "failed",
            type: "unknown",
            provider: "vnpay",
            message: "Payment not found",
          })
        );
      }

      if (req.query.vnp_ResponseCode !== "00") {
        payment.status = "Failed";
        payment.transactionNo = req.query.vnp_TransactionNo || "";
        await payment.save();

        return res.redirect(
          getClientReturnUrl({
            status: "failed",
            type: payment.depositRoomId ? "deposit" : "rent",
            provider: "vnpay",
            message: "VNPay payment failed",
          })
        );
      }

      await completePayment(payment, req.query);

      return res.redirect(
        getClientReturnUrl({
          status: "success",
          type: payment.depositRoomId ? "deposit" : "rent",
          provider: "vnpay",
          message: "Payment successful",
        })
      );
    } catch (error) {
      return res.redirect(
        getClientReturnUrl({
          status: "failed",
          type: "unknown",
          provider: "vnpay",
          message: error.message,
        })
      );
    }
  }

  async momoReturn(req, res) {
    try {
      if (!verifyMoMo(req.query)) {
        return res.redirect(
          getClientReturnUrl({
            status: "failed",
            type: "unknown",
            provider: "momo",
            message: "Invalid MoMo signature",
          })
        );
      }

      const payment = await UserPayment.findOne({
        orderId: req.query.orderId,
      });

      if (!payment) {
        return res.redirect(
          getClientReturnUrl({
            status: "failed",
            type: "unknown",
            provider: "momo",
            message: "Payment not found",
          })
        );
      }

      if (String(req.query.resultCode) !== "0") {
        payment.status = "Failed";
        payment.transactionNo = req.query.transId || "";
        await payment.save();

        return res.redirect(
          getClientReturnUrl({
            status: "failed",
            type: payment.depositRoomId ? "deposit" : "rent",
            provider: "momo",
            message: "MoMo payment failed",
          })
        );
      }

      await completePayment(payment, req.query);

      return res.redirect(
        getClientReturnUrl({
          status: "success",
          type: payment.depositRoomId ? "deposit" : "rent",
          provider: "momo",
          message: "Payment successful",
        })
      );
    } catch (error) {
      return res.redirect(
        getClientReturnUrl({
          status: "failed",
          type: "unknown",
          provider: "momo",
          message: error.message,
        })
      );
    }
  }
}

export default new PaymentController();