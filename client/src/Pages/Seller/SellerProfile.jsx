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
  const [isEditing, setIsEditing] = useState(false);

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
      console.log("User profile data:", res.data.user);

      setForm({
        names: res.data.user.names || "",
        shopownerName: res.data.user.ownerName || res.data.user.names || "",
        shopName: res.data.user.sellerId.shopName || "",
        email: res.data.user.email || "",
        phone: res.data.user.phone || "",
        address: res.data.user.address || {},
        addresses: res.data.user.sellerId.shopAddresses || [],
      });

      // console.log("Profile data fetched:", );
    } catch (err) {
      toast.error("Failed to load profile");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, dataset } = e.target;

    if (dataset.parent) {
      // Update nested address object
      setForm((prev) => ({
        ...prev,
        [dataset.parent]: {
          ...prev[dataset.parent],
          [name]: value,
        },
      }));
    } else {
      // Update top-level fields
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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

      // Append normal string fields
      formData.append("names", form.names);
      formData.append("shopownerName", form.shopownerName);
      formData.append("shopName", form.shopName);
      formData.append("email", form.email);
      formData.append("phone", form.phone);

      // Append the address object as JSON string
      formData.append("address", JSON.stringify(form.address));

      // Append shop image if selected
      if (shopImage) {
        formData.append("shopImage", shopImage); // shopImage is a File object
        console.log("Appending image:", shopImage.name, shopImage.type);
      }

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
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = async (addr, index) => {
    setEditAddressIndex(index);
    setAddressForm(addr);
    setIsModalOpen(true);
    setIsEditing(true);

    // Fetch states list
    // if (statesList.length === 0) {
    //   const resStates = await axios.get("/api/location/states");
    //   setStatesList(resStates.data.data || []);
    // }
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
      setForm((prev) => ({
        ...prev,

        addresses: [
          ...prev.addresses.filter((_, idx) => idx !== editAddressIndex),
          addressForm,
        ],
      }));
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

  const processImageUrl = (image) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL_LOCAL || "";
    if (image && image.startsWith("/uploads")) {
      return `${baseURL}${image}`;
    }
    return image || "/images/offer1.png";
  };

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
                src={processImageUrl(profile.sellerId.shopImage)}
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
                  value={`${form.address?.addressLine || ""}${
                    form.address?.addressLine2 || ""
                  } ${form.address?.state || ""} ${
                    form.address?.pincode || ""
                  } ${form.address?.country || ""}`}
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
                {
                  label: "Address Line ",
                  name: "addressLine",
                  parent: "address",
                },
                { label: "City", name: "city", parent: "address" },
                { label: "State", name: "state", parent: "address" },
                { label: "Pincode", name: "pincode", parent: "address" },
                { label: "Country", name: "country", parent: "address" },
              ].map((field, idx) => (
                <div key={field.name} className="seller-profile-row">
                  <label className="seller-profile-label">{field.label}</label>
                  <input
                    className="seller-profile-input"
                    name={field.name}
                    value={
                      field.parent
                        ? form[field.parent][field.name]
                        : form[field.name]
                    }
                    data-parent={field.parent || ""}
                    onChange={handleChange}
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
        isEditing={isEditing}
      />
    </div>
  );
};

export default SellerProfile;
