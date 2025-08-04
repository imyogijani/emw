import Invoice from "../models/invoiceModel.js";
import Order from "../models/orderModel.js";
import { generateInvoiceNumber } from "../utils/generateInvoiceNumber.js";
import asyncHandler from "express-async-handler";

// Common filter utility
const buildFilters = (query) => {
  const filters = {};
  if (query.status) filters.paymentStatus = query.status;

  if (query.startDate && query.endDate) {
    filters.createdAt = {
      $gte: new Date(query.startDate),
      $lte: new Date(query.endDate),
    };
  }

  return filters;
};

export const generateInvoicesForOrder = async (orderId) => {
  const order = await Order.findById(orderId).populate("items.productId");

  // Group items by seller
  const sellerGroups = {};

  order.items.forEach((item) => {
    const sellerId = item.productId.seller.toString();
    if (!sellerGroups[sellerId]) sellerGroups[sellerId] = [];
    sellerGroups[sellerId].push(item);
  });

  const invoices = [];

  const buyerId = order.userId;
  const paymentMethod = order.paymentMethod;
  const paymentStatus = order.paymentStatus;

  let suffix = "A";

  for (const [sellerId, items] of Object.entries(sellerGroups)) {
    let subTotal = 0;
    let deliveryCharge = 0;

    const invoiceItems = items.map((item) => {
      const finalPrice = item.variantId?.finalPrice || item.productId.price;
      const price = item.productId.price;
      const quantity = item.quantity;
      const discount = price - finalPrice;
      subTotal += finalPrice * quantity;
      deliveryCharge += item.deliveryCharge || 0;

      return {
        productId: item.productId._id,
        productName: item.productId.name,
        quantity,
        price,
        discount,
        finalPrice,
      };
    });

    const totalAmount = subTotal + deliveryCharge;

    const invoice = new Invoice({
      invoiceNumber: generateInvoiceNumber(order._id, suffix),
      orderId: order._id,
      sellerId,
      buyerId,
      items: invoiceItems,
      subTotal,
      deliveryCharge,
      totalAmount,
      paymentMethod,
      paymentStatus,
      deliveryStatus: "processing", // default
    });

    await invoice.save();
    invoices.push(invoice);
    suffix = String.fromCharCode(suffix.charCodeAt(0) + 1); // A -> B -> C...
  }

  return invoices;
};

// export const updateInvoiceStatus = asyncHandler(async (req, res) => {
//   const { invoiceId } = req.params;
//   const { paymentStatus, deliveryStatus } = req.body;

//   const invoice = await Invoice.findById(invoiceId);

//   if (!invoice) return res.status(404).json({ message: "Invoice not found" });

//   if (paymentStatus) invoice.paymentStatus = paymentStatus;
//   if (deliveryStatus) invoice.deliveryStatus = deliveryStatus;

//   await invoice.save();

//   // regenerate PDF
//   const pdfPath = await generateInvoicePDF(invoice);
//   invoice.filePath = pdfPath;
//   await invoice.save();

//   res.json({ success: true, message: "Invoice updated and PDF regenerated", invoice });
// });

//  Admin - Get all invoices with filters & pagination
export const getAllInvoicesAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = "desc" } = req.query;
  const filters = buildFilters(req.query);

  const invoices = await Invoice.find(filters)
    .sort({ createdAt: sort === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Invoice.countDocuments(filters);

  res.json({
    total,
    page: parseInt(page),
    invoices,
  });
});

//  User - Get invoices by userId
export const getInvoicesByUser = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = "desc" } = req.query;
  const userId = req.params.id;
  const filters = buildFilters(req.query);
  filters.buyerId = userId;

  const invoices = await Invoice.find(filters)
    .sort({ createdAt: sort === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Invoice.countDocuments(filters);

  res.json({
    total,
    page: parseInt(page),
    invoices,
  });
});

//  Seller - Get invoices by sellerId
export const getInvoicesBySeller = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = "desc" } = req.query;
  const sellerId = req.params.id;
  const filters = buildFilters(req.query);
  filters.sellerId = sellerId;

  const invoices = await Invoice.find(filters)
    .sort({ createdAt: sort === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Invoice.countDocuments(filters);

  res.json({
    total,
    page: parseInt(page),
    invoices,
  });
});
