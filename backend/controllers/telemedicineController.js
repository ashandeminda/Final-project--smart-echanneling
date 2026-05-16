import mongoose from "mongoose";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import telemedicineSessionModel from "../models/telemedicineSessionModel.js";
import {
  appendTelemedicineSignal,
  getOrCreateTelemedicineSession,
  normalizeTelemedicineRole,
  pruneTelemedicineSessions,
} from "../services/telemedicineSessionService.js";

const formatHistoryMessage = (signal) => ({
  id: signal.id,
  sender: signal.role,
  text: signal.payload?.text || "",
  time: signal.payload?.time || "",
});

export const joinTelemedicineSession = async (req, res) => {
  try {
    await pruneTelemedicineSessions();

    const { sessionId, role } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const normalizedRole = normalizeTelemedicineRole(role, req.user.role);
    const session = await getOrCreateTelemedicineSession(sessionId);

    session.participants = [
      ...session.participants.filter((item) => item.role !== normalizedRole),
      {
        role: normalizedRole,
        userId: req.user.id,
        joinedAt: new Date(),
        name: req.user.name || "",
      },
    ];

    if (session.status !== "completed") {
      appendTelemedicineSignal(session, {
        role: normalizedRole,
        signalType: "presence",
        payload: { status: "joined" },
      });
    }

    await session.save();

    return res.json({
      success: true,
      sessionId,
      role: normalizedRole,
      status: session.status,
      endedAt: session.endedAt,
      endedBy: session.endedBy,
      participants: session.participants.map((item) => item.role),
      messages: session.signals
        .filter((item) => item.signalType === "chat-message")
        .map(formatHistoryMessage),
    });
  } catch (error) {
    return res.status(500).json({ message: "Telemedicine join error" });
  }
};

export const sendTelemedicineSignal = async (req, res) => {
  try {
    await pruneTelemedicineSessions();

    const { sessionId, role, signalType, payload } = req.body;

    if (!sessionId || !signalType) {
      return res.status(400).json({ message: "sessionId and signalType are required" });
    }

    const normalizedRole = normalizeTelemedicineRole(role, req.user.role);
    const session = await getOrCreateTelemedicineSession(sessionId);

    if (session.status === "completed") {
      return res.status(400).json({ message: "This consultation has already ended" });
    }

    appendTelemedicineSignal(session, {
      role: normalizedRole,
      signalType,
      payload,
    });

    await session.save();

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Telemedicine signal error" });
  }
};

export const getTelemedicineSignals = async (req, res) => {
  try {
    await pruneTelemedicineSessions();

    const { sessionId } = req.params;
    const { since } = req.query;
    const sinceId = Number.parseInt(since || "0", 10) || 0;

    const session = await getOrCreateTelemedicineSession(sessionId);
    const signals = session.signals.filter((item) => item.id > sinceId);

    return res.json({
      success: true,
      signals,
      status: session.status,
      endedAt: session.endedAt,
      endedBy: session.endedBy,
      participants: session.participants.map((item) => item.role),
      lastSignalId: session.signals.length
        ? session.signals[session.signals.length - 1].id
        : sinceId,
    });
  } catch (error) {
    return res.status(500).json({ message: "Telemedicine fetch error" });
  }
};

export const leaveTelemedicineSession = async (req, res) => {
  try {
    await pruneTelemedicineSessions();

    const { sessionId, role } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const normalizedRole = normalizeTelemedicineRole(role, req.user.role);
    const session = await getOrCreateTelemedicineSession(sessionId);

    session.participants = session.participants.filter((item) => item.role !== normalizedRole);

    if (session.status !== "completed") {
      appendTelemedicineSignal(session, {
        role: normalizedRole,
        signalType: "presence",
        payload: { status: "left" },
      });
    }

    if (session.participants.length === 0 && session.status === "completed") {
      await telemedicineSessionModel.deleteOne({ _id: session._id });
      return res.json({ success: true });
    }

    await session.save();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Telemedicine leave error" });
  }
};

export const endTelemedicineSession = async (req, res) => {
  try {
    await pruneTelemedicineSessions();

    const { sessionId, role } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const normalizedRole = normalizeTelemedicineRole(role, req.user.role);
    if (normalizedRole !== "doctor") {
      return res.status(403).json({ message: "Only doctors can end consultations" });
    }

    const doctor = await doctorModel.findOne({ userId: req.user.id }).select("_id");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const session = await getOrCreateTelemedicineSession(sessionId);
    if (session.status === "completed") {
      return res.json({ success: true, status: session.status, endedAt: session.endedAt });
    }

    session.status = "completed";
    session.endedAt = new Date();
    session.endedBy = "doctor";
    appendTelemedicineSignal(session, {
      role: normalizedRole,
      signalType: "session-ended",
      payload: { endedBy: "doctor" },
    });

    await session.save();

    if (mongoose.Types.ObjectId.isValid(sessionId)) {
      await appointmentModel.deleteOne({
        _id: sessionId,
        doctorId: doctor._id,
        type: "Chat Consultation",
      });
    }

    return res.json({
      success: true,
      status: session.status,
      endedAt: session.endedAt,
      endedBy: session.endedBy,
    });
  } catch (error) {
    return res.status(500).json({ message: "End consultation error" });
  }
};
