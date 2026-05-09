import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import hospitalModel from "../models/hospitalModel.js";
import donationModel from "../models/donationModel.js";

const authenticateUser = async (email, password) => {
  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return { success: false, status: 400, message: "User not found" };
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return { success: false, status: 401, message: "Invalid Password" };
  }

  const token = JWT.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  user.password = undefined;
  return { success: true, token, user };
};

// ================= REGISTER =================
export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      phone,
    });

    const token = JWT.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.password = undefined;

    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      token,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Register Error" });
  }
};

// ================= LOGIN =================
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const authResult = await authenticateUser(email, password);

    if (!authResult.success) {
      return res.status(authResult.status).json({ message: authResult.message });
    }

    res.json({
      success: true,
      message: "Login Success",
      token: authResult.token,
      user: authResult.user,
    });
  } catch (error) {
    res.status(500).json({ message: "Login Error" });
  }
};

// ================= DOCTOR LOGIN =================
export const doctorLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const authResult = await authenticateUser(email, password);

    if (!authResult.success) {
      return res.status(authResult.status).json({ message: authResult.message });
    }

    if (authResult.user.role !== "doctor") {
      return res.status(403).json({ message: "Doctor access only" });
    }

    return res.json({
      success: true,
      message: "Doctor Login Success",
      token: authResult.token,
      user: authResult.user,
    });
  } catch (error) {
    return res.status(500).json({ message: "Doctor Login Error" });
  }
};

// ================= ADMIN LOGIN =================
export const adminLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const authResult = await authenticateUser(email, password);

    if (!authResult.success) {
      return res.status(authResult.status).json({ message: authResult.message });
    }

    if (authResult.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    return res.json({
      success: true,
      message: "Admin Login Success",
      token: authResult.token,
      user: authResult.user,
    });
  } catch (error) {
    return res.status(500).json({ message: "Admin Login Error" });
  }
};

// ================= GET CURRENT USER =================
export const getCurrentUserController = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: "Fetch User Error" });
  }
};

// ================= GET ALL USERS (ADMIN) =================
export const getAllUsersController = async (req, res) => {
  try {
    const users = await userModel.find().select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: "Fetch Users Error" });
  }
};

// ================= UPDATE PROFILE =================
export const updateUserController = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, phone } = req.body;

    const updated = await userModel.findByIdAndUpdate(
      req.user.id,
      {
        name: name || user.name,
        email: email || user.email,
        phone: phone || user.phone,
        profilePic: req.file ? req.file.filename : user.profilePic,
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile Updated",
      user: updated,
    });
  } catch (error) {
    res.status(500).json({ message: "Update Error" });
  }
};

// ================= ADMIN DASHBOARD STATS =================
export const getAdminStats = async (req, res) => {
  try {
    const totalDoctors = await doctorModel.countDocuments();
    const totalUsers = await userModel.countDocuments({ role: "user" });
    const totalAppointments = await appointmentModel.countDocuments();
    const totalHospitals = await hospitalModel.countDocuments();
    const pendingAppointments = await appointmentModel.countDocuments({ status: "pending" });
    const donationSummary = await donationModel.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalRaised: { $sum: "$amount" },
          donationsCount: { $sum: 1 },
        },
      },
    ]);

    const latestAppointments = await appointmentModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name")
      .populate("doctorId", "name specialization");

    res.json({
      success: true,
      stats: {
        totalDoctors,
        totalUsers,
        totalAppointments,
        totalHospitals,
        pendingAppointments,
        totalRaised: donationSummary[0]?.totalRaised || 0,
        donationsCount: donationSummary[0]?.donationsCount || 0,
      },
      latestAppointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Stats Error" });
  }
};
