import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // User might be anonymous
        },
        name: { type: String, default: "Anonymous" },
        isAnonymous: { type: Boolean, default: false },
        campaignKey: {
            type: String,
            enum: [
                "child-healthcare",
                "cancer-treatment",
                "emergency-aid",
                "senior-care",
                "general",
            ],
            default: "general",
        },
        amount: { type: Number, required: true },
        status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
        paymentMethod: { type: String, default: "card" },
    },
    { timestamps: true }
);

const donationModel =
    mongoose.models.Donation || mongoose.model("Donation", donationSchema);

export default donationModel;
