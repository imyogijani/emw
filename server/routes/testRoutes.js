// const express = require("express");
import express from "express";
import { testController } from "../controllers/testController.js";
// const { testController } = require("../controllers/testController");

//router object
const router = express.Router();

//routes
router.get("/", testController);

// module.exports = router;

// import express from "express";
import { assignSubscriptionToUser } from "../utils/subscriptionHelper.js";

// const router = express.Router();

// POST /api/subscriptions/test-assign
router.post("/test-assign", async (req, res) => {
  try {
    const { userId, subscriptionId, billingCycle } = req.body;

    const result = await assignSubscriptionToUser(
      userId,
      subscriptionId,
      billingCycle || "monthly",
      "paid"
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({
      success: true,
      message: "Test subscription assigned",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Test subscription failed",
      error: error.message,
    });
  }
});

export default router;
