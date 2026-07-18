import nodemailer from "nodemailer";

const mailUser = process.env.MAIL_USER || "trantnce180829@fpt.edu.vn";
const mailPass = process.env.MAIL_PASS || "rjvs rqzj nsut asvr";

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || "gmail",
  auth: { user: mailUser, pass: mailPass },
});

export const formatVnd = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatDateTimeVi = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const sendPaymentEmail = async ({ to, subject, html }) => {
  if (!to) return false;
  try {
    await transporter.sendMail({ from: mailUser, to, subject, html });
    return true;
  } catch (error) {
    console.error("Payment email failed:", error.message);
    return false;
  }
};
