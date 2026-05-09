import express from "express";
import {
  getHospitalsController,
  createHospitalController,
  deleteHospitalController,
  updateHospitalController,
} from "../controllers/hospitalController.js";
import { requireSignIn, requireAdmin } from "../middlewares/authMiddleware.js";
import upload from "../config/multer.js";

const router = express.Router();

// Public — frontend uses this
router.get("/get-all", getHospitalsController);

// Admin only — create, update, delete
router.post("/add", requireSignIn, requireAdmin, upload.single("image"), createHospitalController);
router.put("/update/:id", requireSignIn, requireAdmin, upload.single("image"), updateHospitalController);
router.delete("/delete/:id", requireSignIn, requireAdmin, deleteHospitalController);

export default router;
