import express from "express";
import {
  addReview,
  getProductReviews,
  deleteReview,
  getReviewSummary,
  toggleHelpful,
} from "../controllers/reviewController.js";
// import { protect } from "../middlewares/authMiddleware.js";
import {
  authenticateToken,
  fetchUser,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

//  Require user to be logged in (token based)
router.post("/", authenticateToken, fetchUser, addReview);

//  Only allow admin to delete reviews
router.delete("/:id", authenticateToken, authorizeAdmin, deleteReview);

// router.get("/average", getAverageRatings); // get average rating for all products
router.get("/product/:productId", getProductReviews);
// router.get("/:productId", getAverageRatingByProduct);
// router.delete("/:id", deleteReview);

router.patch("/helpful/:id", authenticateToken, fetchUser, toggleHelpful); // review id

router.get("/product/:productId/summary", getReviewSummary);

export default router;
