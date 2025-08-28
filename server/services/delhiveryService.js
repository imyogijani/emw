import apiClient from "../utils/apiClient.js";
import Order from "../models/orderModel.js";
import Seller from "../models/sellerModel.js";
import { backendClient } from "../utils/backendApi.js";

export const checkServiceability = async (pincode) => {
  console.log("🔍 Checking Serviceability for:", pincode);

  try {
    // full endpoint = baseURL + "/c/api/pin-codes/json/"
    const response = await apiClient.get(`/c/api/pin-codes/json/`, {
      params: { filter_codes: pincode }, // query params
    });
    //   console.log("full url : --",)

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
const createShipment = async (order, item, seller, shippingAddress) => {
  try {
    console.log("🚀 createShipment called");
    console.log("Order ID:", order._id, "Seller ID:", seller._id);

    // 1️⃣ Get or Create Waybill
    console.log("🔍 Fetching or creating waybill...");
    const waybill = await getOrCreateWaybill(seller._id, order._id);
    console.log("Waybill fetched:", waybill);

    if (!waybill) {
      throw new Error("Waybill not available for this order");
    }

    // 2️⃣ Weight handling (gram → kg)
    let weightInKg = 0.5; // default
    if (item.productId?.technicalDetails?.weight) {
      const w = item.productId.technicalDetails.weight; 
      weightInKg = w / 1000;
      console.log(`Product weight: ${w}g => ${weightInKg}kg`);
    } else {
      console.log("No weight info found. Using default 0.5kg");
    }

    // 3️⃣ Create payload for Delhivery
    const payload = {
      shipments: [
        {
          waybill,
          order: order.orderId,
          payment_mode: order.paymentMethod === "COD" ? "COD" : "Prepaid",
          total_amount: item.finalPrice * item.quantity,
          cod_amount:
            order.paymentMethod === "COD" ? item.finalPrice * item.quantity : 0,
          consignee: {
            name: shippingAddress.fullName,
            address: shippingAddress.addressLine,
            city: shippingAddress.city,
            state: shippingAddress.state,
            country: "India",
            phone: shippingAddress.phone,
            pincode: shippingAddress.pincode,
          },
          pickup_location: {
            name: seller.storeName,
            city: seller.shopAddresses[0].city,
            state: seller.shopAddresses[0].state,
            country: "India",
            phone: seller.phone,
            pin: seller.shopAddresses[0].pincode,
            address: seller.shopAddresses[0].addressLine1,
          },
          weight: weightInKg,
          product_details: item.productId?.name || "Product",
        },
      ],
    };

    console.log("🚀 Shipment Payload Ready:", JSON.stringify(payload, null, 2));

    // 4️⃣ API call to Delhivery
    console.log("📡 Sending shipment creation request to Delhivery...");
    const res = await apiClient.post("/api/cmu/create.json", payload);

    console.log("✅ Shipment Created Successfully:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Shipment Error Occurred!");

    // Detailed error logging
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
