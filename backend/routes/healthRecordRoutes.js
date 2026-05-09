import express from "express";
import upload from "../config/multer.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import {
  uploadHealthRecord,
  getMyHealthRecords,
  getPatientHealthRecords,
  getHealthRecordDetails,
  deleteHealthRecord,
} from "../controllers/healthRecordController.js";

const router = express.Router();

router.post("/upload", requireSignIn, upload.single("file"), uploadHealthRecord);
router.get("/my", requireSignIn, getMyHealthRecords);
router.get("/patient/:userId", requireSignIn, getPatientHealthRecords);
router.get("/details/:id", requireSignIn, getHealthRecordDetails);
router.delete("/delete/:id", requireSignIn, deleteHealthRecord);

export default router;
