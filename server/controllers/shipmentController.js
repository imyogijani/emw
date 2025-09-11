import fs from "fs";
import path from "path";
import qs from "qs"; // to encode form-data
import apiClient from "../utils/apiClient.js";
import Order from "../models/orderModel.js";
import Seller from "../models/sellerModel.js";
import { backendClient } from "../utils/backendApi.js";
import { sendShipmentLabelEmail } from "../utils/sendEmail.js";
import axios from "axios";
// import { generateLabel } from "../utils/labelPdfGenerator.js";
import { registerOrUpdatePickup } from "../services/delhiveryService.js";
import mongoose from "mongoose";

export const checkServiceability = async (pincode) => {
  console.log("🔍 Checking Serviceability for:", pincode);

  try {
    // full endpoint = baseURL + "/c/api/pin-codes/json/"
    const response = await apiClient.get(`/c/api/pin-codes/json/`, {
      params: { filter_codes: pincode }, // query params
    });

    // console.log("full url : --",)

    console.log(" API Call Success");
    // console.log("📦 Full Response:", JSON.stringify(response.data, null, 2));

    if (
      response.data &&
      response.data.delivery_codes &&
      response.data.delivery_codes.length > 0
    ) {
      console.log(
        "🚚 Pincode is serviceable:",
        response.data.delivery_codes[0]
      );
      return { serviceable: true, data: response.data.delivery_codes[0] };
    }

    console.log("⚠️ Pincode is NOT serviceable:", pincode);
    return { serviceable: false, data: null };
  } catch (error) {
    console.error("❌ Delhivery API Error");
    if (error.response) {
      console.error("📥 Error Response Data:", error.response.data);
      console.error("⚡ Status:", error.response.status);
    } else {
      console.error("⚡ Error Message:", error.message);
    }
    return { serviceable: false, data: null };
  }
};

export const getDeliveryCharge = async (
  pickup_pincode,
  delivery_pincode,
  weight, // only in grams
  cod
) => {
  console.log("🔄 [Delhivery] getDeliveryCharge START");
  console.log("📦 Request Params:", {
    pickup_pincode,
    delivery_pincode,
    weight,
    cod,
  });

  try {
    const response = await apiClient.get(
      `/api/kinko/v1/invoice/charges/.json`,
      {
        params: {
          md: "S", // Express (default use kar sakte ho)
          ss: "Delivered", // Shipment status
          o_pin: pickup_pincode,
          d_pin: delivery_pincode,
          cgm: weight, // grams me bhejna hai
          pt: cod ? "COD" : "Pre-paid", // payment type
        },
      }
    );

    console.log(" [Delhivery] API Response:", response.data);

    if (response.data && response.data.total_amount) {
      return response.data.total_amount;
    }
    console.log(
      "[Delhivery] Response me total_amount :",
      response.data[0].total_amount
    );
    return (
      response.data[0]?.total_amount || response.data[0]?.gross_amount || 0
    );

    console.warn("⚠️ [Delhivery] Response me total_amount nahi mila.");
    return 0;
  } catch (error) {
    console.error("❌ [Delhivery] Rate API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return 0; // fallback
  } finally {
    console.log("🔚 [Delhivery] getDeliveryCharge END");
  }
};

// Helper function -> pickup date calculate
const getPickupDateAfterDays = (days = 2) => {
  const date = new Date();
  date.setDate(date.getDate() + days); // add N days
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// Delhivery Expected TAT API call
export const getExpectedTAT = async (
  origin_pin,
  destination_pin,
  mot = "S"
) => {
  console.log("🔄 [Delhivery] getExpectedTAT START");

  try {
    const pickupDate = getPickupDateAfterDays(2); // after 2 days pickup
    const response = await apiClient.get(`/api/dc/expected_tat`, {
      params: {
        origin_pin,
        destination_pin,
        mot, // "E" = Express, "S" = Surface
        pdt: "B2C", // optional (default B2C)
        expected_pickup_date: pickupDate,
      },
    });

    console.log("📦 [Delhivery] TAT Response:", response.data);

    return {
      expectedDays: response.data?.expected_tat_days || null,
      expectedDate: response.data?.expected_delivery_date || null,
    };
  } catch (error) {
    console.error("❌ [Delhivery] TAT API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return { expectedDays: null, expectedDate: null };
  } finally {
    console.log("🔚 [Delhivery] getExpectedTAT END");
  }
};

// Way bill
const getOrCreateWaybill = async (sellerId, orderId) => {
  try {
    console.log("🚀 getOrCreateWaybill called");
    console.log("Seller ID:", sellerId);
    console.log("Order ID:", orderId);

    // 1️⃣ Check if already exists in DB
    console.log("🔍 Checking if waybill already exists in backend DB...");
    const existing = await backendClient.get(
      `/api/waybills?sellerId=${sellerId}&orderId=${orderId}`
    );

    console.log("Backend Response:", existing.data);

    if (existing.data?.waybill) {
      console.log("📦 Existing Waybill Found:", existing.data.waybill);
      return existing.data.waybill;
    } else {
      console.log("❌ No existing waybill found in DB.");
    }

    // 2️⃣ Generate new waybill from Delhivery
    console.log("⚡ Generating new waybill from Delhivery...");
    const res = await apiClient.get("/waybill/api/fetch/json/?count=1", {
      responseType: "text", // force plain string response
    });

    console.log("Delhivery API Raw Response:", res.data);

    // Convert response string -> array
    // e.g. "84666610000070,84666610000081,84666610000092"
    // -> ["84666610000070", "84666610000081", "84666610000092"]
    const waybills = res.data
      .toString()
      .trim()
      .replace(/"/g, "")
      .split(",")
      .map((wb) => wb.trim());

    // Pick first waybill
    const newWaybill = waybills[0];

    if (!newWaybill) {
      throw new Error("Waybill not received from Delhivery API");
    }

    console.log(" New Waybill Generated:", newWaybill);

    // 3️⃣ Save in backend DB
    console.log("💾 Saving new waybill in backend DB...");
    const saveResponse = await backendClient.post(`/api/waybills`, {
      sellerId,
      orderId,
      waybill: newWaybill,
    });

    console.log("DB Save Response:", saveResponse.data);

    return newWaybill;
  } catch (err) {
    console.error("❌ Waybill Error Occurred!");

    if (err.response) {
      console.error("Error Response Data:", err.response.data);
      console.error("Status Code:", err.response.status);
      console.error("Headers:", err.response.headers);
    } else if (err.request) {
      console.error("No response received. Request details:", err.request);
    } else {
      console.error("Error Message:", err.message);
    }

    return null;
  }
};

//  Shipment Create

export const createShipment = async (
  order,
  items,
  seller,
  shippingAddress,
  retry = false
) => {
  try {
    const waybill = await getOrCreateWaybill(seller._id, order._id);
    if (!waybill) throw new Error("Waybill not available for this order");

    // 🔹 Calculate seller subtotal
    let sellerTotal = 0;
    let totalWeight = 0;
    let productNames = [];

    for (const it of items) {
      const lineTotal = it.finalPrice * it.quantity;
      sellerTotal += lineTotal;

      // weight
      let w = it.productId?.technicalDetails?.weight || 100; // grams
      totalWeight += Math.max(100, w * it.quantity);

      // product desc
      productNames.push(
        `${it.productId?.name || "Product"} x${it.quantity} = ₹${lineTotal}`
      );
    }

    const isCOD = order.paymentMethod === "COD";
    const codAmount = isCOD ? sellerTotal : 0;

    // 🔹 Seller default pickup address
    const defaultAddress =
      seller.shopAddresses?.find((a) => a.isDefault) ||
      seller.shopAddresses?.[0];

    const shipmentBody = {
      shipments: [
        {
          waybill,
          order: order._id,
          payment_mode: isCOD ? "COD" : "Prepaid",
          total_amount: sellerTotal,
          cod_amount: codAmount,
          name: shippingAddress.fullName,
          add: shippingAddress.addressLine,
          address1: shippingAddress.addressLine1 || shippingAddress.addressLine,
          address2: shippingAddress.addressLine2 || "",
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: "India",
          phone: shippingAddress.phone,
          mobile: shippingAddress.phone,
          pin: shippingAddress.pincode,
          products_desc: productNames.join(", "),
          weight: Math.max(100, totalWeight), // ensure min 100g
        },
      ],
      pickup_location: {
        name: seller.shopName,
        add:
          defaultAddress.addressLine1 +
          " " +
          (defaultAddress.addressLine2 || ""),
        city: defaultAddress?.city,
        state: defaultAddress?.state,
        pin: defaultAddress?.pincode,
        phone: seller.user.phone || "0000000000",
        country: defaultAddress?.country || "India",
      },
    };

    const payload = qs.stringify({
      format: "json",
      data: JSON.stringify(shipmentBody),
    });

    console.log("📦 Shipment Payload:", JSON.stringify(shipmentBody));

    const res = await apiClient.post("/api/cmu/create.json", payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    // handle pickup location issue
    if (
      res.data?.rmk?.includes("ClientWarehouse matching query does not exist.")
    ) {
      console.log("⚠️ Pickup not registered → registering now...");
      const pickupId = await registerOrUpdatePickup(seller, defaultAddress);
      if (pickupId) {
        const idx = seller.shopAddresses.findIndex((a) =>
          a._id.equals(defaultAddress._id)
        );
        if (idx !== -1) {
          seller.shopAddresses[idx].delhiveryPickupId = pickupId;
          await seller.save();
        }
      }
      if (!retry) {
        console.log("🔄 Retrying shipment after pickup registration...");
        return await createShipment(
          order,
          items,
          seller,
          shippingAddress,
          true
        );
      }
    }

    return { success: true, data: res.data, waybill };
  } catch (err) {
    console.error("❌ Shipment Error:", err.response?.data || err.message);
    return { success: false, error: err };
  }
};

//  Attach Waybill + Shipment to Order Items
export const processShipmentsForOrder = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("items.productId")
    .populate("items.sellerId");

  for (const item of order.items) {
    const seller = item.sellerId;
    //   const waybill = await getWaybill();
    //   const waybill = await getOrCreateWaybill(seller._id, order.orderId);

    // if (!waybill) continue;

    const shipment = await createShipment(
      order,
      item,
      seller,
      order.shippingAddress
    );

    if (shipment) {
      item.deliveryPartner = "Delhivery";
      item.deliveryTrackingId = shipment.waybill;
      item.deliveryTrackingURL = `https://www.delhivery.com/track/package/${shipment.waybill}`;
      await order.save();
    }
  }
};

export const generateLabel = async (waybill, orderId, sellerId) => {
  try {
    const res = await apiClient.get(
      `/api/p/packing_slip?wbns=${waybill}&pdf=true`
    );

    const pkg = res.data?.packages?.[0];
    if (!pkg || !pkg.pdf_download_link) {
      console.error("❌ No PDF download link found");
      return null;
    }

    // S3 se actual PDF download karo
    const pdfRes = await axios.get(pkg.pdf_download_link, {
      responseType: "arraybuffer",
    });

    const dir = path.join(process.cwd(), "labels");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const timestamp = Date.now();
    // const fileName = `${sellerId}_${orderId}_${waybill}_${timestamp}.pdf`;
    // const filePath = path.join(dir, fileName);
    const fileName = `${waybill}.pdf`; // easy matching for download
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, Buffer.from(pdfRes.data));

    console.log(" PDF downloaded:", filePath);
    return filePath;
  } catch (err) {
    console.error("❌ Label Generation Failed:", err.message);
    return null;
  }
};

export const generateShipmentsForOrder = async (req, res) => {
  try {
    console.log("👉 generateShipmentsForOrder API called");

    const { orderId } = req.body;
    console.log("OrderId received:", orderId);

    const order = await Order.findById(orderId)
      .populate("items.productId")
      .populate({
        path: "items.sellerId",
        populate: {
          path: "user",
          model: "users",
        },
      });
    console.log("Fetched Order:", order);

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const results = [];
    const sellerGroups = {};

    for (const item of order.items) {
      const sid = String(item.sellerId?._id);
      if (!sid) continue;
      if (!sellerGroups[sid]) sellerGroups[sid] = [];
      sellerGroups[sid].push(item);
    }

    // 🔹 Process each seller group
    for (const sid of Object.keys(sellerGroups)) {
      const items = sellerGroups[sid];
      const seller = items[0].sellerId;
      const sellerUser = seller.user;

      // If seller already has shipment created, skip
      const existingWaybill = items.find(
        (it) => it.deliveryTrackingId
      )?.deliveryTrackingId;
      if (existingWaybill) {
        console.log("🚫 Shipment already exists for seller:", sid);
        results.push({
          sellerId: sid,
          waybill: existingWaybill,
          labelPath: items[0].labelPath || null,
          status: "already_exists",
          products: items.map((it) => ({
            productId: it.productId?._id,
            name: it.productId?.name,
            qty: it.quantity,
          })),
        });
        continue;
      }

      console.log(
        `⏳ Creating shipment for seller ${sid}, items count:`,
        items.length
      );

      // ✅ Call shipment API once for this seller (you may need to modify createShipment to accept multiple items)
      const shipmentRes = await createShipment(
        order,
        items,
        seller,
        order.shippingAddress
      );
      console.log("Shipment Response:", shipmentRes);

      if (
        !shipmentRes.success ||
        shipmentRes.data?.packages?.[0]?.status === "Fail" ||
        shipmentRes.data?.error === true ||
        shipmentRes.data?.success === false
      ) {
        const errorMsg =
          shipmentRes.data?.packages?.[0]?.remarks?.join(", ") ||
          "Shipment creation failed";
        for (const it of items) {
          it.shipmentStatus = "failed";
          it.deliveryStatus = "cancelled";
          it.shippedAt = null;
        }
        await order.save();

        results.push({
          sellerId: sid,
          status: "failed",
          message: errorMsg,
        });
        continue;
      }

      // ✅ Waybill
      const apiWaybill =
        shipmentRes.waybill ||
        shipmentRes.data?.shipments?.[0]?.waybill ||
        shipmentRes.data?.packages?.[0]?.waybill;

      if (!apiWaybill) {
        for (const it of items) it.shipmentStatus = "failed";
        await order.save();
        results.push({ sellerId: sid, status: "failed_no_waybill" });
        continue;
      }

      console.log("Waybill generated:", apiWaybill);

      // ✅ Generate Label PDF (once for seller)
      console.log("📄 Generating label for waybill:", apiWaybill);
      const labelPath = await generateLabel(apiWaybill, orderId, seller._id);

      // ✅ Update all items for this seller
      for (const it of items) {
        it.deliveryPartner = "Delhivery";
        it.deliveryTrackingId = apiWaybill;
        it.deliveryTrackingURL = `https://www.delhivery.com/track/package/${apiWaybill}`;
        it.shipmentStatus = "success";
        it.deliveryStatus = "shipped";
        it.shippedAt = new Date();
        if (labelPath) it.labelPath = labelPath;
      }
      await order.save();

      // ✅ Send label email
      if (sellerUser && sellerUser.email) {
        try {
          await sendShipmentLabelEmail({
            to: sellerUser.email,
            subject: `Shipping Label for Order ${order.orderId}`,
            text: `Hi ${
              seller.shopName || "Seller"
            },\n\nYour shipment label is attached.\nOrder: ${
              order.orderId
            }\nWaybill: ${apiWaybill}\nTrack: https://www.delhivery.com/track/package/${apiWaybill}\n\nThanks.`,
            pdfPath: labelPath,
          });
        } catch (e) {
          console.error("Email send failed:", e.message);
        }
      }

      // ✅ Push final result for seller
      results.push({
        sellerId: sid,
        waybill: apiWaybill,
        labelPath,
        status: "success",
        products: items.map((it) => ({
          productId: it.productId?._id,
          name: it.productId?.name,
          qty: it.quantity,
        })),
      });
    }

    console.log("Final Results:", results);

    return res.json({ success: true, orderId: order._id, results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
};

export const trackShipment = async (waybill) => {
  try {
    console.log("📦 Tracking Waybill:", waybill);

    const res = await apiClient.get(
      `/api/v1/packages/json/?waybill=${waybill}`
    );

    console.log(" Tracking Data:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Tracking Failed:", err.message);
    return null;
  }
};

export const listSellerShipments = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // future filter

    const skip = (page - 1) * limit;

    // Orders with seller items
    const orders = await Order.find({ "items.sellerId": sellerId })
      .select("orderId items createdAt _id")
      .lean();

    let waybillMap = new Map();

    for (const o of orders) {
      for (const it of o.items) {
        if (String(it.sellerId) !== String(sellerId)) continue;

        // Hide delivered/cancelled
        if (["delivered", "cancelled"].includes(it.deliveryStatus)) continue;

        // Skip if no waybill
        if (!it.deliveryTrackingId) continue;

        const wb = it.deliveryTrackingId;

        if (!waybillMap.has(wb)) {
          // New entry for waybill
          waybillMap.set(wb, {
            orderId: o._id,
            customeOrderId: o.orderId,
            sellerId,
            waybill: wb,
            trackingUrl: it.deliveryTrackingURL,
            status: it.shipmentStatus,
            deliveryStatus: it.deliveryStatus,
            labelPath: it.deliveryStatus !== "delivered" ? it.labelPath : null,
            labelUrl: it.deliveryStatus !== "delivered" ? it.labelUrl : null,
            shippedAt: it.shippedAt,
            createdAt: o.createdAt,

            // 👇 extra: pickup & return info
            pickupRequested: it.pickupRequested,
            pickupRequest: it.pickupRequest || null,
            isReturnRequested: it.isReturnRequested || false,
            isReturned: it.isReturned || false,
            returnedAt: it.returnedAt || null,

            // group products in this waybill
            products: [
              {
                productId: it.productId,
                quantity: it.quantity,
                price: it.price,
                finalPrice: it.finalPrice,
              },
            ],
          });
        } else {
          // Already exists → merge products
          const existing = waybillMap.get(wb);
          existing.products.push({
            productId: it.productId,
            quantity: it.quantity,
            price: it.price,
            finalPrice: it.finalPrice,
          });

          // Merge pickup/return if any new info
          existing.pickupRequested =
            existing.pickupRequested || it.pickupRequested;
          existing.isReturnRequested =
            existing.isReturnRequested || it.isReturnRequested;
          existing.isReturned = existing.isReturned || it.isReturned;

          waybillMap.set(wb, existing);
        }
      }
    }

    // Convert Map → Array
    let rows = Array.from(waybillMap.values());

    // Sort latest first
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const paginatedRows = rows.slice(skip, skip + limit);

    res.json({
      success: true,
      page,
      limit,
      total: rows.length,
      shipments: paginatedRows,
    });
  } catch (e) {
    console.error("Error loading shipments:", e);
    res
      .status(500)
      .json({ success: false, message: "Failed to load shipments" });
  }
};

export const downloadLabel = async (req, res) => {
  try {
    const { waybill } = req.params;
    const labelPath = path.join(process.cwd(), "labels", `${waybill}.pdf`);

    if (!fs.existsSync(labelPath)) {
      return res
        .status(404)
        .json({ success: false, message: "Label not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${waybill}.pdf"`
    );
    fs.createReadStream(labelPath).pipe(res);
  } catch (e) {
    res.status(500).json({ success: false, message: "Error serving label" });
  }
};

const formatPickupDate = (date = null) => {
  const now = new Date();
  let d = date ? new Date(date) : new Date();

  if (date) {
    //  Explicit date → force 10AM
    d.setHours(10, 0, 0, 0);

    // If that 10AM is already in past → bump to next day 10AM
    if (d <= now) {
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);
    }
    return d.toISOString().slice(0, 16).replace("T", " ");
  }

  //  No explicit date → always tomorrow 10AM (safe)
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);

  return d.toISOString().slice(0, 16).replace("T", " ");
};

// export const requestPickupForOrder = async (req, res) => {
//   try {
//     const { orderId, pickupDate } = req.body;

//     const order = await Order.findById(orderId).populate({
//       path: "items.sellerId",
//       populate: { path: "user", model: "users" },
//     });

//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found" });
//     }

//     const results = [];
//     const sellers = {};

//     // group waybills per seller
//     for (const it of order.items) {
//       if (it.shipmentStatus === "success" && it.deliveryTrackingId) {
//         if (it.pickupRequested) {
//           //  Prevent repeat request
//           results.push({
//             sellerId: String(it.sellerId._id),
//             success: false,
//             message: "Pickup already requested for this item",
//           });
//           continue;
//         }

//         const sid = String(it.sellerId._id);
//         sellers[sid] = sellers[sid] || {
//           seller: it.sellerId,
//           items: [],
//           waybills: [],
//         };
//         sellers[sid].items.push(it);
//         sellers[sid].waybills.push(it.deliveryTrackingId);
//       }
//     }

//     for (const sid of Object.keys(sellers)) {
//       const { seller, items, waybills } = sellers[sid];
//       const addr =
//         seller.shopAddresses?.find((a) => a.isDefault) ||
//         seller.shopAddresses?.[0];
//       if (!addr) {
//         results.push({
//           sellerId: sid,
//           success: false,
//           message: "No pickup address",
//         });
//         continue;
//       }

//       let pickup_location;
//       if (addr.delhiveryPickupId) {
//         // Agar Delhivery pickup_id string hi store hai to direct string bhej do
//         pickup_location = addr.delhiveryPickupId;
//       } else {
//         pickup_location = seller.shopName;
//       }

//       //  Updated pickup_date logic
//       const pickup_date = formatPickupDate(pickupDate);
//       const [datePart, timePart] = pickup_date.split(" ");

//       const payload = {
//         pickup_location,
//         waybills,
//         pickup_date: datePart, // “YYYY-MM-DD”
//         pickup_time: `${timePart}:00`,
//       };
//       console.log("Request PickUp request --> ", payload);

//       try {
//         const dlResp = await apiClient.post("/fm/request/new/", payload);

//         for (const it of items) {
//           it.pickupRequested = true;
//           it.pickupRequest = {
//             requestedAt: new Date(),
//             waybills,
//             pickupDate: new Date(pickup_date),
//             delhiveryResponse: dlResp.data,
//           };
//         }
//         await order.save();

//         results.push({
//           sellerId: sid,
//           success: true,
//           apiResponse: dlResp.data,
//         });
//       } catch (err) {
//         console.error("Pickup error:", err.response?.data || err.message);
//         results.push({
//           sellerId: sid,
//           success: false,
//           error: err.response?.data || err.message,
//         });
//       }
//     }

//     res.json({ success: true, orderId: order._id, results });
//   } catch (err) {
//     console.error("requestPickupForOrder failed:", err);
//     res.status(500).json({ success: false, message: "Pickup request failed" });
//   }
// };

export const requestPickupForOrder = async (req, res) => {
  try {
    const { orderId, pickupDate, sellerId } = req.body;

    console.log("🟢 Request received:", { orderId, pickupDate, sellerId });

    if (!orderId || !sellerId) {
      return res.status(400).json({
        success: false,
        message: "orderId and sellerId are required",
      });
    }

    const order = await Order.findById(orderId).populate({
      path: "items.sellerId",
      populate: { path: "user", model: "users" },
    });

    if (!order) {
      console.log("❌ Order not found");
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Filter items for this seller only
    const sellerItems = order.items.filter(
      (it) =>
        it.sellerId &&
        new mongoose.Types.ObjectId(sellerId).equals(it.sellerId._id)
    );

    if (!sellerItems.length) {
      console.log("❌ No items found for this seller in the order");
      return res.status(400).json({
        success: false,
        message: "No items found for this seller or already requested",
      });
    }

    // Check if all items already requested
    const alreadyRequested = sellerItems.every((it) => it.pickupRequested);
    if (alreadyRequested) {
      console.log("⚠️ All items already pickup requested for this seller");
      return res.json({
        success: false,
        message: "Pickup already requested for all items of this seller",
      });
    }

    const seller = sellerItems[0].sellerId;

    // Get default shop address
    const addr =
      seller.shopAddresses?.find((a) => a.isDefault) ||
      seller.shopAddresses?.[0];

    if (!addr) {
      console.log("❌ No pickup address for seller:", sellerId);
      return res.status(400).json({
        success: false,
        message: "No pickup address configured for this seller",
      });
    }

    const pickup_location = addr.delhiveryPickupId || seller.shopName;
    const pickup_date = formatPickupDate(pickupDate);
    const [datePart, timePart] = pickup_date.split(" ");

    const waybills = sellerItems
      .filter((it) => it.deliveryTrackingId)
      .map((it) => it.deliveryTrackingId);

    if (!waybills.length) {
      console.log("❌ No shipments created for this seller yet");
      return res.status(400).json({
        success: false,
        message: "No shipments created yet for this seller",
      });
    }

    const payload = {
      pickup_location,
      waybills,
      pickup_date: datePart,
      pickup_time: `${timePart}:00`,
    };

    console.log("📤 Sending pickup payload:", payload);

    try {
      const dlResp = await apiClient.post("/fm/request/new/", payload);

      // ✅ Handle case: Pickup already exists (Delhivery error code 669)
      if (dlResp.data?.error?.code === 669 || dlResp.data?.pr_exist === true) {
        console.log("⚠️ Pickup already exists, treating as success");

        // Update order items anyway
        for (const it of sellerItems) {
          it.pickupRequested = true;
          it.pickupRequest = {
            requestedAt: new Date(),
            waybills,
            pickupDate: new Date(pickup_date),
            delhiveryResponse: dlResp.data,
          };
        }
        await order.save();

        return res.json({
          success: true,
          message: "Pickup already exists, no new request created",
          orderId: order._id,
          sellerId,
          waybills,
          apiResponse: dlResp.data,
        });
      }

      // ✅ Normal success case
      for (const it of sellerItems) {
        it.pickupRequested = true;
        it.pickupRequest = {
          requestedAt: new Date(),
          waybills,
          pickupDate: new Date(pickup_date),
          delhiveryResponse: dlResp.data,
        };
      }

      await order.save();
      console.log("✅ Pickup requested success for seller:", sellerId);

      return res.json({
        success: true,
        orderId: order._id,
        sellerId,
        waybills,
        apiResponse: dlResp.data,
      });
    } catch (err) {
      console.error("❌ Pickup API error:", err.response?.data || err.message);
      return res.status(500).json({
        success: false,
        message: "Delhivery pickup request failed",
        error: err.response?.data || err.message,
      });
    }
  } catch (err) {
    console.error("❌ requestPickupForOrder failed:", err);
    return res.status(500).json({
      success: false,
      message: "Internal error",
      error: err.message,
    });
  }
};
