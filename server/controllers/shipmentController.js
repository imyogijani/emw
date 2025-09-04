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
// export const createShipment = async (order, item, seller, shippingAddress) => {
//   try {
//     const waybill = await getOrCreateWaybill(seller._id, order._id);
//     if (!waybill) throw new Error("Waybill not available for this order");

//     let weightInKg = 0.5;
//     if (item.productId?.technicalDetails?.weight) {
//       const w = item.productId.technicalDetails.weight; // grams
//       weightInKg = Math.max(0.1, w / 1000); // guard min weight
//     }

//     const payload = {
//       format: "json",
//       shipments: [
//         {
//           waybill,
//           order: order._id,
//           payment_mode: order.paymentMethod === "COD" ? "COD" : "Prepaid",
//           total_amount: item.finalPrice * item.quantity,
//           cod_amount:
//             order.paymentMethod === "COD" ? item.finalPrice * item.quantity : 0,
//           consignee: {
//             name: order.shippingAddress.fullName,
//             address: order.shippingAddress.addressLine,
//             city: order.shippingAddress.city,
//             state: order.shippingAddress.state,
//             country: "India",
//             phone: order.shippingAddress.phone,
//             pincode: order.shippingAddress.pincode,
//           },
//           pickup_location: {
//             name: seller.shopName,
//             city: seller.shopAddresses?.[0]?.city,
//             state: seller.shopAddresses?.[0]?.state,
//             country: "India",
//             phone: seller.phone,
//             pin: seller.shopAddresses?.[0]?.pincode,
//             address: seller.shopAddresses?.[0]?.addressLine1,
//           },
//           weight: weightInKg,
//           product_details:
//             item.productId?.name || item.productId?.title || "Product",
//         },
//       ],
//     };

//     const res = await apiClient.post("/api/cmu/create.json", payload);
//     // Expecting res.data.shipments[0].waybill etc.
//     return { success: true, data: res.data, waybill };
//   } catch (err) {
//     console.error("❌ Shipment Error:", err.response?.data || err.message);
//     return { success: false, error: err };
//   }
// };
export const createShipment = async (order, item, seller, shippingAddress) => {
  try {
    const waybill = await getOrCreateWaybill(seller._id, order._id);
    if (!waybill) throw new Error("Waybill not available for this order");
    // console.log("Create Shipment oder seller --> ", seller);

    let weightInKg = 0.5;
    if (item.productId?.technicalDetails?.weight) {
      const w = item.productId.technicalDetails.weight; // grams
      weightInKg = Math.max(0.1, w / 1000); // guard min weight
    }
    // ✅ Seller ka default shop address pick karo
    const defaultAddress =
      seller.shopAddresses?.find((a) => a.isDefault) ||
      seller.shopAddresses?.[0];

    // build shipment body exactly as Delhivery expects
    const shipmentBody = {
      shipments: [
        {
          waybill,
          order: order._id,
          payment_mode: order.paymentMethod === "COD" ? "COD" : "Prepaid",
          total_amount: item.finalPrice * item.quantity,
          cod_amount:
            order.paymentMethod === "COD" ? item.finalPrice * item.quantity : 0,
          name: order.shippingAddress.fullName,
          add: order.shippingAddress.addressLine,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          country: "India",
          phone: order.shippingAddress.phone,
          pin: order.shippingAddress.pincode,
          products_desc:
            item.productId?.name || item.productId?.title || "Product",
          weight: weightInKg,
        },
      ],

      //  Pickup from seller shop using COMPANY account
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

    // wrap into format + data (stringified JSON)
    const payload = qs.stringify({
      format: "json",
      data: JSON.stringify(shipmentBody),
    });

    console.log("Create Shipping order  : --> ", JSON.stringify(shipmentBody));

    const res = await apiClient.post("/api/cmu/create.json", payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

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
      item.deliveryTrackingId = shipment.waybill;
      item.deliveryTrackingURL = `https://www.delhivery.com/track/package/${shipment.waybill}`;
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
// export const generateLabel = async (waybill) => {
//   try {
//     const res = await apiClient.get(
//       `/api/p/packing_slip?wbns=${waybill}&pdf=true`,
//       {
//         responseType: "arraybuffer",
//       }
//     );
//     const dir = path.join(process.cwd(), "labels");
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//     const filePath = path.join(dir, `${waybill}.pdf`);
//     fs.writeFileSync(filePath, res.data);
//     return filePath;
//   } catch (err) {
//     console.error("❌ Label Generation Failed:", err.message);
//     return null;
//   }
// };

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
    const fileName = `${sellerId}_${orderId}_${waybill}_${timestamp}.pdf`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, Buffer.from(pdfRes.data));

    console.log("✅ PDF downloaded:", filePath);
    return filePath;
  } catch (err) {
    console.error("❌ Label Generation Failed:", err.message);
    return null;
  }
};

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

    for (const item of order.items) {
      const seller = item.sellerId;
      const sellerUser = seller.user;
      if (!seller) continue;

      // Skip if already shipped
      if (item.shipmentStatus === "success" && item.deliveryTrackingId) {
        console.log("✅ Already shipped:", item.deliveryTrackingId);
        results.push({
          sellerId: seller._id,
          waybill: item.deliveryTrackingId,
          labelPath: item.labelPath,
          status: "already_exists",
        });
        continue;
      }
      console.log("⏳ Creating shipment for item:", item._id);

      const shipmentRes = await createShipment(
        order,
        item,
        seller,
        order.shippingAddress
      );
      console.log("Shipment Response:", shipmentRes);

      if (
        !shipmentRes.success ||
        shipmentRes.data?.packages?.[0]?.status === "Fail"
      ) {
        const errorMsg =
          shipmentRes.data?.packages?.[0]?.remarks?.join(", ") ||
          "Shipment creation failed";
        item.shipmentStatus = "failed";
        await order.save();
        results.push({
          sellerId: seller._id,
          status: "failed",
          message: errorMsg,
        });
        continue;
      }

      // Determine waybill from either our local value or API response
      const apiWaybill =
        shipmentRes.waybill ||
        shipmentRes.data?.shipments?.[0]?.waybill ||
        shipmentRes.data?.packages?.[0]?.waybill;

      console.log("Waybill generated:", apiWaybill);

      if (!apiWaybill) {
        item.shipmentStatus = "failed";
        await order.save();
        results.push({ sellerId: seller._id, status: "failed_no_waybill" });
        continue;
      }

      // Generate Label PDF
      console.log("📄 Generating label for waybill:", apiWaybill);
      const labelPath = await generateLabel(apiWaybill, orderId, seller._id);
      console.log("Label Path:", labelPath);

      // Update item shipment fields
      item.deliveryPartner = "Delhivery";
      item.deliveryTrackingId = apiWaybill;
      item.deliveryTrackingURL = `https://www.delhivery.com/track/package/${apiWaybill}`;
      item.shipmentStatus = "success";
      item.shippedAt = new Date();
      if (labelPath) item.labelPath = labelPath;

      await order.save();
      console.log("✅ Order updated with shipment info");

      // Send label email to seller (if email exists)
      if (sellerUser && sellerUser.email) {
        console.log("📧 Sending shipment label email to:", sellerUser.email);
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
    console.log("Final Results:", results);

    return res.json({ success: true, orderId: order._id, results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
};

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

// export const requestPickup = async (req, res) => {
//   try {
//     const { orderId } = req.body;

//     // Order find karo
//     const order = await Order.findById(orderId).lean();
//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     // Ready shipments ke waybills nikalo
//     const waybills = order.items
//       .filter((it) => it.shipmentStatus === "success" && it.deliveryTrackingId)
//       .map((it) => it.deliveryTrackingId);

//     if (waybills.length === 0) {
//       return res.status(400).json({ success: false, message: "No parcels for pickup" });
//     }

//     // Seller ka address le lo (direct pickup ke liye)
//     const seller = order.items[0].sellerId; // maan lo ek seller ke liye
//     const sellerAddr = seller.shopAddresses?.[0];

//     const payload = {
//       pickup_location: {
//         name: "KENAYO SURFACE" // ✅ yahi rehna chahiye
//       },
//       waybills,
//       pickup_date: new Date().toISOString().slice(0, 19).replace("T", " "), // format yyyy-mm-dd hh:mm
//       pickup_address: {
//         name: seller.shopName,
//         add: sellerAddr?.addressLine1,
//         city: sellerAddr?.city,
//         pin: sellerAddr?.pincode,
//         phone: seller.phone,
//         state: sellerAddr?.state,
//         country: "India"
//       }
//     };

//     const resp = await apiClient.post("/api/cmu/pickup", payload);
//     return res.json({ success: true, data: resp.data });
//   } catch (err) {
//     console.error("Pickup Request Error:", err.response?.data || err.message);
//     return res.status(500).json({ success: false, message: "Pickup request failed" });
//   }
// };

// 👉 Tracking Status

// 👉 Use case:  User / Seller dono ko live status dikhane ke liye.
// User app me "Track Order" button click kare → ye API call hogi
// Seller ko bhi apne panel me dikhana.

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


