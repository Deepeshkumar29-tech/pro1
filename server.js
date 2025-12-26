// server.js

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------- PATH SETUP -------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------- DB CONNECTION -------------------
if (!process.env.MONGODB_URL) {
    console.error("❌ MONGODB_URL not found in .env");
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URL);

mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

// ------------------- SCHEMAS -------------------
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const appointmentSchema = new mongoose.Schema({
    patientName: {
        type: String,
        required: true
    },
    doctor: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    slot: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

// ------------------- MIDDLEWARE -------------------
app.use(express.json());
app.use(express.static(__dirname)); // serve index.html, css, js

// ------------------- TEST -------------------
app.get("/api/test", (req, res) => {
    res.json({ message: "API working" });
});

// ------------------- REGISTER -------------------
app.post("/api/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("REGISTER:", username);

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password required" });
        }

        const existing = await User.findOne({ username });

        if (existing) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const newUser = new User({ username, password, role: 'user' });
        await newUser.save();

        res.status(201).json({ message: "Registered successfully" });

    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ message: "Server error while registering" });
    }
});

// ------------------- LOGIN -------------------
app.post("/api/login", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        const user = await User.findOne({ username, password, role });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.json({ message: "Login ok" });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ message: "Server error while logging in" });
    }
});

// ------------------- CREATE APPOINTMENT -------------------
app.post("/api/appointments", async (req, res) => {
    try {
        const { patient, doctor, date, slot, username } = req.body;

        if (!patient || !doctor || !date || !slot || !username) {
            return res.status(400).json({ message: "All fields required" });
        }

        const existing = await Appointment.findOne({ doctor, date, slot });

        if (existing) {
            return res.status(400).json({ message: "Slot already booked" });
        }

        const newAppointment = new Appointment({
            patientName: patient,
            doctor,
            date,
            slot,
            username
        });
        await newAppointment.save();

        res.status(201).json({ message: "Appointment booked" });

    } catch (err) {
        console.error("APPOINTMENT ERROR:", err);
        res.status(500).json({ message: "Server error while booking" });
    }
});

// ------------------- GET APPOINTMENTS -------------------
app.get("/api/appointments", async (req, res) => {
    try {
        const { username } = req.query;

        let appointments;
        if (username) {
            appointments = await Appointment.find({ username })
                .sort({ date: 1, slot: 1 })
                .select('doctor date slot');
        } else {
            appointments = await Appointment.find({})
                .sort({ date: 1, slot: 1 })
                .select('patientName doctor date slot');
        }

        // Transform for consistent response format
        const response = appointments.map(apt => ({
            patient: apt.patientName,
            doctor: apt.doctor,
            date: apt.date,
            slot: apt.slot
        }));

        res.json(response);

    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).json({ message: "Server error while fetching" });
    }
});

// ------------------- START -------------------
app.listen(PORT, () => {
    console.log(`✅ Backend running on port ${PORT}`);
});
