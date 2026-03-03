import nodemailer from "nodemailer";

const FROM_EMAIL = "avitan.yogev@gmail.com";
const FROM_NAME = "iPalsam";

function getTransporter() {
  const pass = process.env.SMTP_PASS;
  if (!pass) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || FROM_EMAIL,
      pass,
    },
  });
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      headers: {
        "Content-Language": "he",
      },
    });
    return true;
  } catch {
    return false;
  }
}
