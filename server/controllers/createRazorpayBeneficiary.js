import Razorpay from "razorpay";
import Seller from "../models/sellerModel.js"; // assuming seller model path
import axios from "axios";

const razorpay = new Razorpay({
  key_id: process.env.RP_KEY_ID,
  key_secret: process.env.RP_KEY_SECRET,
});

const RAZORPAYX_API = "https://api.razorpay.com/v1";
const authHeader = {
  auth: {
    username: process.env.RAZORPAYX_KEY_ID, // Payout Key ID
    password: process.env.RAZORPAYX_KEY_SECRET, // Payout Secret
  },
};

export const createRazorpayBeneficiary = async (req, res) => {
  try {
    const { name, email, contact, account_number, ifsc } = req.body;
    const userId = req.user._id.toString();

    // Step 1: Create Razorpay Contact
    const contactResponse = await axios.post(
      `${RAZORPAYX_API}/contacts`,
      {
        name,
        email,
        contact,
        type: "vendor",
        reference_id: "seller_" + userId,
      },
      authHeader
    );
    const contactId = contactResponse.data.id || null;

    // const contactId = contactResponse.id;

    // Step 2: Create Fund Account
    const fundAccountResponse = await axios.post(
      `${RAZORPAYX_API}/fund_accounts`,
      {
        contact_id: contactId,
        account_type: "bank_account",
        bank_account: {
          name,
          ifsc,
          account_number,
        },
      },
      authHeader
    );
    // const fundAccountId = fundAccountResponse.data.id;

    const fundAccountId = fundAccountResponse.id;

    // Step 3: Update Seller model
    await Seller.findByIdAndUpdate(userId, {
      razorpayContactId: contactId,
      razorpayFundAccountId: fundAccountId,
    });

    res.status(200).json({
      message: "Razorpay beneficiary created successfully",
      contactId,
      fundAccountId,
    });
  } catch (error) {
    console.error("Razorpay error:", error);
    res.status(500).json({ error: error.message });
  }
};
