const nodemailer = require("nodemailer");

const host = process.env.MAIL_HOST || "smtp.gmail.com";
const port = Number(process.env.MAIL_PORT || 465);
const secure = String(process.env.MAIL_SECURE || "true") === "true";

const user = process.env.MAIL_USER;
const pass = process.env.MAIL_PASS;

if (!user || !pass) {
  console.warn("⚠️  Missing MAIL_USER or MAIL_PASS in .env");
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
});

const fromName = process.env.MAIL_FROM_NAME || "Web Học Tiếng Anh";
const fromEmail = process.env.MAIL_FROM_EMAIL || user;

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    console.log(`Email đã gửi tới: ${to}`);
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
    throw error;
  }
};

module.exports = sendEmail;
