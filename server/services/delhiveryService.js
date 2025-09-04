import apiClient from "../utils/apiClient.js";
import Order from "../models/orderModel.js";
import Seller from "../models/sellerModel.js";
import { backendClient } from "../utils/backendApi.js";

import axios from "axios";

const DELHIVERY_API_BASE = process.env.DELHIVERY_API_BASE;
const API_TOKEN = process.env.DELHIVERY_API_TOKEN;

export const registerOrUpdatePickup = async (seller, address) => {
  try {
    if (address.delhiveryPickupId) {
      const payloadUpdate = {
        pickup_location: {
          pickup_id: address.delhiveryPickupId,
          name: seller.shopName,
          add: address.addressLine1 + " " + (address.addressLine2 || ""),
          city: address.city,
          state: address.state,
          pin: address.pincode,
          phone: seller.phone || "0000000000",
          country: address.country || "India",
        },
      };
      const res = await axios.post(
        `${DELHIVERY_API_BASE}/api/p/pickup_update.json`,
        payloadUpdate,
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      return address.delhiveryPickupId;
    }

    const payloadRegister = {
      pickup_location: {
        name: seller.shopName,
        add: address.addressLine1 + " " + (address.addressLine2 || ""),
        city: address.city,
        state: address.state,
        pin: address.pincode,
        phone: seller.phone || "0000000000",
        country: address.country || "India",
      },
    };

    const res = await axios.post(
      `${DELHIVERY_API_BASE}/api/p/pickup.json`,
      payloadRegister,
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.data?.pickup_id) return res.data.pickup_id;
    throw new Error("Delhivery pickup registration failed");
  } catch (err) {
    console.error("❌ Pickup Registration/Update Error:", err.message);
    return null;
  }
};
