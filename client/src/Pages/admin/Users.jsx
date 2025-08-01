/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaUserCog,
  FaStore,
  FaUser,
  FaTrash,
  FaSpinner,
} from "react-icons/fa";
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

  // New: Shopowner details modal state
  const [shopownerDetails, setShopownerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      console.log("Fetching users with token:", token); // Debug log

      const response = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Users response:", response.data); // Debug log
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error); // Debug log
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User deleted successfully");
      fetchUsers();
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
      fetchUsers();
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

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
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
      </div>

      <div className="users-table-container">
        <div className="users-grid">
          {filteredUsers.length === 0 ? (
            <p className="no-users">No users found</p>
          ) : (
            filteredUsers.map((user) => (
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
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </p>
                  <p>
                    Status:{" "}
                    <span className={`status-badge ${user.status}`}>
                      {user.status}
                    </span>
                  </p>
                  {user.role === "shopowner" && user.subscription && (
                    <p>
                      Subscription:{" "}
                      <span className="subscription-name">
                        {user.subscription.name}
                      </span>
                    </p>
                  )}
                </div>
                <div className="user-card-actions">
                  <button
                    className="action-btn edit"
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
                    <FaUserCog /> Edit
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() =>
                      setModal({
                        type: "delete",
                        user: user,
                      })
                    }
                  >
                    <FaTrash /> Delete
                  </button>
                  {user.role === "shopowner" && (
                    <button
                      className="action-btn view-details"
                      onClick={() => fetchShopownerDetails(user._id)}
                    >
                      <FaStore /> Details
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
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
                    value={roleToSet}
                    onChange={(e) => setRoleToSet(e.target.value)}
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
                    className="modal-btn confirm"
                    onClick={() => handleUpdateUser(modal.user._id, roleToSet, modal.user.status)}
                  >
                    Save
                  </button>
                  <button
                    className="modal-btn cancel"
                    onClick={() => setModal(null)}
                  >
                    Cancel
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
                    className="modal-btn confirm"
                    onClick={() => handleDeleteUser(modal.user._id)}
                  >
                    Yes, Delete
                  </button>
                  <button
                    className="modal-btn cancel"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
