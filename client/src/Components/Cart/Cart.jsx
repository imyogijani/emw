import React, { useState, useEffect } from "react";
import axios from "../../utils/axios";
import { showErrorToast } from "../../utils/muiAlertHandler.jsx";
import { SafeImage } from "../../utils/imageUtils.jsx";
import "./Cart.css";

const Cart = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/v1/orders/user-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Ensure orders is always an array
      setOrders(response.data?.orders || []);
    } catch (error) {
      showErrorToast("Error fetching orders", "Cart - Fetch Orders");
      console.log(error);
      // Set to empty array on error
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-container">
      <h2>Your Orders</h2>
      {loading ? (
        <p className="loading">Loading orders...</p>
      ) : (!orders || orders.length === 0) ? (
        <p className="no-orders">No orders found</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order?._id || Math.random()} className="order-card">
              <div className="order-header">
                <h3>Order #{order?._id?.slice(-6) || 'N/A'}</h3>
                <span className={`status ${(order?.status || 'pending').toLowerCase()}`}>
                  {order?.status || 'Pending'}
                </span>
              </div>
              <div className="order-items">
                {(order?.items || []).map((item, index) => (
                  <div key={index} className="order-item">
                    <SafeImage
                      src={item?.image}
                      alt={item?.name || 'Product'}
                      category={item?.category || 'default'}
                      size="60x60"
                    />
                    <div className="item-details">
                      <h4>{item?.name || 'Unknown Product'}</h4>
                      <p>Quantity: {item?.quantity || 0}</p>
                      <p>Price: ₹{(item?.price || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="order-footer">
                <p>Total: ₹{(order?.total || 0).toFixed(2)}</p>
                <p>
                  Order Date: {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cart;
