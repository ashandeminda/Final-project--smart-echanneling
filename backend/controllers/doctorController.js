import bcrypt from "bcryptjs";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";
import appointmentModel from "../models/appointmentModel.js";

const withPatientCounts = async (doctors) => {
  const doctorList = Array.isArray(doctors) ? doctors : [doctors].filter(Boolean);

  if (!doctorList.length) {
    return Array.isArray(doctors) ? [] : null;
  }

  const doctorIds = doctorList.map((doctor) => doctor._id);
  const appointments = await appointmentModel.find(
    { doctorId: { $in: doctorIds } },
    "doctorId userId"
  );

  const patientCountsByDoctor = new Map();

  for (const doctor of doctorList) {
    patientCountsByDoctor.set(String(doctor._id), new Set());
  }

  for (const appointment of appointments) {
    const doctorKey = String(appointment.doctorId);
    const patientKey = String(appointment.userId);

    if (patientCountsByDoctor.has(doctorKey)) {
      patientCountsByDoctor.get(doctorKey).add(patientKey);
    }
  }

  const enrichedDoctors = doctorList.map((doctor) => ({
    ...doctor,
    patientsCount: patientCountsByDoctor.get(String(doctor._id))?.size || 0,
  }));

  return Array.isArray(doctors) ? enrichedDoctors : enrichedDoctors[0];
};

// CREATE DOCTOR
export const createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialization,
      experience,
      hospital,
      fee,
      availableDays,
      videoConsultationEnabled,
      chatConsultationEnabled,
    } = req.body;

    if (!name || !specialization || !hospital || !fee) {
      return res.status(400).json({ message: "Missing required doctor fields" });
    }

    let doctorUserId = req.user.id;

    if (req.user.role === "admin") {
      if (!email || !password || !phone) {
        return res
          .status(400)
          .json({ message: "Doctor email, password, and phone are required" });
      }

      const existingUser = await userModel.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: "A user already exists with this email" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const doctorUser = await userModel.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        role: "doctor",
      });

      doctorUserId = doctorUser._id;
    } else if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only admin or doctor can create doctor profiles" });
    }

    const existingDoctor = await doctorModel.findOne({ userId: doctorUserId });
    if (existingDoctor) {
      return res.status(400).json({ message: "Doctor profile already exists for this user" });
    }

    const doctor = await doctorModel.create({
      userId: doctorUserId,
      name,
      specialization,
      experience,
      hospital,
      fee,
      availableDays: availableDays ? JSON.parse(availableDays) : [],
      videoConsultationEnabled: String(videoConsultationEnabled) === "true",
      chatConsultationEnabled: String(chatConsultationEnabled) === "true",
      image: req.file ? req.file.filename : "",
    });

    res.status(201).json({ message: "Doctor Created", doctor });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Create Doctor Error" });
  }
};

// GET ALL DOCTORS
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel
      .find({ isApproved: true })
      .populate("userId", "name email phone")
      .lean();

    const doctorsWithCounts = await withPatientCounts(doctors);

    res.json(doctorsWithCounts);
  } catch (error) {
    res.status(500).json({ message: "Get Doctors Error" });
  }
};

// GET SINGLE DOCTOR
export const getSingleDoctor = async (req, res) => {
  try {
    const doctor = await doctorModel.findById(req.params.id).lean();

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const doctorWithCount = await withPatientCounts(doctor);

    res.json(doctorWithCount);
  } catch (error) {
    res.status(500).json({ message: "Get Doctor Error" });
  }
};

// GET LOGGED-IN DOCTOR PROFILE
export const getMyDoctorProfile = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Doctor access only" });
    }

    const doctor = await doctorModel
      .findOne({ userId: req.user.id })
      .populate("userId", "name email phone");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ message: "Get My Doctor Profile Error" });
  }
};

// UPDATE DOCTOR
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await doctorModel.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const updatedDoctor = await doctorModel.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        availableDays: req.body.availableDays
          ? JSON.parse(req.body.availableDays)
          : doctor.availableDays,
        videoConsultationEnabled:
          req.body.videoConsultationEnabled !== undefined
            ? String(req.body.videoConsultationEnabled) === "true"
            : doctor.videoConsultationEnabled,
        chatConsultationEnabled:
          req.body.chatConsultationEnabled !== undefined
            ? String(req.body.chatConsultationEnabled) === "true"
            : doctor.chatConsultationEnabled,
        image: req.file ? req.file.filename : doctor.image,
      },
      { new: true }
    );

    res.json({ message: "Doctor Updated", updatedDoctor });
  } catch (error) {
    res.status(500).json({ message: "Update Doctor Error" });
  }
};

// DELETE DOCTOR
export const deleteDoctor = async (req, res) => {
  try {
    const doctorToDelete = await doctorModel.findById(req.params.id);
    if (doctorToDelete && doctorToDelete.userId) {
      await userModel.findByIdAndDelete(doctorToDelete.userId);
    }
    await doctorModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Doctor Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete Doctor Error" });
  }
};

// GET ALL DOCTORS FOR ADMIN (including unapproved)
export const getAllDoctorsAdmin = async (req, res) => {
  try {
    const doctors = await doctorModel
      .find()
      .populate("userId", "name email phone")
      .lean();

    const doctorsWithCounts = await withPatientCounts(doctors);

    res.json(doctorsWithCounts);
  } catch (error) {
    res.status(500).json({ message: "Get Doctors Error" });
  }
};

// APPROVE / REJECT DOCTOR (toggle isApproved)
export const approveDoctorController = async (req, res) => {
  try {
    const doctor = await doctorModel.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    doctor.isApproved = req.body.isApproved;
    await doctor.save();

    res.json({
      message: doctor.isApproved ? "Doctor Approved" : "Doctor Rejected",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: "Approve Doctor Error" });
  }
};

// UPDATE LOGGED-IN DOCTOR SCHEDULE
export const updateMyDoctorSchedule = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Doctor access only" });
    }

    const doctor = await doctorModel.findOne({ userId: req.user.id });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const { availableDays, videoConsultationEnabled, chatConsultationEnabled } = req.body;

    if (!Array.isArray(availableDays)) {
      return res.status(400).json({ message: "availableDays must be an array" });
    }

    doctor.availableDays = availableDays;
    if (typeof videoConsultationEnabled === "boolean") {
      doctor.videoConsultationEnabled = videoConsultationEnabled;
    }
    if (typeof chatConsultationEnabled === "boolean") {
      doctor.chatConsultationEnabled = chatConsultationEnabled;
    }
    await doctor.save();

    res.json({
      success: true,
      message: "Schedule updated successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: "Update Doctor Schedule Error" });
  }
};
