import telemedicineSessionModel from "../models/telemedicineSessionModel.js";

const SESSION_TTL_MS = 1000 * 60 * 60 * 4;

export const normalizeTelemedicineRole = (role, userRole) => {
  if (role === "doctor" || role === "patient") {
    return role;
  }

  return userRole === "doctor" ? "doctor" : "patient";
};

export const pruneTelemedicineSessions = async () => {
  const cutoff = new Date(Date.now() - SESSION_TTL_MS);
  await telemedicineSessionModel.deleteMany({
    status: "completed",
    updatedAt: { $lt: cutoff },
  });
};

export const getOrCreateTelemedicineSession = async (sessionId) => {
  let session = await telemedicineSessionModel.findOne({ sessionId });

  if (session) {
    return session;
  }

  session = await telemedicineSessionModel.create({ sessionId });
  return session;
};

export const trimTelemedicineSignals = (signals) => {
  if (signals.length <= 300) {
    return signals;
  }

  return signals.slice(-200);
};

export const appendTelemedicineSignal = (session, { role, signalType, payload }) => {
  session.signals = trimTelemedicineSignals([
    ...session.signals,
    {
      id: session.nextSignalId,
      role,
      signalType,
      payload: payload || {},
      createdAt: new Date(),
    },
  ]);

  const signalId = session.nextSignalId;
  session.nextSignalId += 1;
  return signalId;
};
