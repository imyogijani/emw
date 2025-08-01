import Cart from "../models/cartModal.js";

export const addToCart = async (req, res) => {
  try {
    const { userId, product } = req.body;
    const { productId, quantity, price, title, image, discount } = product;

    // const discountAmount = (price * discount) / 100;
    // const finalPrice = price - discountAmount;
    // const finalPriceToStore = finalPrice;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Cart doesn't exist for this user - create new
      cart = new Cart({
        userId,
        items: [
          {
            productId,
            quantity,
            price,
            title,
            image,
            discount,
          },
        ],
      });
    } else {
      // Cart exists, check if product already exists
      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId
      );

      if (existingItem) {
        // Update quantity if product already in cart
        existingItem.quantity += quantity;
      } else {
        // Add new product to cart
        cart.items.push({
          productId,
          quantity,
          price,
          title,
          image,
          discount,
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

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    // Calculate total price of all items
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
    const { userId, productId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();
    res.status(200).json({ success: true, message: "Item removed", cart });
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ success: false, message: "Failed to remove item" });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );

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
      .json({ success: false, message: "Failed to update quantity" });
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
