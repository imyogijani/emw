// import crypto from "crypto";

// export const verifyRazorpaySignature = (body, razorpay_signature, razorpay_order_id, razorpay_payment_id) => {
//   const sign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//     .update(razorpay_order_id + "|" + razorpay_payment_id)
//     .digest("hex");

//   return sign === razorpay_signature;
// };
