import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast } from "react-toastify";
import "./CartModal.css";
import {
  getCartByUserAPI,
  updateCartItemAPI,
  clearCartAPI,
  removeCartItemAPI,
} from "../api/cartApi/cartApi";

import { trackEvent } from "../analytics/trackEvent";

export default function CartModal({ open, onClose }) {
  const navigate = useNavigate();
  // const {
  //   cartItems,
  //   removeFromCart,
  //   updateQuantity,
  //   getTotalPrice,
  //   clearCart,
  // } = useCart();
  // const [hoveredItem, setHoveredItem] = useState(null);

  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);
  const userId = user?._id;

  useEffect(() => {
    const fetchCart = async () => {
      if (!userId) return;
      try {
        const response = await getCartByUserAPI(userId);
        setCartData(response);
        // console.log("Cart Moadal", response);
        setLoading(false);

        trackEvent("view_cart_modal", {
          user_id: userId,
          item_count: response?.cart?.items?.length || 0,
          location: window.location.pathname,
        });
      } catch (err) {
        console.error("Failed to fetch cart:", err);
        toast.error("Failed to fetch cart");
      }
    };

    if (open) fetchCart();
  }, [open, userId]);

  const handleCheckout = () => {
    trackEvent("start_checkout", {
      user_id: userId,
      item_count: cart?.items?.length || 0,
      total_price: cart?.total || 0,
      location: window.location.pathname,
    });

    // Check if user is logged in and is a customer
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !user || user.role !== "client") {
      toast.warning("Please login as a customer to checkout.");
      onClose();
      navigate("/login", {
        state: { returnUrl: "/checkout", customerOnly: true },
      });
      return;
    }

    onClose();
    navigate("/checkout");
  };

  // const handleQuantityChange = (itemId, newQuantity) => {
  //   updateQuantity(itemId, parseInt(newQuantity));
  // };

  // const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);
  // const userId = user?._id;
  const handleQuantityChange = useCallback(
    async (productId, newQuantity) => {
      if (!userId || newQuantity < 1) return;

      try {
        await updateCartItemAPI(userId, productId, newQuantity);

        setCartData((prevCartData) => {
          const updatedItems = prevCartData.cart.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: newQuantity }
              : item
          );

          const newTotalPrice = updatedItems.reduce(
            (acc, item) => acc + item.quantity * item.price,
            0
          );

          return {
            ...prevCartData,
            cart: { ...prevCartData.cart, items: updatedItems },
            totalPrice: newTotalPrice,
          };
        });

        // const updatedProduct = cartData.cart.items.find(
        //   (item) => item.productId === productId
        // );
        // if (updatedProduct) {
        //   await trackEvent("cart_quantity_changed", {
        //     product_id: productId,
        //     new_quantity: newQuantity,
        //     price: updatedProduct.price,
        //     user_id: userId,
        //     location: window.location.pathname,
        //   });
        // }
      } catch (err) {
        console.error("Failed to update cart:", err);
        toast.error("Failed to update quantity");
      }
    },
    [userId] // dependency
  );

  const handleClearCart = useCallback(async () => {
    try {
      trackEvent("cart_clear_all_items", {
        user_id: userId,
        location: window.location.pathname,
      });

      await clearCartAPI(userId);
      toast.success("Cart cleared!");
      setCartData((prev) => ({
        ...prev,
        cart: { ...prev.cart, items: [] },
        totalPrice: 0,
      }));
    } catch (err) {
      console.error("Failed to clear cart:", err);
      toast.error("Failed to clear cart");
    }
  }, [userId]);

  const handleRemoveItem = useCallback(
    async (productId) => {
      try {
        trackEvent("cart_remove_item", {
          user_id: userId,
          product_id: productId,
          location: window.location.pathname,
        });

        await removeCartItemAPI(userId, productId);
        toast.success("Item removed from cart");

        setCartData((prevCartData) => {
          const updatedItems = prevCartData.cart.items.filter(
            (item) => item.productId !== productId
          );

          const newTotalPrice = updatedItems.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
          );

          return {
            ...prevCartData,
            cart: {
              ...prevCartData.cart,
              items: updatedItems,
            },
            totalPrice: newTotalPrice,
          };
        });
      } catch (error) {
        console.error("Failed to remove item:", error);
        toast.error("Failed to remove item");
      }
    },
    [userId]
  );
  const { cart, totalPrice } = cartData || {
    cart: { items: [] },
    totalPrice: 0,
  };
  const items = cart.items || [];

  const subtotal = useMemo(() => totalPrice || 0, [totalPrice]);
  const discount = useMemo(() => (subtotal > 500 ? 50 : 0), [subtotal]);
  const delivery = useMemo(() => (subtotal > 0 ? 25 : 0), [subtotal]);
  const total = useMemo(
    () => subtotal - discount + delivery,
    [subtotal, discount, delivery]
  );

  if (!open) return null;
  if (loading) return <div className="cart-modal-overlay">Loading...</div>;

  return (
    <div className="cart-modal-overlay">
      <div className="cart-modal">
        <button className="cart-modal-close" onClick={onClose}>
          &times;
        </button>
        <h2>My Basket</h2>
        {items.length === 0 ? (
          <div className="cart-modal-empty">Your cart is empty.</div>
        ) : (
          <>
            <ul className="cart-modal-list">
              {items.map((item) => {
                const itemId = item.productId;
                const itemPrice = parseFloat(
                  item.price?.toString().replace(/[^0-9.]/g, "") || 0
                );

                return (
                  <li key={itemId} className="cart-modal-item">
                    <div className="cart-item-info">
                      <span className="cart-item-title">{item.title}</span>
                    </div>

                    <div className="cart-item-controls">
                      <div className="cart-item-price-qty">
                        <span className="cart-item-price">
                          ₹{itemPrice.toFixed(2)}
                        </span>
                        <div className="cart-quantity-controls">
                          <button
                            className="qty-btn"
                            onClick={() =>
                              handleQuantityChange(itemId, item.quantity - 1)
                            }
                          >
                            -
                          </button>
                          <span className="cart-item-qty">{item.quantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() =>
                              handleQuantityChange(itemId, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="cart-modal-remove"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="cart-bill">
              <div className="cart-bill-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="cart-bill-row">
                  <span>Discount</span>
                  <span style={{ color: "#28a745" }}>
                    -₹{discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="cart-bill-row">
                <span>Delivery</span>
                <span>₹{delivery.toFixed(2)}</span>
              </div>
              <div className="cart-bill-row cart-bill-total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            <div className="cart-modal-actions">
              <button
                className="cart-modal-clear"
                onClick={handleClearCart}
                disabled={items.length === 0}
              >
                Clear Cart
              </button>
              <button
                className="cart-modal-checkout"
                onClick={handleCheckout}
                disabled={items.length === 0}
              >
                Checkout (₹{total.toFixed(2)})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
