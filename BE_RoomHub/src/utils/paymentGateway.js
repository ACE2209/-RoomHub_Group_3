import crypto from "crypto";
import axios from "axios";
import moment from "moment";

const sortObject = (obj) => {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
};

export const buildVNPayUrl = ({ req, orderId, amount, orderInfo }) => {
  const vnpUrl =
    process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const tmnCode = process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET;
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
    vnp_TmnCode: tmnCode,
    vnp_Amount: Number(amount) * 100,
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: moment().format("YYYYMMDDHHmmss"),
    vnp_ExpireDate: moment().add(15, "minutes").format("YYYYMMDDHHmmss"),
  };

  params = sortObject(params);

  const signData = new URLSearchParams(params).toString();

  const secureHash = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  params.vnp_SecureHash = secureHash;

  return `${vnpUrl}?${new URLSearchParams(params).toString()}`;
};

export const verifyVNPayReturn = (query) => {
  const secretKey = process.env.VNP_HASH_SECRET;

  const params = { ...query };
  const secureHash = params.vnp_SecureHash;

  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sortedParams = sortObject(params);
  const signData = new URLSearchParams(sortedParams).toString();

  const checkHash = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  return secureHash === checkHash;
};

export const buildMoMoUrl = async ({ orderId, amount, orderInfo }) => {
  const endpoint =
    process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";

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

  const body = {
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
  };

  const response = await axios.post(endpoint, body);
  return response.data.payUrl;
};

export const verifyMoMoReturn = (query) => {
  const secretKey = process.env.MOMO_SECRET_KEY;

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
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  return checkSignature === query.signature;
};