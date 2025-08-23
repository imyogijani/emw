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
        pass: "clsw aakz cgvl gxlo",
      },
    });

    const info = await transporter.sendMail({
      from: '"eMall Test 👋" <no-reply@emall.com>',
      to,
      subject,
      text,
    });

    console.log(" Test Email sent: %s", info.messageId);
    console.log(" Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
};
