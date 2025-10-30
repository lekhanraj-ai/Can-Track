import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import os from 'os';
import authRoutes from "./routes/auth.js";
import busLocationRoutes from "./routes/busLocation.js";
import friendLocationRoutes from "./routes/friendLocation.js";

dotenv.config();

const app = express();

// ✅ CORS fully open for development testing
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ✅ Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running ✅" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/location", busLocationRoutes);
app.use("/api/friend", friendLocationRoutes);

// ✅ MongoDB Connection
const mongoURI =
  process.env.MONGODB_URI ||
  "mongodb+srv://lekhanraj1605_db_user:ZVQ5ld22pL0QmSIS@cantrack.egzaiyb.mongodb.net/?retryWrites=true&w=majority&appName=CanTrack";

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");
    // Test the connection
    mongoose.connection.db.admin().ping()
      .then(() => console.log("✅ MongoDB Ping successful"))
      .catch(err => console.error("❌ MongoDB Ping failed:", err));
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
  });

// ✅ API ROUTES
app.use("/api/auth", authRoutes);

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ error: err.message });
});

// ✅ Server start (mobile-friendly)
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log("🚀 Backend Server Running");
  console.log(`🌍 Local:    http://10.247.172.187:${PORT}`);
  console.log(
    `📱 Mobile:   http://${getLocalIPAddress()}:${PORT} (Use this in Expo)`
  );
});

// ✅ Function to fetch the Local Network IP
function getLocalIPAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "0.0.0.0";
}
