import React, { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    // Normalize item ID (handle both _id and id)
    const itemId = item._id || item.id || Date.now().toString();
    const normalizedItem = {
      ...item,
      id: itemId,
      _id: itemId,
      addedAt: Date.now(),
      quantity: item.quantity || 1,
    };

    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(
      (cartItem) => (cartItem.id || cartItem._id) === itemId,
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      setCartItems((prev) =>
        prev.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantity: (cartItem.quantity || 1) + 1 }
            : cartItem,
        ),
      );
    } else {
      // Add new item to cart
      setCartItems((prev) => [...prev, normalizedItem]);
    }
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) =>
      prev.filter((item) => (item.id || item._id) !== itemId),
    );
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        (item.id || item._id) === itemId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => setCartItems([]);

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(
        item.price?.toString().replace(/[^0-9.]/g, "") || 0,
      );
      return total + price * (item.quantity || 1);
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
