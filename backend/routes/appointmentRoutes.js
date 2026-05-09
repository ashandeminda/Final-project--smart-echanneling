import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentDetails,
  updateAppointmentStatus,
  cancelUserAppointment,
  deleteAppointment,
  getUserAppointments,
  getUserAppointmentDetails,
  getDoctorAppointments,
  getNextAppointmentNumberForDoctor,
} from "../controllers/appointmentController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", requireSignIn, createAppointment);
router.get("/all", getAllAppointments);
router.get("/details/:id", getAppointmentDetails);
router.put("/update/:id", requireSignIn, updateAppointmentStatus);
router.put("/user/cancel/:id", requireSignIn, cancelUserAppointment);
router.delete("/delete/:id", requireSignIn, deleteAppointment);
router.get("/user/all", requireSignIn, getUserAppointments);
router.get("/user/details/:id", requireSignIn, getUserAppointmentDetails);
router.get("/doctor/all", requireSignIn, getDoctorAppointments);
router.get("/next-number/:doctorId", getNextAppointmentNumberForDoctor);

export default router;
