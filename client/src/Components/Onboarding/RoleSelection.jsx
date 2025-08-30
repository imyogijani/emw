import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import './RoleSelection.css';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleSelection = async (role) => {
    if (!role) {
      toast.error('Please select a role to continue.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required. Please log in again.');
      navigate('/login');
      return;
    }

    setSelectedRole(role);
    setIsLoading(true);

    try {
      // Update user role in backend
      const response = await axios.patch('http://localhost:8080/api/auth/update-role', 
        { role },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Update user data in localStorage with complete response data
        const userData = response.data.user || JSON.parse(localStorage.getItem('user') || '{}');
        userData.role = role;
        // If sellerId is provided in response, update it
        if (response.data.sellerId) {
          userData.sellerId = response.data.sellerId;
        }
        localStorage.setItem('user', JSON.stringify(userData));

        toast.success('Role selected successfully!');
        
        // Redirect based on role
        if (role === 'shopowner') {
          navigate('/seller/onboarding');
        } else {
          navigate('/onboarding/customer');
        }
      } else {
        toast.error(response.data.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Role selection error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update role. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="role-selection-container">
      <div className="role-selection-card">
        <div className="role-selection-header">
          <h1>Welcome to eMall World!</h1>
          <p>Let's get you set up. Are you registering as a seller?</p>
        </div>

        <div className="role-options">
          <div 
            className={`role-option ${selectedRole === 'shopowner' ? 'selected' : ''}`}
            onClick={() => !isLoading && handleRoleSelection('shopowner')}
          >
            <div className="role-icon seller-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Yes, I'm a Seller</h3>
            <p>I want to sell products and manage my online store</p>
            <ul>
              <li>Create and manage product listings</li>
              <li>Track orders and inventory</li>
              <li>Access seller dashboard and analytics</li>
              <li>Manage customer communications</li>
            </ul>
          </div>

          <div 
            className={`role-option ${selectedRole === 'client' ? 'selected' : ''}`}
            onClick={() => !isLoading && handleRoleSelection('client')}
          >
            <div className="role-icon customer-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>No, I'm a Customer</h3>
            <p>I want to browse and purchase products</p>
            <ul>
              <li>Browse and search products</li>
              <li>Add items to cart and checkout</li>
              <li>Track orders and delivery</li>
              <li>Leave reviews and ratings</li>
            </ul>
          </div>
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Setting up your account...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelection;