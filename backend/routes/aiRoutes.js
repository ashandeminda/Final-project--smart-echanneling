import express from "express";
import { checkSymptoms } from "../controllers/aiController.js";

const router = express.Router();

router.post("/check-symptoms", checkSymptoms);

export default router;