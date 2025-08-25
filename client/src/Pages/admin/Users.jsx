/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaUserCog,
  FaStore,
  FaUser,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import JumpingLoader from "../../Components/JumpingLoader";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import "./Users.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [modal, setModal] = useState(null); // { type: 'edit'|'delete', user: {...} }
  const [roleToSet, setRoleToSet] = useState("");
  const [formData, setFormData] = useState({
    role: "",
    status: "",
  });

  // View state - show all users by default
  const [showAllUsers, setShowAllUsers] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // New: Shopowner details modal state
  const [shopownerDetails, setShopownerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchUsers(1, true); // Load first page on mount
  }, [filterRole, searchTerm]);

  const fetchUsers = async (pageToFetch = 1, reset = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = {
        page: pageToFetch,
        limit: 20,
      };
      if (filterRole !== "all") params.role = filterRole;
      if (searchTerm) params.search = searchTerm;
      const response = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      if (reset) {
        setUsers(response.data.users || []);
      } else {
        setUsers((prev) => [...prev, ...(response.data.users || [])]);
      }
      setTotalUsersCount(response.data.totalUsers || 0);
      setPage(pageToFetch);
      setHasMore(pageToFetch < (response.data.totalPages || 1));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchUsers(page + 1);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User deleted successfully");
      fetchUsers(1, true);
    } catch (error) {
      toast.error("Error deleting user");
    }
    setModal(null);
  };

  const handleUpdateUser = async (userId, newRole, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/admin/users/${userId}`,
        { role: newRole, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User updated successfully");
      fetchUsers(1, true);
    } catch (error) {
      toast.error("Error updating user");
    }
    setModal(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.names || user.shopownerName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      filterRole === "all" ||
      user.role.toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  // Display all filtered users
  const currentUsers = filteredUsers;

  const handleToggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <FaUserCog className="role-icon admin" />;
      case "shopowner":
        return <FaStore className="role-icon seller" />;
      default:
        return <FaUser className="role-icon user" />;
    }
  };

  const getRoleDisplayText = (user) => {
    if (!user.role || user.role === 'unknown' || user.role === '') {
      return user.isOnboardingComplete === false ? 'Not selected yet' : 'Pending';
    }
    return user.role;
  };

  const getUserStats = () => {
    const stats = users.reduce((acc, user) => {
      acc[user.role.toLowerCase()] = (acc[user.role.toLowerCase()] || 0) + 1;
      return acc;
    }, {});

    return {
      total: users.length,
      admin: stats.admin || 0,
      shopowner: stats.shopowner || 0,
      client: stats.client || 0,
    };
  };

  const stats = getUserStats();

  // New: Fetch shopowner details
  const fetchShopownerDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/admin/shopowner/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShopownerDetails(res.data.user);
    } catch (err) {
      toast.error("Failed to fetch shopowner details");
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="loading-container">
        <JumpingLoader size="medium" />
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="admin-header">
        <h1>User Management</h1>
        <p className="admin-subtitle">Manage all users and their roles</p>
      </div>

      {/* User Metrics */}
      <div className="user-metrics">
        <div className="metric-card total">
          <div className="metric-icon">
            <FaUsers />
          </div>
          <div className="metric-info">
            <h3>{totalUsersCount}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="metric-card admin">
          <div className="metric-icon">
            <FaUserCog />
          </div>
          <div className="metric-info">
            <h3>{stats.admin}</h3>
            <p>Admin Users</p>
          </div>
        </div>
        <div className="metric-card sellers">
          <div className="metric-icon">
            <FaStore />
          </div>
          <div className="metric-info">
            <h3>{stats.shopowner}</h3>
            <p>Sellers</p>
          </div>
        </div>
        <div className="metric-card customers">
          <div className="metric-icon">
            <FaUser />
          </div>
          <div className="metric-info">
            <h3>{stats.client}</h3>
            <p>Customers</p>
          </div>
        </div>
      </div>

      <div className="users-controls">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="role-filter"
        >
          <option value="all">All Users</option>
          <option value="admin">Admins</option>
          <option value="shopowner">Shop Owners</option>
          <option value="client">Customers</option>
        </select>

        <button
          className="btn btn-medium btn-secondary"
          onClick={handleToggleViewMode}
          title={viewMode === 'grid' ? "Switch to list view" : "Switch to grid view"}
        >
          <span className="sparkle">{viewMode === 'grid' ? <FaEyeSlash /> : <FaEye />}</span>
          <span className="text">{viewMode === 'grid' ? "List View" : "Grid View"}</span>
        </button>
      </div>

      <div className="users-table-container">
        {totalUsersCount > 0 && (
          <div className="users-summary">
            <p>
              Showing {currentUsers.length} of {totalUsersCount} users
              {filterRole !== "all" && ` (filtered by ${filterRole})`}
            </p>
          </div>
        )}
        
        <div className={`users-display ${viewMode === 'list' ? 'users-list' : 'users-grid'}`}>
          {currentUsers.length === 0 ? (
            <p className="no-users">No users found</p>
          ) : (
            currentUsers.map((user) => (
              <div key={user._id} className="user-card">
                <div className="user-card-header">
                  {getRoleIcon(user.role)}
                  <h3 className="user-name">
                    {user.role === "shopowner"
                      ? user.shopownerName
                      : user.names}
                  </h3>
                </div>
                <div className="user-card-body">
                  <p className="user-email">{user.email}</p>
                  <p>
                    Role:{" "}
                    <span className={`role-badge ${user.role || 'pending'}`}>
                      {getRoleDisplayText(user)}
                    </span>
                  </p>
                  <p>
                    Status:{" "}
                    <span className={`status-badge ${user.status}`}>
                      {user.status}
                    </span>
                  </p>
                  <p>
                    Registration:{" "}
                    <span className={`status-badge ${user.registrationStatus || 'pending'}`}>
                      {user.registrationStatus === 'verified' ? 'Verified' : 'Pending'}
                    </span>
                  </p>
                  {user.role === "shopowner" && (
                    <p>
                      Onboarding:{" "}
                      <span className={`status-badge ${user.isOnboardingComplete ? 'completed' : 'pending'}`}>
                        {user.isOnboardingComplete ? 'Completed' : 'Pending'}
                      </span>
                    </p>
                  )}
                  {user.role === "shopowner" && user.subscription && (
                    <p>
                      Subscription:{" "}
                      <span className="subscription-name">
                        {user.subscription.planName || user.subscription.name}
                      </span>
                    </p>
                  )}
                </div>
                <div className="user-card-actions">
                  <button
                    className="btn btn-small btn-primary"
                    onClick={() => {
                      setModal({
                        type: "edit",
                        user: user,
                      });
                      setFormData({
                        role: user.role,
                        status: user.status,
                      });
                    }}
                  >
                    <span className="sparkle"><FaUserCog /></span>
                    <span className="text">Edit</span>
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() =>
                      setModal({
                        type: "delete",
                        user: user,
                      })
                    }
                  >
                    <span className="sparkle"><FaTrash /></span>
                    <span className="text">Delete</span>
                  </button>
                  {user.role === "shopowner" && (
                    <button
                      className="btn btn-small btn-secondary"
                      onClick={() => fetchShopownerDetails(user._id)}
                    >
                      <span className="sparkle"><FaStore /></span>
                      <span className="text">Details</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {hasMore && (
          <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
            <button className="btn btn-primary" onClick={handleLoadMore} disabled={loading}>
              {loading ? <JumpingLoader size="small" /> : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Modal Popups */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            {modal.type === "edit" ? (
              <>
                <h3>Edit User Role</h3>
                <p>
                  Change role for{" "}
                  <b>{modal.user.name || modal.user.shopownerName}</b>
                </p>
                <div className="form-group">
                  <label htmlFor="role">Role:</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="shopowner">Shop Owner</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status:</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button
                    className="btn btn-medium btn-success"
                    onClick={() =>
                      handleUpdateUser(
                        modal.user._id,
                        formData.role,
                        formData.status
                      )
                    }
                  >
                    <span className="text">Save</span>
                  </button>
                  <button
                    className="btn btn-medium btn-secondary"
                    onClick={() => setModal(null)}
                  >
                    <span className="text">Cancel</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Delete User</h3>
                <p>
                  Are you sure you want to delete{" "}
                  <b>{modal.user.name || modal.user.shopownerName}</b>?
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button
                    className="btn btn-medium btn-danger"
                    onClick={() => handleDeleteUser(modal.user._id)}
                  >
                    <span className="text">Yes, Delete</span>
                  </button>
                  <button
                    className="btn btn-medium btn-secondary"
                    onClick={() => setModal(null)}
                  >
                    <span className="text">Cancel</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Shopowner Details Modal */}
      {shopownerDetails && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Shopowner Details</h3>
            {detailsLoading ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <JumpingLoader size="small" /> Loading...
              </div>
            ) : (
              <>
                {shopownerDetails.shopImage && (
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <img
                      src={
                        shopownerDetails.shopImage.startsWith("/uploads")
                          ? (import.meta.env.VITE_API_BASE_URL_PROD || "") +
                            shopownerDetails.shopImage
                          : shopownerDetails.shopImage
                      }
                      alt="Shop Logo"
                      style={{
                        width: 90,
                        height: 90,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2.5px solid #e3e8ee",
                        marginBottom: 8,
                      }}
                    />
                  </div>
                )}
                <div className="details-row">
                  <span className="details-label">Name:</span>
                  <span className="details-value">
                    {shopownerDetails.shopownerName || shopownerDetails.names}
                  </span>
                </div>
                <div className="details-row">
                  <span className="details-label">Email:</span>
                  <span className="details-value">
                    {shopownerDetails.email}
                  </span>
                </div>
                <div className="details-row">
                  <span className="details-label">Phone:</span>
                  <span className="details-value">
                    {shopownerDetails.phone}
                  </span>
                </div>
                <div className="details-row">
                  <span className="details-label">Shop Name:</span>
                  <span className="details-value">
                    {shopownerDetails.shopName}
                  </span>
                </div>
                <div className="details-row">
                  <span className="details-label">Status:</span>
                  <span className="details-value">
                    {shopownerDetails.status}
                  </span>
                </div>
                <div className="details-row">
                  <span className="details-label">Subscription:</span>
                  <span className="details-value">
                    {shopownerDetails.subscription?.name || "None"}
                  </span>
                </div>
                <div className="details-row">
                  <span className="details-label">Created:</span>
                  <span className="details-value">
                    {shopownerDetails.createdAt
                      ? new Date(shopownerDetails.createdAt).toLocaleString()
                      : "-"}
                  </span>
                </div>
                {/* Add more fields as needed */}
              </>
            )}
            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button
                className="btn btn-medium btn-secondary"
                onClick={() => setShopownerDetails(null)}
              >
                <span className="text">Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
