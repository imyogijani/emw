// controllers/checkoutController.js
import asyncHandler from "express-async-handler";
import Cart from "../models/cartModal.js";
import Deal from "../models/dealModel.js";
import Offer from "../models/offerModel.js";

export const checkoutSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const cart = await Cart.findOne({ userId })
    .populate("items.productId")
    .populate("items.variantId", "price finalPrice stock size color");

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty." });
  }

  let subTotal = 0;
  let totalGST = 0;
  let deliveryCharge = 50;

  const items = await Promise.all(
    cart.items.map(async (item) => {
      const product = item.productId;
      const variant = item.variantId;
      const quantity = item.quantity;

      let basePrice = product.price;
      let finalPrice = product.finalPrice; // default: price after discount

      if (variant) {
        basePrice = variant.price ?? product.price;
        finalPrice = variant.finalPrice ?? variant.price ?? product.finalPrice;
      }

      // If product has an activeDeal, check if it's still active
      if (product.activeDeal) {
        const now = new Date();

        const deal = await Deal.findOne({
          _id: product.activeDeal,
          startDate: { $lte: now },
          endDate: { $gte: now },
        });

        if (deal) {
          finalPrice = deal.dealPrice;
        }
      }

      const productTotal = finalPrice * quantity;
      const gstPercentage = product.gstPercentage || 0;
      const gstAmount = parseFloat(
        ((finalPrice * gstPercentage) / 100) * quantity
      ).toFixed(2);

      subTotal += productTotal;
      totalGST += parseFloat(gstAmount);

      return {
        product,
        productId: product._id,
        variantId: variant?._id || null,
        variant,
        sellerId: product.seller,
        quantity,
        price: basePrice,
        finalPrice,
        productTotal,
        gstPercentage,
        gstAmount: parseFloat(gstAmount),
      };
    })
  );

  const totalAmount = subTotal + totalGST + deliveryCharge;

  res.status(200).json({
    success: true,
    items,
    subTotal: parseFloat(subTotal.toFixed(2)),
    deliveryCharge,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    totalGST: parseFloat(totalGST.toFixed(2)),
  });
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user._id;

  const cart = await Cart.findOne({ userId })
    .populate("items.productId")
    .populate("items.variantId", "price finalPrice stock size color");

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty." });
  }

  const offer = await Offer.findOne({
    code,
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });

  if (!offer) {
    return res.status(400).json({ message: "Invalid or expired coupon code" });
  }

  // Usage limits
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

  let subTotal = 0;
  let totalGST = 0;
  const deliveryCharge = 50;
  const validItems = [];

  const items = await Promise.all(
    cart.items.map(async (item) => {
      const product = item.productId;
      const variant = item.variantId;

      let basePrice = product.price;
      let finalPrice = await getFinalPrice(product);
      let quantity = item.quantity;

      if (variant) {
        basePrice = variant.price ?? product.price;
        finalPrice = variant.finalPrice ?? variant.price ?? product.finalPrice;
      }

      if (product.activeDeal) {
        const now = new Date();
        const deal = await Deal.findOne({
          _id: product.activeDeal,
          startDate: { $lte: now },
          endDate: { $gte: now },
        });

        if (deal) {
          finalPrice = deal.dealPrice;
        }
      }
      const productTotal = finalPrice * quantity;

      //  GST Calculation
      const gstPercentage = product.gstPercentage || 0;
      const gstAmount = parseFloat(
        ((finalPrice * gstPercentage) / 100) * quantity
      ).toFixed(2);

      totalGST += parseFloat(gstAmount);
      subTotal += productTotal;

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

      return {
        productId: product._id,
        variantId: variant?._id || null,
        sellerId: product.seller,
        quantity,
        finalPrice,
        productTotal: parseFloat(productTotal),
        gstPercentage,
        gstAmount: parseFloat(gstAmount),
      };
    })
  );

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

  const totalAmount = subTotal + totalGST + deliveryCharge - discount;

  res.status(200).json({
    success: true,
    coupon: offer.code,
    offerId: offer._id,
    description: offer.description,
    subTotal,
    deliveryCharge,
    discount,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    totalGST: parseFloat(totalGST.toFixed(2)),
    items,
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
