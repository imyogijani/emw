// import apiClient from "../utils/apiClient.js";
import Order from "../models/orderModel.js";
import Seller from "../models/sellerModel.js";
import { backendClient } from "../utils/backendApi.js";
import apiClient from "../utils/apiClient.js";

import ShopTiming from "../models/shopTimingModel.js";

import axios from "axios";

const DELHIVERY_API_BASE = process.env.DELHIVERY_API_BASE;
const API_TOKEN = process.env.DELHIVERY_API_TOKEN;

// console.log("Delivery service  : ---> ", DELHIVERY_API_BASE, API_TOKEN);

const getBusinessHoursForSeller = async (sellerId) => {
  const timing = await ShopTiming.findOne({ seller: sellerId });
  if (!timing) {
    console.log("⚠️ No ShopTiming found for seller:", sellerId);
    return {};
  }

  const map = {
    monday: "MON",
    tuesday: "TUE",
    wednesday: "WED",
    thursday: "THU",
    friday: "FRI",
    saturday: "SAT",
    sunday: "SUN",
  };

  const businessHours = {};
  for (const day in map) {
    const intervals = timing.shopTimings[day];
    if (intervals && intervals.length > 0) {
      // Assume first interval only, or merge if multiple
      const { openTime, closeTime } = intervals[0];
      businessHours[map[day]] = {
        start_time: openTime,
        close_time: closeTime,
      };
    }
  }

  console.log(
    "🕒 Generated business_hours:",
    JSON.stringify(businessHours, null, 2)
  );
  return businessHours;
};

export const registerOrUpdatePickup = async (seller, address) => {
  const businessHours = await getBusinessHoursForSeller(seller._id);
  const businessDays = Object.keys(businessHours);

  console.log("📅 Final business_days:", businessDays);

  try {
    const fullAddress =
      `${address.addressLine1 || ""} ${address.addressLine2 || ""}, ` +
      `${address.city || ""}, ${address.state || ""} - ${
        address.pincode || ""
      }`;
    // ---- Update Case ----
    if (address.delhiveryPickupId) {
      const payloadUpdate = {
        pickup_id: address.delhiveryPickupId,
        name: seller.shopName,
        registered_name: seller.registeredName || seller.shopName,
        phone: seller.user.phone || "0000000000",
        email: seller.user.email || "no-reply@example.com",

        //  Full seller address
        address: fullAddress.trim(),
        city: address.city,
        state: address.state,
        pin: address.pincode,
        country: address.country || "India",

        //  Return address bhi full
        return_address: fullAddress.trim(),
        return_city: address.city,
        return_pin: address.pincode,
        return_state: address.state,
        return_country: address.country || "India",

        business_hours: businessHours,
        business_days: businessDays,
      };

      console.log("🟡 Sending Update Payload:", payloadUpdate);

      const res = await apiClient.put(
        `/api/backend/clientwarehouse/edit/`,
        payloadUpdate
      );

      console.log("🟢 Update Response:", res.data);
      return address.delhiveryPickupId;
    }

    // ---- Register Case ----
    const payloadRegister = {
      name: seller.shopName,
      registered_name: seller.registeredName || seller.shopName,
      phone: seller.user.phone || "0000000000",
      email: seller.user.email || "no-reply@example.com",

      //  Full seller address
      address: fullAddress.trim(),
      city: address.city,
      state: address.state,
      pin: address.pincode,
      country: address.country || "India",

      //  Full return address
      return_address: fullAddress.trim(),
      return_city: address.city,
      return_pin: address.pincode,
      return_state: address.state,
      return_country: address.country || "India",

      business_hours: businessHours,
      business_days: businessDays,
    };

    console.log("🟡 Sending Register Payload:", payloadRegister);

    const res = await apiClient.post(
      `/api/backend/clientwarehouse/create/`,
      payloadRegister
    );

    console.log("🟢 Register Response:", res.data);

    // console.log("🟢 Register Response:", res.data);

    if (res.data?.success) {
      // pickup_id agar mila to use lo, warna fallback me name
      const pickupId = res.data.pickup_id || res.data.data?.name;

      console.log("✅ Warehouse registered:", pickupId);

      // yeh seller DB me save karo taaki shipment create karte waqt yahi name bhejo
      return pickupId;
    } else {
      throw new Error(`Delhivery Error: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    console.error("❌ Pickup Registration/Update Error");

    // Agar API error hai (axios error)
    if (err.response) {
      console.error("Status Code:", err.response.status);
      console.error("Error Data:", err.response.data);
      console.error("Headers:", err.response.headers);
    } else if (err.request) {
      // Agar request gaya hi nahi
      console.error("No response received:", err.request);
    } else {
      // Agar code error hai (logic, payload issue)
      console.error("Error Message:", err.message);
    }

    // Full stack trace for debugging
    console.error("Stack Trace:", err.stack);

    return null;
  }
};
