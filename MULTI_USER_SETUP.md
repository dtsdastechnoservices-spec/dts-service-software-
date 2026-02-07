# DTS ABB VFD Service System - Multi-User Setup Guide

## 🌍 Enable Global Access for Multiple Users (FREE!)

This guide shows you how to make your DTS app work for **multiple people** across **different networks** without paying anything, now and forever.

---

## ✨ How It Works

The app now uses **ngrok** - a free tunneling service that:
- ✅ Exposes your local backend to the internet
- ✅ Works for unlimited users on any network
- ✅ Free forever (no upgrade needed)
- ✅ Provides a shareable public URL
- ✅ Keeps real-time sync (Socket.IO) working

---

## 🚀 Setup Steps (ONE TIME)

### Step 1: Install Node.js Dependencies
```bash
cd c:\Users\DAS\dts-service-software
npm install
```
This installs `ngrok` and sets up the backend.

### Step 2: Start the Backend with ngrok
```bash
npm run start:ngrok
```

**Look for output like:**
```
✅ BACKEND IS ONLINE & GLOBALLY ACCESSIBLE!
======================================================================

🌐 PUBLIC URL (share this with teammates):
   https://xxxx-yyyy-zzzz.ngrok.io

🖥️  LOCAL URL (same network):
   http://192.168.0.100:5000
```

### Step 3: Share the URL

Copy the **PUBLIC URL** (the ngrok URL) and send it to your team members.

---

## 👥 For Each User (Your Team)

### First Time Setup

1. **Install the APK** on Android phone
   - Get `dts-app-fixed.apk` from you
   - Install via USB or app installer

2. **Open the app** on phone
   - The app will auto-detect backend (might take 10-15 seconds first time)
   - OR click **⚙️ Settings** and paste the ngrok URL

3. **Done!** 
   - App is connected
   - Real-time sync active
   - Ready to create/edit jobs

### Subsequent Users

When someone else wants to use it:
```
1. Receive the PUBLIC URL from you
2. Install APK on their phone
3. Click ⚙️ Settings
4. Paste the URL
5. Click "Test & Save"
6. Done!
```

All users will see **real-time updates** across devices via Socket.IO.

---

## 🔄 Daily Usage

**Every time you want to use the app:**

1. Start backend + ngrok on your PC:
   ```bash
   npm run start:ngrok
   ```

2. Keep this terminal open (internet access stays active)

3. Users open the app and it automatically connects

4. When done, you can close the terminal (everyone disconnects)

---

## ⚙️ Configuration Options

### Option A: Cloud Hosting (Paid, Always On)
- Upgrade ngrok to Paid ($7/month) 
- URL doesn't change on restart
- Backend always reachable
- No local PC needed

### Option B: Local Network (Free, LAN Only)
- URL: `http://192.168.0.100:5000`
- Everyone must be on same WiFi
- No internet tunneling

### Option C: ngrok Free (Best for Small Teams)
- ✅ Free forever
- ✅ Works anywhere
- URL changes on restart (free tier)
- Must keep PC running
- **RECOMMENDED** ← You're here!

---

## 🔐 Security Notes

### ngrok URLs are PUBLIC
Any browser can access `https://xxxx.ngrok.io` - keep your team small!

**To restrict access:**
- Set up authentication in the backend (future feature)
- Or keep API secret URLs that aren't guessable
- Or upgrade ngrok for IP whitelisting ($7/month)

---

## 🛠️ Troubleshooting

### "Cannot reach server"
1. Check if PC is still running the terminal
2. Verify you're using the correct ngrok URL
3. Click ⚙️ Settings and test again

### "Jobs not syncing in real-time"
1. Socket.IO connection might have dropped
2. Refresh the app
3. Check the ngrok terminal for errors

### "ngrok URL changed"
- Free tier generates new URL each restart
- Share the new URL with your team
- OR upgrade ngrok to keep same URL

### "ngrok stops after 2 hours"
- Free tier limits sessions
- Upgrade to ngrok paid ($7/month) for unlimited
- OR just restart the npm command

---

## 📱 APK Download

Get the latest APK from:
- **Desktop**: `C:\Users\DAS\OneDrive\Desktop\dts-app-fixed.apk`
- **Share**: Send this file via:
  - Email
  - Google Drive
  - WeTransfer
  - Or copy to USB

Anyone can install it - it works on Android 8+

---

## 🎯 Next Steps

1. ✅ Start backend: `npm run start:ngrok`
2. ✅ Copy ngrok URL from terminal
3. ✅ Share URL + APK with team
4. ✅ Each person opens app and enters URL
5. ✅ Start creating jobs with real-time sync!

---

## 📞 Support

For issues:
1. Check the error message in chrome://inspect (remote debugging)
2. Verify ngrok terminal shows no errors
3. Try restarting backend: `npm run start:ngrok`
4. Confirm everyone's on latest APK

---

## 🎉 You're Set!

Your app now works for **unlimited users** on **any network** with **real-time sync** - all for FREE! 🚀

**Remember:** Keep the `npm run start:ngrok` terminal open when anyone is using the app.
