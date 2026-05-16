import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import {
  appendTelemedicineSignal,
  getOrCreateTelemedicineSession,
  normalizeTelemedicineRole,
} from "../services/telemedicineSessionService.js";

const getSocketUser = async (socket) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    throw new Error("Authentication required");
  }

  const decoded = JWT.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id || decoded._id;

  if (!userId) {
    throw new Error("Invalid token");
  }

  const user = await userModel.findById(userId).select("name role");

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: userId,
    name: user.name,
    role: user.role,
  };
};

export const registerTelemedicineSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      socket.user = await getSocketUser(socket);
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on("connection", (socket) => {
    socket.on("telemedicine:join", ({ sessionId, role }) => {
      if (!sessionId) return;

      const normalizedRole = normalizeTelemedicineRole(role, socket.user.role);

      socket.data.sessionId = sessionId;
      socket.data.role = normalizedRole;
      socket.join(sessionId);

      socket.to(sessionId).emit("telemedicine:presence", {
        role: normalizedRole,
        status: "joined",
        name: socket.user.name,
      });

      socket.emit("telemedicine:joined", {
        sessionId,
        role: normalizedRole,
      });
    });

    socket.on("telemedicine:chat-message", async ({ sessionId, text, time }) => {
      if (!sessionId || !text?.trim()) return;

      const normalizedRole =
        socket.data.role || normalizeTelemedicineRole(undefined, socket.user.role);

      try {
        const session = await getOrCreateTelemedicineSession(sessionId);
        if (session.status === "completed") {
          socket.emit("telemedicine:session-ended", {
            endedBy: session.endedBy || "doctor",
            endedAt: session.endedAt,
          });
          return;
        }

        const signalId = appendTelemedicineSignal(session, {
          role: normalizedRole,
          signalType: "chat-message",
          payload: {
            text: text.trim(),
            time,
          },
        });
        await session.save();

        io.to(sessionId).emit("telemedicine:chat-message", {
          id: signalId,
          role: normalizedRole,
          text: text.trim(),
          time,
        });
      } catch {
        socket.emit("telemedicine:error", {
          message: "Unable to send the message right now",
        });
      }
    });

    socket.on("telemedicine:end-session", async ({ sessionId }) => {
      if (!sessionId) return;

      const normalizedRole =
        socket.data.role || normalizeTelemedicineRole(undefined, socket.user.role);

      if (normalizedRole !== "doctor") {
        socket.emit("telemedicine:error", {
          message: "Only doctors can end consultations",
        });
        return;
      }

      try {
        const session = await getOrCreateTelemedicineSession(sessionId);
        if (session.status !== "completed") {
          session.status = "completed";
          session.endedAt = new Date();
          session.endedBy = "doctor";
          appendTelemedicineSignal(session, {
            role: "doctor",
            signalType: "session-ended",
            payload: { endedBy: "doctor" },
          });
          await session.save();
        }

        io.to(sessionId).emit("telemedicine:session-ended", {
          endedBy: session.endedBy || "doctor",
          endedAt: session.endedAt,
        });
      } catch {
        socket.emit("telemedicine:error", {
          message: "Unable to end the consultation right now",
        });
      }
    });

    socket.on("telemedicine:leave", ({ sessionId }) => {
      if (!sessionId) return;

      socket.leave(sessionId);
      socket.to(sessionId).emit("telemedicine:presence", {
        role: socket.data.role || (socket.user.role === "doctor" ? "doctor" : "patient"),
        status: "left",
        name: socket.user.name,
      });
    });

    socket.on("disconnect", () => {
      const { sessionId } = socket.data;

      if (!sessionId) return;

      socket.to(sessionId).emit("telemedicine:presence", {
        role: socket.data.role || (socket.user.role === "doctor" ? "doctor" : "patient"),
        status: "left",
        name: socket.user.name,
      });
    });
  });
};
