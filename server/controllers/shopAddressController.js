import Seller from "../models/sellerModel.js";
import User from "../models/userModel.js";

//  Add a new shop address
export const addShopAddress = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const { address, fromUserAddress, userAddressIndex } = req.body;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    let newAddress;

    if (fromUserAddress) {
      const user = await User.findById(seller.user);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (!user.address || !user.address[userAddressIndex]) {
        return res.status(400).json({ success: false, message: "Invalid user address index" });
      }

      newAddress = user.address[userAddressIndex];
    } else {
      // Check if this is the first shop address
      const isFirstAddress = seller.shopAddresses.length === 0;
      const errorMsg = validateAddress(address, isFirstAddress);
      if (errorMsg) {
        return res.status(400).json({ success: false, message: errorMsg });
      }
      newAddress = address;
    }

    seller.shopAddresses.push(newAddress);
    await seller.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: seller.shopAddresses
    });
  } catch (error) {
    console.error("Error adding shop address:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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

export const validateAddress = (address, isFirstAddress = false) => {
  // For first address: addressLine1, city, state, pincode are required
  // For subsequent addresses: only city, state, pincode are required
  const requiredFields = isFirstAddress
    ? ["addressLine1", "city", "state", "pincode"]
    : ["city", "state", "pincode"];

  for (const field of requiredFields) {
    if (!address[field] || address[field].trim() === "") {
      return `${field} is required`;
    }
  }
  return null;
};
