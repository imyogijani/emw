import Order from "../models/orderModel.js";
import asyncHandler from "express-async-handler";
import Cart from "../models/cartModal.js";
// import Order from "../models/orderModel.js";
import Deal from "../models/dealModel.js";
import Offer from "../models/offerModel.js";
import Brand from "../models/brandModel.js";
import Category from "../models/categoryModel.js";
import mongoose from "mongoose";
import Product from "../models/productModel.js";
import Seller from "../models/sellerModel.js";
import Variant from "../models/variantsModel.js";
import { generateInvoicesForOrder } from "./invoiceController.js";
import { createNotification } from "./notificationController.js";
import Counter from "../models/counterModel.js";
import { processShipmentsForOrder } from "../services/delhiveryService.js";

export const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const {
    orderStatus,
    paymentStatus,
    paymentMethod,
    fromDate,
    toDate,
    userId,
    search, //  search by name/email/phone
  } = req.query;

  const filter = {};

  if (orderStatus) {
    filter.orderStatus = orderStatus;
  }

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

  if (userId) {
    filter.userId = userId;
  }

  if (fromDate && toDate) {
    filter.createdAt = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }

  //  Search in user fields
  let userFilter = {};
  if (search) {
    const searchRegex = { $regex: search, $options: "i" };

    // Step 1: find users that match name/email/phone
    const matchingUsers = await mongoose.model("users").find(
      {
        $or: [
          { names: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      },
      "_id"
    );

    const userIds = matchingUsers.map((u) => u._id);

    // Step 2: apply to orders filter
    filter.$or = [
      { orderId: searchRegex }, // custom orderId
      { userId: { $in: userIds } }, // match customers
    ];

    // If search is valid MongoDB _id
    if (mongoose.Types.ObjectId.isValid(search)) {
      filter.$or.push({ _id: new mongoose.Types.ObjectId(search) });
    }
  }

  const totalOrders = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "names email phone") // fetch user info
    .select(
      "orderId userId totalAmount paymentMethod paymentStatus orderStatus isPaid createdAt"
    );

  const formattedOrders = orders.map((order) => ({
    orderId: order._id,
    customeOrderId: order.orderId,
    customer: {
      name: order.userId?.names,
      email: order.userId?.email,
      phone: order.userId?.phone,
    },
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
  }));

  const stats = {
    totalOrders: await Order.countDocuments(),
    pending: await Order.countDocuments({ orderStatus: "pending" }),
    processing: await Order.countDocuments({ orderStatus: "processing" }),
    confirmed: await Order.countDocuments({ orderStatus: "confirmed" }),
    in_transit: await Order.countDocuments({ orderStatus: "in_transit" }),
    delivered: await Order.countDocuments({ orderStatus: "delivered" }),
    cancelled: await Order.countDocuments({ orderStatus: "cancelled" }),
  };

  res.status(200).json({
    success: true,
    stats,
    totalOrders,
    currentPage: page,
    totalPages: Math.ceil(totalOrders / limit),
    orders: formattedOrders,
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    shippingAddress,
    paymentMethod,
    deliveryPartner = "Manual",
    appliedCoupon = null, // { code, discount, offerId, description }
  } = req.body;

  if (!shippingAddress || !paymentMethod) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const cart = await Cart.findOne({ userId })
    .populate("items.productId")
    .populate("items.variantId", "price finalPrice stock size color");

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty." });
  }

  let subTotal = 0;
  let totalGST = 0;
  let deliveryCharge = 50;
  let couponDiscount = 0;
  let couponCode = null;
  let couponDescription = null;
  let offerId = null;
  let validItems = [];

  const items = await Promise.all(
    cart.items.map(async (item) => {
      const product = item.productId;
      const variant = item.variantId;
      const quantity = item.quantity;

      const discount = product.discount;
      let basePrice = product.price;
      let finalPrice = product.finalPrice; // default: price after discount

      if (!product.isActive) {
        await Cart.updateOne(
          { userId },
          { $pull: { items: { productId: product._id } } }
        );
        return res.status(400).json({
          success: false,
          message: `${product.name} is not available anymore and has been removed from your cart.`,
        });
      }

      //  Product Out of Stock Check
      if (product.status === "Out of Stock") {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock.`,
        });
      }

      //  Stock Availability Check
      let availableStock = 0;
      if (variant) {
        availableStock = variant.stock ?? 0;
      } else {
        availableStock = product.stock ?? 0;
      }

      if (availableStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `${
            product.title || product.name
          } has only ${availableStock} in stock.`,
        });
      }

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
      const gstPercentage = product.gstPercentage || 0;

      const gstAmount = parseFloat(
        ((finalPrice * gstPercentage) / 100) * quantity
      ).toFixed(2);

      totalGST += parseFloat(gstAmount);
      const productTotal = finalPrice * quantity;
      subTotal += productTotal;

      return {
        product,
        productId: product._id,
        variantId: item.variantId || null,
        sellerId: product.seller,
        quantity,
        price: basePrice,
        finalPrice,
        discount,
        productTotal,
        gstAmount: parseFloat(gstAmount),
      };
    })
  );

  if (appliedCoupon && appliedCoupon.code) {
    const offer = await Offer.findOne({
      code: appliedCoupon.code,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (!offer) {
      return res.status(400).json({ message: "Invalid or expired coupon." });
    }

    if (offer.usageLimit > 0 && offer.usedCount >= offer.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached." });
    }

    if (offer.minCartValue > 0 && subTotal < offer.minCartValue) {
      return res.status(400).json({
        message: `Minimum cart value ₹${offer.minCartValue} required to use this coupon.`,
      });
    }

    // Filter valid items based on offer type
    for (const item of items) {
      const product = item.product;
      const isProductMatched = offer.products?.includes(product._id);
      const isCategoryMatched = offer.categories?.includes(product.category);
      const isBrandMatched = offer.brands?.includes(product.brand);

      if (
        offer.type === "CART" ||
        (offer.type === "PRODUCT" && isProductMatched) ||
        (offer.type === "CATEGORY" && isCategoryMatched) ||
        (offer.type === "BRAND" && isBrandMatched)
      ) {
        validItems.push(item);
      }
    }

    if (offer.type !== "CART" && validItems.length === 0) {
      return res
        .status(400)
        .json({ message: "Coupon not applicable to your cart items." });
    }

    // Calculate discount
    const validSubTotal = validItems.reduce(
      (acc, item) => acc + item.finalPrice * item.quantity,
      0
    );

    if (offer.discountType === "FLAT") {
      couponDiscount = offer.discountValue;
    } else if (offer.discountType === "PERCENTAGE") {
      couponDiscount = Math.floor((validSubTotal * offer.discountValue) / 100);
      if (offer.maxDiscountAmount && couponDiscount > offer.maxDiscountAmount) {
        couponDiscount = offer.maxDiscountAmount;
      }
    }

    couponCode = offer.code;
    couponDescription = offer.description || "";
    offerId = offer._id;
  }

  const totalAmount = parseFloat(
    (subTotal + totalGST + deliveryCharge - couponDiscount).toFixed(2)
  );

  // const orderItems = items.map((item) => ({
  //   productId: item.productId,
  //   variantId: item.variantId || null,
  //   sellerId: item.sellerId,
  //   quantity: item.quantity,
  //   price: item.price,
  //   finalPrice: item.finalPrice,
  //   discount: item.discount,
  //   deliveryStatus: "processing",
  //   deliveryPartner,
  //   deliveryCharge: 0,
  //   commission: 0,
  // }));

  const orderItems = await Promise.all(
    items.map(async (item) => {
      let commissionRate = 0;
      let itemPrice = 0;

      // Agar variant selected hai
      if (item.variantId) {
        const variant = await Variant.findById(item.variantId);
        if (!variant) {
          throw new Error(`Variant not found for ID: ${item.variantId}`);
        }

        // Variant ka price aur commission rate lo
        itemPrice = variant.finalPrice || item.finalPrice; // fallback agar DB me finalPrice na ho
        commissionRate = variant.commissionRate || item.commissionRate || 0;
      } else {
        // Agar variant nahi hai to product ka data lo
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product not found for ID: ${item.productId}`);
        }

        itemPrice = product.finalPrice || item.finalPrice;
        commissionRate = product.commissionRate || 0;
      }

      // Commission calculate
      const commissionValue =
        (itemPrice * item.quantity * commissionRate) / 100;

      return {
        productId: item.productId,
        variantId: item.variantId || null,
        sellerId: item.sellerId,
        quantity: item.quantity,
        price: item.price,
        finalPrice: item.finalPrice,
        discount: item.discount,
        deliveryStatus: "processing",
        deliveryPartner,
        deliveryCharge: 0,
        commission: commissionValue, //  now commission auto stored
      };
    })
  );

  for (const item of orderItems) {
    if (item.variantId) {
      const variant = await Variant.findById(item.variantId);
      if (!variant)
        return res.status(404).json({ message: "Variant not found" });

      if (variant.stock < item.quantity) {
        return res.status(400).json({
          message: `Only ${variant.stock} left for selected variant.`,
        });
      }
    } else {
      const product = await Product.findById(item.productId);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Only ${product.stock} left for selected product.`,
        });
      }
    }
  }
  let counter = await Counter.findOneAndUpdate(
    { name: "order" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const orderId = `ORD-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${counter.seq.toString().padStart(5, "0")}`;

  const order = new Order({
    orderId,
    userId,
    items: orderItems,
    shippingAddress,
    subTotal,
    totalAmount,
    totalGST,
    paymentMethod,
    paymentStatus: paymentMethod === "COD" ? "pending" : "pending",
    isPaid: false,
    couponCode,
    couponDiscount,
    couponDescription,
    offerId,
  });

  await order.save();

  //  Ab order ke liye shipment process karo
  console.log("Check Order Id =--=-=", order._id);
  // await processShipmentsForOrder(order._id);

  // await createNotification({
  //   recipient: userId,
  //   title: "Order Placed Successfully!",
  //   message: `Your order #${order._id} has been placed with ${orderItems.length} items.`,
  //   type: "order",
  //   channels: ["inApp", "email", "push"], // Optional: depends on your setup
  // });

  const uniqueSellerIds = [
    ...new Set(orderItems.map((i) => i.sellerId.toString())),
  ];

  // for (const sellerId of uniqueSellerIds) {
  //   await createNotification({
  //     recipient: sellerId,
  //     title: "New Order Received!",
  //     message: `You have received a new order #${order.orderId}. Please process the shipment.`,
  //     type: "seller",
  //     channels: ["inApp", "email", "push"],
  //   });
  // }

  await generateInvoicesForOrder(order._id);

  // Reduce stock after successful order creation
  await Promise.all(
    orderItems.map(async (item) => {
      if (item.variantId) {
        await Variant.findByIdAndUpdate(item.variantId, {
          $inc: { stock: -item.quantity },
        });
      } else {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        });
      }
    })
  );

  cart.items = [];
  await cart.save();

  res.status(201).json({ success: true, order });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.userId;

  // Find order with product & seller populated
  const order = await Order.findById(orderId)
    .populate("userId", "names email")
    .populate({
      path: "items.productId",
      select: "name image brand category",
      populate: [
        { path: "brand", model: Brand, select: "name logo" },
        { path: "category", model: Category, select: "name" },
      ],
    })
    .populate("items.sellerId", "shopName shopImage location")
    .populate("items.variantId", "size color price finalPrice stock")
    .select("-__v");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Access control (user only)
  if (order.userId._id.toString() !== userId.toString()) {
    return res
      .status(403)
      .json({ message: "Unauthorized to access this order" });
  }

  // Format clean Amazon-style response
  const formattedOrder = {
    orderId: order._id,
    customeOrderId: order?.orderId,
    user: {
      name: order.userId.names,
      email: order.userId.email,
    },
    shippingAddress: order.shippingAddress,
    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
      isPaid: order.isPaid,
    },
    coupon: {
      code: order.couponCode,
      discount: order.couponDiscount,
      description: order.couponDescription,
    },
    orderStatus: order.orderStatus,
    timestamps: {
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
    },
    items: order.items.map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
      image: item.productId.image?.[0] || null,
      brand: item.productId.brand?.name || null,
      brandLogo: item.productId.brand?.logo || null,
      category: item.productId.category?.name || null,
      quantity: item.quantity,
      price: item.price,
      finalPrice: item.finalPrice,
      total: item.finalPrice * item.quantity,
      deliveryStatus: item.deliveryStatus,
      deliveryPartner: item.deliveryPartner,
      trackingId: item.deliveryTrackingId,
      expectedDeliveryDate: item.expectedDeliveryDate,
      variant: item.variantId
        ? {
            size: item.variantId.size,
            color: item.variantId.color,
            price: item.variantId.price,
            finalPrice: item.variantId.finalPrice,
            stock: item.variantId.stock,
          }
        : null,
      seller: {
        shopName: item.sellerId?.shopName || "",
        shopImage: item.sellerId?.shopImage || "",
        location: item.sellerId?.location || "",
      },
    })),
    pricing: {
      subTotal: order.subTotal,
      deliveryCharge: order.totalAmount - order.subTotal + order.couponDiscount,
      discount: order.couponDiscount,
      totalAmount: order.totalAmount,
    },
  };

  res.status(200).json({
    success: true,
    order: formattedOrder,
  });
});

export const getOrderTimeline = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  const order = await Order.findById(orderId).select("timeline userId");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Allow user access only to their own order
  if (order.userId.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  res.status(200).json({
    success: true,
    timeline: order.timeline,
  });
});

export const getSellerOrderHistory = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const seller = await Seller.findOne({ user: userId });
  if (!seller) {
    return res
      .status(404)
      .json({ success: false, message: "Seller not found" });
  }
  const sellerId = seller._id;

  // Query Params
  let {
    page = 1,
    limit = 10,
    orderStatus,
    paymentStatus,
    productId,
    from,
    to,
    date,
    city,
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  //  Default date range = last 30 days (if not filtering by singleDate(date))
  const now = new Date();
  const defaultFrom = new Date();
  defaultFrom.setDate(now.getDate() - 30);

  // Date logic
  let createdAtFilter = {};
  if (date) {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate)) {
      const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
      createdAtFilter = { $gte: startOfDay, $lte: endOfDay };
    }
  } else {
    from = from ? new Date(from) : defaultFrom;
    to = to ? new Date(to) : now;
    createdAtFilter = { $gte: from, $lte: to };
  }

  //  Build match filter
  const matchStage = {
    "items.sellerId": sellerId,
    createdAt: createdAtFilter,
  };

  if (orderStatus) matchStage.orderStatus = orderStatus;
  if (paymentStatus) matchStage.paymentStatus = paymentStatus;
  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    matchStage["items.productId"] = mongoose.Types.ObjectId(productId);
  }

  //  City Filter (case-insensitive)
  if (city) {
    matchStage["shippingAddress.city"] = { $regex: new RegExp(city, "i") };
  }

  // Count total
  const totalOrders = await Order.countDocuments(matchStage);

  // Fetch orders
  const orders = await Order.find(matchStage)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "names email")
    .populate("items.productId", "name image")
    .populate("items.variantId", "size color price finalPrice stock")
    .select(
      "userId items totalAmount paymentStatus orderStatus createdAt shippingAddress orderId"
    );

  const formattedOrders = [];

  for (const order of orders) {
    const sellerItems = order.items.filter(
      (item) => item.sellerId.toString() === sellerId.toString()
    );
    if (sellerItems.length === 0) continue;

    const orderTotal = sellerItems.reduce(
      (sum, item) => sum + item.finalPrice * item.quantity,
      0
    );

    const formattedOrder = {
      orderId: order.orderId || order._id.toString(),
      // orderId: order._id,
      customer: {
        name: order.userId?.names || "N/A",
        email: order.userId?.email || "N/A",
      },
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      orderTotal: parseFloat(orderTotal.toFixed(2)),
      shippingAddress: {
        city: order.shippingAddress?.city || "N/A",
        state: order.shippingAddress?.state || "N/A",
      },
      items: sellerItems.map((item) => {
        const isVariantUsed = item.variantId;
        return {
          productId: item.productId?._id,
          productName: item.productId?.name || "Unknown",
          productImage: item.productId?.image?.[0] || null,
          quantity: item.quantity,
          finalPrice: isVariantUsed
            ? item.variantId.finalPrice
            : item.finalPrice,
          total:
            (isVariantUsed ? item.variantId.finalPrice : item.finalPrice) *
            item.quantity,
          deliveryStatus: item.deliveryStatus,
          ...(isVariantUsed && {
            variant: {
              size: item.variantId.size,
              color: item.variantId.color,
              stock: item.variantId.stock,
            },
          }),
        };
      }),
    };

    formattedOrders.push(formattedOrder);
  }

  res.status(200).json({
    success: true,
    message: "Seller order history fetched",
    totalOrders,
    currentPage: page,
    totalPages: Math.ceil(totalOrders / limit),
    orders: formattedOrders,
  });
});

// Cancel order by user
export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.userId;

  const order = await Order.findById(orderId);

  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.userId.toString() !== userId.toString())
    return res.status(403).json({ message: "Unauthorized" });

  if (order.orderStatus === "cancelled")
    return res.status(400).json({ message: "Order already cancelled" });

  if (["shipped", "in_transit", "delivered"].includes(order.orderStatus)) {
    return res
      .status(400)
      .json({ message: "Cannot cancel after shipping has started" });
  }

  //  Handle Refund if Paid Online
  let refundInfo = null;
  if (order.paymentStatus === "paid" && order.paymentMethod !== "COD") {
    refundInfo = {
      refundStatus: "initiated",
      refundedAt: new Date(),
    };
    // Add refund txn ID logic if needed
  }

  //  Step 1: Restore Stock for each item
  await Promise.all(
    order.items.map(async (item) => {
      if (item.variantId) {
        await Variant.findByIdAndUpdate(item.variantId, {
          $inc: { stock: item.quantity },
        });
      } else {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }
    })
  );

  //  Mark cancelled
  order.orderStatus = "cancelled";
  order.cancelledAt = new Date();
  await order.save();

  res.status(200).json({
    message: "Order cancelled successfully",
    refund: refundInfo,
  });
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Filters
  const { status, fromDate, toDate } = req.query;

  const query = { userId };

  if (status) {
    query.orderStatus = status;
  }

  if (fromDate && toDate) {
    query.createdAt = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }

  // Total count for pagination
  const totalOrders = await Order.countDocuments(query);

  // Fetch paginated orders
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select(
      "items totalAmount paymentMethod paymentStatus orderStatus isPaid createdAt"
    )
    // show product name & image
    .populate({
      path: "items.productId",
      select: "name image brand category",
      populate: [
        { path: "brand", model: Brand, select: "name logo" },
        { path: "category", model: Category, select: "name" },
      ],
    })
    .populate("items.sellerId", "shopName") // show seller name
    .populate("items.variantId", "size color price finalPrice stock");

  res.status(200).json({
    success: true,
    totalOrders,
    currentPage: page,
    totalPages: Math.ceil(totalOrders / limit),
    orders,
  });
});

// PATCH /orders/:orderId/confirm-received
export const confirmOrderReceived = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);

  // Order not found
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Auth check
  if (order.userId.toString() !== req.userId.toString()) {
    return res
      .status(403)
      .json({ message: "You are not authorized for this order." });
  }

  // Already delivered check
  if (order.orderStatus === "delivered") {
    return res
      .status(400)
      .json({ message: "Order is already marked as delivered." });
  }

  // Update each item to delivered
  order.items.forEach((item) => {
    item.deliveryStatus = "delivered";
    item.deliveryConfirmedAt = new Date();
  });

  // Update main order status
  order.orderStatus = "delivered";
  order.deliveredAt = new Date();

  order.timeline.push({
    status: "delivered",
    time: new Date(),
  });

  await order.save();

  res.json({
    success: true,
    message: "Order and all items marked as delivered.",
  });
});

// /orders/:orderId/items/:itemId/confirm-received
export const confirmSingleItemReceived = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const order = await Order.findById(orderId);

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.userId.toString() !== req.userId.toString())
    return res.status(403).json({ message: "Not your order" });

  const item = order.items.id(itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });

  item.deliveryStatus = "delivered";
  item.deliveryConfirmedAt = new Date();

  // Check if all items are delivered
  const allDelivered = order.items.every(
    (i) => i.deliveryStatus === "delivered"
  );

  if (allDelivered) {
    order.orderStatus = "delivered";
    order.deliveryConfirmedAt = new Date();
    order.timeline.push({ status: "confirmed", time: new Date() });
  }

  await order.save();
  res.json({ success: true, message: "Item marked as delivered." });
});

// Confirm Whole Order Delivered (Only If All Same Seller)
// PATCH /orders/:orderId/confirm-all-items
export const confirmAllItemsReceived = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.userId.toString() !== req.userId.toString())
    return res.status(403).json({ message: "Not your order" });

  const allSameSeller = order.items.every(
    (item) => item.sellerId.toString() === order.items[0].sellerId.toString()
  );

  if (!allSameSeller) {
    return res.status(400).json({ message: "Items are from multiple sellers" });
  }

  // Mark all items as delivered
  order.items.forEach((item) => {
    item.deliveryStatus = "delivered";
    item.deliveryConfirmedAt = new Date();
  });

  order.orderStatus = "delivered";
  order.deliveryConfirmedAt = new Date();
  order.timeline.push({ status: "confirmed", time: new Date() });

  await order.save();
  res.json({ success: true, message: "Order fully marked as delivered." });
});

export const updateAdminOrderStatus = async (req, res) => {
  try {
    let { orderStatus } = req.body;
    const { orderId } = req.params;

    orderStatus = orderStatus.toLowerCase();

    const allowedStatuses = [
      "processing",
      "confirmed",
      "in_transit",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed: ${allowedStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // 🚨 Restriction Rules
    if (order.orderStatus === "delivered") {
      return res.status(400).json({
        success: false,
        message: "Order is already delivered and cannot be updated further.",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled and cannot be updated further.",
      });
    }

    // Example of strict flow: you can’t skip steps
    const statusFlow = {
      processing: ["confirmed", "cancelled"],
      confirmed: ["in_transit", "cancelled"],
      in_transit: ["delivered", "cancelled"],
      delivered: [], // no further updates
      cancelled: [], // no further updates
    };

    if (!statusFlow[order.orderStatus].includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from ${order.orderStatus} → ${orderStatus}`,
      });
    }

    // ✅ Update status
    order.orderStatus = orderStatus;
    order.timeline.push({ status: orderStatus });

    order.items = order.items.map((item) => ({
      ...item.toObject(),
      deliveryStatus: orderStatus === "in_transit" ? "shipped" : orderStatus,
    }));

    if (orderStatus === "delivered") {
      order.deliveredAt = new Date();
    }
    if (orderStatus === "cancelled") {
      order.cancelledAt = new Date();
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${orderStatus}`,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
    });
  }
};
