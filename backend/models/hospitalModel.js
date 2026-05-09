import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    rating: { type: Number, default: 0 },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

const hospitalModel =
  mongoose.models.Hospital || mongoose.model("Hospital", hospitalSchema);

export default hospitalModel;
