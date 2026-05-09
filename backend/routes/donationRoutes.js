import express from "express";
import {
  getAdminDonationsController,
  createDonationController,
  getDonationStatsController,
  getDonationsController,
} from "../controllers/donationController.js";
import { requireAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/donate", createDonationController);
router.get("/recent", getDonationsController);
router.get("/stats", getDonationStatsController);
router.get("/admin/all", requireSignIn, requireAdmin, getAdminDonationsController);

export default router;
