import Subscription from "../models/subscriptionModel.js";

// Create a new subscription plan
export const createSubscription = async (req, res) => {
  try {
    const { planName, pricing, includedFeatures, isVisible, upiQrCode, upiId } = req.body;

    const existingPlan = await Subscription.findOne({ planName });
    if (existingPlan) {
      return res.status(400).json({
        message: `Plan with name "${planName}" already exists`,
      });
    }

    //  validate pricing object
    if (!pricing.monthly && !pricing.yearly) {
      return res.status(400).json({
        message: "At least one pricing option (monthly or yearly) is required",
      });
    }

    const newSubscription = new Subscription({
      planName,
      pricing,
      includedFeatures,
      isVisible: isVisible !== undefined ? isVisible : true,
      upiQrCode,
      upiId,
    });

    await newSubscription.save();

    res.status(201).json({
      message: "Subscription plan created successfully",
      subscription: newSubscription,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating subscription plan",
      error: error.message,
    });
  }
};

// Get all subscription plans
export const getAllSubscriptions = async (req, res) => {
  try {
    // const subscriptions = await Subscription.find();
    const subscriptions = await Subscription.find({ isVisible: true });

    res.status(200).json({ success: true, subscriptions }); // Modified to include success flag and subscriptions key
  } catch (error) {
    res.status(500).json({
      message: "Error fetching subscription plans",
      error: error.message,
    });
  }
};

// Get a single subscription plan by ID
export const getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching subscription plan",
      error: error.message,
    });
  }
};

// Get a subscription plan by name (for review page)
export const getSubscriptionByName = async (req, res) => {
  try {
    const { planName } = req.params;
    const plan = await Subscription.findOne({ planName });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    // Optionally, you can fetch old plan info if needed
    res.status(200).json({ plan });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching plan", error: error.message });
  }
};

// Update a subscription plan
export const updateSubscription = async (req, res) => {
  try {
    const { planName, pricing, includedFeatures, isVisible, upiQrCode, upiId } = req.body;

    // Basic Validation
    if (
      !planName ||
      !includedFeatures ||
      !Array.isArray(includedFeatures) ||
      includedFeatures.length === 0
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!pricing || (!pricing.monthly && !pricing.yearly)) {
      return res.status(400).json({
        message: "At least one pricing type (monthly or yearly) is required",
      });
    }

    // Prepare update fields
    const updateFields = {
      planName,
      pricing,
      includedFeatures,
      isVisible: isVisible !== undefined ? isVisible : true, // 👈 default true
    };

    // Add UPI fields if provided
    if (upiQrCode !== undefined) updateFields.upiQrCode = upiQrCode;
    if (upiId !== undefined) updateFields.upiId = upiId;

    // Update subscription
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedSubscription) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    // Notify all shopowners using this subscription
    const User = (await import("../models/userModel.js")).default;
    const { sendSubscriptionChangeNotification } = await import(
      "./notificationController.js"
    );

    const affectedUsers = await User.find({ subscription: req.params.id });

    for (const user of affectedUsers) {
      await sendSubscriptionChangeNotification({
        userId: user._id,
        oldPlan: planName, // Ideally keep old planName from DB before update
        newPlan: planName,
        newFeatures: includedFeatures,
      });
    }

    res.status(200).json({
      message: "Subscription updated successfully",
      subscription: updatedSubscription,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating subscription",
      error: error.message,
    });
  }
};

// Delete a subscription plan
export const deleteSubscription = async (req, res) => {
  try {
    const deletedSubscription = await Subscription.findByIdAndDelete(
      req.params.id
    );
    if (!deletedSubscription) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    res.status(200).json({ message: "Subscription plan deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting subscription plan",
      error: error.message,
    });
  }
};
