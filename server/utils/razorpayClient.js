import Razorpay from "razorpay";
const razorpay = new Razorpay({
  key_id: process.env.RP_KEY_ID,
  key_secret: process.env.RP_KEY_SECRET,
});

// console.log("Razorpay Key:", process.env.RP_KEY_ID);
// console.log("Razorpay Secret:", process.env.RP_KEY_SECRET);
export default razorpay;
