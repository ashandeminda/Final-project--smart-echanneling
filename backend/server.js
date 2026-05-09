import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Server } from "socket.io";
import userRoutes from "./routes/userRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import healthRecordRoutes from "./routes/healthRecordRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import telemedicineRoutes from "./routes/telemedicineRoutes.js";
// Import AI routes for symptom checker feature
import aiRoutes from "./routes/aiRoutes.js";
import { registerTelemedicineSocket } from "./socket/telemedicineSocket.js";
import userModel from "./models/userModel.js";
import appointmentModel from "./models/appointmentModel.js";


dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_PANEL_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:4173",
  "http://localhost:4174",
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};

const ensureDefaultAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@echanneling.lk").toLowerCase();
  const existingAdmin = await userModel.findOne({ email: adminEmail });

  if (existingAdmin) {
    return;
  }

  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);

  await userModel.create({
    name: process.env.ADMIN_NAME || "Admin",
    email: adminEmail,
    password: hashedPassword,
    phone: process.env.ADMIN_PHONE || "0771234567",
    role: "admin",
  });

  console.log(`Default admin created: ${adminEmail}`);
};

// DATABASE
mongoose
  .connect(`${process.env.MONGO_LOCAL_URL}/doctorapp`)
  .then(async () => {
    console.log("MongoDB Connected");
    await appointmentModel.syncIndexes();
    await ensureDefaultAdmin();
  })
  .catch((err) => {
    console.log("MongoDB Error:", err.message);
    process.exit(1);
  });

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(morgan("dev"));

// STATIC IMAGE ACCESS
app.use("/uploads", express.static("uploads"));

// ROUTES
app.use("/api/v1/test", testRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/doctor", doctorRoutes);
app.use("/api/v1/appointment", appointmentRoutes);
app.use("/api/v1/hospital", hospitalRoutes);
app.use("/api/v1/donation", donationRoutes);
app.use("/api/v1/health-record", healthRecordRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/telemedicine", telemedicineRoutes);
// Mount AI symptom checker routes
app.use("/api/v1/ai", aiRoutes);

// Root route - server health check
app.get("/", (req, res) => {
  res.send("Smart E-Channeling Server Running");
});

const PORT = process.env.PORT || 8080;

const io = new Server(server, {
  cors: corsOptions,
});

registerTelemedicineSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
