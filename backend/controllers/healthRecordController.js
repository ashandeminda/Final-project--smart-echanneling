import fs from "fs";
import path from "path";
import healthRecordModel from "../models/healthRecordModel.js";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

const removeUploadedFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(process.cwd(), "uploads", filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// ================= UPLOAD HEALTH RECORD =================
export const uploadHealthRecord = async (req, res) => {
  try {
    const { title, description, recordType, recordDate } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    if (!title) {
      removeUploadedFile(req.file.filename);
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      removeUploadedFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "Only PDF, JPG, JPEG, and PNG files are allowed",
      });
    }

    const healthRecord = await healthRecordModel.create({
      userId: req.user.id,
      title,
      description,
      recordType,
      recordDate,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl: `/uploads/${req.file.filename}`,
    });

    return res.status(201).json({
      success: true,
      message: "Health record uploaded successfully",
      healthRecord,
    });
  } catch (error) {
    if (req.file?.filename) {
      removeUploadedFile(req.file.filename);
    }
    return res.status(500).json({ success: false, message: "Upload health record error" });
  }
};

// ================= GET MY HEALTH RECORDS =================
export const getMyHealthRecords = async (req, res) => {
  try {
    const healthRecords = await healthRecordModel
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    return res.json({ success: true, healthRecords });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Fetch health records error" });
  }
};

export const getPatientHealthRecords = async (req, res) => {
  try {
    const { userId } = req.params;
    const { appointmentId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Patient user ID is required" });
    }

    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "Appointment ID is required" });
    }

    if (req.user.role === "admin") {
      const healthRecords = await healthRecordModel
        .find({ userId })
        .sort({ createdAt: -1 });

      return res.json({ success: true, healthRecords });
    }

    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const doctor = await doctorModel.findOne({ userId: req.user.id }).select("_id");

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }

    const appointment = await appointmentModel.findOne({
      _id: appointmentId,
      userId,
      doctorId: doctor._id,
    });

    if (!appointment) {
      return res.status(403).json({
        success: false,
        message: "You can only view records for your own appointment patients",
      });
    }

    const healthRecords = await healthRecordModel
      .find({ userId })
      .sort({ createdAt: -1 });

    return res.json({ success: true, healthRecords });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Fetch patient health records error" });
  }
};

// ================= GET HEALTH RECORD DETAILS =================
export const getHealthRecordDetails = async (req, res) => {
  try {
    const healthRecord = await healthRecordModel
      .findById(req.params.id)
      .populate("userId", "name email");

    if (!healthRecord) {
      return res.status(404).json({ success: false, message: "Health record not found" });
    }

    const isOwner = String(healthRecord.userId?._id || healthRecord.userId) === String(req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    return res.json({ success: true, healthRecord });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Health record details error" });
  }
};

// ================= DELETE HEALTH RECORD =================
export const deleteHealthRecord = async (req, res) => {
  try {
    const healthRecord = await healthRecordModel.findById(req.params.id);

    if (!healthRecord) {
      return res.status(404).json({ success: false, message: "Health record not found" });
    }

    const isOwner = String(healthRecord.userId) === String(req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    await healthRecordModel.findByIdAndDelete(req.params.id);
    removeUploadedFile(healthRecord.fileName);

    return res.json({ success: true, message: "Health record deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Delete health record error" });
  }
};
