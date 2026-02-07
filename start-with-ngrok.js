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

async function getConnectUrl() {
  try {
    const fs = require("fs");
    const os = require("os");
    const configDir = path.join(os.homedir(), ".ngrok2");
    const configFile = path.join(configDir, "ngrok.yml");
    
    if (fs.existsSync(configFile)) {
      const content = fs.readFileSync(configFile, "utf8");
      const match = content.match(/authtoken:\s*(.+)/);
      return match ? match[1].trim() : null;
    }
  } catch (e) {
    console.log("⚠️  No ngrok auth token found. Using free tier (URL changes on restart)");
  }
  return null;
}

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
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Start ngrok tunnel
  try {
    console.log("\n⏳ Setting up ngrok tunnel...");
    
    const authToken = await getConnectUrl();
    if (authToken) {
      await ngrok.authtoken(authToken);
      console.log("✅ ngrok authenticated");
    } else {
      console.log("⚠️  Using free ngrok (URL regenerates each restart)");
      console.log("📝 Upgrade at: https://dashboard.ngrok.com");
    }

    const url = await ngrok.connect(LOCAL_PORT);
    
    console.log("\n" + "=".repeat(70));
    console.log("✅ BACKEND IS ONLINE & GLOBALLY ACCESSIBLE!");
    console.log("=".repeat(70));
    console.log(`\n🌐 PUBLIC URL (share this with teammates):\n   ${url}`);
    console.log(`\n🖥️  LOCAL URL (same network):\n   http://192.168.0.100:${LOCAL_PORT}`);
    console.log("\n📱 How to use:");
    console.log("   1. Share the PUBLIC URL with any teammate on any network");
    console.log("   2. They can use it on their phone, laptop, anywhere");
    console.log("   3. Real-time sync works automatically via Socket.IO");
    console.log("\n⚡ This terminal must stay open for everyone to access!");
    console.log("=".repeat(70) + "\n");

    // Save URL to file for reference
    const urlFile = path.join(__dirname, ".ngrok-url");
    fs.writeFileSync(urlFile, url, "utf8");
    console.log(`📝 URL saved to: ${urlFile}`);

  } catch (err) {
    console.error("❌ ngrok tunnel failed:", err.message);
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n\n🛑 Shutting down...");
    await ngrok.disconnect();
    await ngrok.kill();
    server.kill();
    process.exit(0);
  });
}

startServices().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
