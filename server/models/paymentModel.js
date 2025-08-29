// // models/paymentModel.js
// import mongoose from "mongoose";

// const paymentSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "users",
//       required: true,
//     },
//     orderId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "orders",
//       required: true,
//     },
//     amount: {
//       type: Number,
//       required: true,
//     },
//     currency: {
//       type: String,
//       default: "INR",
//     },
//     status: {
//       type: String,
//       enum: ["pending", "success", "failed", "refunded"],
//       default: "pending",
//     },
//     method: {
//       type: String,
//       enum: ["UPI", "QR", "NetBanking", "Card", "Wallet", "COD"],
//       required: true,
//     },
//     gateway: {
//       type: String,
//       enum: ["Cashfree", "Razorpay", "COD"],
//       default: "Cashfree",
//     },
//     providerOrderId: {
//       type: String, // Cashfree or Razorpay Order ID
//     },
//     providerPaymentId: {
//       type: String, // Cashfree or Razorpay Payment ID
//     },
//     upiId: {
//       type: String, // Optional - customer UPI
//     },
//     qrUrl: {
//       type: String, // Optional - for QR-based payments
//     },
//     receipt: {
//       type: String,
//     },
//     refundStatus: {
//       type: String,
//       enum: ["not_requested", "processing", "completed", "failed"],
//       default: "not_requested",
//     },
//     refundAmount: {
//       type: Number,
//       default: 0,
//     },
//     paidAt: {
//       type: Date,
//     },
//     failureReason: {
//       type: String,
//     },
//   },
//   { timestamps: true }
// );

// const Payment = mongoose.model("Payment", paymentSchema);
// export default Payment;

// models/paymentModel.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: false,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
    },

    purpose: {
      type: String,
      enum: ["order", "subscription"],
      // required: true,
    },

    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    method: {
      type: String,
      enum: [
        "UPI",
        "QR",
        "NetBanking",
        "Card",
        "Wallet",
        "COD",
        "autopay",
        "manual",
      ],
      required: true,
    },
    gateway: {
      type: String,
      enum: ["Cashfree", "Razorpay", "COD"],
      default: "Razorpay",
    },
    providerOrderId: {
      type: String, // Cashfree or Razorpay Order ID
    },
    providerPaymentId: {
      type: String, // Cashfree or Razorpay Payment ID   (means transaction uniq ID )
    },
    upiId: {
      type: String, // Optional - customer UPI
    },
    qrUrl: {
      type: String, // Optional - for QR-based payments
    },
    receipt: {
      type: String,
    },
    transferId: String,
    deliveryPartner: {
      type: String,
      enum: ["Shiprocket", "Delhivery", "Shadowfax", null],
      default: null,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: ["not_requested", "processing", "completed", "failed"],
      default: "not_requested",
    },
    paymentGatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    paidAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
