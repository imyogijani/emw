/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import JumpingLoader from '../../Components/JumpingLoader';
import './OnboardingManagement.css';

const OnboardingManagement = () => {
  const [onboardingData, setOnboardingData] = useState({
    users: [],
    sellers: [],
    stats: {
      totalUsers: 0,
      completedOnboarding: 0,
      pendingOnboarding: 0,
      totalSellers: 0,
      activeSellers: 0,
      pendingSellers: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOnboardingData();
  }, []);

  const fetchOnboardingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch users data
      const usersResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch sellers data
      const sellersResponse = await fetch('/api/admin/shops', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch onboarding stats
      const statsResponse = await fetch('/api/admin/onboarding/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (usersResponse.ok && sellersResponse.ok && statsResponse.ok) {
        const usersData = await usersResponse.json();
        const sellersData = await sellersResponse.json();
        const statsData = await statsResponse.json();
        
        if (usersData.success && sellersData.success && statsData.success) {
          setOnboardingData({
            users: usersData.users || [],
            sellers: sellersData.shops || [],
            stats: statsData.stats || {
              totalUsers: 0,
              completedOnboarding: 0,
              incompleteOnboarding: 0,
              completionRate: 0
            }
          });
        } else {
          toast.error('Failed to fetch onboarding data');
        }
      } else {
        toast.error('Failed to fetch onboarding data');
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
      toast.error('Error fetching onboarding data');
    } finally {
      setLoading(false);
    }
  };

  const handleSellerStatusUpdate = async (sellerId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/shops/${sellerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`Seller status updated to ${newStatus}`);
          fetchOnboardingData(); // Refresh data
        } else {
          toast.error(data.message || 'Failed to update seller status');
        }
      } else {
        toast.error('Failed to update seller status');
      }
    } catch (error) {
      console.error('Error updating seller status:', error);
      toast.error('Error updating seller status');
    }
  };

  const handleUserOnboardingReset = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isOnboardingComplete: false })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('User onboarding reset successfully');
          fetchOnboardingData(); // Refresh data
        } else {
          toast.error(data.message || 'Failed to reset user onboarding');
        }
      } else {
        toast.error('Failed to reset user onboarding');
      }
    } catch (error) {
      console.error('Error resetting user onboarding:', error);
      toast.error('Error resetting user onboarding');
    }
  };

  const filteredUsers = onboardingData.users.filter(user => {
    const matchesSearch = user.names?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'completed' && user.isOnboardingComplete) ||
                         (filterStatus === 'pending' && !user.isOnboardingComplete);
    return matchesSearch && matchesFilter;
  });

  const filteredSellers = onboardingData.sellers.filter(seller => {
    const matchesSearch = seller.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || seller.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="onboarding-management">
        <div className="loading-container">
          <JumpingLoader size="medium" />
          <p>Loading onboarding data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-management">
      <div className="admin-header">
        <h1>Onboarding Management</h1>
        <p className="admin-subtitle">Monitor and manage user and seller onboarding processes</p>
      </div>

      {/* Stats Overview */}
      <div className="cards-grid cards-grid-small">
        <div className="card-base card-small admin-card">
          <div className="card-content">
            <div className="card-icon">👥</div>
            <div className="card-info">
              <h3 className="card-title">Total Users</h3>
              <p className="card-value">{onboardingData.stats.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="card-base card-small admin-card">
          <div className="card-content">
            <div className="card-icon">✅</div>
            <div className="card-info">
              <h3 className="card-title">Completed Onboarding</h3>
              <p className="card-value">{onboardingData.stats.completedOnboarding}</p>
            </div>
          </div>
        </div>
        <div className="card-base card-small admin-card">
          <div className="card-content">
            <div className="card-icon">⏳</div>
            <div className="card-info">
              <h3 className="card-title">Pending Onboarding</h3>
              <p className="card-value">{onboardingData.stats.pendingOnboarding}</p>
            </div>
          </div>
        </div>
        <div className="card-base card-small admin-card">
          <div className="card-content">
            <div className="card-icon">🏪</div>
            <div className="card-info">
              <h3 className="card-title">Total Sellers</h3>
              <p className="card-value">{onboardingData.stats.totalSellers}</p>
            </div>
          </div>
        </div>
        <div className="card-base card-small admin-card">
          <div className="card-content">
            <div className="card-icon">🟢</div>
            <div className="card-info">
              <h3 className="card-title">Active Sellers</h3>
              <p className="card-value">{onboardingData.stats.activeSellers}</p>
            </div>
          </div>
        </div>
        <div className="card-base card-small admin-card">
          <div className="card-content">
            <div className="card-icon">🟡</div>
            <div className="card-info">
              <h3 className="card-title">Pending Sellers</h3>
              <p className="card-value">{onboardingData.stats.pendingSellers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`btn btn-small ${selectedTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedTab('overview')}
        >
          <span className="text">Overview</span>
        </button>
        <button 
          className={`btn btn-small ${selectedTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedTab('users')}
        >
          <span className="text">Users ({onboardingData.users.length})</span>
        </button>
        <button 
          className={`btn btn-small ${selectedTab === 'sellers' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedTab('sellers')}
        >
          <span className="text">Sellers ({onboardingData.sellers.length})</span>
        </button>
      </div>

      {/* Search and Filter */}
      {(selectedTab === 'users' || selectedTab === 'sellers') && (
        <div className="search-filter-container">
          <div className="search-box">
            <input
              type="text"
              placeholder={`Search ${selectedTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {selectedTab === 'users' ? (
                <>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </>
              ) : (
                <>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </>
              )}
            </select>
          </div>
        </div>
      )}

      {/* Content based on selected tab */}
      {selectedTab === 'overview' && (
        <div className="overview-content">
          <div className="overview-charts">
            <div className="chart-container">
              <h3>Onboarding Progress</h3>
              <div className="progress-chart">
                <div className="progress-item">
                  <span>Users Completed</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill completed" 
                      style={{ 
                        width: `${onboardingData.stats.totalUsers > 0 ? 
                          (onboardingData.stats.completedOnboarding / onboardingData.stats.totalUsers) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span>{onboardingData.stats.completedOnboarding}/{onboardingData.stats.totalUsers}</span>
                </div>
                <div className="progress-item">
                  <span>Sellers Active</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill active" 
                      style={{ 
                        width: `${onboardingData.stats.totalSellers > 0 ? 
                          (onboardingData.stats.activeSellers / onboardingData.stats.totalSellers) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span>{onboardingData.stats.activeSellers}/{onboardingData.stats.totalSellers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'users' && (
        <div className="users-content">
          <div className="users-grid">
            {filteredUsers.map(user => (
              <div key={user._id} className="user-card">
                <div className="user-card-header">
                  <div className="user-avatar">
                    <div className="avatar-circle">
                      {(user.names || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="user-basic-info">
                    <h3 className="user-name">{user.names || 'Unknown User'}</h3>
                    <p className="user-email">{user.email}</p>
                  </div>
                  <div className="user-status-badges">
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                    <span className={`status-badge ${user.isOnboardingComplete ? 'completed' : 'pending'}`}>
                      {user.isOnboardingComplete ? '✅ Completed' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
                
                <div className="user-card-body">
                  <div className="user-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">User ID</span>
                      <span className="detail-value">{user._id?.slice(-8) || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Joined Date</span>
                      <span className="detail-value">{new Date(user.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Last Updated</span>
                      <span className="detail-value">{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Account Status</span>
                      <span className={`detail-value status-indicator ${user.isActive !== false ? 'active' : 'inactive'}`}>
                        {user.isActive !== false ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  {user.profile && (
                    <div className="user-profile-section">
                      <h4 className="section-title">Profile Information</h4>
                      <div className="profile-details">
                        {user.profile.phone && (
                          <div className="profile-item">
                            <span className="profile-icon">📱</span>
                            <span className="profile-text">{user.profile.phone}</span>
                          </div>
                        )}
                        {user.profile.address && (
                          <div className="profile-item">
                            <span className="profile-icon">📍</span>
                            <span className="profile-text">{user.profile.address}</span>
                          </div>
                        )}
                        {user.profile.dateOfBirth && (
                          <div className="profile-item">
                            <span className="profile-icon">🎂</span>
                            <span className="profile-text">{new Date(user.profile.dateOfBirth).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="onboarding-progress-section">
                    <h4 className="section-title">Onboarding Progress</h4>
                    <div className="progress-container">
                      <div className="progress-bar-container">
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${user.isOnboardingComplete ? 'completed' : 'pending'}`}
                            style={{ width: user.isOnboardingComplete ? '100%' : '60%' }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {user.isOnboardingComplete ? '100% Complete' : '60% In Progress'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="user-card-footer">
                  <div className="card-actions">
                    {!user.isOnboardingComplete && (
                      <button 
                        className="btn btn-small btn-warning"
                        onClick={() => handleUserOnboardingReset(user._id)}
                        title="Reset Onboarding"
                      >
                        <span className="text">🔄 Reset Onboarding</span>
                      </button>
                    )}
                    <button 
                      className="btn btn-small btn-secondary"
                      title="View Details"
                    >
                      <span className="text">👁️ View Details</span>
                    </button>
                    {user.role === 'user' && (
                      <button 
                        className="btn btn-small btn-info"
                        title="Send Message"
                      >
                        <span className="text">💬 Message</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="no-data">
              <div className="no-data-icon">👥</div>
              <h3>No Users Found</h3>
              <p>No users found matching your search criteria. Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'sellers' && (
        <div className="sellers-content">
          <div className="table-container">
            <table className="onboarding-table">
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Owner Name</th>
                  <th>Status</th>
                  <th>Onboarding Step</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSellers.map(seller => (
                  <tr key={seller._id}>
                    <td>{seller.shopName || 'N/A'}</td>
                    <td>{seller.ownerName || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${seller.status}`}>
                        {seller.status}
                      </span>
                    </td>
                    <td>
                      <span className="step-badge">
                        Step {seller.onboardingStep || 1}
                      </span>
                    </td>
                    <td>{new Date(seller.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        {seller.status === 'pending' && (
                          <>
                            <button 
                              className="btn btn-small btn-success"
                              onClick={() => handleSellerStatusUpdate(seller._id, 'active')}
                              title="Approve Seller"
                            >
                              <span className="text">✅</span>
                            </button>
                            <button 
                              className="btn btn-small btn-danger"
                              onClick={() => handleSellerStatusUpdate(seller._id, 'inactive')}
                              title="Reject Seller"
                            >
                              <span className="text">❌</span>
                            </button>
                          </>
                        )}
                        {seller.status === 'active' && (
                          <button 
                            className="btn btn-small btn-warning"
                            onClick={() => handleSellerStatusUpdate(seller._id, 'inactive')}
                            title="Deactivate Seller"
                          >
                            <span className="text">🔒</span>
                          </button>
                        )}
                        {seller.status === 'inactive' && (
                          <button 
                            className="btn btn-small btn-success"
                            onClick={() => handleSellerStatusUpdate(seller._id, 'active')}
                            title="Activate Seller"
                          >
                            <span className="text">🔓</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSellers.length === 0 && (
              <div className="no-data">
                <p>No sellers found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingManagement;