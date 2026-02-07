const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const os = require("os");

const app = express();

// Advanced CORS for all networks
const corsOptions = {
  origin: "*",
  credentials: false,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
};
app.use(cors(corsOptions));
app.use(express.json());
const googleSheetRoutes = require("./routes/googleSheetRoutes");


// ------------------ START HTTP + SOCKET.IO ------------------
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("⚡ Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("⚡ Socket disconnected:", socket.id));
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Config endpoint
app.get("/api/config", (req, res) => {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  res.json({ port: 5000, ips });
});

// ------------------ ROUTES ------------------
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes")(io);
const pdfRoutes = require("./routes/pdfRoutes"); // ✅ Add PDF route

// ------------------ USE ROUTES ------------------
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/pdf", pdfRoutes); // ✅ Add PDF route
app.use("/api/sheets", googleSheetRoutes);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ DTS Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Access from mobile: http://192.168.0.100:${PORT}`);
});
