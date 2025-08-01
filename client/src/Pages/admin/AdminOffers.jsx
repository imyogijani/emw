import React, { useState, useEffect } from "react";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import "./AdminDeals.css";

export default function AdminOffers() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerDiscount, setOfferDiscount] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShops();
    fetchAllProducts();
    fetchOffers();
  }, []);

  const fetchShops = async () => {
    try {
      const res = await axios.get("/api/admin/shops");
      setShops(res.data.shops || []);
    } catch (e) {
      setShops([]);
    }
  };

  // Fetch all products for filtering by shop
  const fetchAllProducts = async () => {
    try {
      const res = await axios.get("/api/products?populateCategory=true");
      setAllProducts(res.data.products || []);
    } catch (e) {
      setAllProducts([]);
    }
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/offers");
      setOffers(res.data.offers || []);
    } catch (e) {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShop || !selectedProduct || !offerTitle || !offerDiscount)
      return;
    setLoading(true);
    try {
      await axios.post("/api/admin/offers", {
        shop: selectedShop,
        product: selectedProduct,
        title: offerTitle,
        description: offerDescription,
        discount: offerDiscount,
        price: offerPrice,
      });
      setOfferTitle("");
      setOfferDescription("");
      setOfferDiscount("");
      setOfferPrice("");
      fetchOffers();
      toast.success("Offer added to Today's Deals!");
    } catch (e) {
      toast.error("Failed to add offer");
    }
    setLoading(false);
  };

  // Remove offer handler
  const handleRemoveOffer = async (offerId) => {
    if (!window.confirm("Are you sure you want to remove this offer?")) return;
    setLoading(true);
    try {
      await axios.delete(`/api/admin/offers/${offerId}`);
      fetchOffers();
      toast.success("Offer removed successfully");
    } catch (e) {
      toast.error("Failed to remove offer");
    }
    setLoading(false);
  };

  // Filter products by selected shop
  const filteredProducts = selectedShop
    ? allProducts.filter(
        (p) => p.seller === selectedShop || p.seller?._id === selectedShop
      )
    : [];

  return (
    <div className="admin-deals admin-offers-page">
      <div className="admin-header">
        <h1>Today's Special Offers</h1>
        <p className="admin-subtitle">
          Add and manage today's special offers for each shop.
        </p>
      </div>
      <form className="admin-deal-form" onSubmit={handleSubmit}>
        <select
          value={selectedShop}
          onChange={(e) => {
            setSelectedShop(e.target.value);
            setSelectedProduct(""); // Reset product when shop changes
          }}
          required
        >
          <option value="">Select Shop</option>
          {shops.map((shop) => (
            <option key={shop._id} value={shop._id}>
              {shop.shopName || shop.names || shop.email}
            </option>
          ))}
        </select>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          required
          disabled={!selectedShop}
        >
          <option value="">Select Product</option>
          {filteredProducts.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Offer Title"
          value={offerTitle}
          onChange={(e) => setOfferTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={offerDescription}
          onChange={(e) => setOfferDescription(e.target.value)}
        />
        <input
          type="number"
          placeholder="Discount %"
          value={offerDiscount}
          onChange={(e) => setOfferDiscount(e.target.value)}
          required
          min="1"
          max="100"
        />
        <input
          type="number"
          placeholder="Special Price (optional)"
          value={offerPrice}
          onChange={(e) => setOfferPrice(e.target.value)}
          min="1"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Offer"}
        </button>
      </form>
      <div className="admin-deals-list">
        <h3>Active Offers</h3>
        {offers.length === 0 ? (
          <p>No offers yet.</p>
        ) : (
          <ul>
            {offers.map((offer) => (
              <li key={offer._id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <span>
                  <b>{offer.title}</b> - {offer.product?.name} (
                  {offer.shop?.shopName || offer.shop?.names || offer.shop?.email}
                  ) - {offer.discount}% off
                </span>
                <button
                  style={{ marginLeft: 16, background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}
                  onClick={() => handleRemoveOffer(offer._id)}
                  disabled={loading}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
