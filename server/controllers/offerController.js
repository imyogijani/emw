import Offer from "../models/offerModel.js";

// Create Offer
export const createOffer = async (req, res) => {
  try {
    const offer = await Offer.create(req.body);
    res.status(201).json({ success: true, offer });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all offers
export const getAllOffers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;

    // 🔎 Build filter
    const filter = {};

    // Status filter (active/inactive)
    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    // Search filter (code OR title OR description)
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { code: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    // ✅ Count documents for pagination
    const totalOffers = await Offer.countDocuments(filter);

    // ✅ Fetch paginated offers
    const offers = await Offer.find(filter)
      .sort({ createdAt: -1 }) // newest first
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      offers,
      totalCount: totalOffers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOffers / limit),
    });
  } catch (err) {
    console.error("❌ Error in getAllOffers:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update offer
export const updateOffer = async (req, res) => {
  try {
    const updated = await Offer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete offer
export const deleteOffer = async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Offer deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const toggleOfferActive = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer)
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });

    offer.isActive = !offer.isActive;
    await offer.save();

    res.json({ success: true, isActive: offer.isActive });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
