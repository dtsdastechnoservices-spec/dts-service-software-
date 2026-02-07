#!/usr/bin/env node

/**
 * Multi-user backend server with ngrok tunneling
 * Starts Express backend + ngrok and displays the public URL for sharing
 */

const { spawn } = require("child_process");
const ngrok = require("ngrok");
const fs = require("fs");
const path = require("path");

const LOCAL_PORT = 5000;

async function startServices() {
  console.log("🚀 Starting DTS Backend with ngrok tunneling...\n");

  // Start Express server
  const server = spawn("node", ["src/server.js"], {
    cwd: __dirname,
    stdio: "inherit"
  });

  server.on("error", (err) => {
    console.error("❌ Backend failed to start:", err);
    process.exit(1);
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Start ngrok tunnel
  try {
    console.log("\n⏳ Setting up ngrok tunnel...");
    
    // Connect ngrok (no auth token needed for free tier)
    const publicUrl = await ngrok.connect({
      proto: "http",
      addr: LOCAL_PORT,
      bind_tls: true  // Use HTTPS for public URL
    });
    
    console.log("\n" + "=".repeat(70));
    console.log("✅ BACKEND IS ONLINE & GLOBALLY ACCESSIBLE!");
    console.log("=".repeat(70));
    console.log(`\n🌐 PUBLIC URL (share this with teammates):\n   ${publicUrl}`);
    console.log(`\n🖥️  LOCAL URL (same network):\n   http://192.168.0.100:${LOCAL_PORT}`);
    console.log("\n📱 How to use:");
    console.log("   1. Share the PUBLIC URL with any teammate on any network");
    console.log("   2. They can open the app and paste the URL in Settings");
    console.log("   3. Real-time sync works automatically via Socket.IO");
    console.log("\n⚡ This terminal must stay open for everyone to access!");
    console.log("=".repeat(70) + "\n");

    // Save URL to file for reference
    const urlFile = path.join(__dirname, ".ngrok-url");
    fs.writeFileSync(urlFile, publicUrl, "utf8");
    console.log(`📝 URL saved to: ${urlFile}`);

  } catch (err) {
    console.error("❌ ngrok tunnel failed:", err.message);
    console.log("\n⚠️  Fallback: Backend is still running on http://192.168.0.100:5000");
    console.log("   Use this for local network access if ngrok fails.");
    // Don't exit - let backend continue running
  }

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n\n🛑 Shutting down...");
    try {
      await ngrok.disconnect();
      await ngrok.kill();
    } catch (e) {}
    server.kill();
    process.exit(0);
  });
}

startServices().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
