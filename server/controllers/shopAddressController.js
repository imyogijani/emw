import Seller from "../models/sellerModel.js";
import User from "../models/userModel.js";

//  Add a new shop address
// controller
export const addShopAddress = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const { address, fromUserAddress, userAddressIndex } = req.body;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    let newAddress;

    if (fromUserAddress) {
      const user = await User.findById(seller.user);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      if (!Array.isArray(user.address) || !user.address[userAddressIndex]) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user address index" });
      }

      // Validate the picked user address too (so you still get field-level errors)
      const { valid, errors, sanitized } = validateAddress(
        user.address[userAddressIndex]
      );
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: "Invalid address",
          errors, // <-- field by field errors
        });
      }
      newAddress = sanitized;
    } else {
      // Validate the incoming address payload
      const { valid, errors, sanitized } = validateAddress(address);
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: "Invalid address",
          errors, // <-- field by field errors
        });
      }
      newAddress = sanitized;
    }

    // If it's the first address, you can auto-mark as default (optional)
    if (seller.shopAddresses.length === 0) {
      newAddress.isDefault = true;
    }

    seller.shopAddresses.push(newAddress);
    await seller.save();

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: seller.shopAddresses,
    });
  } catch (error) {
    console.error("Error adding shop address:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

//  Update shop address by index
export const updateShopAddress = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const index = parseInt(req.params.index);
    const updatedData = req.body;

    const seller = await Seller.findById(sellerId);
    if (!seller)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });

    if (index < 0 || index >= seller.shopAddresses.length) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid address index" });
    }

    seller.shopAddresses[index] = {
      ...seller.shopAddresses[index]._doc,
      ...updatedData,
    };
    await seller.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: seller.shopAddresses,
    });
  } catch (error) {
    console.error("Error updating shop address:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//  Delete shop address by index
export const deleteShopAddress = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const index = parseInt(req.params.index);

    const seller = await Seller.findById(sellerId);
    if (!seller)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });

    if (index < 0 || index >= seller.shopAddresses.length) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid address index" });
    }

    seller.shopAddresses.splice(index, 1);
    await seller.save();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      data: seller.shopAddresses,
    });
  } catch (error) {
    console.error("Error deleting shop address:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// helpers/validateAddress.js (recommended separate file)
export const validateAddress = (address = {}) => {
  const errors = {};
  const get = (v) => (typeof v === "string" ? v.trim() : "");

  const addressLine1 = get(address.addressLine1);
  const addressLine2 = get(address.addressLine2); // optional
  const city = get(address.city);
  const state = get(address.state);
  const country = get(address.country || "India"); // you can default or enforce
  const pincode = get(address.pincode);

  if (!addressLine1) errors.addressLine1 = "Address Line 1 is required";
  if (!city) errors.city = "City is required";
  if (!state) errors.state = "State is required";
  if (!country) errors.country = "Country is required";

  // If you want pincode mandatory:
  if (!pincode) {
    errors.pincode = "Pincode is required";
  } else if (!/^\d{6}$/.test(pincode)) {
    errors.pincode = "Pincode must be 6 digits";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      addressLine1,
      addressLine2, // optional -> keep empty string if not provided
      city,
      state,
      country,
      pincode,
      isDefault: !!address.isDefault,
      type: address.type || "store",
    },
  };
};
