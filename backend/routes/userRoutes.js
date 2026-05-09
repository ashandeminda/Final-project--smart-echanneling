import express from "express";
import {
  registerController,
  loginController,
  doctorLoginController,
  adminLoginController,
  getCurrentUserController,
  getAllUsersController,
  updateUserController,
  getAdminStats,
} from "../controllers/userController.js";
import { requireSignIn, requireAdmin } from "../middlewares/authMiddleware.js";
import upload from "../config/multer.js";

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/doctor-login", doctorLoginController);
router.post("/admin-login", adminLoginController);
router.get("/get-user", requireSignIn, getCurrentUserController);
router.patch(
  "/update-profile",
  requireSignIn,
  upload.single("image"),
  updateUserController
);

// Admin routes
router.get("/admin/stats", requireSignIn, requireAdmin, getAdminStats);
router.get("/admin/all-users", requireSignIn, requireAdmin, getAllUsersController);

export default router;
