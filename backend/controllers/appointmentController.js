import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import paymentSessionModel from "../models/paymentSessionModel.js";
import { sendApprovalEmails } from "../services/emailService.js";

const TELEMEDICINE_TYPES = ["Video Consultation", "Chat Consultation"];
const APPOINTMENT_RESERVATION_WINDOW_MS = 30 * 60 * 1000;

const formatDatePart = (value) => String(value).padStart(2, "0");

const buildInstantChatSchedule = () => {
  const now = new Date();

  return {
    date: `${now.getFullYear()}-${formatDatePart(now.getMonth() + 1)}-${formatDatePart(
      now.getDate()
    )}`,
    time: `${formatDatePart(now.getHours())}:${formatDatePart(
      now.getMinutes()
    )}:${formatDatePart(now.getSeconds())}`,
  };
};

const getNextAppointmentNo = async (doctorId, date) => {
  const activeReservationCutoff = new Date(Date.now() - APPOINTMENT_RESERVATION_WINDOW_MS);

  const appointmentQuery = {
    appointmentNo: { $regex: "^[0-9]+$" },
    status: { $in: ["pending", "approved"] },
  };
  if (doctorId) appointmentQuery.doctorId = doctorId;
  if (date) appointmentQuery.date = date;

  const sessionQuery = {
    type: "appointment",
    reservedAppointmentNo: { $regex: "^[0-9]+$" },
    status: { $in: ["initiated", "pending"] },
    relatedAppointmentId: { $exists: false },
    createdAt: { $gte: activeReservationCutoff },
  };
  if (doctorId) sessionQuery["payload.doctorId"] = doctorId;
  if (date) sessionQuery["payload.date"] = date;

  const [appointments, reservedSessions] = await Promise.all([
    appointmentModel.find(appointmentQuery, { appointmentNo: 1, _id: 0 }),
    paymentSessionModel.find(sessionQuery, { reservedAppointmentNo: 1, _id: 0 }),
  ]);

  const numbers = [
    ...appointments.map((a) => Number.parseInt(a.appointmentNo, 10)),
    ...reservedSessions.map((session) =>
      Number.parseInt(session.reservedAppointmentNo, 10)
    ),
  ]
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 100);

  const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;

  return nextNumber <= 100 ? String(nextNumber) : null;
};

// ================= CREATE APPOINTMENT =================
export const createAppointment = async (req, res) => {
  try {
    const { doctorId, type } = req.body;
    let { date, time } = req.body;
    const isChatConsultation = type === "Chat Consultation";

    if (isChatConsultation && (!date || !time)) {
      const instantSchedule = buildInstantChatSchedule();
      date = instantSchedule.date;
      time = instantSchedule.time;
    }

    if (!doctorId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "doctorId, date and time are required",
      });
    }

    const existingAppointment = await appointmentModel.findOne({
      doctorId,
      date,
      time,
      status: { $in: ["pending", "approved"] },
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked for the selected doctor",
      });
    }

    if (isChatConsultation) {
      const appointment = await appointmentModel.create({
        userId: req.user.id,
        doctorId,
        date,
        time,
        type,
      });

      return res.status(201).json({
        success: true,
        message: "Chat consultation created successfully",
        appointment,
      });
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const appointmentNo = await getNextAppointmentNo(doctorId, date);
      if (!appointmentNo) {
        return res
          .status(400)
          .json({ message: "Appointment numbers are full (1-100)" });
      }

      try {
        const appointment = await appointmentModel.create({
          appointmentNo,
          userId: req.user.id,
          doctorId,
          date,
          time,
          type,
        });

        return res.status(201).json({
          success: true,
          message: "Appointment Created Successfully",
          appointmentNo: appointment.appointmentNo,
          appointment,
        });
      } catch (createError) {
        if (
          createError?.code === 11000 &&
          createError?.keyPattern?.doctorId &&
          createError?.keyPattern?.date &&
          createError?.keyPattern?.time
        ) {
          return res.status(409).json({
            success: false,
            message: "This slot is already booked for the selected doctor",
          });
        }

        if (createError?.code !== 11000) {
          throw createError;
        }
      }
    }

    return res.status(500).json({ message: "Failed to generate appointment number" });
  } catch (error) {
    console.log("Create Appointment Error:", error);
    res.status(500).json({ message: "Create Appointment Error" });
  }
};

// ================= GET ALL APPOINTMENTS =================
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await appointmentModel
      .find()
      .populate("userId", "name email")
      .populate("doctorId", "name specialization");

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ message: "Fetch Error" });
  }
};

// ================= GET APPOINTMENT DETAILS =================
export const getAppointmentDetails = async (req, res) => {
  try {
    const appointment = await appointmentModel
      .findById(req.params.id)
      .populate("userId", "name email")
      .populate("doctorId", "name specialization");

    if (!appointment)
      return res.status(404).json({ message: "Appointment Not Found" });

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: "Details Fetch Error" });
  }
};

// ================= UPDATE STATUS =================
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, meetingLink } = req.body;
    const allowedStatuses = ["pending", "approved", "rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const appointment = await appointmentModel.findById(req.params.id);

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    if (req.user.role !== "admin" && req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors or admins can update appointments" });
    }

    if (req.user.role === "doctor") {
      const doctor = await doctorModel.findOne({ userId: req.user.id }).select("_id");

      if (!doctor) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }

      if (String(appointment.doctorId) !== String(doctor._id)) {
        return res.status(403).json({ message: "You can only update your own appointments" });
      }

      if (!TELEMEDICINE_TYPES.includes(appointment.type)) {
        return res.status(403).json({
          message: "Doctors can approve or reject only video and chat consultations",
        });
      }
    }

    if (status === "approved" && appointment.type === "Video Consultation") {
      if (!meetingLink || !String(meetingLink).trim()) {
        return res.status(400).json({ message: "Teams meeting link is required for video consultations" });
      }

      try {
        const parsedMeetingUrl = new URL(String(meetingLink).trim());
        if (!["http:", "https:"].includes(parsedMeetingUrl.protocol)) {
          throw new Error("Invalid meeting link");
        }
      } catch {
        return res.status(400).json({ message: "Please provide a valid Teams meeting URL" });
      }

      appointment.meetingProvider = "teams";
      appointment.meetingLink = String(meetingLink).trim();
    }

    if (status !== "approved") {
      appointment.meetingProvider = "";
      appointment.meetingLink = "";
    }

    appointment.status = status;
    await appointment.save();

    res.json({
      success: true,
      message: "Status Updated",
      appointment,
    });

    // Send emails securely in the background if approved and it's a telemedicine session
    if (status === "approved" && TELEMEDICINE_TYPES.includes(appointment.type)) {
      try {
        const fullAppointment = await appointmentModel.findById(appointment._id)
          .populate("userId")
          .populate({
            path: "doctorId",
            populate: { path: "userId" },
          });

        if (fullAppointment?.userId && fullAppointment?.doctorId?.userId) {
          sendApprovalEmails(
            fullAppointment,
            fullAppointment.userId,
            fullAppointment.doctorId.userId
          );
        }
      } catch (emailErr) {
        console.error("Error triggering approval emails:", emailErr);
      }
    }
  } catch (error) {
    if (
      error?.code === 11000 &&
      error?.keyPattern?.doctorId &&
      error?.keyPattern?.date &&
      error?.keyPattern?.time
    ) {
      return res.status(409).json({
        success: false,
        message: "Cannot set this status because the slot is already booked",
      });
    }

    res.status(500).json({ message: "Update Error" });
  }
};

export const cancelUserAppointment = async (req, res) => {
  try {
    const appointment = await appointmentModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!["pending", "approved"].includes(appointment.status)) {
      return res
        .status(400)
        .json({ message: "Only pending or approved appointments can be cancelled" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    return res.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: "Cancel appointment error" });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const appointment = await appointmentModel.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!["approved", "rejected", "cancelled"].includes(appointment.status)) {
      return res.status(400).json({
        message: "Only approved, rejected, or cancelled appointments can be deleted",
      });
    }

    await appointmentModel.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Delete appointment error" });
  }
};

// ================= GET ALL USER APPOINTMENTS =================
export const getUserAppointments = async (req, res) => {
  try {
    const appointments = await appointmentModel
      .find({ userId: req.user.id })
      .populate("doctorId", "name specialization");

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ message: "User Fetch Error" });
  }
};

// ================= GET USER APPOINTMENT DETAILS =================
export const getUserAppointmentDetails = async (req, res) => {
  try {
    const appointment = await appointmentModel
      .findOne({
        _id: req.params.id,
        userId: req.user.id,
      })
      .populate("doctorId", "name specialization");

    if (!appointment)
      return res.status(404).json({ message: "Appointment Not Found" });

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: "User Details Error" });
  }
};

// ================= GET DOCTOR APPOINTMENTS =================
export const getDoctorAppointments = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Doctor access only" });
    }

    const doctor = await doctorModel.findOne({ userId: req.user.id });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointments = await appointmentModel
      .find({ doctorId: doctor._id })
      .populate("userId", "name email phone")
      .sort({ date: 1, time: 1 });

    res.json({ success: true, appointments, doctor });
  } catch (error) {
    res.status(500).json({ message: "Doctor Fetch Error" });
  }
};

export const getNextAppointmentNumberForDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    const appointmentNo = await getNextAppointmentNo(doctorId, date);
    if (!appointmentNo) {
      return res.status(400).json({ message: "Appointment numbers are full (1-100)" });
    }
    res.json({ success: true, appointmentNo });
  } catch (error) {
    res.status(500).json({ message: "Error fetching next appointment number" });
  }
};
