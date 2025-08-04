import Cart from "../models/cartModal.js";
import Variant from "../models/variantsModel.js";
import Product from "../models/productModel.js";

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
    let availableStock = 0;

    // Step 1: Check stock from Variant or Product
    if (variantId) {
      const variant = await Variant.findById(variantId);
      if (!variant) {
        return res
          .status(404)
          .json({ success: false, message: "Variant not found" });
      }
      availableStock = variant.stock;
    } else {
      const productData = await Product.findById(productId);
      if (!productData) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      availableStock = productData.stock;
    }
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      if (availableStock < quantity) {
        return res
          .status(400)
          .json({ success: false, message: "Not enough stock available" });
      }
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
        const totalQuantity = existingItem.quantity + quantity;

        if (availableStock < totalQuantity) {
          return res
            .status(400)
            .json({ success: false, message: "Stock limit exceeded" });
        }

        existingItem.quantity = totalQuantity;
      } else {
        if (availableStock < quantity) {
          return res
            .status(400)
            .json({ success: false, message: "Not enough stock available" });
        }
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
      .populate({
        path: "items.productId",
        select:
          "_id name description price discount finalPrice category seller activeDeal stock",
      })
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
    const incomingVariantId = variantId || null;

    cart.items = cart.items.filter((item) => {
      const isProductMatch = item.productId.toString() === productId;

      // Normalize DB value and request value to string or null
      const dbVariantId = item.variantId ? item.variantId.toString() : null;

      const isVariantMatch = dbVariantId === incomingVariantId;

      // Remove if both product and variant match
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
    let availableStock = 0;

    if (variantId) {
      const variant = await Variant.findById(variantId);
      if (!variant) {
        return res
          .status(404)
          .json({ success: false, message: "Variant not found" });
      }
      availableStock = variant.stock;
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      availableStock = product.stock;
    }

    if (quantity > availableStock) {
      return res
        .status(400)
        .json({ success: false, message: "Stock not available" });
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
