import express from "express";
import {
  getStates,
  getCitiesByState,
  getPincodesByCity,
} from "../controllers/locationController.js";

const router = express.Router();

router.get("/states", getStates);
router.get("/cities/:state", getCitiesByState);
router.get("/pincodes/:state/:city", getPincodesByCity);

export default router;
