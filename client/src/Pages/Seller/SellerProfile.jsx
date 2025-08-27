import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchProfile();
    fetchDocuments();
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
      setGstNumber(res.data.user.sellerId?.gstNumber || "");
      setShopImages(res.data.user.sellerId?.shopImages || []);
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
    } catch (err) {
      toast.error("Failed to load profile");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setDocLoading(true);
      const res = await axios.get("/api/seller-documents");
      if (res.data.success) {
        setDocuments(res.data.data || []);
      }
    } catch (err) {
      toast.error("Failed to load documents");
      setDocuments([]);
    } finally {
      setDocLoading(false);
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

  if (loading) return (
    <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <JumpingLoader size="medium" />
      <p>Loading profile...</p>
    </div>
  );
  if (!profile) return <div>No profile data</div>;

  return (
    <div className="seller-dashboard" style={{ minHeight: "100vh", background: "linear-gradient(120deg, #f6f8fa 60%, #e3e8ee 100%)" }}>
      <div className="admin-header">
        <div>
          <h1>Seller Profile</h1>
          <p className="admin-subtitle">Manage your shop and account details</p>
        </div>
      </div>
      <div className="seller-profile-main" style={{ display: "flex", gap: 36, maxWidth: 1100, margin: "0 auto", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Left: Avatar & Shop Card */}
        <div className="seller-profile-left" style={{ flex: "0 0 320px", minWidth: 280, maxWidth: 340 }}>
          <div className="seller-profile-card" style={{ padding: "2.5rem 1.5rem", boxShadow: "0 8px 32px rgba(60,72,88,0.13)", borderRadius: 24, border: "1.5px solid #e3e8ee", background: "#fff" }}>
            <div className="seller-profile-avatar" style={{ margin: "0 auto 18px auto" }}>
              <img
                src={shopImagePreview}
                alt="shop avatar"
                style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "2.5px solid #e3e8ee" }}
              />
              {editMode && (
                <label className="seller-profile-upload-label" style={{ marginTop: 12, display: "block", cursor: "pointer" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
                  <span className="seller-profile-upload-btn">Change Shop Image</span>
                  {shopImage && <span style={{ marginLeft: 8, color: "#388e3c", fontWeight: 500 }}>{shopImage.name}</span>}
                </label>
              )}
            </div>
            <div className="seller-profile-title" style={{ textAlign: "center", fontSize: 22, fontWeight: 700, color: "#1a237e" }}>{form.shopName || "Your Shop"}</div>
            <div className="seller-profile-email" style={{ textAlign: "center", color: "#888", fontSize: 15, marginTop: 2 }}>{form.email}</div>
            <div style={{ margin: "18px 0 0 0", textAlign: "center" }}>
              <div style={{ fontWeight: 600, color: "#1a237e", fontSize: 15 }}>GST Number</div>
              <div>
                {gstNumber ? (
                  <span className="seller-profile-tag gst">{gstNumber}</span>
                ) : (
                  <span style={{ color: '#bbb' }}>Not Provided</span>
                )}
              </div>
            </div>
            <div style={{ margin: "18px 0 0 0", textAlign: "center" }}>
              <div style={{ fontWeight: 600, color: "#1a237e", fontSize: 15 }}>Subscription</div>
              <div style={{ fontSize: 15, color: profile.subscription && profile.subscription.planName ? "#388e3c" : "#b71c1c", fontWeight: 600, marginTop: 2 }}>
                {profile.subscription && profile.subscription.planName ? profile.subscription.planName : "No Plan"}
              </div>
            </div>
          </div>
        </div>
        {/* Right: Details & Documents */}
        <div className="seller-profile-right" style={{ flex: 1, minWidth: 320, maxWidth: 700 }}>
          <div className="seller-profile-card" style={{ padding: "2.5rem 2.5rem 2rem 2.5rem", borderRadius: 24, background: "#fff", boxShadow: "0 8px 32px rgba(60,72,88,0.10)", border: "1.5px solid #e3e8ee" }}>
            {/* Editable fields or read-only */}
            {!editMode ? (
              <>
                <div className="seller-profile-row"><label className="seller-profile-label">Full Name</label><input className="seller-profile-input" value={form.names} disabled readOnly /></div>
                <div className="seller-profile-row"><label className="seller-profile-label">Shop Owner Name</label><input className="seller-profile-input" value={form.shopownerName} disabled readOnly /></div>
                <div className="seller-profile-row"><label className="seller-profile-label">Shop Name</label><input className="seller-profile-input" value={form.shopName} disabled readOnly /></div>
                <div className="seller-profile-row"><label className="seller-profile-label">Email</label><input className="seller-profile-input" value={form.email} disabled readOnly /></div>
                <div className="seller-profile-row"><label className="seller-profile-label">Phone</label><input className="seller-profile-input" value={form.phone} disabled readOnly /></div>
                <div className="seller-profile-row"><label className="seller-profile-label">Address</label><input className="seller-profile-input" value={`${form.address?.addressLine || ""}${form.address?.addressLine2 || ""} ${form.address?.state || ""} ${form.address?.pincode || ""} ${form.address?.country || ""}`} disabled readOnly /></div>
                {/* Addresses */}
                <div style={{ marginTop: "20px" }}>
                  <label className="seller-profile-label">Shop Addresses</label>
                  {form.addresses && form.addresses.length > 0 ? (
                    form.addresses.map((addr, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #eee", padding: "10px", marginBottom: "8px", borderRadius: "8px", background: "#f8fafc" }}>
                        <span style={{ flex: 1 }}>
                          <strong style={{ display: "block", marginBottom: "4px" }}>Address {idx + 1}</strong>
                          {addr.addressLine1}, {addr.addressLine2}, {addr.city}, {addr.state} - {addr.pincode}, {addr.country}
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Edit size={20} color="#1a237e" style={{ cursor: "pointer" }} onClick={() => openEditModal(addr, idx)} />
                          <Trash2 size={20} color="#b71c1c" style={{ cursor: "pointer" }} onClick={() => handleDeleteAddress(idx)} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#888', fontSize: 15 }}>No addresses found</p>
                  )}
                  <button onClick={openAddModal} style={{ marginTop: "10px", background: "#1a237e", color: "#fff", border: 0, borderRadius: 8, padding: "8px 22px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Add Address</button>
                </div>
                {/* Shop Images */}
                {shopImages && shopImages.length > 0 && (
                  <div className="seller-profile-section-card" style={{ margin: "32px 0 0 0", padding: 18, borderRadius: 14, background: "#f6f8fa", border: "1.5px solid #e3e8ee" }}>
                    <div style={{ fontWeight: 600, color: "#1a237e", fontSize: 16, marginBottom: 10 }}>Shop Images</div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {shopImages.map((img, idx) => (
                        <img key={idx} src={processImageUrl(img)} alt={`Shop Image ${idx + 1}`} style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 10, border: '1.5px solid #e3e8ee', background: '#fff' }} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Seller Documents */}
                <div className="seller-profile-section-card" style={{ margin: "32px 0 0 0", padding: 18, borderRadius: 14, background: "#f6f8fa", border: "1.5px solid #e3e8ee" }}>
                  <div style={{ fontWeight: 600, color: "#1a237e", fontSize: 16, marginBottom: 10 }}>Uploaded Documents</div>
                  {docLoading ? (
                    <span>Loading documents...</span>
                  ) : documents.length === 0 ? (
                    <span style={{ color: '#888' }}>No documents uploaded</span>
                  ) : (
                    <div className="seller-documents-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                      {documents.map((doc) => {
                        const isImage = doc.filePath.endsWith('.jpg') || doc.filePath.endsWith('.jpeg') || doc.filePath.endsWith('.png');
                        const isPdf = doc.filePath.endsWith('.pdf');
                        const previewUrl = `/api/seller-documents/view/${doc._id}`;
                        return (
                          <div key={doc._id} style={{ border: '1.5px solid #e3e8ee', borderRadius: 10, padding: 10, width: 130, textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(60,72,88,0.04)' }}>
                            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4, color: '#1a237e' }}>{doc.docType.toUpperCase()}</div>
                            {isImage ? (
                              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                                <img src={previewUrl} alt={doc.docType} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 4, border: '1.5px solid #e3e8ee' }} />
                              </a>
                            ) : isPdf ? (
                              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                                <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f3f3', borderRadius: 8, margin: '0 auto 4px' }}>
                                  <span role="img" aria-label="PDF" style={{ fontSize: 32 }}>📄</span>
                                </div>
                                <div style={{ fontSize: 12 }}>View PDF</div>
                              </a>
                            ) : (
                              <a href={previewUrl} target="_blank" rel="noopener noreferrer">View</a>
                            )}
                            {doc.docNumber && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>No: {doc.docNumber}</div>}
                            <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{doc.status}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Subscription Features */}
                {profile.subscription && profile.subscription.includedFeatures && (
                  <div className="seller-profile-row" style={{ alignItems: "start", marginTop: 32 }}>
                    <label className="seller-profile-label" style={{ marginTop: 6 }}>Plan Features</label>
                    <ul className="seller-profile-features">
                      {profile.subscription.includedFeatures.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="seller-profile-actions">
                  <button type="button" className="btn btn-primary" onClick={() => setEditMode(true)}>
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
                  { label: "Email", name: "email", disabled: true, readOnly: true },
                  { label: "Phone", name: "phone" },
                  { label: "Address Line ", name: "addressLine", parent: "address" },
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
                      value={field.parent ? form[field.parent][field.name] : form[field.name]}
                      data-parent={field.parent || ""}
                      onChange={handleChange}
                      disabled={field.disabled}
                      readOnly={field.readOnly}
                    />
                  </div>
                ))}
                <div className="seller-profile-actions">
                  <button type="submit" className="btn btn-primary">Save</button>
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
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
