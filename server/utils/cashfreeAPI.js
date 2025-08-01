// backend/utils/cashfree.js
import { Cashfree } from "cashfree-pg";
import axios from "axios";

const CASHFREE_ENV =
  process.env.DEV_MODE === "production"
    ? Cashfree.PRODUCTION
    : Cashfree.SANDBOX;

export const cf = new Cashfree(
  CASHFREE_ENV,
  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_CLIENT_SECRET
);

const CF_BASE_URL =
  process.env.DEV_MODE === "production"
    ? "https://api.cashfree.com/pg/orders"
    : "https://sandbox.cashfree.com/pg/orders";

const CF_HEADERS = {
  "Content-Type": "application/json",
  "x-api-version": "2022-09-01",
  "x-client-id": process.env.CASHFREE_CLIENT_ID,
  "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
};

export const createCashfreeOrder = async (details) => {
  try {
    const res = await axios.post(
      CF_BASE_URL,
      {
        order_id: details.orderId,
        order_amount: details.amount,
        order_currency: details.currency,
        customer_details: details.customer,
        order_splits: details.splits,
      },
      { headers: CF_HEADERS }
    );

    return res.data;
  } catch (err) {
    console.error("Cashfree API Error:", err.response?.data || err.message);
    throw new Error("Cashfree order creation failed");
  }
};

export const verifyWebhook = (headers, body) => {
  return cf.webhooks.verify(headers["x-webhook-signature"], body);
};

// export const verifyWebhook = (headers, body) => {
//   const signature = headers["x-webhook-signature"];
//   const secret = process.env.CASHFREE_WEBHOOK_SECRET; // set it from Cashfree dashboard
//   const hmac = crypto.createHmac("sha256", secret);
//   hmac.update(JSON.stringify(body));
//   const expectedSignature = hmac.digest("base64");
//   return expectedSignature === signature;
// };
