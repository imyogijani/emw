/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "./UserProfile.css";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import { processImageUrl } from "../../utils/apiConfig";
import JumpingLoader from "../JumpingLoader";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaCamera,
} from "react-icons/fa";
import MaleUser from "../../images/MaleUser.png";

const UserProfile = ({ onClose }) => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    names: "",
    shopownerName: "",
    email: "",
    phone: "",
    mobile: "",
    address: "",
    avatar: "",
    role: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/auth/current-user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = response.data.user;
      setUser(userData);
      setFormData({
        names: userData.names || "",
        shopownerName: userData.shopownerName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        mobile: userData.mobile || "",
        address: userData.address || "",
        avatar: userData.avatar || "",
        role: userData.role || "",
      });
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error fetching user data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const updateData = {
        ...formData,
        names: formData.role === "shopowner" ? undefined : formData.names,
        shopownerName:
          formData.role === "shopowner" ? formData.shopownerName : undefined,
      };

      const response = await axios.patch(
        "/api/auth/update-profile",
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const updatedUser = response.data.user;
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
        toast.success("Profile updated successfully");

        setFormData((prev) => ({
          ...prev,
          names: updatedUser.names || prev.names,
          shopownerName: updatedUser.shopownerName || prev.shopownerName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          mobile: updatedUser.mobile,
          address: updatedUser.address,
          avatar: updatedUser.avatar,
        }));
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Error updating profile");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      try {
        setIsLoading(true);
        const formData = new FormData();
        formData.append("avatar", file);

        const previewUrl = URL.createObjectURL(file);
        setFormData((prev) => ({ ...prev, avatar: previewUrl }));

        const token = localStorage.getItem("token");
        const response = await axios.post("/api/auth/upload-avatar", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success) {
          const avatarUrl = response.data.avatarUrl;
          setFormData((prev) => ({
            ...prev,
            avatar: avatarUrl,
          }));

          toast.success("Profile picture updated successfully");

          const updatedUser = { ...user, avatar: avatarUrl };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // processImageUrl is now imported from utils

  if (loading) {
    return (
      <div className="profile-modal">
        <div className="profile-content loading">
          <div className="loader">
            <JumpingLoader size="medium" />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="profile-modal"
      onClick={(e) => e.target.className === "profile-modal" && onClose()}
    >
      <div className="profile-content">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="profile-header">
          <div className="profile-cover">
            <div className="cover-overlay"></div>
          </div>
          <div className="avatar-section">
            <div className="avatar-container">
              <img
                src={
                  formData.avatar ? processImageUrl(formData.avatar) : MaleUser
                }
                alt="Profile"
                className={`profile-avatar ${isLoading ? "loading" : ""}`}
              />
              {isEditing && (
                <label className="avatar-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: "none" }}
                  />
                  <div className="avatar-upload">
                    <FaCamera />
                  </div>
                </label>
              )}
            </div>
            {!isEditing ? (
              <button
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                <FaEdit /> Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button
                  className="save-button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Saving..."
                  ) : (
                    <>
                      <FaSave /> Save Changes
                    </>
                  )}
                </button>
                <button
                  className="cancel-button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(user);
                  }}
                  disabled={isLoading}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-group">
              <div className="input-group">
                {/* <FaUser className="input-icon" /> */}
                <label htmlFor="">Name:</label>
                <input
                  type="text"
                  name={
                    formData.role === "shopowner" ? "shopownerName" : "names"
                  }
                  value={
                    formData.role === "shopowner"
                      ? formData.shopownerName
                      : formData.names
                  }
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={
                    formData.role === "shopowner"
                      ? "Shop Owner Name"
                      : "Your Name"
                  }
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-group">
                {/* <FaEnvelope className="input-icon" /> */}
                <label htmlFor="">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Email Address"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Details</h3>
            <div className="form-group">
              <div className="input-group">
                {/* <FaPhone className="input-icon" /> */}
                <label htmlFor="">Phone:</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Phone Number"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-group">
                {/* <FaPhone className="input-icon" /> */}
                <label htmlFor="">Mobile:</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Mobile Number"
                  className="form-input"
                  pattern="[6-9]\d{9}"
                  maxLength="10"
                  title="Please enter a valid 10-digit mobile number starting with 6-9"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-group">
                {/* <FaMapMarkerAlt className="input-icon" /> */}
                <label htmlFor="">Address:</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Address"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
