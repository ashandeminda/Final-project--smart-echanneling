import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNo: {
      type: String,
      required: false,
      index: true,
      sparse: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["In-Person", "Telemedicine", "Video Consultation", "Chat Consultation"],
      default: "In-Person",
    },
    meetingProvider: {
      type: String,
      enum: ["internal", "teams", ""],
      default: "",
    },
    meetingLink: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

appointmentSchema.index(
  { doctorId: 1, date: 1, time: 1, type: 1, appointmentNo: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "approved"] },
      appointmentNo: { $exists: true, $type: "string" },
    },
  }
);

const appointmentModel =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);

export default appointmentModel;
