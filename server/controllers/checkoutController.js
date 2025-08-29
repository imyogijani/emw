// controllers/checkoutController.js
import asyncHandler from "express-async-handler";
import Cart from "../models/cartModal.js";
import Deal from "../models/dealModel.js";
import Offer from "../models/offerModel.js";
import Seller from "../models/sellerModel.js";
import Product from "../models/productModel.js";
// import {
//   checkServiceability,
//   getDeliveryCharge,
// } from "../services/delhiveryService.js";

import {
  checkServiceability,
  getDeliveryCharge,
} from "../controllers/shipmentController.js";

export const checkoutSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { shippingAddress } = req.body;

  if (!shippingAddress || !shippingAddress.pincode) {
    return res
      .status(400)
      .json({ success: false, message: "Shipping address required." });
  }

  // Required fields validation
  const requiredFields = [
    "name",
    "phone",
    "email",
    "addressLine1",
    "state",
    "city",
    "pincode",
    "country",
  ];
  const missingFields = requiredFields.filter(
    (field) =>
      !shippingAddress[field] || shippingAddress[field].toString().trim() === ""
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  // // Serviceability check
  // const serviceCheck = await checkServiceability(shippingAddress.pincode);
  // if (!serviceCheck.serviceable) {
  //   return res.status(400).json({
  //     success: false,
  //     message: `Delivery not available at pincode ${shippingAddress.pincode}`,
  //   });
  // }

  // Get cart
  const cart = await Cart.findOne({ userId })
    .populate("items.productId")
    .populate("items.variantId", "price finalPrice stock size color");

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty." });
  }

  let subTotal = 0;
  let totalGST = 0;
  let totalDeliveryCharge = 0;

  // Group items by seller
  const groupedBySeller = {};
  cart.items.forEach((item) => {
    const seller = item.productId.seller.toString();
    if (!groupedBySeller[seller]) groupedBySeller[seller] = [];
    groupedBySeller[seller].push(item);
  });

  // Seller-wise summary
  let sellerSummaries = [];

  for (const sellerId of Object.keys(groupedBySeller)) {
    const sellerItems = groupedBySeller[sellerId];

    // Seller ka pickup pincode nikaalo
    const seller = await Seller.findById(sellerId);
    let defaultAddress = null;

    // Pehle isDefault wali address dhoondo
    if (seller?.shopAddresses?.length) {
      defaultAddress =
        // seller.shopAddresses.find((addr) => addr.isDefault) ||
        seller.shopAddresses[0]; // agar isDefault nahi hai to first use karo
    }
    const pickupPincode = defaultAddress?.pincode;

    if (!pickupPincode) {
      return res.status(400).json({
        success: false,
        message: `Seller ${seller.shopName} has no pickup address.`,
      });
    }

    let sellerWeight = 0;
    let sellerSubTotal = 0;
    let sellerGST = 0;
    let productsSummary = [];

    for (const item of sellerItems) {
      // const product = item.productId;
      const product = await Product.findById(item.productId).populate(
        "technicalDetails"
      ); // yaha populate kar diya
      const variant = item.variantId;
      const quantity = item.quantity;

      let finalPrice =
        variant?.finalPrice ?? product.finalPrice ?? product.price;
      const productTotal = finalPrice * quantity;
      const gstPercentage = product.gstPercentage || 0;
      const gstAmount = parseFloat(
        ((finalPrice * gstPercentage) / 100) * quantity
      ).toFixed(2);

      sellerSubTotal += productTotal;
      sellerGST += parseFloat(gstAmount);

      // default weight 0.5kg agar product weight field missing hai
      let rawWeight =
        product.technicalDetails?.weight || product.weight || "0.5kg";
      // let quantity = product.quantity || 1;

      // Normalize → string ko lowercase karo aur space hatao
      rawWeight = rawWeight.toString().toLowerCase().trim();

      // Unit check
      let weightInGrams = 0;

      if (rawWeight.includes("kg")) {
        weightInGrams = parseFloat(rawWeight) * 1000; // convert to grams
      } else if (rawWeight.includes("g")) {
        weightInGrams = parseFloat(rawWeight); // already grams
      } else {
        weightInGrams = parseFloat(rawWeight) * 1000; // default assume kg
      }

      // Multiply by quantity
      sellerWeight += weightInGrams * quantity;

      console.log(
        "Weight (grams):",
        weightInGrams,
        "Total Seller Weight (grams):",
        sellerWeight
      );

      // Agar API ko kg me bhejna hai to :
      const finalWeightInKg = sellerWeight / 1000;
      console.log("Final Seller Weight (kg):", finalWeightInKg);

      // sellerWeight = finalWeightInKg + " kg";

      productsSummary.push({
        productId: product._id,
        name: product.name,
        quantity,
        finalPrice,
        productTotal,
        gstAmount: parseFloat(gstAmount),
      });
    }

    // Delhivery API call for seller delivery charge
    const sellerDeliveryCharge = await getDeliveryCharge(
      pickupPincode,
      shippingAddress.pincode,
      sellerWeight,
      false,
      sellerSubTotal
    );

    // console.log(
    //   "Delievery api call",
    //   pickupPincode,
    //   shippingAddress.pincode,
    //   sellerWeight,
    //   sellerSubTotal
    // );

    totalDeliveryCharge += sellerDeliveryCharge;
    // totalDeliveryCharge += 100;
    subTotal += sellerSubTotal;
    totalGST += sellerGST;

    sellerSummaries.push({
      sellerId,
      shopName: seller?.shopName,
      pickupPincode,
      deliveryCharge: sellerDeliveryCharge,
      // deliveryCharge: 100,
      sellerSubTotal,
      sellerGST,
      products: productsSummary,
    });
  }

  const totalAmount = subTotal + totalGST + totalDeliveryCharge;

  // console.log("📦 Seller-wise Summary:", sellerSummaries);

  res.status(200).json({
    success: true,
    sellers: sellerSummaries,
    subTotal: parseFloat(subTotal.toFixed(2)),
    totalGST: parseFloat(totalGST.toFixed(2)),
    totalDeliveryCharge: parseFloat(totalDeliveryCharge.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  });
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, shippingAddress } = req.body;
  const userId = req.user._id;

  if (!shippingAddress || !shippingAddress.pincode) {
    return res
      .status(400)
      .json({ success: false, message: "Shipping address required." });
  }

  // Required fields validation
  const requiredFields = [
    "name",
    "phone",
    "email",
    "addressLine1",
    "state",
    "city",
    "pincode",
    "country",
  ];
  const missingFields = requiredFields.filter(
    (field) =>
      !shippingAddress[field] || shippingAddress[field].toString().trim() === ""
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  // // Serviceability check
  // const serviceCheck = await checkServiceability(shippingAddress.pincode);
  // if (!serviceCheck.serviceable) {
  //   return res.status(400).json({
  //     success: false,
  //     message: `Delivery not available at pincode ${shippingAddress.pincode}`,
  //   });
  // }

  // Get Cart
  const cart = await Cart.findOne({ userId })
    .populate("items.productId")
    .populate("items.variantId", "price finalPrice stock size color");

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty." });
  }

  // Coupon Check
  const offer = await Offer.findOne({
    code,
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });

  if (!offer) {
    return res.status(400).json({ message: "Invalid or expired coupon code" });
  }

  if (offer.usageLimit > 0 && offer.usedCount >= offer.usageLimit) {
    return res.status(400).json({ message: "Coupon usage limit reached" });
  }

  const userUsage = offer.userUsage.find(
    (u) => u.user.toString() === userId.toString()
  );
  if (userUsage && userUsage.count >= offer.perUserLimit) {
    return res.status(400).json({
      message: "You have already used this coupon the maximum number of times",
    });
  }

  // -------- Seller-wise calculation (same as checkoutSummary) ----------
  let subTotal = 0;
  let totalGST = 0;
  let totalDeliveryCharge = 0;
  let validItems = [];
  let sellerSummaries = [];

  // Group items by seller
  const groupedBySeller = {};
  cart.items.forEach((item) => {
    const seller = item.productId.seller.toString();
    if (!groupedBySeller[seller]) groupedBySeller[seller] = [];
    groupedBySeller[seller].push(item);
  });

  for (const sellerId of Object.keys(groupedBySeller)) {
    const sellerItems = groupedBySeller[sellerId];

    const seller = await Seller.findById(sellerId);
    let defaultAddress = null;
    if (seller?.shopAddresses?.length) {
      defaultAddress = seller.shopAddresses[0]; // agar isDefault nahi hai to first use karo
    }
    const pickupPincode = defaultAddress?.pincode;

    if (!pickupPincode) {
      return res.status(400).json({
        success: false,
        message: `Seller ${seller.shopName} has no pickup address.`,
      });
    }

    let sellerWeight = 0;
    let sellerSubTotal = 0;
    let sellerGST = 0;
    let productsSummary = [];

    for (const item of sellerItems) {
      const product = await Product.findById(item.productId).populate(
        "technicalDetails"
      );
      const variant = item.variantId;
      const quantity = item.quantity;

      let finalPrice =
        variant?.finalPrice ?? product.finalPrice ?? product.price;
      const productTotal = finalPrice * quantity;
      const gstPercentage = product.gstPercentage || 0;
      const gstAmount = parseFloat(
        ((finalPrice * gstPercentage) / 100) * quantity
      ).toFixed(2);

      sellerSubTotal += productTotal;
      sellerGST += parseFloat(gstAmount);

      // Weight normalize
      let rawWeight =
        product.technicalDetails?.weight || product.weight || "0.5kg";
      rawWeight = rawWeight.toString().toLowerCase().trim();

      let weightInGrams = 0;
      if (rawWeight.includes("kg")) {
        weightInGrams = parseFloat(rawWeight) * 1000;
      } else if (rawWeight.includes("g")) {
        weightInGrams = parseFloat(rawWeight);
      } else {
        weightInGrams = parseFloat(rawWeight) * 1000;
      }

      sellerWeight += weightInGrams * quantity;

      // Coupon eligible check
      const isProductMatched = offer.products?.includes(product._id);
      const isCategoryMatched = offer.categories?.includes(product.category);
      const isBrandMatched = offer.brands?.includes(product.brand);

      const isEligible =
        offer.type === "CART" ||
        (offer.type === "PRODUCT" && isProductMatched) ||
        (offer.type === "CATEGORY" && isCategoryMatched) ||
        (offer.type === "BRAND" && isBrandMatched);

      if (isEligible) {
        validItems.push({ finalPrice, quantity });
      }

      productsSummary.push({
        productId: product._id,
        name: product.name,
        quantity,
        finalPrice,
        productTotal,
        gstAmount: parseFloat(gstAmount),
      });
    }

    // Delivery Charge API call
    const sellerDeliveryCharge = await getDeliveryCharge(
      pickupPincode,
      shippingAddress.pincode,
      sellerWeight,
      false,
      sellerSubTotal
    );

    totalDeliveryCharge += sellerDeliveryCharge;
    subTotal += sellerSubTotal;
    totalGST += sellerGST;

    sellerSummaries.push({
      sellerId,
      shopName: seller?.shopName,
      pickupPincode,
      deliveryCharge: sellerDeliveryCharge,
      sellerSubTotal,
      sellerGST,
      products: productsSummary,
    });
  }

  // ---------- Coupon Discount ----------
  if (offer.type !== "CART" && validItems.length === 0) {
    return res
      .status(400)
      .json({ message: "Coupon not applicable to your cart items" });
  }

  if (offer.minCartValue > 0 && subTotal < offer.minCartValue) {
    return res.status(400).json({
      message: `Minimum cart value ₹${offer.minCartValue} required to use this coupon`,
    });
  }

  const validSubTotal = validItems.reduce(
    (sum, item) => sum + item.finalPrice * item.quantity,
    0
  );

  let discount = 0;
  if (offer.discountType === "FLAT") {
    discount = offer.discountValue;
  } else if (offer.discountType === "PERCENTAGE") {
    discount = Math.floor((validSubTotal * offer.discountValue) / 100);
    if (offer.maxDiscountAmount && discount > offer.maxDiscountAmount) {
      discount = offer.maxDiscountAmount;
    }
  }

  // ---------- Final Total ----------
  const totalAmount = subTotal + totalGST + totalDeliveryCharge - discount;

  res.status(200).json({
    success: true,
    coupon: offer.code,
    offerId: offer._id,
    description: offer.description,
    sellers: sellerSummaries,
    subTotal: parseFloat(subTotal.toFixed(2)),
    totalGST: parseFloat(totalGST.toFixed(2)),
    totalDeliveryCharge: parseFloat(totalDeliveryCharge.toFixed(2)),
    discount,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  });
});

// utils/priceUtils.js
export const getFinalPrice = async (product) => {
  const now = new Date();
  let finalPrice = product.finalPrice;

  if (product.activeDeal) {
    const deal = await Deal.findOne({
      _id: product.activeDeal,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    if (deal) {
      finalPrice = deal.dealPrice;
    }
  }

  return finalPrice;
};
