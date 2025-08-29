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

export const sendShipmentLabelEmail = async ({
  to,
  subject,
  text,
  pdfPath,
}) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const attachments = [];
  if (pdfPath && fs.existsSync(pdfPath)) {
    attachments.push({
      filename: pdfPath.split("/").pop(),
      path: pdfPath,
      contentType: "application/pdf",
    });
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || "no-reply@yourapp.com",
    to,
    subject,
    text,
    attachments,
  });
};
