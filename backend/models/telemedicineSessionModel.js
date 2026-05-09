import mongoose from "mongoose";

const telemedicineSignalSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    role: { type: String, enum: ["doctor", "patient"], required: true },
    signalType: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const telemedicineParticipantSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["doctor", "patient"], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
    name: { type: String, default: "" },
  },
  { _id: false }
);

const telemedicineSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    participants: { type: [telemedicineParticipantSchema], default: [] },
    signals: { type: [telemedicineSignalSchema], default: [] },
    nextSignalId: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const telemedicineSessionModel =
  mongoose.models.TelemedicineSession ||
  mongoose.model("TelemedicineSession", telemedicineSessionSchema);

export default telemedicineSessionModel;
