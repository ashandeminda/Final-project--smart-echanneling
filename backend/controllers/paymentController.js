import Stripe from "stripe";
import appointmentModel from "../models/appointmentModel.js";
import donationModel from "../models/donationModel.js";
import paymentSessionModel from "../models/paymentSessionModel.js";
import userModel from "../models/userModel.js";

const getEnv = (key, fallback = "") => process.env[key] || fallback;

const generateOrderId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const getStripeClient = () => {
  const secretKey = getEnv("STRIPE_SECRET_KEY");

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }

  return new Stripe(secretKey);
};

const getFrontendUrl = () => getEnv("FRONTEND_URL", "http://localhost:5173");

const getNextAppointmentNo = async (doctorId, date) => {
  const appointments = await appointmentModel.find(
    {
      appointmentNo: { $regex: "^[0-9]+$" },
      doctorId,
      date,
    },
    { appointmentNo: 1, _id: 0 }
  );

  const numbers = appointments
    .map((a) => Number.parseInt(a.appointmentNo, 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 100);

  const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;

  return nextNumber <= 100 ? String(nextNumber) : null;
};

const createAppointmentFromSession = async (session) => {
  const { doctorId, date, time, type } = session.payload || {};

  if (!session.userId || !doctorId || !date || !time) {
    throw new Error("Appointment session data is incomplete");
  }

  const existingAppointment = await appointmentModel.findOne({
    doctorId,
    date,
    time,
    status: { $in: ["pending", "approved"] },
  });

  if (existingAppointment) {
    throw new Error("This slot is already booked for the selected doctor");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const appointmentNo = await getNextAppointmentNo(doctorId, date);
    if (!appointmentNo) {
      throw new Error("Appointment numbers are full (1-100)");
    }

    try {
      const appointment = await appointmentModel.create({
        appointmentNo,
        userId: session.userId,
        doctorId,
        date,
        time,
        type,
      });

      session.relatedAppointmentId = appointment._id;
      return appointment;
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
    }
  }

  throw new Error("Failed to generate appointment number");
};

const createDonationFromSession = async (session) => {
  const { name, isAnonymous, campaignKey } = session.payload || {};

  const donation = await donationModel.create({
    userId: session.userId || undefined,
    name: isAnonymous ? "Anonymous" : name || "Anonymous",
    isAnonymous: Boolean(isAnonymous),
    campaignKey: campaignKey || "general",
    amount: session.amount,
    paymentMethod: "stripe",
    status: "completed",
  });

  session.relatedDonationId = donation._id;
  return donation;
};

const ensureCompletedRecord = async (session) => {
  if (session.type === "donation" && !session.relatedDonationId) {
    await createDonationFromSession(session);
  }

  if (session.type === "appointment" && !session.relatedAppointmentId) {
    await createAppointmentFromSession(session);
  }
};

const buildCheckoutUrls = (type) => {
  const frontendUrl = getFrontendUrl();

  if (type === "donation") {
    return {
      successUrl: `${frontendUrl}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/donate?cancelled=true`,
    };
  }

  return {
    successUrl: `${frontendUrl}/appointment-payment?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${frontendUrl}/appointment-payment?cancelled=true`,
  };
};

const createStripeCheckoutSession = async ({
  type,
  amount,
  customerEmail,
  orderId,
  itemName,
  metadata,
}) => {
  const stripe = getStripeClient();
  const { successUrl, cancelUrl } = buildCheckoutUrls(type);

  return stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail || undefined,
    payment_method_types: ["card"],
    billing_address_collection: "auto",
    line_items: [
      {
        price_data: {
          currency: "lkr",
          product_data: {
            name: itemName,
          },
          unit_amount: Math.round(Number(amount) * 100),
        },
        quantity: 1,
      },
    ],
    metadata,
  });
};

export const initiateDonationPayment = async (req, res) => {
  try {
    const { amount, name, isAnonymous, email, phone, campaignKey } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Valid donation amount is required" });
    }

    const displayName = isAnonymous ? "Anonymous" : name || "Anonymous";

    const session = await paymentSessionModel.create({
      orderId: generateOrderId("DON"),
      type: "donation",
      amount: Number(amount),
      status: "pending",
      provider: "stripe",
      paymentMethod: "stripe",
      customer: {
        firstName: displayName.split(" ")[0] || "Anonymous",
        lastName: displayName.split(" ").slice(1).join(" ") || "Donor",
        email: email || "donor@example.com",
        phone: phone || "0770000000",
        address: "Donation",
        city: "Colombo",
        country: "Sri Lanka",
      },
      payload: {
        name: displayName,
        isAnonymous: Boolean(isAnonymous),
        campaignKey: campaignKey || "general",
      },
    });

    const stripeSession = await createStripeCheckoutSession({
      type: "donation",
      amount: session.amount,
      customerEmail: email,
      orderId: session.orderId,
      itemName: "Healthcare Donation",
      metadata: {
        orderId: session.orderId,
        type: "donation",
      },
    });

    session.stripeSessionId = stripeSession.id;
    await session.save();

    return res.json({
      success: true,
      orderId: session.orderId,
      sessionId: stripeSession.id,
      checkoutUrl: stripeSession.url,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to initialize donation payment" });
  }
};

export const initiateAppointmentPayment = async (req, res) => {
  try {
    const { doctorId, date, time, type, amount, doctor, hospital, email, phone } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ message: "Please login to continue" });
    }

    if (!doctorId || !date || !time || !amount) {
      return res.status(400).json({ message: "Appointment payment details are missing" });
    }

    const existingAppointment = await appointmentModel.findOne({
      doctorId,
      date,
      time,
      status: { $in: ["pending", "approved"] },
    });

    if (existingAppointment) {
      return res.status(409).json({
        message: "This slot is already booked for the selected doctor",
      });
    }

    const user = await userModel.findById(req.user.id).select("name email phone");
    const nameParts = String(user?.name || "Patient User").trim().split(" ");

    const session = await paymentSessionModel.create({
      orderId: generateOrderId("APT"),
      type: "appointment",
      userId: req.user.id,
      amount: Number(amount),
      status: "pending",
      provider: "stripe",
      paymentMethod: "stripe",
      customer: {
        firstName: nameParts[0] || "Patient",
        lastName: nameParts.slice(1).join(" ") || "User",
        email: email || user?.email || "patient@example.com",
        phone: phone || user?.phone || "0770000000",
        address: "Appointment",
        city: "Colombo",
        country: "Sri Lanka",
      },
      payload: {
        doctorId,
        date,
        time,
        type: type || "In-Person",
        doctor: doctor || "",
        hospital: hospital || "",
      },
    });

    const stripeSession = await createStripeCheckoutSession({
      type: "appointment",
      amount: session.amount,
      customerEmail: session.customer.email,
      orderId: session.orderId,
      itemName: `${type || "Appointment"} - ${doctor || "Doctor Consultation"}`,
      metadata: {
        orderId: session.orderId,
        type: "appointment",
      },
    });

    session.stripeSessionId = stripeSession.id;
    await session.save();

    return res.json({
      success: true,
      orderId: session.orderId,
      sessionId: stripeSession.id,
      checkoutUrl: stripeSession.url,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to initialize appointment payment" });
  }
};

export const verifyStripeSession = async (req, res) => {
  try {
    const stripe = getStripeClient();
    const stripeSession = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    let session = await paymentSessionModel
      .findOne({ stripeSessionId: stripeSession.id })
      .populate("relatedAppointmentId", "appointmentNo type date time")
      .populate("relatedDonationId", "amount");

    if (!session) {
      return res.status(404).json({ message: "Payment session not found" });
    }

    session.stripePaymentIntentId =
      typeof stripeSession.payment_intent === "string"
        ? stripeSession.payment_intent
        : session.stripePaymentIntentId;

    if (stripeSession.payment_status === "paid") {
      if (session.status !== "completed") {
        await ensureCompletedRecord(session);
      }
      session.status = "completed";
    } else if (stripeSession.status === "expired") {
      session.status = "failed";
    } else if (stripeSession.status === "open") {
      session.status = "pending";
    }

    await session.save();

    session = await paymentSessionModel
      .findById(session._id)
      .populate("relatedAppointmentId", "appointmentNo type date time")
      .populate("relatedDonationId", "amount");

    return res.json({
      success: true,
      status: session.status,
      orderId: session.orderId,
      type: session.type,
      appointment: session.relatedAppointmentId || null,
      donation: session.relatedDonationId || null,
      amount: session.amount,
      payload: session.payload || {},
      createdAt: session.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to verify Stripe session" });
  }
};
