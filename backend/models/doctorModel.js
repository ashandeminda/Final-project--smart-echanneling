import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: String, required: true },
    hospital: { type: String, required: true },
    fee: { type: Number, required: true },
    availableDays: { type: [String], default: [] },
    videoConsultationEnabled: { type: Boolean, default: false },
    chatConsultationEnabled: { type: Boolean, default: false },
    image: { type: String, default: "" },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const doctorModel =
  mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);

export default doctorModel;
