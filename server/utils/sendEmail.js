import nodemailer from "nodemailer";
// import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendEmail = async (to, subject, text) => {
  try {
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: "meetchauhan925@gmail.com", //  your gmail here
    //     pass: "clsw aakz cgvl gxlo",
    //   },
    // });

    // Step 1: Create test account
    const testAccount = await nodemailer.createTestAccount();

    // Step 2: Create transporter using test SMTP
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // auto-created
        pass: testAccount.pass, // auto-created
      },
    }); // step 1 and  step 2 only for testing

    // Step 3: Send the email

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
