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
  const [onboardingConfig, setOnboardingConfig] = useState({
    isEnabled: true,
    allowSkipping: false,
    requireDocumentVerification: false,
    steps: [],
    documentVerification: {
      isEnabled: true,
      isRequired: false,
      allowSkip: true,
      documentTypes: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingStep, setEditingStep] = useState(null);
  const [editingDocType, setEditingDocType] = useState(null);
  const [showStepModal, setShowStepModal] = useState(false);
  const [showDocTypeModal, setShowDocTypeModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPagination, setAuditPagination] = useState({ currentPage: 1, totalPages: 1, totalLogs: 0 });

  useEffect(() => {
    fetchOnboardingData();
    fetchOnboardingConfig();
  }, []);

  useEffect(() => {
    if (selectedTab === 'audit') {
      fetchAuditLogs();
    }
  }, [selectedTab]);

  const fetchOnboardingConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/onboarding/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOnboardingConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Error fetching onboarding config:', error);
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    try {
      setAuditLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/onboarding/audit-logs?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAuditLogs(data.logs);
          setAuditPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

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

  const updateGlobalSettings = async (settings) => {
    try {
      setConfigLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/onboarding/config/global', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Global settings updated successfully');
          fetchOnboardingConfig();
        } else {
          toast.error(data.message || 'Failed to update settings');
        }
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating global settings:', error);
      toast.error('Error updating settings');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleStepUpdate = async (stepData) => {
    try {
      setConfigLoading(true);
      const token = localStorage.getItem('token');
      const url = editingStep ? 
        `/api/admin/onboarding/config/steps/${editingStep.stepId}` : 
        '/api/admin/onboarding/config/steps';
      const method = editingStep ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stepData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`Step ${editingStep ? 'updated' : 'created'} successfully`);
          setShowStepModal(false);
          setEditingStep(null);
          fetchOnboardingConfig();
        } else {
          toast.error(data.message || 'Failed to save step');
        }
      } else {
        toast.error('Failed to save step');
      }
    } catch (error) {
      console.error('Error saving step:', error);
      toast.error('Error saving step');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleStepDelete = async (stepId) => {
    if (!window.confirm('Are you sure you want to delete this step?')) return;

    try {
      setConfigLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/onboarding/config/steps/${stepId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Step deleted successfully');
          fetchOnboardingConfig();
        } else {
          toast.error(data.message || 'Failed to delete step');
        }
      } else {
        toast.error('Failed to delete step');
      }
    } catch (error) {
      console.error('Error deleting step:', error);
      toast.error('Error deleting step');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleDocTypeUpdate = async (docTypeData) => {
    try {
      setConfigLoading(true);
      const token = localStorage.getItem('token');
      const url = editingDocType ? 
        `/api/admin/onboarding/config/document-types/${editingDocType._id}` : 
        '/api/admin/onboarding/config/document-types';
      const method = editingDocType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(docTypeData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`Document type ${editingDocType ? 'updated' : 'created'} successfully`);
          setShowDocTypeModal(false);
          setEditingDocType(null);
          fetchOnboardingConfig();
        } else {
          toast.error(data.message || 'Failed to save document type');
        }
      } else {
        toast.error('Failed to save document type');
      }
    } catch (error) {
      console.error('Error saving document type:', error);
      toast.error('Error saving document type');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleDocTypeSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingDocType?.name) {
      toast.error('Document name is required');
      return;
    }

    try {
      setConfigLoading(true);
      const token = localStorage.getItem('token');
      
      const docTypeData = {
        name: editingDocType.name,
        description: editingDocType.description || '',
        acceptedFormats: editingDocType.acceptedFormats || ['pdf', 'jpg', 'png'],
        maxSizeInMB: editingDocType.maxSizeInMB || 5,
        isRequired: editingDocType.isRequired || false,
        isActive: editingDocType.isActive !== false
      };

      const url = editingDocType._id 
        ? `/api/admin/onboarding/config/document-types/${editingDocType._id}`
        : '/api/admin/onboarding/config/document-types';
      
      const method = editingDocType._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(docTypeData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`Document type ${editingDocType._id ? 'updated' : 'created'} successfully`);
          setShowDocTypeModal(false);
          setEditingDocType(null);
          fetchOnboardingConfig();
        } else {
          toast.error(data.message || 'Failed to save document type');
        }
      } else {
        toast.error('Failed to save document type');
      }
    } catch (error) {
      console.error('Error saving document type:', error);
      toast.error('Error saving document type');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleDocTypeDelete = async (docTypeId) => {
    if (!window.confirm('Are you sure you want to delete this document type?')) return;

    try {
      setConfigLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/onboarding/config/document-types/${docTypeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Document type deleted successfully');
          fetchOnboardingConfig();
        } else {
          toast.error(data.message || 'Failed to delete document type');
        }
      } else {
        toast.error('Failed to delete document type');
      }
    } catch (error) {
      console.error('Error deleting document type:', error);
      toast.error('Error deleting document type');
    } finally {
      setConfigLoading(false);
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
        <button 
          className={`btn btn-small ${selectedTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedTab('settings')}
        >
          <span className="text">⚙️ Settings</span>
        </button>
        <button 
          className={`btn btn-small ${selectedTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedTab('audit')}
        >
          <span className="text">📋 Audit Logs</span>
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

      {/* Settings Tab Content */}
      {selectedTab === 'settings' && (
        <div className="settings-content">
          {configLoading && (
            <div className="loading-overlay">
              <JumpingLoader size="small" />
              <p>Updating configuration...</p>
            </div>
          )}
          
          {/* Global Settings */}
          <div className="settings-section">
            <div className="section-header">
              <h3>🌐 Global Onboarding Settings</h3>
              <p>Configure the overall onboarding system behavior</p>
            </div>
            
            <div className="settings-grid">
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Enable Onboarding System</h4>
                  <p>Turn the entire onboarding process on or off</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={onboardingConfig.isEnabled}
                    onChange={(e) => updateGlobalSettings({ isEnabled: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Allow Step Skipping</h4>
                  <p>Allow users to skip optional onboarding steps</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={onboardingConfig.allowSkipping}
                    onChange={(e) => updateGlobalSettings({ allowSkipping: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Require Document Verification</h4>
                  <p>Make document verification mandatory for all sellers</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={onboardingConfig.requireDocumentVerification}
                    onChange={(e) => updateGlobalSettings({ requireDocumentVerification: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Onboarding Steps Management */}
          <div className="settings-section">
            <div className="section-header">
              <h3>📋 Onboarding Steps</h3>
              <p>Manage individual onboarding steps and their requirements</p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setEditingStep(null);
                  setShowStepModal(true);
                }}
              >
                <span className="text">➕ Add New Step</span>
              </button>
            </div>
            
            <div className="steps-list">
              {onboardingConfig.steps?.map((step, index) => (
                <div key={step.stepId} className="step-card">
                  <div className="step-header">
                    <div className="step-info">
                      <div className="step-title">
                        <span className="step-number">{step.order}</span>
                        <h4>{step.stepName}</h4>
                        <div className="step-badges">
                          <span className={`badge ${step.isRequired ? 'badge-required' : 'badge-optional'}`}>
                            {step.isRequired ? '🔴 Required' : '🟡 Optional'}
                          </span>
                          <span className={`badge ${step.isActive ? 'badge-active' : 'badge-inactive'}`}>
                            {step.isActive ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </div>
                      </div>
                      <p className="step-description">{step.description}</p>
                      {step.category && (
                        <span className="step-category">Category: {step.category}</span>
                      )}
                    </div>
                    <div className="step-actions">
                      <button 
                        className="btn btn-small btn-secondary"
                        onClick={() => {
                          setEditingStep(step);
                          setShowStepModal(true);
                        }}
                        title="Edit Step"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-small btn-danger"
                        onClick={() => handleStepDelete(step.stepId)}
                        title="Delete Step"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {step.dependencies?.length > 0 && (
                    <div className="step-dependencies">
                      <strong>Dependencies:</strong> {step.dependencies.join(', ')}
                    </div>
                  )}
                  
                  {step.estimatedTimeMinutes && (
                    <div className="step-time">
                      <strong>Estimated Time:</strong> {step.estimatedTimeMinutes} minutes
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Document Types Management */}
          <div className="settings-section">
            <div className="section-header">
              <h3>📄 Document Types</h3>
              <p>Configure document types for verification process</p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setEditingDocType(null);
                  setShowDocTypeModal(true);
                }}
              >
                <span className="text">➕ Add Document Type</span>
              </button>
            </div>
            
            <div className="document-types-list">
              {onboardingConfig.documentVerification?.documentTypes?.map((docType, index) => (
                <div key={docType._id || index} className="doc-type-card">
                  <div className="doc-type-header">
                    <div className="doc-type-info">
                      <h4>{docType.name}</h4>
                      <div className="doc-type-badges">
                        <span className={`badge ${docType.isRequired ? 'badge-required' : 'badge-optional'}`}>
                          {docType.isRequired ? '🔴 Required' : '🟡 Optional'}
                        </span>
                        <span className={`badge ${docType.isActive ? 'badge-active' : 'badge-inactive'}`}>
                          {docType.isActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="doc-type-actions">
                      <button 
                        className="btn btn-small btn-secondary"
                        onClick={() => {
                          setEditingDocType(docType);
                          setShowDocTypeModal(true);
                        }}
                        title="Edit Document Type"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-small btn-danger"
                        onClick={() => handleDocTypeDelete(docType._id)}
                        title="Delete Document Type"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="doc-type-details">
                    <div className="doc-type-formats">
                      <strong>Accepted Formats:</strong> {docType.acceptedFormats?.join(', ') || 'All formats'}
                    </div>
                    <div className="doc-type-size">
                      <strong>Max Size:</strong> {docType.maxSizeInMB || 5} MB
                    </div>
                    {docType.description && (
                      <div className="doc-type-description">
                        <strong>Description:</strong> {docType.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab Content */}
      {selectedTab === 'audit' && (
        <div className="audit-logs-section">
          <div className="section-header">
            <h3>📋 Configuration Audit Logs</h3>
            <p>Track all changes made to onboarding configuration</p>
          </div>
          
          {auditLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading audit logs...</p>
            </div>
          ) : (
            <div className="audit-logs-container">
              {auditLogs.length === 0 ? (
                <div className="empty-state">
                  <p>No audit logs found</p>
                </div>
              ) : (
                <>
                  <div className="audit-logs-list">
                    {auditLogs.map((log, index) => (
                      <div key={index} className="audit-log-card">
                        <div className="log-header">
                          <div className="log-info">
                            <span className="log-action">{log.action}</span>
                            <span className="log-timestamp">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="log-user">
                            By: {log.modifiedBy?.name || log.modifiedBy?.email || 'System'}
                          </div>
                        </div>
                        
                        {log.changes && (
                          <div className="log-changes">
                            <h5>Changes:</h5>
                            <div className="changes-list">
                              {Object.entries(log.changes).map(([field, change]) => (
                                <div key={field} className="change-item">
                                  <strong>{field}:</strong>
                                  <div className="change-values">
                                    <span className="old-value">From: {JSON.stringify(change.from)}</span>
                                    <span className="new-value">To: {JSON.stringify(change.to)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {log.details && (
                          <div className="log-details">
                            <p>{log.details}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {auditPagination.totalPages > 1 && (
                    <div className="pagination">
                      <button 
                        className="btn btn-small btn-secondary"
                        onClick={() => fetchAuditLogs(auditPagination.currentPage - 1)}
                        disabled={auditPagination.currentPage === 1}
                      >
                        Previous
                      </button>
                      <span className="pagination-info">
                        Page {auditPagination.currentPage} of {auditPagination.totalPages}
                      </span>
                      <button 
                        className="btn btn-small btn-secondary"
                        onClick={() => fetchAuditLogs(auditPagination.currentPage + 1)}
                        disabled={auditPagination.currentPage === auditPagination.totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Document Type Modal */}
      {showDocTypeModal && (
        <div className="modal-overlay" onClick={() => setShowDocTypeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDocType ? 'Edit Document Type' : 'Add Document Type'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDocTypeModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleDocTypeSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Document Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingDocType?.name || ''}
                  onChange={(e) => setEditingDocType(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Aadhaar Card, PAN Card"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={editingDocType?.description || ''}
                  onChange={(e) => setEditingDocType(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the document"
                  rows="3"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Accepted Formats</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingDocType?.acceptedFormats?.join(', ') || 'pdf, jpg, png'}
                    onChange={(e) => setEditingDocType(prev => ({ 
                      ...prev, 
                      acceptedFormats: e.target.value.split(',').map(f => f.trim()) 
                    }))}
                    placeholder="pdf, jpg, png"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Max Size (MB)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editingDocType?.maxSizeInMB || 5}
                    onChange={(e) => setEditingDocType(prev => ({ ...prev, maxSizeInMB: parseInt(e.target.value) }))}
                    min="1"
                    max="50"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={editingDocType?.isRequired || false}
                      onChange={(e) => setEditingDocType(prev => ({ ...prev, isRequired: e.target.checked }))}
                    />
                    <span className="toggle-slider"></span>
                    Required Document
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={editingDocType?.isActive !== false}
                      onChange={(e) => setEditingDocType(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <span className="toggle-slider"></span>
                    Active
                  </label>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowDocTypeModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={configLoading}
                >
                  {configLoading ? 'Saving...' : (editingDocType?._id ? 'Update' : 'Add')} Document Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingManagement;