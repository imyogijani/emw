import Cart from "../models/cartModal.js";

export const addToCart = async (req, res) => {
  try {
    const { userId, product } = req.body;
    const {
      productId,
      variantId,
      quantity,
      title,
      price,
      finalPrice,
      image,
      discount,
      color,
      size,
    } = product;

    // const discountAmount = (price * discount) / 100;
    // const finalPrice = price - discountAmount;
    // const finalPriceToStore = finalPrice;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({
        userId,
        items: [
          {
            productId,
            variantId,
            quantity,
            title,
            price,
            finalPrice,
            image,
            discount,
            color,
            size,
          },
        ],
      });
    } else {
      const existingItem = cart.items.find(
        (item) =>
          item.productId.toString() === productId &&
          (item.variantId?.toString() || null) === (variantId || null)
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          productId,
          variantId,
          quantity,
          title,
          price,
          finalPrice,
          image,
          discount,
          color,
          size,
        });
      }
    }

    await cart.save();
    res
      .status(200)
      .json({ success: true, message: "Item added to cart", cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Cart update failed", error });
  }
};

// Get cart by userId and calculate total
export const getUserCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId })
      .populate("items.productId")
      .populate("items.variantId");

    if (cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        cart: [],
        totalPrice: 0,
      });
    }

    if (!cart || cart.items.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found or empty" });
    }

    // Total price calculation
    const totalPrice = cart.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    res.status(200).json({
      success: true,
      cart,
      totalPrice,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
};

// controllers/cartController.js

export const removeFromCart = async (req, res) => {
  try {
    const { userId, productId, variantId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    // Properly filter out the specific productId and variantId
    cart.items = cart.items.filter((item) => {
      const isProductMatch = item.productId.toString() === productId;
      const isVariantMatch =
        (item.variantId?.toString() || null) === (variantId || null);

      // Keep item if it's NOT the one we want to remove
      return !(isProductMatch && isVariantMatch);
    });

    await cart.save();

    res.status(200).json({ success: true, message: "Item removed", cart });
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ success: false, message: "Failed to remove item" });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const { userId, productId, variantId, quantity } = req.body;

    // console.log("Received userId:", userId);
    // console.log("Received productId:", productId);
    console.log("Received variantId:", variantId);

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    const inputVariantId = variantId?.toString() || null;

    const item = cart.items.find((item) => {
      const itemProductId = item.productId.toString();
      const itemVariantId = item.variantId?.toString() || null;

      return itemProductId === productId && itemVariantId === inputVariantId;
    });

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    item.quantity = quantity;

    await cart.save();
    res.status(200).json({ success: true, message: "Quantity updated", cart });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update quantity", error });
  }
};

export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ success: true, message: "Cart cleared", cart });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
};
