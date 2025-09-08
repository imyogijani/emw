import React from "react";
import { useCart } from "../../context/CartContext";
import { FaTimes, FaPlus, FaMinus, FaTrash, FaShoppingBag } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { SafeImage } from "../../utils/imageUtils.jsx";
import "./CartModal.css";

const CartModal = ({ isOpen, onClose }) => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotalItems, 
    getTotalPrice 
  } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  const handleViewCart = () => {
    onClose();
    navigate("/cart");
  };

  return (
    <>
      {/* Modal Overlay */}
      <div className="cart-modal-overlay" onClick={onClose}>
        <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="cart-modal-header">
            <h2>
              <FaShoppingBag className="cart-modal-icon" />
              Shopping Cart ({getTotalItems()})
            </h2>
            <button className="cart-modal-close" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* Modal Content */}
          <div className="cart-modal-content">
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <FaShoppingBag className="empty-cart-icon" />
                <h3>Your cart is empty</h3>
                <p>Add some products to get started!</p>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cartItems.map((item) => (
                    <div key={item.id || item._id} className="cart-modal-item">
                      <div className="cart-item-image">
                        <SafeImage
                          src={item.image || item.images?.[0]}
                          alt={item.name || item.title}
                          category={item.category || 'default'}
                          size="60x60"
                        />
                      </div>
                      
                      <div className="cart-item-details">
                        <h4>{item.name || item.title}</h4>
                        <p className="cart-item-price">
                          ₹{parseFloat(item.price?.toString().replace(/[^0-9.]/g, "") || 0).toFixed(2)}
                        </p>
                        {item.variant && (
                          <p className="cart-item-variant">Variant: {item.variant}</p>
                        )}
                      </div>

                      <div className="cart-item-controls">
                        <div className="quantity-controls">
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id || item._id, (item.quantity || 1) - 1)}
                          >
                            <FaMinus />
                          </button>
                          <span className="quantity">{item.quantity || 1}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id || item._id, (item.quantity || 1) + 1)}
                          >
                            <FaPlus />
                          </button>
                        </div>
                        
                        <button
                          className="remove-btn"
                          onClick={() => removeFromCart(item.id || item._id)}
                          title="Remove item"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cart Summary */}
                <div className="cart-modal-summary">
                  <div className="cart-summary-row">
                    <span>Subtotal:</span>
                    <span className="cart-total-price">₹{getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>Items:</span>
                    <span>{getTotalItems()}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Modal Footer */}
          {cartItems.length > 0 && (
            <div className="cart-modal-footer">
              <button className="btn-secondary" onClick={handleViewCart}>
                View Full Cart
              </button>
              <button className="btn-clear" onClick={clearCart}>
                Clear Cart
              </button>
              <button className="btn-primary" onClick={handleCheckout}>
                Checkout - ₹{getTotalPrice().toFixed(2)}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartModal;
