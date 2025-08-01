import axios from "../utils/axios";

//  Add new review
export const addReview = async (data) => {
  try {
    const res = await axios.post("/api/reviews", data);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Error adding review" };
  }
};

//  Get all reviews for a product
export const getProductReviews = async (productId) => {
  try {
    const res = await axios.get(`/api/reviews/product/${productId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Error fetching reviews" };
  }
};

//  Delete review (admin only)
export const deleteReview = async (reviewId) => {
  try {
    const res = await axios.delete(`/api/reviews/${reviewId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Error deleting review" };
  }
};

//  Toggle helpful (mark/unmark)
export const toggleHelpful = async (reviewId) => {
  try {
    const res = await axios.patch(`/api/reviews/helpful/${reviewId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Error updating helpful count" };
  }
};

//  Get review summary (count of 1⭐ to 5⭐)
export const getReviewSummary = async (productId) => {
  try {
    const res = await axios.get(`/api/reviews/product/${productId}/summary`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Error fetching review summary" };
  }
};
