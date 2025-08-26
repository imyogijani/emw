import express from "express";
import {
  getStates,
  getCitiesByState,
  getPincodesByCity,
  createCountry,
  updateCountry,
  createState,
  updateState,
  createCity,
  updateCity,
  createPincode,
  updatePincode,
  deleteCountry,
  deleteState,
  deleteCity,
  deletePincode,
  getAllCountries,
  getLocationStats,
  getStatesDropDown,
  getCitiesByStateDropDown,
  getPincodesByCityDropDown,
} from "../controllers/locationController.js";
import {
  authenticateToken,
  authorizeAdmin,
  fetchUser,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/country", getAllCountries);

router.get("/states", getStates);
// router.get("/cities/:state", getCitiesByState);
router.get("/cities/:stateId", getCitiesByState);
router.get("/pincode/:stateId/:cityId", getPincodesByCity);

router.get("/stats", getLocationStats);

// Api for DropDown :

router.get("/states-dropdown", getStatesDropDown);
router.get("/cities-dropdown/:state", getCitiesByStateDropDown);
router.get("/pincodes-dropdown/:state/:city", getPincodesByCityDropDown);

// Country routes
router.post(
  "/country",
  authenticateToken,
  fetchUser,
  authorizeAdmin,
  createCountry
);
router.patch(
  "/country/:id",
  authenticateToken,
  fetchUser,
  authorizeAdmin,
  updateCountry
);
router.delete(
  "/country/:id",
  authenticateToken,
  fetchUser,
  authorizeAdmin,
  deleteCountry
);

// State routes
router.post(
  "/state",
  authenticateToken,
  fetchUser,
  authorizeAdmin,
  createState
);
router.patch(
  "/state/:id",
  authenticateToken,
  fetchUser,
  authorizeAdmin,
  updateState
);
router.delete(
  "/state/:id",
  authenticateToken,
  fetchUser,
  authorizeAdmin,
  deleteState
);

// City routes
router.post("/city", authenticateToken, fetchUser, authorizeAdmin, createCity);
router.patch(
  "/city/:id",
  authenticateToken,
  fetchUser,
  authorizeAdmin,
  updateCity
);
router.delete(
  "/city/:id",
  authenticateToken,
  fetchUser,
  authorizeAdmin,
  deleteCity
);

// Pincode routes
router.post(
  "/pincode",
  authenticateToken,
  fetchUser,
  authorizeAdmin,
  createPincode
);
router.patch(
  "/pincode/:id",
  authenticateToken,
  fetchUser,
  authorizeAdmin,
  updatePincode
);
router.delete(
  "/pincode/:id",
  authenticateToken,
  fetchUser,
  authorizeAdmin,
  deletePincode
);

export default router;
