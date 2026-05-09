import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import {
  getTelemedicineSignals,
  joinTelemedicineSession,
  leaveTelemedicineSession,
  sendTelemedicineSignal,
} from "../controllers/telemedicineController.js";

const router = express.Router();

router.post("/join", requireSignIn, joinTelemedicineSession);
router.post("/signal", requireSignIn, sendTelemedicineSignal);
router.get("/signals/:sessionId", requireSignIn, getTelemedicineSignals);
router.post("/leave", requireSignIn, leaveTelemedicineSession);

export default router;
