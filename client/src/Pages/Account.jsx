import React, { useState } from 'react';
import './Account.css';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Package, 
  Heart, 
  Settings, 
  Shield, 
  Bell,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  ShoppingBag,
  Star,
  Calendar,
  Truck
} from 'lucide-react';

const Account = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, City, State 12345',
    joinDate: 'January 2023'
  });

  const [orders] = useState([
    {
      id: 'ORD-001',
      date: '2024-01-15',
      status: 'Delivered',
      total: '$299.99',
      items: 3,
      image: '/api/placeholder/60/60'
    },
    {
      id: 'ORD-002',
      date: '2024-01-10',
      status: 'In Transit',
      total: '$149.50',
      items: 2,
      image: '/api/placeholder/60/60'
    },
    {
      id: 'ORD-003',
      date: '2024-01-05',
      status: 'Processing',
      total: '$89.99',
      items: 1,
      image: '/api/placeholder/60/60'
    }
  ]);

  const [wishlist] = useState([
    {
      id: 1,
      name: 'Wireless Headphones',
      price: '$199.99',
      image: '/api/placeholder/100/100',
      rating: 4.5,
      inStock: true
    },
    {
      id: 2,
      name: 'Smart Watch',
      price: '$299.99',
      image: '/api/placeholder/100/100',
      rating: 4.8,
      inStock: false
    },
    {
      id: 3,
      name: 'Laptop Stand',
      price: '$49.99',
      image: '/api/placeholder/100/100',
      rating: 4.2,
      inStock: true
    }
  ]);

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data if needed
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return '#059669';
      case 'in transit': return '#d97706';
      case 'processing': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const renderProfile = () => (
    <div className="profile-section">
      <div className="profile-header">
        <div className="profile-avatar">
          <User size={60} />
        </div>
        <div className="profile-info">
          <h2>Welcome back, {userInfo.name}!</h2>
          <p>Member since {userInfo.joinDate}</p>
        </div>
        <button 
          className="edit-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? <X size={20} /> : <Edit3 size={20} />}
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="profile-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-group">
              <User className="input-icon" size={20} />
              <input 
                type="text" 
                value={userInfo.name}
                disabled={!isEditing}
                onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-group">
              <Mail className="input-icon" size={20} />
              <input 
                type="email" 
                value={userInfo.email}
                disabled={!isEditing}
                onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <div className="input-group">
              <Phone className="input-icon" size={20} />
              <input 
                type="tel" 
                value={userInfo.phone}
                disabled={!isEditing}
                onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Address</label>
            <div className="input-group">
              <MapPin className="input-icon" size={20} />
              <input 
                type="text" 
                value={userInfo.address}
                disabled={!isEditing}
                onChange={(e) => setUserInfo({...userInfo, address: e.target.value})}
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="form-actions">
            <button className="save-btn" onClick={handleSave}>
              <Save size={20} />
              Save Changes
            </button>
            <button className="cancel-btn" onClick={handleCancel}>
              <X size={20} />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="orders-section">
      <div className="section-header">
        <h2>Order History</h2>
        <p>Track and manage your orders</p>
      </div>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-image">
              <img src={order.image} alt="Order" />
            </div>
            <div className="order-details">
              <div className="order-header">
                <h3>Order #{order.id}</h3>
                <span 
                  className="order-status"
                  style={{ color: getStatusColor(order.status) }}
                >
                  {order.status}
                </span>
              </div>
              <div className="order-meta">
                <span><Calendar size={16} /> {order.date}</span>
                <span><ShoppingBag size={16} /> {order.items} items</span>
                <span className="order-total">{order.total}</span>
              </div>
            </div>
            <div className="order-actions">
              <button className="track-btn">
                <Truck size={16} />
                Track Order
              </button>
              <button className="reorder-btn">
                Reorder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWishlist = () => (
    <div className="wishlist-section">
      <div className="section-header">
        <h2>My Wishlist</h2>
        <p>Items you've saved for later</p>
      </div>

      <div className="wishlist-grid">
        {wishlist.map(item => (
          <div key={item.id} className="wishlist-card">
            <div className="wishlist-image">
              <img src={item.image} alt={item.name} />
              <button className="remove-wishlist">
                <X size={16} />
              </button>
            </div>
            <div className="wishlist-info">
              <h3>{item.name}</h3>
              <div className="wishlist-rating">
                <Star size={14} fill="#fbbf24" color="#fbbf24" />
                <span>{item.rating}</span>
              </div>
              <div className="wishlist-price">
                <span className="price">{item.price}</span>
                <span className={`stock ${item.inStock ? 'in-stock' : 'out-stock'}`}>
                  {item.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <button 
                className={`add-cart-btn ${!item.inStock ? 'disabled' : ''}`}
                disabled={!item.inStock}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>Account Settings</h2>
        <p>Manage your account preferences</p>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-header">
            <Shield className="settings-icon" size={24} />
            <h3>Security</h3>
          </div>
          <div className="settings-content">
            <div className="setting-item">
              <label>Change Password</label>
              <div className="password-input">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Enter new password"
                />
                <button 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="setting-item">
              <label>Two-Factor Authentication</label>
              <div className="toggle-switch">
                <input type="checkbox" id="2fa" />
                <label htmlFor="2fa" className="switch"></label>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-header">
            <Bell className="settings-icon" size={24} />
            <h3>Notifications</h3>
          </div>
          <div className="settings-content">
            <div className="setting-item">
              <label>Email Notifications</label>
              <div className="toggle-switch">
                <input type="checkbox" id="email-notif" defaultChecked />
                <label htmlFor="email-notif" className="switch"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>SMS Notifications</label>
              <div className="toggle-switch">
                <input type="checkbox" id="sms-notif" />
                <label htmlFor="sms-notif" className="switch"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Order Updates</label>
              <div className="toggle-switch">
                <input type="checkbox" id="order-updates" defaultChecked />
                <label htmlFor="order-updates" className="switch"></label>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-header">
            <CreditCard className="settings-icon" size={24} />
            <h3>Payment Methods</h3>
          </div>
          <div className="settings-content">
            <div className="payment-methods">
              <div className="payment-method">
                <div className="card-info">
                  <span className="card-type">Visa</span>
                  <span className="card-number">**** **** **** 1234</span>
                </div>
                <button className="remove-card">Remove</button>
              </div>
              <button className="add-payment-btn">
                + Add New Payment Method
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="account-container">
      <div className="account-hero">
        <div className="container">
          <h1>My Account</h1>
          <p>Manage your profile, orders, and preferences</p>
        </div>
      </div>

      <div className="container">
        <div className="account-layout">
          <div className="account-sidebar">
            <nav className="account-nav">
              {tabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <IconComponent size={20} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="account-content">
            {activeTab === 'profile' && renderProfile()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'wishlist' && renderWishlist()}
            {activeTab === 'settings' && renderSettings()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;