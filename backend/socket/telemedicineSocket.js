import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

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

      const normalizedRole =
        role === "doctor" || role === "patient"
          ? role
          : socket.user.role === "doctor"
            ? "doctor"
            : "patient";

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

    socket.on("telemedicine:chat-message", ({ sessionId, text, time }) => {
      if (!sessionId || !text?.trim()) return;

      io.to(sessionId).emit("telemedicine:chat-message", {
        id: `${socket.id}-${Date.now()}`,
        role: socket.data.role || (socket.user.role === "doctor" ? "doctor" : "patient"),
        text: text.trim(),
        time,
      });
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
