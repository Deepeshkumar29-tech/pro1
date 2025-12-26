// server.js

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// ------------------- PATH SETUP -------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------- DB CONNECTION -------------------
if (!process.env.MONGODB_URL) {
  console.error("❌ MONGODB_URL not found");
} else {
  mongoose.connect(process.env.MONGODB_URL);

  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB error:", err);
  });
}

// ------------------- SCHEMAS -------------------
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const appointmentSchema = new mongoose.Schema({
  patientName: String,
  doctor: String,
  date: String,
  slot: String,
  username: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Appointment = mongoose.model("Appointment", appointmentSchema);

// ------------------- MIDDLEWARE -------------------
app.use(express.json());
app.use(express.static(__dirname));

// ------------------- ROUTES -------------------
app.get("/api/test", (req, res) => {
  res.json({ message: "API working on Vercel 🚀" });
});

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ username });
    if (exists)
      return res.status(400).json({ message: "User already exists" });

    await new User({ username, password, role: "user" }).save();
    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Register error" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { username, password, role } = req.body;

  if (role === "admin") {
    if (username === "admin" && password === "Admin@123")
      return res.json({ message: "Login ok" });
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const user = await User.findOne({ username, password, role });
  if (!user)
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({ message: "Login ok" });
});

// CREATE APPOINTMENT
app.post("/api/appointments", async (req, res) => {
  const { patient, doctor, date, slot, username } = req.body;

  const booked = await Appointment.findOne({ doctor, date, slot });
  if (booked)
    return res.status(400).json({ message: "Slot already booked" });

  await new Appointment({
    patientName: patient,
    doctor,
    date,
    slot,
    username
  }).save();

  res.status(201).json({ message: "Appointment booked" });
});

// GET APPOINTMENTS
app.get("/api/appointments", async (req, res) => {
  const appointments = await Appointment.find({});
  res.json(appointments);
});

// 🚫 NO app.listen()
// ✅ EXPORT for Vercel
export default app;
