import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";

dotenv.config();

const ACTIVE_STATUSES = ["pending", "approved"];

const parseArgs = (argv) => {
  const args = {
    apply: false,
    doctorId: "",
    doctorName: "",
    date: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--apply") {
      args.apply = true;
      continue;
    }

    if (arg === "--doctor-id") {
      args.doctorId = argv[i + 1] || "";
      i += 1;
      continue;
    }

    if (arg === "--doctor-name") {
      args.doctorName = argv[i + 1] || "";
      i += 1;
      continue;
    }

    if (arg === "--date") {
      args.date = argv[i + 1] || "";
      i += 1;
    }
  }

  return args;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveDoctorIds = async ({ doctorId, doctorName }) => {
  if (doctorId) {
    return [doctorId];
  }

  if (!doctorName) {
    return [];
  }

  const doctors = await doctorModel
    .find(
      {
        name: { $regex: `^${escapeRegex(doctorName)}$`, $options: "i" },
      },
      { _id: 1 }
    )
    .lean();

  return doctors.map((doctor) => String(doctor._id));
};

const buildQuery = async (options) => {
  const query = {
    appointmentNo: { $regex: "^[0-9]+$" },
    status: { $in: ACTIVE_STATUSES },
  };

  if (options.date) {
    query.date = options.date;
  }

  const doctorIds = await resolveDoctorIds(options);
  if (options.doctorId || options.doctorName) {
    if (!doctorIds.length) {
      return null;
    }

    query.doctorId = {
      $in: doctorIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  return query;
};

const buildPlan = (appointments) => {
  const groups = new Map();

  for (const appointment of appointments) {
    const key = `${appointment.doctorId}|${appointment.date}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(appointment);
  }

  const updates = [];

  for (const [key, items] of groups.entries()) {
    const sorted = [...items].sort((a, b) => {
      const aKey = `${a.date}|${a.time}|${a.createdAt.toISOString()}|${a._id}`;
      const bKey = `${b.date}|${b.time}|${b.createdAt.toISOString()}|${b._id}`;
      return aKey.localeCompare(bKey);
    });

    const [, date] = key.split("|");

    sorted.forEach((appointment, index) => {
      const nextNo = String(index + 1);
      if (String(appointment.appointmentNo) !== nextNo) {
        updates.push({
          id: String(appointment._id),
          doctorName: appointment.doctorName,
          date,
          time: appointment.time,
          from: String(appointment.appointmentNo),
          to: nextNo,
        });
      }
    });
  }

  return updates;
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  await connectDB();

  try {
    const query = await buildQuery(options);

    if (!query) {
      console.log("No matching doctor found.");
      return;
    }

    const appointments = await appointmentModel
      .find(query, {
        _id: 1,
        doctorId: 1,
        date: 1,
        time: 1,
        appointmentNo: 1,
        createdAt: 1,
      })
      .populate("doctorId", "name")
      .lean();

    const normalized = appointments.map((appointment) => ({
      ...appointment,
      doctorId: String(appointment.doctorId?._id || appointment.doctorId),
      doctorName: appointment.doctorId?.name || "Unknown doctor",
    }));

    const plan = buildPlan(normalized);

    console.log(`Scanned ${normalized.length} active appointments.`);
    console.log(`Found ${plan.length} appointment numbers to update.`);

    for (const item of plan) {
      console.log(
        `${item.doctorName} | ${item.date} | ${item.time} | ${item.from} -> ${item.to}`
      );
    }

    if (!options.apply || !plan.length) {
      if (!options.apply) {
        console.log("Dry run only. Re-run with --apply to save changes.");
      }
      return;
    }

    await appointmentModel.bulkWrite(
      plan.map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: { $set: { appointmentNo: `TMP-${item.id}` } },
        },
      }))
    );

    await appointmentModel.bulkWrite(
      plan.map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: { $set: { appointmentNo: item.to } },
        },
      }))
    );

    console.log(`Applied ${plan.length} appointment number updates successfully.`);
  } finally {
    await mongoose.disconnect();
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to renumber appointments:", error.message);
    process.exit(1);
  });
