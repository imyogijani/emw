import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RP_KEY_ID,
  key_secret: process.env.RP_KEY_SECRET,
});

export async function sendPayoutToSeller({
  fundAccountId,
  amount,
  batchId,
  month,
}) {
  const payout = await razorpay.payouts.create({
    account_number: process.env.RAZORPAY_ACCOUNT_NUMBER, // apni co. account
    fund_account_id: fundAccountId,
    amount: amount * 100, // paisa
    currency: "INR",
    mode: "IMPS", // or NEFT/UPI
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id: `settlement_${batchId}`,
    narration: `Settlement for ${month}`,
  });

  return payout;
}
