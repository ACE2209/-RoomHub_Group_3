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

const makeZaloPayOrderId = (prefix) => {
  const date = moment().format("YYMMDD");
  const random = Math.floor(Math.random() * 10000);
  return `${date}_${prefix}${Date.now().toString().slice(-8)}${random}`;
};

const getClientReturnUrl = ({ status, type, provider, message }) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3001";
  return `${clientUrl}/payment-result?status=${status}&type=${type}&provider=${provider}&message=${encodeURIComponent(
    message
  )}`;
};

const getServerBaseUrl = () =>
  process.env.SERVER_URL ||
  `http://${process.env.APP_HOST || "localhost"}:${
    process.env.APP_PORT || process.env.PORT || 3000
  }`;

const getZaloPayRedirectUrl = () =>
  process.env.ZALOPAY_REDIRECT_URL ||
  `${getServerBaseUrl()}/payment/zalopay-redirect`;

const normalizeMethod = (method) => {
  const value = String(method || "").toLowerCase();

  if (value === "vnpay") return "VNPay";
  if (value === "zalopay") return "ZaloPay";

  return null;
};

const validateAmount = (amount) => {
  const numberAmount = Number(amount);
  return Number.isFinite(numberAmount) && numberAmount > 0;
};

const validateVNPayConfig = () => {
  if (!process.env.VNP_TMN_CODE || !process.env.VNP_HASH_SECRET) {
    throw new Error("Missing VNPay config");
  }
};

const validateZaloPayConfig = () => {
  if (
    !process.env.ZALOPAY_APP_ID ||
    !process.env.ZALOPAY_KEY1 ||
    !process.env.ZALOPAY_KEY2
  ) {
    throw new Error("Missing ZaloPay config");
  }
};

const buildVNPayUrl = ({ req, orderId, amount, orderInfo }) => {
  validateVNPayConfig();

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
  validateVNPayConfig();

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

const buildZaloPayUrl = async ({ orderId, amount, orderInfo }) => {
  validateZaloPayConfig();

  const endpoint =
    process.env.ZALOPAY_CREATE_URL ||
    "https://sandbox.zalopay.com.vn/v001/tpe/createorder";

  const appid = Number(process.env.ZALOPAY_APP_ID);
  const key1 = process.env.ZALOPAY_KEY1;

  const embeddata = JSON.stringify({
    merchantinfo: orderInfo,

    // Quan trọng:
    // Không redirect thẳng về FE nữa.
    // Phải redirect về BE để BE check trạng thái và update DB.
    redirecturl: getZaloPayRedirectUrl(),
  });

  const item = JSON.stringify([
    {
      itemid: orderId,
      itemname: orderInfo,
      itemprice: Number(amount),
      itemquantity: 1,
    },
  ]);

  const order = {
    appid,
    appuser: "RoomHubUser",
    apptime: Date.now(),
    amount: Number(amount),
    apptransid: orderId,
    embeddata,
    item,
    description: `RoomHub - ${orderInfo}`,
    bankcode: "zalopayapp",
  };

  const data =
    `${order.appid}|${order.apptransid}|${order.appuser}|${order.amount}|` +
    `${order.apptime}|${order.embeddata}|${order.item}`;

  order.mac = crypto.createHmac("sha256", key1).update(data).digest("hex");

  const response = await axios.post(
    endpoint,
    new URLSearchParams(order).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (Number(response.data?.returncode) !== 1) {
    throw new Error(
      response.data?.returnmessage ||
        response.data?.subreturnmessage ||
        "Create ZaloPay order failed"
    );
  }

  return response.data.orderurl;
};

const verifyZaloPay = (body) => {
  validateZaloPayConfig();

  if (!body?.data || !body?.mac) return false;

  const checkMac = crypto
    .createHmac("sha256", process.env.ZALOPAY_KEY2)
    .update(body.data)
    .digest("hex");

  return body.mac === checkMac;
};

const verifyZaloPayRedirect = (query) => {
  validateZaloPayConfig();

  const {
    appid,
    apptransid,
    pmcid,
    bankcode,
    amount,
    discountamount,
    status,
    checksum,
  } = query;

  if (!appid || !apptransid || !checksum) return false;

  const checksumData = `${appid}|${apptransid}|${pmcid || ""}|${
    bankcode || ""
  }|${amount || ""}|${discountamount || ""}|${status || ""}`;

  const checkSum = crypto
    .createHmac("sha256", process.env.ZALOPAY_KEY2)
    .update(checksumData)
    .digest("hex");

  return checksum === checkSum;
};

const queryZaloPayStatus = async (apptransid) => {
  validateZaloPayConfig();

  const appid = Number(process.env.ZALOPAY_APP_ID);
  const key1 = process.env.ZALOPAY_KEY1;

  const endpoint =
    process.env.ZALOPAY_STATUS_URL ||
    "https://sandbox.zalopay.com.vn/v001/tpe/getstatusbyapptransid";

  const data = `${appid}|${apptransid}|${key1}`;

  const mac = crypto.createHmac("sha256", key1).update(data).digest("hex");

  const response = await axios.post(
    endpoint,
    new URLSearchParams({
      appid,
      apptransid,
      mac,
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
};

const completePayment = async (payment, rawData) => {
  if (!payment) throw new Error("Payment not found");

  if (payment.status === "Paid") return payment;

  if (payment.status !== "Pending") {
    throw new Error("Payment is not pending");
  }

  if (payment.depositRoomId) {
    const deposit = await DepositRoom.findById(payment.depositRoomId).populate(
      "roomId"
    );

    if (!deposit) throw new Error("Deposit not found");

    if (deposit.status !== "accepted") {
      throw new Error("Deposit must be accepted before payment");
    }

    if (!deposit.roomId) {
      throw new Error("Room not found");
    }

    deposit.status = "confirmed";

    if (!Array.isArray(deposit.roomId.rentBy)) {
      deposit.roomId.rentBy = [];
    }

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

  payment.status = "Paid";

  const pendingOtherPayments = await UserPayment.exists({
    paymentBillId: bill._id,
    _id: { $ne: payment._id },
    status: { $nin: ["Paid", "Done"] },
  });

  if (!pendingOtherPayments) {
    bill.status = "Done";
    await bill.save();
  }
}

  payment.status = "Paid";
  payment.transactionNo =
    rawData.vnp_TransactionNo ||
    rawData.transId ||
    rawData.zp_trans_id ||
    rawData.zptransid ||
    rawData.zptransid ||
    payment.transactionNo ||
    "";

  await payment.save();

  return payment;
};

class PaymentController {
  async payDeposit(req, res) {
    try {
      const { depositId } = req.params;
      const { method } = req.body;
      const accountId = req.user.userId;

      const paymentMethod = normalizeMethod(method);

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method. Use VNPay or ZaloPay",
        });
      }

      const deposit = await DepositRoom.findOne({
        _id: depositId,
        accountId,
      });

      if (!deposit) {
        return res.status(404).json({
          success: false,
          message: "Deposit not found",
        });
      }

      if (deposit.status !== "accepted") {
        return res.status(400).json({
          success: false,
          message: "Owner must accept deposit before payment",
        });
      }

      if (!validateAmount(deposit.amount)) {
        return res.status(400).json({
          success: false,
          message: "Deposit amount is invalid",
        });
      }

      const existedPaidPayment = await UserPayment.findOne({
        depositRoomId: deposit._id,
        accountId,
        status: "Paid",
      });

      if (existedPaidPayment) {
        return res.status(400).json({
          success: false,
          message: "Deposit already paid",
        });
      }

      await UserPayment.updateMany(
        {
          depositRoomId: deposit._id,
          accountId,
          status: "Pending",
        },
        {
          $set: {
            status: "Failed",
          },
        }
      );

      const orderId =
        paymentMethod === "ZaloPay"
          ? makeZaloPayOrderId("DEP")
          : makeOrderId("DEP");

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
          : await buildZaloPayUrl({
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

      const paymentMethod = normalizeMethod(method);

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method. Use VNPay or ZaloPay",
        });
      }

      const bill = await PaymentBill.findById(billId).populate("roomId");

      if (!bill || !bill.roomId) {
        return res.status(404).json({
          success: false,
          message: "Payment bill not found",
        });
      }

      const isRenter = bill.roomId.rentBy
        .map((id) => id.toString())
        .includes(accountId);

      if (!isRenter) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to pay this bill",
        });
      }

      if (String(bill.status).toLowerCase() === "paid") {
        return res.status(400).json({
          success: false,
          message: "Bill already paid",
        });
      }

      if (!validateAmount(bill.paymentAmount)) {
        return res.status(400).json({
          success: false,
          message: "Bill amount is invalid",
        });
      }

      const existedPaidPayment = await UserPayment.findOne({
        paymentBillId: bill._id,
        accountId,
        status: "Paid",
      });

      if (existedPaidPayment) {
        return res.status(400).json({
          success: false,
          message: "Bill already paid",
        });
      }

      await UserPayment.updateMany(
        {
          paymentBillId: bill._id,
          accountId,
          status: "Pending",
        },
        {
          $set: {
            status: "Failed",
          },
        }
      );

      const orderId =
        paymentMethod === "ZaloPay"
          ? makeZaloPayOrderId("RENT")
          : makeOrderId("RENT");

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
          : await buildZaloPayUrl({
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
async payUserMonthlyRent(req, res) {
  try {
    const { userPaymentId } = req.params;
    const { method } = req.body;
    const accountId = req.user.userId;

    const paymentMethod = normalizeMethod(method);

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Use VNPay or ZaloPay",
      });
    }

    const userPayment = await UserPayment.findOne({
      _id: userPaymentId,
      accountId,
    }).populate({
      path: "paymentBillId",
      populate: {
        path: "roomId",
      },
    });

    if (!userPayment) {
      return res.status(404).json({
        success: false,
        message: "Monthly rent payment not found",
      });
    }

    if (!userPayment.paymentBillId) {
      return res.status(400).json({
        success: false,
        message: "Invalid monthly rent payment",
      });
    }

    if (["Paid", "Done"].includes(userPayment.status)) {
      return res.status(400).json({
        success: false,
        message: "Monthly rent already paid",
      });
    }

    if (userPayment.status === "Cancel") {
      return res.status(400).json({
        success: false,
        message: "Monthly rent was canceled",
      });
    }

    if (!validateAmount(userPayment.paymentAmount)) {
      return res.status(400).json({
        success: false,
        message: "Monthly rent amount is invalid",
      });
    }

    const orderId =
      paymentMethod === "ZaloPay"
        ? makeZaloPayOrderId("RENT")
        : makeOrderId("RENT");

    const orderInfo = `RENT_${userPayment._id}`;

    userPayment.status = "Pending";
    userPayment.paymentMethod = paymentMethod;
    userPayment.orderId = orderId;
    userPayment.orderInfo = orderInfo;
    userPayment.transactionNo = "";
    await userPayment.save();

    const paymentUrl =
      paymentMethod === "VNPay"
        ? buildVNPayUrl({
            req,
            orderId,
            amount: userPayment.paymentAmount,
            orderInfo,
          })
        : await buildZaloPayUrl({
            orderId,
            amount: userPayment.paymentAmount,
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

async zalopayRedirect(req, res) {
  const redirectToClient = (status, type, message) => {
    return res.redirect(
      getClientReturnUrl({
        status,
        type,
        provider: "zalopay",
        message,
      })
    );
  };

  try {
    console.log("ZaloPay redirect query:", req.query);

    if (!verifyZaloPayRedirect(req.query)) {
      return redirectToClient(
        "failed",
        "unknown",
        "Invalid ZaloPay redirect checksum"
      );
    }

    const appTransId = req.query.apptransid;

    const payment = await UserPayment.findOne({
      orderId: appTransId,
    });

    if (!payment) {
      return redirectToClient("failed", "unknown", "Payment not found");
    }

    const type = payment.depositRoomId ? "deposit" : "rent";

    if (payment.status === "Paid") {
      return redirectToClient("success", type, "Payment already completed");
    }

    if (payment.status !== "Pending") {
      return redirectToClient(
        "failed",
        type,
        `Payment is ${payment.status}, please create a new payment`
      );
    }

    const zaloPayStatus = await queryZaloPayStatus(appTransId);

    console.log("ZaloPay status response:", zaloPayStatus);

    const returnCode = Number(
      zaloPayStatus.returncode ?? zaloPayStatus.return_code
    );

    if (returnCode === 1) {
      await completePayment(payment, {
        ...req.query,
        ...zaloPayStatus,
        zp_trans_id:
          zaloPayStatus.zptransid ||
          zaloPayStatus.zp_trans_id ||
          req.query.zptransid,
      });

      return redirectToClient("success", type, "Payment successful");
    }

    if (returnCode === 3) {
      return redirectToClient(
        "pending",
        type,
        zaloPayStatus.returnmessage ||
          zaloPayStatus.return_message ||
          "ZaloPay payment is still processing, please check again later"
      );
    }

    payment.status = "Failed";
    payment.transactionNo =
      zaloPayStatus.zptransid ||
      zaloPayStatus.zp_trans_id ||
      req.query.zptransid ||
      payment.transactionNo ||
      "";

    await payment.save();

    return redirectToClient(
      "failed",
      type,
      zaloPayStatus.returnmessage ||
        zaloPayStatus.return_message ||
        "ZaloPay payment failed"
    );
  } catch (error) {
    console.error("ZaloPay redirect error:", error);
    return redirectToClient("failed", "unknown", error.message);
  }
}

  async zalopayReturn(req, res) {
    try {
      if (!verifyZaloPay(req.body)) {
        return res.json({
          returncode: -1,
          returnmessage: "Invalid ZaloPay signature",
        });
      }

      const data = JSON.parse(req.body.data || "{}");
      const appTransId = data.apptransid || data.app_trans_id;

      if (!appTransId) {
        return res.json({
          returncode: -1,
          returnmessage: "Missing apptransid",
        });
      }

      const payment = await UserPayment.findOne({
        orderId: appTransId,
      });

      if (!payment) {
        return res.json({
          returncode: -1,
          returnmessage: "Payment not found",
        });
      }

      await completePayment(payment, {
        ...data,
        zp_trans_id: data.zptransid || data.zp_trans_id,
      });

      return res.json({
        returncode: 1,
        returnmessage: "success",
      });
    } catch (error) {
      return res.json({
        returncode: -1,
        returnmessage: error.message,
      });
    }
  }
}

export default new PaymentController();