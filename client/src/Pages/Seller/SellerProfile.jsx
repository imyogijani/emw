/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import { processImageUrl } from "../../utils/apiConfig";
import "./SellerProfile.css";
import AddressModal from "./AddressModal";
import { Edit, Trash2 } from "lucide-react";
import JumpingLoader from "../../Components/JumpingLoader";

const SellerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [shopImage, setShopImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [gstNumber, setGstNumber] = useState("");
  const [shopImages, setShopImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);

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
  
  // Add a ref to track if documents are already being fetched
  const [isFetchingDocs, setIsFetchingDocs] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Add CSS for animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .seller-profile-input {
        padding: 12px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.2s ease;
        background: #ffffff;
      }
      .seller-profile-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .seller-profile-input:disabled {
        background: #f8fafc;
        color: #64748b;
      }
      .seller-profile-label {
        font-weight: 600;
        color: #374151;
        margin-bottom: 6px;
        display: block;
        font-size: 14px;
      }
      .seller-profile-row {
        margin-bottom: 20px;
      }
      .btn {
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
      }
      .btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }
      .btn-primary:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        transform: translateY(-1px);
      }
      .btn-secondary {
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        color: #374151;
        border: 1px solid #d1d5db;
      }
      .btn-secondary:hover {
        background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/auth/current-user");
      setProfile(res.data.user);
      setGstNumber(res.data.user.sellerId?.gstNumber || "");
      setShopImages(res.data.user.sellerId?.shopImages || []);

      setForm({
        names: res.data.user.names || "",
        shopownerName: res.data.user.ownerName || res.data.user.names || "",
        shopName: res.data.user.sellerId.shopName || "",
        email: res.data.user.email || "",
        phone: res.data.user.phone || "",
        address: res.data.user.address || {},
        addresses: res.data.user.sellerId.shopAddresses || [],
      });
    } catch (err) {
      toast.error("Failed to load profile");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    if (isFetchingDocs) {
      return;
    }
    
    try {
      setIsFetchingDocs(true);
      setDocLoading(true);
      const res = await axios.get("/api/seller-documents");
      if (res.data.success) {
        const allDocuments = res.data.data || [];
        // Remove duplicates based on document ID
        const uniqueDocuments = allDocuments.filter((doc, index, self) => 
          index === self.findIndex(d => d._id === doc._id)
        );
        setDocuments(uniqueDocuments);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      toast.error("Failed to load documents");
      setDocuments([]);
    } finally {
      setDocLoading(false);
      setIsFetchingDocs(false);
    }
  }, [isFetchingDocs]);

  useEffect(() => {
    const initializeProfile = async () => {
      if (hasInitialized) return;
      setHasInitialized(true);
      
      // Fetch profile and documents in parallel but only once
      await Promise.all([
        fetchProfile(),
        fetchDocuments()
      ]);
    };
    
    initializeProfile();
  }, [fetchProfile, fetchDocuments, hasInitialized]);

  useEffect(() => {
    console.log("editMode:", editMode);
  }, [editMode]);

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

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (user.email === "demo@seller.com") {
      toast.info("This is a demo account. You cannot add products.");
      return; //  stop here
    }
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
  const shopImagePreview = shopImage
    ? URL.createObjectURL(shopImage)
    : profile && profile.shopImage
    ? processImageUrl(profile.shopImage)
    : profile && profile.avatar
    ? processImageUrl(profile.avatar)
    : "/vite.svg";

  if (loading)
    return (
      <div
        className="loading-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
        }}
      >
        <JumpingLoader size="medium" />
        <p>Loading profile...</p>
      </div>
    );

  const handleViewDoc = async (docId) => {
    try {
      const res = await axios.get(`/api/seller-documents/view/${docId}`, {
        responseType: "blob",
      });

      // Blob se object URL banao
      const fileURL = URL.createObjectURL(res.data);

      // new tab me open karo
      window.open(fileURL, "_blank");
    } catch (err) {
      console.error("Error viewing document:", err);
    }
  };

  const handleDownloadDoc = async (docId, fileName) => {
    try {
      const res = await axios.get(`/api/seller-documents/download/${docId}`, {
        responseType: "blob", // important
      });

      // 🔑 create Blob correctly
      const blob = new Blob([res.data]);
      const fileURL = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.download = fileName || "document";
      document.body.appendChild(link);
      link.click();
      link.remove();

      // cleanup URL
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error("Error downloading document:", err);
    }
  };

  if (!profile) return <div>No profile data</div>;

  return (
    <div
      className="seller-dashboard"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, #f6f8fa 60%, #e3e8ee 100%)",
      }}
    >
      <div className="admin-header">
        <div>
          <h1>Seller Profile</h1>
          <p className="admin-subtitle">Manage your shop and account details</p>
        </div>
      </div>
      <div
        className="seller-profile-main"
        style={{
          display: "flex",
          gap: 36,
          maxWidth: 1100,
          margin: "0 auto",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Avatar & Shop Card */}
        <div
          className="seller-profile-left"
          style={{ flex: "0 0 320px", minWidth: 280, maxWidth: 340 }}
        >
          <div
            className="seller-profile-card"
            style={{
              padding: "2.5rem 1.5rem",
              boxShadow: "0 12px 40px rgba(60,72,88,0.15)",
              borderRadius: 24,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            {/* Background Pattern */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 80,
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                opacity: 0.1,
                borderRadius: "24px 24px 0 0"
              }}
            />
            
            <div
              className="seller-profile-avatar"
              style={{ 
                margin: "0 auto 24px auto",
                position: "relative",
                zIndex: 1
              }}
            >
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={shopImagePreview}
                  alt="shop avatar"
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "4px solid #ffffff",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    background: "#10b981",
                    borderRadius: "50%",
                    border: "3px solid #ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <span style={{ color: "white", fontSize: 12 }}>✓</span>
                </div>
              </div>
              {editMode && (
                <label
                  className="seller-profile-upload-label"
                  style={{ 
                    marginTop: 16, 
                    display: "block", 
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
                  <span 
                    className="seller-profile-upload-btn"
                    style={{
                      display: "inline-block",
                      padding: "8px 16px",
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      color: "white",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "all 0.2s ease"
                    }}
                  >
                    📷 Change Image
                  </span>
                  {shopImage && (
                    <span
                      style={{
                        display: "block",
                        marginTop: 8,
                        color: "#10b981",
                        fontWeight: 500,
                        fontSize: 12
                      }}
                    >
                      ✓ {shopImage.name}
                    </span>
                  )}
                </label>
              )}
            </div>
            
            <div
              className="seller-profile-title"
              style={{
                textAlign: "center",
                fontSize: 24,
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: 8,
                lineHeight: 1.2
              }}
            >
              {form.shopName || "Your Shop"}
            </div>
            
            <div
              className="seller-profile-email"
              style={{
                textAlign: "center",
                color: "#64748b",
                fontSize: 15,
                marginBottom: 24,
                fontWeight: 500
              }}
            >
              {form.email}
            </div>

            {/* GST Section */}
            <div style={{ 
              margin: "20px 0",
              padding: "16px",
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              borderRadius: 12,
              border: "1px solid #f59e0b"
            }}>
              <div style={{ 
                fontWeight: 600, 
                color: "#92400e", 
                fontSize: 14,
                marginBottom: 8,
                textAlign: "center"
              }}>
                🏛️ GST Registration
              </div>
              <div style={{ textAlign: "center" }}>
                {gstNumber ? (
                  <span style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    background: "#ffffff",
                    color: "#92400e",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "monospace",
                    border: "1px solid #f59e0b"
                  }}>
                    {gstNumber}
                  </span>
                ) : (
                  <span style={{ 
                    color: "#64748b",
                    fontSize: 13,
                    fontStyle: "italic"
                  }}>
                    Not Provided
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Right: Details & Documents */}
        <div
          className="seller-profile-right"
          style={{ flex: 1, minWidth: 320, maxWidth: 700 }}
        >
          <div
            className="seller-profile-card"
            style={{
              padding: "2.5rem 2.5rem 2rem 2.5rem",
              borderRadius: 24,
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              boxShadow: "0 12px 40px rgba(60,72,88,0.12)",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Editable fields or read-only */}
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
                  <label className="seller-profile-label">
                    Shop Owner Name
                  </label>
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
                <div style={{ marginTop: "24px" }}>
                  <label className="seller-profile-label" style={{ fontSize: 16, marginBottom: 12 }}>
                    🏠 Shop Addresses
                  </label>
                  {form.addresses && form.addresses.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {form.addresses.map((addr, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            border: "2px solid #e2e8f0",
                            padding: "16px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = "#3b82f6";
                            e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{ 
                                fontWeight: 600, 
                                marginBottom: "8px",
                                color: "#1e293b",
                                fontSize: 14
                              }}
                            >
                              📍 Address {idx + 1}
                            </div>
                            <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>
                              {addr.addressLine1}, {addr.addressLine2}, {addr.city},{" "}
                              {addr.state} - {addr.pincode}, {addr.country}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "12px", marginLeft: 16 }}>
                            <button
                              onClick={() => openEditModal(addr, idx)}
                              style={{
                                padding: "8px",
                                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = "scale(1.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "scale(1)";
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(idx)}
                              style={{
                                padding: "8px",
                                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = "scale(1.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "scale(1)";
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: "center",
                      padding: "24px",
                      background: "#f8fafc",
                      borderRadius: "12px",
                      border: "2px dashed #cbd5e1",
                      color: "#64748b"
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🏠</div>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>No addresses found</div>
                    </div>
                  )}
                  <button
                    onClick={openAddModal}
                    style={{
                      marginTop: "16px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#fff",
                      border: 0,
                      borderRadius: 8,
                      padding: "12px 24px",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "linear-gradient(135deg, #059669 0%, #047857 100%)";
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    <span>➕</span>
                    Add New Address
                  </button>
                </div>
                {/* Shop Images */}
                {shopImages && shopImages.length > 0 && (
                  <div
                    className="seller-profile-section-card"
                    style={{
                      margin: "32px 0 0 0",
                      padding: 24,
                      borderRadius: 16,
                      background: "linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%)",
                      border: "1px solid #e879f9",
                      boxShadow: "0 4px 20px rgba(232, 121, 249, 0.1)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#86198f",
                        fontSize: 18,
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>🏪</span>
                      Shop Gallery
                    </div>
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: 16 
                    }}>
                      {shopImages.map((img, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: 12,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            transition: "transform 0.3s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          <img
                            src={processImageUrl(img)}
                            alt={`Shop Image ${idx + 1}`}
                            style={{
                              width: "100%",
                              height: 100,
                              objectFit: "cover",
                              background: "#fff",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                              color: "white",
                              padding: "8px",
                              fontSize: 11,
                              fontWeight: 500,
                              textAlign: "center"
                            }}
                          >
                            Image {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Seller Documents */}
                <div
                  className="seller-profile-section-card"
                  style={{
                    margin: "32px 0 0 0",
                    padding: 24,
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 20px rgba(60,72,88,0.08)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#1e293b",
                      fontSize: 18,
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>📋</span>
                    Uploaded Documents
                  </div>
                  {docLoading ? (
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 12,
                      padding: "20px 0",
                      color: "#64748b" 
                    }}>
                      <div style={{
                        width: 20,
                        height: 20,
                        border: "2px solid #e2e8f0",
                        borderTop: "2px solid #3b82f6",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }}></div>
                      Loading documents...
                    </div>
                  ) : documents.length === 0 ? (
                    <div style={{ 
                      textAlign: "center",
                      padding: "40px 20px",
                      color: "#64748b",
                      background: "#ffffff",
                      borderRadius: 12,
                      border: "2px dashed #e2e8f0"
                    }}>
                      {/* <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div> */}
                      <div style={{ fontSize: 16, fontWeight: 500 }}>No documents uploaded</div>
                      <div style={{ fontSize: 14, marginTop: 4 }}>Upload your business documents to get started</div>
                    </div>
                  ) : (
                    <div
                      className="seller-documents-grid"
                      style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: 20 
                      }}
                    >
                      {documents.map((doc) => {
                        const isImage =
                          doc.filePath.endsWith(".jpg") ||
                          doc.filePath.endsWith(".jpeg") ||
                          doc.filePath.endsWith(".png");
                        const isPdf = doc.filePath.endsWith(".pdf");

                        const getStatusColor = (status) => {
                          switch(status?.toLowerCase()) {
                            case 'approved': return '#10b981';
                            case 'pending': return '#f59e0b';
                            case 'rejected': return '#ef4444';
                            default: return '#6b7280';
                          }
                        };

                        const getStatusBg = (status) => {
                          switch(status?.toLowerCase()) {
                            case 'approved': return '#d1fae5';
                            case 'pending': return '#fef3c7';
                            case 'rejected': return '#fee2e2';
                            default: return '#f3f4f6';
                          }
                        };

                        return (
                          <div
                            key={doc._id}
                            style={{
                              background: "#ffffff",
                              borderRadius: 12,
                              padding: 20,
                              border: "1px solid #e2e8f0",
                              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                              transition: "all 0.3s ease",
                              cursor: "pointer",
                              position: "relative",
                              overflow: "hidden"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = "translateY(-2px)";
                              e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)";
                            }}
                          >
                            {/* Status Badge */}
                            {/* <div
                              style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                padding: "4px 8px",
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                color: getStatusColor(doc.status),
                                background: getStatusBg(doc.status),
                                letterSpacing: "0.5px"
                              }}
                            >
                              {doc.status || 'Unknown'}
                            </div> */}

                            {/* Document Type Header */}
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 14,
                                marginBottom: 16,
                                color: "#1e293b",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px"
                              }}
                            >
                              {doc.docType.replace(/([A-Z])/g, ' $1').trim()}
                            </div>

                            {/* {doc.docNumber && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#64748b",
                                  marginBottom: 12,
                                  padding: "6px 10px",
                                  background: "#f8fafc",
                                  borderRadius: 6,
                                  border: "1px solid #e2e8f0"
                                }}
                              >
                                <strong>Document No:</strong> {doc.docNumber}
                              </div>
                            )} */}
                            {doc.docNumber && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#64748b",
                                  marginBottom: 12,
                                  padding: "6px 10px",
                                  background: "#f8fafc",
                                  borderRadius: 6,
                                  border: "1px solid #e2e8f0"
                                }}
                              >
                                <strong>Document No:</strong> {doc.docNumber}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                marginTop: 16
                              }}
                            >
                              <button
                                onClick={() => handleViewDoc(doc._id)}
                                style={{
                                  flex: 1,
                                  padding: "8px 12px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#ffffff",
                                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                  border: "none",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
                                }}
                              >
                                👁️ View
                              </button>
                              <button
                                onClick={() =>
                                  handleDownloadDoc(
                                    doc._id,
                                    `${doc.docType}${doc.originalExt}`
                                  )
                                }
                                style={{
                                  flex: 1,
                                  padding: "8px 12px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#374151",
                                  background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                                  border: "1px solid #d1d5db",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)";
                                }}
                              >
                                💾 Download
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Subscription Features */}
                {profile.subscription &&
                  profile.subscription.includedFeatures && (
                    <div
                      className="seller-profile-row"
                      style={{ alignItems: "start", marginTop: 32 }}
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
                    <label className="seller-profile-label">
                      {field.label}
                    </label>
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
