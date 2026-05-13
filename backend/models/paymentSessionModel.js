import mongoose from "mongoose";

const paymentSessionSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["donation", "appointment"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "LKR" },
    status: {
      type: String,
      enum: ["initiated", "pending", "completed", "failed", "cancelled"],
      default: "initiated",
    },
    provider: { type: String, default: "stripe" },
    stripeSessionId: { type: String, default: "" },
    stripePaymentIntentId: { type: String, default: "" },
    paymentMethod: { type: String, default: "" },
    reservedAppointmentNo: { type: String, default: "", index: true },
    customer: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "N/A" },
      city: { type: String, default: "Colombo" },
      country: { type: String, default: "Sri Lanka" },
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    relatedDonationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: false,
    },
    relatedAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: false,
    },
    paymentConfirmationEmailsSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const paymentSessionModel =
  mongoose.models.PaymentSession ||
  mongoose.model("PaymentSession", paymentSessionSchema);

export default paymentSessionModel;
