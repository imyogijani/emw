import nodemailer from "nodemailer";
// import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "meetchauhan925@gmail.com", //  your gmail here
        pass: "123456789",
      },
    });

    const info = await transporter.sendMail({
      from: `"eMall Test 👋"meetchauhan925@gmail.com`,
      to,
      subject,
      text,
    });

    console.log("✅ Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Email send error:", error);
    return false;
  }
};
