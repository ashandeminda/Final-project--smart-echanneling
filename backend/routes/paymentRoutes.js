import express from "express";
import {
  initiateAppointmentPayment,
  initiateDonationPayment,
  verifyStripeSession,
} from "../controllers/paymentController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/stripe/donation/initiate", initiateDonationPayment);
router.post("/stripe/appointment/initiate", requireSignIn, initiateAppointmentPayment);
router.get("/stripe/session/:sessionId", verifyStripeSession);

export default router;
