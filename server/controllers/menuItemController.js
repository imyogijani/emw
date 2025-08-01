// controllers/admin/menuItemController.js

import MenuItem from "../models/menuItemModel.js";
import Product from "../models/productModel.js";
// controllers/adminController.js
// import Product from "../models/productModel.js";
import Seller from "../models/sellerModel.js";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";

//Admind Side
export const createMenuItem = async (req, res) => {
  try {
    const {
      title,
      filterType,
      filterValue,
      productLimit,
      customProducts,
      position,
    } = req.body;

    if (filterType !== "custom" && !filterValue) {
      return res.status(400).json({
        success: false,
        message: "filterValue is required unless filterType is 'custom'",
      });
    }

    if (
      filterType === "custom" &&
      (!customProducts || customProducts.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one product for custom type.",
      });
    }

    const menuItem = await MenuItem.create({
      title,
      filterType,
      filterValue: filterType !== "custom" ? filterValue : undefined,
      customProducts: filterType === "custom" ? customProducts : [],
      productLimit,
      position,
    });

    res.status(201).json({ success: true, menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// User Side show data:
export const getHomeMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ status: "active" }).sort({
      position: 1,
    });

    const menuWithProducts = await Promise.all(
      menuItems.map(async (item) => {
        let products = [];

        if (item.filterType === "custom") {
          products = await Product.find({
            _id: { $in: item.customProducts },
          }).limit(item.productLimit);
        } else {
          const query = {};
          query[item.filterType.toLowerCase()] = item.filterValue;

          products = await Product.find(query).limit(item.productLimit);
        }

        return {
          _id: item._id,
          title: item.title,
          products,
        };
      })
    );

    res.status(200).json({ success: true, data: menuWithProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Get All Menu Items
export const getAllMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ position: 1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Get Menu Item by ID
export const getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Update Menu Item
export const updateMenuItem = async (req, res) => {
  try {
    const {
      title,
      filterType,
      filterValue,
      productLimit,
      customProducts,
      position,
      status,
    } = req.body;

    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    menuItem.title = title || menuItem.title;
    menuItem.filterType = filterType || menuItem.filterType;
    menuItem.filterValue = filterType !== "custom" ? filterValue : undefined;
    menuItem.customProducts = filterType === "custom" ? customProducts : [];
    menuItem.productLimit = productLimit || menuItem.productLimit;
    menuItem.position = position ?? menuItem.position;
    menuItem.status = status || menuItem.status;

    await menuItem.save();

    res.status(200).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Delete Menu Item
export const deleteMenuItem = async (req, res) => {
  try {
    const deleted = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Toggle Active/Inactive
export const toggleStatus = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    item.status = item.status === "active" ? "inactive" : "active";
    await item.save();
    res
      .status(200)
      .json({ success: true, message: `Status changed to ${item.status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export const getAllProductMenusWithFilters = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      sellerId,
      subscription, // Gold, Premium, Basic
      sort,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Basic filters
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (sellerId) query.seller = sellerId;

    //  Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    //  Filter by Subscription (via User -> Seller -> Product)
    if (subscription) {
      // Step 1: Get all users having the specified subscription type
      const users = await User.find()
        .populate("subscription")
        .select("_id subscription");

      const filteredUserIds = users
        .filter(
          (u) =>
            u.subscription &&
            u.subscription.planName.toLowerCase() === subscription.toLowerCase()
        )
        .map((u) => u._id.toString());

      // Step 2: Get Sellers whose `user` is in that filtered list
      const sellers = await Seller.find({
        user: { $in: filteredUserIds },
      }).select("_id");

      const sellerIds = sellers.map((s) => s._id.toString());

      // Step 3: Add seller filter to Product query
      if (sellerIds.length > 0) {
        query.seller = { $in: sellerIds };
      } else {
        // If no sellers match the subscription, return empty
        return res.status(200).json({
          success: true,
          total: 0,
          page: Number(page),
          totalPages: 0,
          data: [],
        });
      }
    }

    //  Sorting
    let sortOption = {};
    if (sort === "price_low_to_high") sortOption.price = 1;
    else if (sort === "price_high_to_low") sortOption.price = -1;
    else sortOption.createdAt = -1;

    const skip = (page - 1) * limit;

    //  Fetch Products
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: "category",
        select: "name", //  only category name
      })
      .populate({
        path: "subcategory",
        select: "name", //  only subcategory name
      })
      .populate({
        path: "seller",
        select: "shopName user", //  shop name and user
        populate: {
          path: "user",
          select: "names subscription", //  seller's user name & subscription
          populate: {
            path: "subscription",
            select: "type", // optional, if you want subscription type
          },
        },
      });

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    console.error("❌ Error in product filter API:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
