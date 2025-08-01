import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import CartModal from "./CartModal";
import "./CartFloatingButton.css";

export default function CartFloatingButton() {
  const { cartItems, getTotalItems } = useCart();
  const [open, setOpen] = useState(false);
  const totalItems = getTotalItems();

  return (
    <>
      <div className="cart-float-wrapper">
        <button className="cart-float-btn" onClick={() => setOpen(true)}>
          <span className="cart-float-icon">🛒</span>
          {totalItems > 0 && (
            <span className="cart-float-count">{totalItems}</span>
          )}
          {/* <span className="cart-float-label">Cart</span> */}
        </button>
      </div>
      <CartModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
