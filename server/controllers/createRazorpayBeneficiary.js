import Razorpay from "razorpay";
import Seller from "../models/sellerModel.js"; // assuming seller model path
import axios from "axios";
import User from "../models/userModel.js";

// const razorpay = new Razorpay({
//   key_id: process.env.RP_KEY_ID,
//   key_secret: process.env.RP_KEY_SECRET,
// });

// const RAZORPAYX_API = "https://api.razorpay.com/v1";
// const authHeader = {
//   auth: {
//     username: process.env.RAZORPAYX_KEY_ID, // Payout Key ID
//     password: process.env.RAZORPAYX_KEY_SECRET, // Payout Secret
//   },
// };

// export const createRazorpayBeneficiary = async (req, res) => {
//   try {
//     const { name, email, contact, account_number, ifsc } = req.body;
//     const userId = req.user._id.toString();

//     // Step 1: Create Razorpay Contact
//     const contactResponse = await axios.post(
//       `${RAZORPAYX_API}/contacts`,
//       {
//         name,
//         email,
//         contact,
//         type: "vendor",
//         reference_id: "seller_" + userId,
//       },
//       authHeader
//     );
//     const contactId = contactResponse.data.id || null;

//     // const contactId = contactResponse.id;

//     // Step 2: Create Fund Account
//     const fundAccountResponse = await axios.post(
//       `${RAZORPAYX_API}/fund_accounts`,
//       {
//         contact_id: contactId,
//         account_type: "bank_account",
//         bank_account: {
//           name,
//           ifsc,
//           account_number,
//         },
//       },
//       authHeader
//     );
//     // const fundAccountId = fundAccountResponse.data.id;

//     const fundAccountId = fundAccountResponse.id;

//     // Step 3: Update Seller model
//     await Seller.findByIdAndUpdate(userId, {
//       razorpayContactId: contactId,
//       razorpayFundAccountId: fundAccountId,
//     });

//     res.status(200).json({
//       message: "Razorpay beneficiary created successfully",
//       contactId,
//       fundAccountId,
//     });
//   } catch (error) {
//     console.error("Razorpay error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// RazorPay routes use so link account of seller

// import axios from "axios";
// import Seller from "../models/sellerModel.js";

export const createSellerSubAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user for name, email, phone
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { shopName, bankDetails, shopImage, shopImages, address, location } =
      req.body;

    // 1. Create Razorpay Sub Account
    const accountRes = await axios.post(
      "https://api.razorpay.com/v2/accounts",
      {
        email: user.email,
        contact: user.phone || user.contact || "9999999999",
        type: "route",
        legal_business_name: shopName,
        customer_facing_business_name: shopName,
      },
      {
        auth: {
          username: process.env.RP_KEY_ID,
          password: process.env.RP_KEY_SECRET,
        },
      }
    );

    const razorpayAccountId = accountRes.data.id;

    // 2. Add Bank Account to Razorpay Sub-Account
    await axios.post(
      `https://api.razorpay.com/v2/accounts/${razorpayAccountId}/bank_accounts`,
      {
        beneficiary_name: bankDetails.beneficiary_name,
        account_number: bankDetails.account_number,
        ifsc_code: bankDetails.ifsc,
      },
      {
        auth: {
          username: process.env.RP_KEY_ID,
          password: process.env.RP_KEY_SECRET,
        },
      }
    );

    // 3. Check if seller already exists
    let seller = await Seller.findOne({ userId });

    if (seller) {
      //  Update existing seller
      seller.bankDetails = bankDetails;
      seller.razorpayAccountId = razorpayAccountId;
      await seller.save();
    } else {
      //  Create new seller if not exists
      seller = await Seller.create({
        userId,
        bankDetails,
        razorpayAccountId,
      });
    }

    res
      .status(200)
      .json({ message: "Seller created with sub-account", seller });
  } catch (error) {
    console.error("Error creating sub account:", error);
    res.status(500).json({ error: error.message });
  }
};
