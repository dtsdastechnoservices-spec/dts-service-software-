const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const os = require("os");
const path = require("path");

const app = express();

// Advanced CORS for all networks
const corsOptions = {
  origin: "*",
  credentials: false,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
};
app.use(cors(corsOptions));
app.use(express.json());

// ==================== FAVICON ====================
// Prevent 404 errors for favicon - just return empty response
app.get("/favicon.ico", (req, res) => {
  res.status(204).send(); // 204 No Content - success but no content
});

// ==================== SERVE REACT FRONTEND ====================
// Serve React static files from frontend build
const reactBuildPath = path.join(__dirname, "../../dts-frontend/build");
app.use(express.static(reactBuildPath, { maxAge: "1h" }));

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

// ==================== REACT ROUTER FALLBACK ====================
// Serve index.html for all non-API GET requests (React Router SPA)
app.use((req, res, next) => {
  try {
    if (req.method !== 'GET') return next();
    if (req.path && req.path.startsWith('/api')) return next();
    res.sendFile(path.join(reactBuildPath, 'index.html'), (err) => {
      if (err) return next(err);
    });
  } catch (err) {
    next(err);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ DTS Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Access from mobile: http://192.168.0.100:${PORT}`);
  console.log(`🌐 React frontend served from: ${reactBuildPath}`);
});
