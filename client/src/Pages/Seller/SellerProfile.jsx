import React, { useEffect, useState } from "react";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import "./SellerProfile.css";
import AddressModal from "./AddressModal";
import { Edit, Trash2 } from "lucide-react";

const SellerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [shopImage, setShopImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const [editAddressIndex, setEditAddressIndex] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    console.log("editMode:", editMode);
  }, [editMode]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/auth/current-user");
      setProfile(res.data.user);
      // console.log("User profile data:", res.data.user);

      setForm({
        names: res.data.user.names || "",
        shopownerName: res.data.user.ownerName || res.data.user.names || "",
        shopName: res.data.user.sellerId.shopName || "",
        email: res.data.user.email || "",
        phone: res.data.user.phone || "",
        address: res.data.user.address || "",
        addresses: res.data.user.sellerId.shopAddresses || [],
      });

      console.log("Profile data fetched:", res.data);
    } catch (err) {
      toast.error("Failed to load profile");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setShopImage(e.target.files[0]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let formData = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        formData.append(key, value)
      );
      if (shopImage) formData.append("shopImage", shopImage);
      await axios.patch("/api/auth/update-profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Profile updated");
      setEditMode(false);
      setShopImage(null);
      fetchProfile();
    } catch (err) {
      toast.error("Failed to update profile");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setShopImage(null);
    // Reset form to original profile data
    setForm({
      names: profile.names || "",
      shopownerName: profile.shopownerName || "",
      shopName: profile.shopName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      address: profile.address || "",
    });
  };

  // Modal handlers
  const openAddModal = () => {
    setEditAddressIndex(null);
    setAddressForm({
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (addr, index) => {
    setEditAddressIndex(index);
    setAddressForm(addr);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveAddress = async () => {
    try {
      if (editAddressIndex !== null) {
        // Update address
        await axios.patch(
          `/api/shopaddress/${profile.sellerId._id}/address/${editAddressIndex}`,
          addressForm
        );
        toast.success("Address updated");
      } else {
        // Add new address
        await axios.post(`/api/shopaddress/${profile.sellerId._id}/address`, {
          address: addressForm,
        });
        toast.success("Address added");
      }
      closeModal();
      fetchProfile();
    } catch (err) {
      const apiMessage =
        err.response?.data?.message || // backend main message
        err.response?.data?.error || // fallback for some APIs
        "Failed to save address";
      toast.error(apiMessage);
    }
  };

  const handleDeleteAddress = async (index) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    try {
      await axios.delete(
        `/api/shopaddress/${profile.sellerId._id}/address/${index}`
      );
      toast.success("Address deleted");
      fetchProfile();
    } catch (err) {
      const apiMessage =
        err.response?.data?.message || // backend main message
        err.response?.data?.error || // fallback for some APIs
        "Failed to delete address";
      toast.error(apiMessage);
    }
  };

  // Show preview of new shop image if selected
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL_LOCAL; // Change if needed for production
  const shopImagePreview = shopImage
    ? URL.createObjectURL(shopImage)
    : profile && profile.shopImage
    ? profile.shopImage.startsWith("/uploads/")
      ? `${BACKEND_URL}${profile.shopImage}`
      : profile.shopImage
    : profile && profile.avatar
    ? profile.avatar.startsWith("/uploads/")
      ? `${BACKEND_URL}${profile.avatar}`
      : profile.avatar
    : "/vite.svg";

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No profile data</div>;

  return (
    <div
      className="seller-dashboard"
      style={{ overflow: "visible", minHeight: "100vh", background: "#f6f8fa" }}
    >
      <div className="seller-header">
        <h1>Seller Profile</h1>
        <p className="seller-subtitle">Manage your shop and account details</p>
      </div>
      <div
        className="dashboard-stats"
        style={{ gridTemplateColumns: "1fr", overflow: "visible" }}
      >
        <div className="seller-profile-card">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            <div className="seller-profile-avatar">
              <img
                src={shopImagePreview}
                alt="shop avatar"
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2.5px solid #e3e8ee",
                }}
              />
              {editMode && (
                <label
                  className="seller-profile-upload-label"
                  style={{ marginTop: 12, display: "block", cursor: "pointer" }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
                  <span className="seller-profile-upload-btn">
                    Change Shop Image
                  </span>
                  {shopImage && (
                    <span
                      style={{
                        marginLeft: 8,
                        color: "#388e3c",
                        fontWeight: 500,
                      }}
                    >
                      {shopImage.name}
                    </span>
                  )}
                </label>
              )}
            </div>
            <div className="seller-profile-title">
              {form.shopName || "Your Shop"}
            </div>
            <div className="seller-profile-email">{form.email}</div>
          </div>
          {/* Show profile fields in read-only mode if not editing */}
          {!editMode ? (
            <>
              <div className="seller-profile-row">
                <label className="seller-profile-label">Full Name</label>
                <input
                  className="seller-profile-input"
                  value={form.names}
                  disabled
                  readOnly
                />
              </div>
              <div className="seller-profile-row">
                <label className="seller-profile-label">Shop Owner Name</label>
                <input
                  className="seller-profile-input"
                  value={form.shopownerName}
                  disabled
                  readOnly
                />
              </div>
              <div className="seller-profile-row">
                <label className="seller-profile-label">Shop Name</label>
                <input
                  className="seller-profile-input"
                  value={form.shopName}
                  disabled
                  readOnly
                />
              </div>
              <div className="seller-profile-row">
                <label className="seller-profile-label">Email</label>
                <input
                  className="seller-profile-input"
                  value={form.email}
                  disabled
                  readOnly
                />
              </div>
              <div className="seller-profile-row">
                <label className="seller-profile-label">Phone</label>
                <input
                  className="seller-profile-input"
                  value={form.phone}
                  disabled
                  readOnly
                />
              </div>

              <div className="seller-profile-row">
                <label className="seller-profile-label">Address</label>
                <input
                  className="seller-profile-input"
                  value={form.address}
                  disabled
                  readOnly
                />
              </div>
              {/* Addresses */}
              <div style={{ marginTop: "20px" }}>
                <label className="seller-profile-label">Shop Addresses</label>

                {form.addresses && form.addresses.length > 0 ? (
                  form.addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid #ccc",
                        padding: "10px",
                        marginBottom: "8px",
                        borderRadius: "6px",
                        background: "#fff",
                      }}
                    >
                      <span style={{ flex: 1 }}>
                        <strong
                          style={{ display: "block", marginBottom: "4px" }}
                        >
                          Address {idx + 1}
                        </strong>
                        {addr.addressLine1}, {addr.addressLine2}, {addr.city},{" "}
                        {addr.state} - {addr.pincode}, {addr.country}
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Edit
                          size={20}
                          color="orange"
                          style={{ cursor: "pointer" }}
                          onClick={() => openEditModal(addr, idx)}
                        />
                        <Trash2
                          size={20}
                          color="orange"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDeleteAddress(idx)}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No addresses found</p>
                )}

                <button onClick={openAddModal} style={{ marginTop: "10px" }}>
                  Add Address
                </button>
              </div>

              <div className="seller-profile-row">
                <label className="seller-profile-label">
                  Subscription Plan
                </label>
                <input
                  className="seller-profile-input"
                  value={
                    profile.subscription && profile.subscription.planName
                      ? profile.subscription.planName
                      : "No Plan"
                  }
                  disabled
                  readOnly
                  style={{
                    fontWeight: 700,
                    color:
                      profile.subscription && profile.subscription.planName
                        ? "#388e3c"
                        : "#b71c1c",
                  }}
                />
              </div>
              {profile.subscription &&
                profile.subscription.includedFeatures && (
                  <div
                    className="seller-profile-row"
                    style={{ alignItems: "start" }}
                  >
                    <label
                      className="seller-profile-label"
                      style={{ marginTop: 6 }}
                    >
                      Plan Features
                    </label>
                    <ul className="seller-profile-features">
                      {profile.subscription.includedFeatures.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              <div className="seller-profile-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="seller-profile-form">
              {/* Modern styled input row */}
              {[
                { label: "Full Name", name: "names" },
                { label: "Shop Owner Name", name: "shopownerName" },
                { label: "Shop Name", name: "shopName" },
                {
                  label: "Email",
                  name: "email",
                  disabled: true,
                  readOnly: true,
                },
                { label: "Phone", name: "phone" },
                { label: "Address", name: "address" },
              ].map((field, idx) => (
                <div key={field.name} className="seller-profile-row">
                  <label className="seller-profile-label">{field.label}</label>
                  <input
                    className="seller-profile-input"
                    name={field.name}
                    value={form[field.name]}
                    onChange={field.disabled ? undefined : handleChange}
                    disabled={field.disabled}
                    readOnly={field.readOnly}
                  />
                </div>
              ))}
              <div className="seller-profile-row">
                <label className="seller-profile-label">
                  Subscription Plan
                </label>
                <input
                  className="seller-profile-input"
                  value={
                    profile.subscription && profile.subscription.planName
                      ? profile.subscription.planName
                      : "No Plan"
                  }
                  disabled
                  readOnly
                  style={{
                    fontWeight: 700,
                    color:
                      profile.subscription && profile.subscription.planName
                        ? "#388e3c"
                        : "#b71c1c",
                  }}
                />
              </div>
              {profile.subscriptionFeatures &&
                profile.subscriptionFeatures.length > 0 && (
                  <div
                    className="seller-profile-row"
                    style={{ alignItems: "start" }}
                  >
                    <label
                      className="seller-profile-label"
                      style={{ marginTop: 6 }}
                    >
                      Plan Features
                    </label>
                    <ul className="seller-profile-features">
                      {profile.subscriptionFeatures.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              <div className="seller-profile-actions">
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <AddressModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveAddress}
        addressForm={addressForm}
        setAddressForm={setAddressForm}
        isEditing={editAddressIndex !== null}
      />
    </div>
  );
};

export default SellerProfile;
