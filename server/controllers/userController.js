// controllers/userController.js
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";

export const updatePushToken = async (req, res) => {
  try {
    const { userId, pushToken } = req.body;

    if (!userId || !pushToken) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await User.findByIdAndUpdate(userId, { pushToken });
    res.status(200).json({ message: "Push token updated" });
  } catch (err) {
    console.error("Error updating push token:", err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getCustomerWithOrderSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    //  Validate input
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    //  1. Fetch user details
    const user = await User.findById(userId).select(
      "names email phone address"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    //  2. Fetch relevant orders (delivered OR prepaid)
    const orders = await Order.find({
      userId,
      $or: [{ orderStatus: "delivered" }, { paymentStatus: "paid" }],
    });

    //  3. Calculate summary
    const totalOrders = orders.length;
    const totalSpent = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    const lastOrderDate = orders.reduce((latest, order) => {
      return order.createdAt > latest ? order.createdAt : latest;
    }, new Date(0));

    //  4. Return response
    return res.status(200).json({
      success: true,
      message: "Customer summary fetched successfully",
      customer: {
        id: user._id,
        name: user.names,
        email: user.email,
        phone: user.phone,
        address: user.address,
        totalOrders,
        totalSpent,
        lastOrder:
          lastOrderDate.getTime() > 0
            ? lastOrderDate.toISOString().split("T")[0]
            : null,
      },
    });
  } catch (error) {
    console.error("🔥 Server Error in getCustomerWithOrderSummary:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

export const getUserAddress = async (req, res) => {
  try {
    const userId = req.user.id; // user.id JWT middleware se aayega
    const user = await User.findById(userId).select(
      "address names phone email"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      name: user.names,
      phone: user.phone,
      email: user.email,
      address: user.address,
    });
  } catch (error) {
    console.error("Error fetching address:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching address",
    });
  }
};
