import telemedicineSessionModel from "../models/telemedicineSessionModel.js";

const SESSION_TTL_MS = 1000 * 60 * 60 * 4;

const normalizeRole = (role, userRole) => {
  if (role === "doctor" || role === "patient") {
    return role;
  }

  return userRole === "doctor" ? "doctor" : "patient";
};

const pruneSessions = async () => {
  const cutoff = new Date(Date.now() - SESSION_TTL_MS);
  await telemedicineSessionModel.deleteMany({ updatedAt: { $lt: cutoff } });
};

const getOrCreateSession = async (sessionId) => {
  let session = await telemedicineSessionModel.findOne({ sessionId });

  if (session) {
    return session;
  }

  session = await telemedicineSessionModel.create({ sessionId });
  return session;
};

const trimSignals = (signals) => {
  if (signals.length <= 300) {
    return signals;
  }

  return signals.slice(-200);
};

export const joinTelemedicineSession = async (req, res) => {
  try {
    await pruneSessions();

    const { sessionId, role } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const normalizedRole = normalizeRole(role, req.user.role);
    const session = await getOrCreateSession(sessionId);

    session.participants = [
      ...session.participants.filter((item) => item.role !== normalizedRole),
      {
        role: normalizedRole,
        userId: req.user.id,
        joinedAt: new Date(),
        name: req.user.name || "",
      },
    ];

    session.signals = trimSignals([
      ...session.signals,
      {
        id: session.nextSignalId,
        role: normalizedRole,
        signalType: "presence",
        payload: { status: "joined" },
        createdAt: new Date(),
      },
    ]);
    session.nextSignalId += 1;

    await session.save();

    return res.json({
      success: true,
      sessionId,
      role: normalizedRole,
      participants: session.participants.map((item) => item.role),
    });
  } catch (error) {
    return res.status(500).json({ message: "Telemedicine join error" });
  }
};

export const sendTelemedicineSignal = async (req, res) => {
  try {
    await pruneSessions();

    const { sessionId, role, signalType, payload } = req.body;

    if (!sessionId || !signalType) {
      return res.status(400).json({ message: "sessionId and signalType are required" });
    }

    const normalizedRole = normalizeRole(role, req.user.role);
    const session = await getOrCreateSession(sessionId);

    session.signals = trimSignals([
      ...session.signals,
      {
        id: session.nextSignalId,
        role: normalizedRole,
        signalType,
        payload: payload || {},
        createdAt: new Date(),
      },
    ]);
    session.nextSignalId += 1;

    await session.save();

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Telemedicine signal error" });
  }
};

export const getTelemedicineSignals = async (req, res) => {
  try {
    await pruneSessions();

    const { sessionId } = req.params;
    const { role, since } = req.query;
    const normalizedRole = normalizeRole(role, req.user.role);
    const sinceId = Number.parseInt(since || "0", 10) || 0;

    const session = await getOrCreateSession(sessionId);
    const signals = session.signals.filter(
      (item) => item.id > sinceId && item.role !== normalizedRole
    );

    return res.json({
      success: true,
      signals,
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
    await pruneSessions();

    const { sessionId, role } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const normalizedRole = normalizeRole(role, req.user.role);
    const session = await getOrCreateSession(sessionId);

    session.participants = session.participants.filter((item) => item.role !== normalizedRole);
    session.signals = trimSignals([
      ...session.signals,
      {
        id: session.nextSignalId,
        role: normalizedRole,
        signalType: "presence",
        payload: { status: "left" },
        createdAt: new Date(),
      },
    ]);
    session.nextSignalId += 1;

    if (session.participants.length === 0) {
      await telemedicineSessionModel.deleteOne({ _id: session._id });
      return res.json({ success: true });
    }

    await session.save();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Telemedicine leave error" });
  }
};
