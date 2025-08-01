import MenuItem from "../models/menuItemModel.js";

// Create a new menu item
export const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable, isPremium } =
      req.body;

    // Handle image upload
    let imagePath = null;
    if (req.files && req.files.image) {
      const image = req.files.image;
      const uploadPath = `./public/uploads/products/${Date.now()}-${
        image.name
      }`;

      await image.mv(uploadPath);
      imagePath = image.name;
    }

    const newMenuItem = new MenuItem({
      name,
      description,
      price: parseFloat(price),
      category,
      image: imagePath,
      isAvailable: isAvailable === "true" || isAvailable === true,
      isPremium: isPremium === "true" || isPremium === true,
    });

    const savedMenuItem = await newMenuItem.save();
    res.status(201).json({ success: true, data: savedMenuItem });
  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all menu items
export const getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: menuItems });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get menu item by ID
export const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    res.status(200).json({ success: true, data: menuItem });
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a menu item
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, isAvailable, isPremium } =
      req.body;

    // Handle image upload
    let imagePath = null;
    if (req.files && req.files.image) {
      const image = req.files.image;
      const uploadPath = `./public/uploads/products/${Date.now()}-${
        image.name
      }`;

      await image.mv(uploadPath);
      imagePath = image.name;
    }

    const updateData = {
      name,
      description,
      price: parseFloat(price),
      category,
      isAvailable: isAvailable === "true" || isAvailable === true,
      isPremium: isPremium === "true" || isPremium === true,
    };

    if (imagePath) {
      updateData.image = imagePath;
    }

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedMenuItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    res.status(200).json({ success: true, data: updatedMenuItem });
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMenuItem = await MenuItem.findByIdAndDelete(id);

    if (!deletedMenuItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get menu statistics
export const getMenuStats = async (req, res) => {
  try {
    const totalItems = await MenuItem.countDocuments();
    const availableItems = await MenuItem.countDocuments({ isAvailable: true });
    const premiumItems = await MenuItem.countDocuments({ isPremium: true });
    const totalValue = await MenuItem.aggregate([
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        availableItems,
        premiumItems,
        totalValue: totalValue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching menu stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
