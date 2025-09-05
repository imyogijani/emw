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

export const createShipment = async (order, item, seller, shippingAddress) => {
  try {
    const waybill = await getOrCreateWaybill(seller._id, order._id);
    if (!waybill) throw new Error("Waybill not available for this order");

    let weightInKg = 0.5;
    if (item.productId?.technicalDetails?.weight) {
      const w = item.productId.technicalDetails.weight; // grams
      weightInKg = Math.max(0.1, w / 1000);
    }

    //  Seller ka default shop address
    const defaultAddress =
      seller.shopAddresses?.find((a) => a.isDefault) ||
      seller.shopAddresses?.[0];

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
          address1:
            order.shippingAddress.addressLine1 ||
            order.shippingAddress.addressLine, //  primary
          address2: order.shippingAddress.addressLine2 || "", //Secondary
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          country: "India",
          phone: order.shippingAddress.phone,
          mobile: order.shippingAddress.phone,
          pin: order.shippingAddress.pincode,
          products_desc:
            item.productId?.name || item.productId?.title || "Product",
          weight: weightInKg,
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

    //  Agar Delhivery fail kare pickup location missing ke wajah se
    if (
      res.data?.rmk?.includes("ClientWarehouse matching query does not exist.")
    ) {
      console.log("⚠️ Pickup not registered → registering now...");

      const pickupId = await registerOrUpdatePickup(seller, defaultAddress);

      console.log("SHipment Controller --> ", pickupId);
      if (pickupId) {
        const idx = seller.shopAddresses.findIndex((a) =>
          a._id.equals(defaultAddress._id)
        );
        if (idx !== -1) {
          seller.shopAddresses[idx].delhiveryPickupId = pickupId;
          await seller.save();
          console.log(" Pickup ID DB save ->:", pickupId);
        }
      }
    }

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
        console.log(" Already shipped:", item.deliveryTrackingId);
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
        shipmentRes.data?.packages?.[0]?.status === "Fail" ||
        shipmentRes.data?.error === true ||
        shipmentRes.data?.success === false
      ) {
        const errorMsg =
          shipmentRes.data?.packages?.[0]?.remarks?.join(", ") ||
          "Shipment creation failed";
        item.shipmentStatus = "failed";
        item.deliveryStatus = "cancelled"; //  order side bhi reflect ho
        item.shippedAt = null;
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
      item.deliveryStatus = "shipped";

      item.shippedAt = new Date();
      if (labelPath) item.labelPath = labelPath;

      await order.save();
      console.log(" Order updated with shipment info");

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

export const listSellerShipments = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Query params from frontend
    const page = parseInt(req.query.page) || 1; // default page 1
    const limit = parseInt(req.query.limit) || 10; // default 10 per page
    const status = req.query.status; // optional filter e.g. ?status=success

    const skip = (page - 1) * limit;

    // Orders laao jisme seller ka item ho
    const orders = await Order.find({ "items.sellerId": sellerId })
      .select("orderId items createdAt _id")
      .lean();

    let rows = [];
    for (const o of orders) {
      for (const it of o.items) {
        if (String(it.sellerId) !== String(sellerId)) continue;

        //  Hide delivered shipments
        if (it.deliveryStatus === "delivered") continue;

        //  Hide cancelled bhi agar chaho
        if (it.deliveryStatus === "cancelled") continue;

        rows.push({
          orderId: o.orderId,
          customeOrderId: o._id,
          sellerId,
          waybill: it.deliveryTrackingId,
          trackingUrl: it.deliveryTrackingURL,
          status: it.shipmentStatus, // pending / success / failed
          deliveryStatus: it.deliveryStatus, // processing / shipped / delivered / cancelled
          labelPath: it.deliveryStatus !== "delivered" ? it.labelPath : null, //  delivered hone ke baad label hide
          labelUrl: it.deliveryStatus !== "delivered" ? it.labelUrl : null,
          shippedAt: it.shippedAt,
          createdAt: o.createdAt,
        });
      }
    }

    //  Sort by createdAt (latest first)
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    //  Pagination slice
    const paginatedRows = rows.slice(skip, skip + limit);

    res.json({
      success: true,
      page,
      limit,
      total: rows.length, // total count before pagination
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
  const d = date ? new Date(date) : new Date();

  // Agar date explicitly diya gaya hai
  if (date) {
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16).replace("T", " ");
  }

  // Same-day vs Next-day logic
  if (now.getHours() < 12) {
    // Agar subah 12 baje se pehle → same-day pickup 3PM fix karte hain
    d.setHours(15, 0, 0, 0);
  } else {
    // Agar 12 ke baad → next-day 10AM
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
  }

  return d.toISOString().slice(0, 16).replace("T", " ");
};

export const requestPickupForOrder = async (req, res) => {
  try {
    const { orderId, pickupDate } = req.body;

    const order = await Order.findById(orderId).populate({
      path: "items.sellerId",
      populate: { path: "user", model: "users" },
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const results = [];
    const sellers = {};

    // group waybills per seller
    for (const it of order.items) {
      if (it.shipmentStatus === "success" && it.deliveryTrackingId) {
        if (it.pickupRequested) {
          //  Prevent repeat request
          results.push({
            sellerId: String(it.sellerId._id),
            success: false,
            message: "Pickup already requested for this item",
          });
          continue;
        }

        const sid = String(it.sellerId._id);
        sellers[sid] = sellers[sid] || {
          seller: it.sellerId,
          items: [],
          waybills: [],
        };
        sellers[sid].items.push(it);
        sellers[sid].waybills.push(it.deliveryTrackingId);
      }
    }

    for (const sid of Object.keys(sellers)) {
      const { seller, items, waybills } = sellers[sid];
      const addr =
        seller.shopAddresses?.find((a) => a.isDefault) ||
        seller.shopAddresses?.[0];
      if (!addr) {
        results.push({
          sellerId: sid,
          success: false,
          message: "No pickup address",
        });
        continue;
      }

      let pickup_location;
      if (addr.delhiveryPickupId) {
        // Agar Delhivery pickup_id string hi store hai to direct string bhej do
        pickup_location = addr.delhiveryPickupId;
      } else {
        pickup_location = seller.shopName;
      }

      //  Updated pickup_date logic
      const pickup_date = formatPickupDate(pickupDate);
      const [datePart, timePart] = pickup_date.split(" ");

      const payload = {
        pickup_location,
        waybills,
        pickup_date: datePart, // “YYYY-MM-DD”
        pickup_time: `${timePart}:00`,
      };
      console.log("Request PickUp request --> ", payload);

      try {
        const dlResp = await apiClient.post("/fm/request/new/", payload);

        for (const it of items) {
          it.pickupRequested = true;
          it.pickupRequest = {
            requestedAt: new Date(),
            waybills,
            pickupDate: new Date(pickup_date),
            delhiveryResponse: dlResp.data,
          };
        }
        await order.save();

        results.push({
          sellerId: sid,
          success: true,
          apiResponse: dlResp.data,
        });
      } catch (err) {
        console.error("Pickup error:", err.response?.data || err.message);
        results.push({
          sellerId: sid,
          success: false,
          error: err.response?.data || err.message,
        });
      }
    }

    res.json({ success: true, orderId: order._id, results });
  } catch (err) {
    console.error("requestPickupForOrder failed:", err);
    res.status(500).json({ success: false, message: "Pickup request failed" });
  }
};
