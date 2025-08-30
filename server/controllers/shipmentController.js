import fs from "fs";
import path from "path";
import apiClient from "../utils/apiClient.js";
import Order from "../models/orderModel.js";
import Seller from "../models/sellerModel.js";
import { backendClient } from "../utils/backendApi.js";
import { sendShipmentLabelEmail } from "../utils/sendEmail.js";

export const checkServiceability = async (pincode) => {
  console.log("🔍 Checking Serviceability for:", pincode);

  try {
    // full endpoint = baseURL + "/c/api/pin-codes/json/"
    const response = await apiClient.get(`/c/api/pin-codes/json/`, {
      params: { filter_codes: pincode }, // query params
    });

    // console.log("full url : --",)

    console.log(" API Call Success");
    console.log("📦 Full Response:", JSON.stringify(response.data, null, 2));

    if (
      response.data &&
      response.data.delivery_codes &&
      response.data.delivery_codes.length > 0
    ) {
      console.log("🚚 Pincode is serviceable:", pincode);
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
  weight, // expects only grams .
  cod,
  order_value
) => {
  console.log("🔄 [Delhivery] getDeliveryCharge START");
  console.log("📦 Request Params:", {
    pickup_pincode,
    delivery_pincode,
    weight,
    cod,
    order_value,
  });

  try {
    const response = await apiClient.post(
      `/api/kinko/v1/invoice/charges/.json`,
      {
        pickup_pincode,
        delivery_pincode,
        weight,
        cod,
        order_value,
      }
    );

    console.log(" [Delhivery] API Response:", response.data);

    if (response.data && response.data.delivery_charges) {
      console.log("💰 [Delhivery] Total Charge:", response.data.total_amount);
      return response.data.total_amount;
    }

    console.warn("⚠️ [Delhivery] Response me delivery_charges nahi mile.");
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
    const res = await apiClient.get("/waybill/api/fetch/json/?count=1");

    console.log("Delhivery API Response:", res.data);

    const newWaybill = res.data?.waybill;

    if (!newWaybill) {
      throw new Error("Waybill not received from Delhivery API");
    }

    console.log("✅ New Waybill Generated:", newWaybill);

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

    // Better error logging
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
export const createShipment = async (order, item, seller, shippingAddress) => {
  try {
    const waybill = await getOrCreateWaybill(seller._id, order._id);
    if (!waybill) throw new Error("Waybill not available for this order");

    let weightInKg = 0.5;
    if (item.productId?.technicalDetails?.weight) {
      const w = item.productId.technicalDetails.weight; // grams
      weightInKg = Math.max(0.1, w / 1000); // guard min weight
    }

    const payload = {
      shipments: [
        {
          waybill,
          order: order._id,
          payment_mode: order.paymentMethod === "COD" ? "COD" : "Prepaid",
          total_amount: item.finalPrice * item.quantity,
          cod_amount:
            order.paymentMethod === "COD" ? item.finalPrice * item.quantity : 0,
          consignee: {
            name: order.shippingAddress.fullName,
            address: order.shippingAddress.addressLine,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            country: "India",
            phone: order.shippingAddress.phone,
            pincode: order.shippingAddress.pincode,
          },
          pickup_location: {
            name: seller.shopName,
            city: seller.shopAddresses?.[0]?.city,
            state: seller.shopAddresses?.[0]?.state,
            country: "India",
            phone: seller.phone,
            pin: seller.shopAddresses?.[0]?.pincode,
            address: seller.shopAddresses?.[0]?.addressLine1,
          },
          weight: weightInKg,
          product_details:
            item.productId?.name || item.productId?.title || "Product",
        },
      ],
    };

    const res = await apiClient.post("/api/cmu/create.json", payload);
    // Expecting res.data.shipments[0].waybill etc.
    return { success: true, data: res.data, waybill };
  } catch (err) {
    console.error("❌ Shipment Error:", err.response?.data || err.message);
    return { success: false, error: err };
  }
};

// 3. Attach Waybill + Shipment to Order Items
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
      item.deliveryTrackingId = waybill;
      item.deliveryTrackingURL = `https://www.delhivery.com/track/package/${shipment.shipments[0].waybill}`;
      await order.save();
    }
  }
};

// label  : Seller panel in download to this call and download. or automatic generate and email in send.

// export const generateLabel = async (waybill) => {
//   try {
//     console.log("🖨️ Generating Label for:", waybill);

//     const res = await apiClient.get(
//       `/api/p/packing_slip?wbns=${waybill}&pdf=true`
//     );

//     // ⚠️ Response will be PDF (Buffer)
//     const filePath = `labels/${waybill}.pdf`;
//     fs.writeFileSync(filePath, res.data);
//     console.log("✅ Label Saved at:", filePath);

//     return filePath;
//   } catch (err) {
//     console.error("❌ Label Generation Failed:", err.message);
//     return null;
//   }
// };

// Pickup Request:
// 👉 Use case:
// Seller ne apne dashboard me "Schedule Pickup" click kiya
// System auto Delhivery ko request bhej dega.

//  Generate Label (PDF)
export const generateLabel = async (waybill) => {
  try {
    const res = await apiClient.get(
      `/api/p/packing_slip?wbns=${waybill}&pdf=true`,
      {
        responseType: "arraybuffer",
      }
    );
    const dir = path.join(process.cwd(), "labels");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${waybill}.pdf`);
    fs.writeFileSync(filePath, res.data);
    return filePath;
  } catch (err) {
    console.error("❌ Label Generation Failed:", err.message);
    return null;
  }
};

// export const createPickupRequest = async (pickupLocation) => {
//   try {
//     console.log("🚚 Creating Pickup Request...");

//     const payload = {
//       pickup_location: {
//         name: pickupLocation.name,
//         city: pickupLocation.city,
//         state: pickupLocation.state,
//         country: "India",
//         phone: pickupLocation.phone,
//         pin: pickupLocation.pincode,
//         address: pickupLocation.address,
//       },
//     };

//     const res = await apiClient.post("/api/cmu/pickup", payload);

//     console.log("✅ Pickup Request Created:", res.data);
//     return res.data;
//   } catch (err) {
//     console.error("❌ Pickup Request Failed:", err.message);
//     return null;
//   }
// };

export const requestPickup = async (req, res) => {
  try {
    const { orderId, pickupLocation } = req.body;

    // Order find karo
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Waybills nikalo jo shipment success hain
    const waybills = order.items
      .filter((it) => it.shipmentStatus === "success" && it.deliveryTrackingId)
      .map((it) => it.deliveryTrackingId);

    if (waybills.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No ready parcels for pickup" });
    }

    // Payload banao
    const payload = {
      pickup_location: {
        name: pickupLocation.name,
        city: pickupLocation.city,
        state: pickupLocation.state,
        country: "India",
        phone: pickupLocation.phone,
        pin: pickupLocation.pincode,
        address: pickupLocation.address,
      },
      waybills, // sare waybills bhej rahe hain
    };

    // Delhivery ko call karo
    // const data = await createPickupRequest(payload);
    const res = await apiClient.post("/api/cmu/pickup", payload);

    res.json({ success: !!data, data });
  } catch (err) {
    console.error("Pickup Request Error:", err);
    res.status(500).json({ success: false, message: "Pickup request failed" });
  }
};
// 👉 Tracking Status

// 👉 Use case:  User / Seller dono ko live status dikhane ke liye.
// User app me "Track Order" button click kare → ye API call hogi
// Seller ko bhi apne panel me dikhana.

export const trackShipment = async (waybill) => {
  try {
    console.log("📦 Tracking Waybill:", waybill);

    const res = await apiClient.get(
      `/api/v1/packages/json/?waybill=${waybill}`
    );

    console.log("✅ Tracking Data:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Tracking Failed:", err.message);
    return null;
  }
};

export const generateShipmentsForOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId)
      .populate("items.productId")
      .populate({
        path: "items.sellerId",
        populate: {
          path: "user",
          model: "users",
        },
      });

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const results = [];

    for (const item of order.items) {
      const seller = item.sellerId;
      const sellerUser = seller.user;
      if (!seller) continue;

      // Skip if already shipped
      if (item.shipmentStatus === "success" && item.deliveryTrackingId) {
        results.push({
          sellerId: seller._id,
          waybill: item.deliveryTrackingId,
          labelPath: item.labelPath,
          status: "already_exists",
        });
        continue;
      }

      const shipmentRes = await createShipment(
        order,
        item,
        seller,
        order.shippingAddress
      );

      if (!shipmentRes.success) {
        item.shipmentStatus = "failed";
        await order.save();
        results.push({ sellerId: seller._id, status: "failed" });
        continue;
      }

      // Determine waybill from either our local value or API response
      const apiWaybill =
        shipmentRes.waybill ||
        shipmentRes.data?.shipments?.[0]?.waybill ||
        shipmentRes.data?.packages?.[0]?.waybill;

      if (!apiWaybill) {
        item.shipmentStatus = "failed";
        await order.save();
        results.push({ sellerId: seller._id, status: "failed_no_waybill" });
        continue;
      }

      // Generate Label PDF
      const labelPath = await generateLabel(apiWaybill);

      // Update item shipment fields
      item.deliveryPartner = "Delhivery";
      item.deliveryTrackingId = apiWaybill;
      item.deliveryTrackingURL = `https://www.delhivery.com/track/package/${apiWaybill}`;
      item.shipmentStatus = "success";
      item.shippedAt = new Date();
      if (labelPath) item.labelPath = labelPath;

      await order.save();

      // Send label email to seller (if email exists)
      if (sellerUser && sellerUser.email) {
        try {
          await sendShipmentLabelEmail({
            to: sellerUser.email,
            subject: `Shipping Label for Order ${order.orderId}`,
            text: `Hi ${
              seller.shopName || "Seller"
            },\n\nYour shipment label is attached.\nOrder: ${
              order.orderId
            }\nWaybill: ${apiWaybill}\nTrack: ${
              item.deliveryTrackingURL
            }\n\nThanks.`,
            pdfPath: labelPath,
          });
        } catch (e) {
          console.error("Email send failed:", e.message);
        }
      }

      results.push({
        sellerId: seller._id,
        waybill: apiWaybill,
        labelPath,
        labelUrl: item.labelUrl || null,
        status: "success",
      });
    }

    return res.json({ success: true, orderId: order._id, results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
};

export const listSellerShipments = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const orders = await Order.find({ "items.sellerId": sellerId })
      .select("orderId items createdAt")
      .lean();

    const rows = [];
    for (const o of orders) {
      for (const it of o.items) {
        if (String(it.sellerId) !== String(sellerId)) continue;
        rows.push({
          orderId: o.orderId,
          sellerId,
          waybill: it.deliveryTrackingId,
          trackingUrl: it.deliveryTrackingURL,
          status: it.shipmentStatus,
          labelPath: it.labelPath,
          labelUrl: it.labelUrl,
          shippedAt: it.shippedAt,
          createdAt: o.createdAt,
        });
      }
    }
    res.json({ success: true, shipments: rows });
  } catch (e) {
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
