import mongoose from "mongoose";

const healthRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    recordType: {
      type: String,
      enum: ["Lab Report", "Prescription", "Scan", "Discharge Summary", "Other"],
      default: "Other",
    },
    recordDate: {
      type: Date,
      default: Date.now,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const healthRecordModel =
  mongoose.models.HealthRecord ||
  mongoose.model("HealthRecord", healthRecordSchema);

export default healthRecordModel;
