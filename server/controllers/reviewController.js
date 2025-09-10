import Review from "../models/reviewModel.js";
import mongoose from "mongoose";
import Product from "../models/productModel.js";
import Seller from "../models/sellerModel.js";

export const addReview = async (req, res) => {
  try {
    const { product, rating, title, comment, verified } = req.body;

    // 1 Validate input
    if (!product || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2 Validate productId format (optional but good)
    if (!mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Check if review already exists by the user for the same product
    const existingReview = await Review.findOne({
      product,
      user: req.user?._id || "000000000000000000000000",
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }

    // 4 Save new review
    const review = new Review({
      user: req.user?._id || "000000000000000000000000",
      product,
      rating,
      title,
      comment,
      verified: verified !== undefined ? verified : true,
    });

    await review.save();

    // 5 Recalculate product average rating and total reviews
    const reviews = await Review.find({ product });
    const totalReviews = reviews.length;
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    // 6 Update product's review stats
    await Product.findByIdAndUpdate(product, {
      averageRating: averageRating.toFixed(1),
      totalReviews,
    });
    const currentProduct = await Product.findById(product);
    const sellerId = currentProduct?.seller;

    if (sellerId) {
      // console.log("📦 Seller ID:", sellerId);

      // Get all products of this seller
      const sellerProducts = await Product.find({ seller: sellerId }).select(
        "_id"
      );
      const productIds = sellerProducts.map((p) => p._id);

      // Get all reviews of this seller's products
      const sellerReviews = await Review.find({ product: { $in: productIds } });

      const sellerTotal = sellerReviews.length;
      const sellerAvg =
        sellerTotal === 0
          ? 0
          : sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerTotal;

      // console.log("⭐ Seller Avg Rating:", sellerAvg.toFixed(1));
      // console.log("📝 Seller Total Reviews:", sellerTotal);

      // Update seller model
      await Seller.findByIdAndUpdate(sellerId, {
        averageRating: sellerAvg.toFixed(1),
        totalReviews: sellerTotal,
      });
    } else {
      console.log("❌ Seller not found for this product.");
    }

    // 7 Respond
    res.status(201).json({
      success: true,
      message: "Review added",
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate("user", "role names firstName lastName") // Populate required fields
      .sort({ createdAt: -1 });

    const updatedReviews = reviews.map((review) => {
      const user = review.user;
      let username = "";

      if (user.role === "client" || user.role === "admin") {
        username = user.names;
      } else if (user.role === "shopowner") {
        username =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.names;
      }

      return {
        ...review._doc,
        user: {
          _id: user._id,
          name: username,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: updatedReviews.length,
      reviews: updatedReviews,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching reviews", err });
  }
};

// Delete Review
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const productId = review.product;

    await review.deleteOne();

    // Update product stats
    const reviews = await Review.find({ product: productId });
    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    await Product.findByIdAndUpdate(productId, {
      averageRating: avgRating.toFixed(1),
      totalReviews,
    });

    res.status(200).json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting review", err });
  }
};

export const toggleHelpful = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const isAlreadyHelpful = review.helpfulBy.includes(userId);

    if (isAlreadyHelpful) {
      // Remove user (unhelpful)
      review.helpfulBy = review.helpfulBy.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Add user (helpful)
      review.helpfulBy.push(userId);
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: isAlreadyHelpful ? "Removed from helpful" : "Marked as helpful",
      helpfulCount: review.helpfulBy.length,
      isHelpful: !isAlreadyHelpful,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const getReviewSummary = async (req, res) => {
  const { productId } = req.params;

  try {
    const summary = await Review.aggregate([
      {
        $match: { product: new mongoose.Types.ObjectId(productId) },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to proper format (1-5 keys)
    const ratingSummary = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    summary.forEach(({ _id, count }) => {
      ratingSummary[_id] = count;
    });

    res.status(200).json({
      success: true,
      ratings: ratingSummary,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error in rating summary", error: err.message });
  }
};
