const express = require("express");
const router = express.Router();
const db = require("../db/database");

const { google } = require("googleapis");
const path = require("path");

/**
 * GOOGLE AUTH
 */
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "google-service-account.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = "13gxrOZycnC_WjHxJGSBqEu9p2Niry8PQuR7G9UITx60";
const SHEET_NAME = "Jobs";

/**
 * ===========================
 * SYNC JOBS (NO DISPATCH DATE)
 * ===========================
 */
router.get("/sync-jobs", async (req, res) => {
  try {
    db.all(
      `
      SELECT
        entry_date,
        job_no,
        client_name,
        make,
        model_no,
        serial_no,
        fault,
        dispatch_date
      FROM jobs
      ORDER BY id ASC
      `,
      async (err, rows) => {
        if (err) {
          console.error("❌ DB Error:", err.message);
          return res.status(500).json({ error: err.message });
        }

        if (!rows.length) {
          return res.json({ message: "No jobs to sync" });
        }

        try {
          const authClient = await auth.getClient();
          const sheets = google.sheets({ version: "v4", auth: authClient });

          /**
           * CLEAR DATA (KEEP HEADER)
           */
          await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A2:H`,
          });

          /**
           * MAP DATA (Dispatch Date EMPTY)
           */
          const values = rows.map((job) => [
            job.entry_date || "",
            job.job_no || "",
            job.client_name || "",
            job.make || "",
            job.model_no || "",
            job.serial_no || "",
            job.fault || "",
            job.dispatch_date || "",
          ]);

          /**
           * APPEND DATA
           */
          await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A2`,
            valueInputOption: "RAW",
            requestBody: { values },
          });

          res.json({
            message: "✅ Jobs synced successfully",
            total: rows.length,
          });
        } catch (e) {
          console.error("❌ Google Sheets Error:", e.message);
          res.status(500).json({ error: e.message });
        }
      }
    );
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ==================================
 * UPDATE DISPATCH DATE (PDF GENERATED)
 * ==================================
 */
router.post("/update-dispatch", async (req, res) => {
  try {
    const { job_no } = req.body;

    if (!job_no) {
      return res.status(400).json({ error: "Job No required" });
    }

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    // Read Job No column
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!B2:B1000`,
    });

    const rows = readRes.data.values || [];
    const rowIndex = rows.findIndex((r) => r[0] === job_no);

    if (rowIndex === -1) {
      return res.status(404).json({ error: "Job not found in sheet" });
    }

    const dispatchDate = new Date().toISOString().split("T")[0];
    const targetRow = rowIndex + 2;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!H${targetRow}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[dispatchDate]],
      },
    });

    res.json({
      message: "✅ Dispatch Date updated successfully",
      job_no,
      dispatchDate,
    });
  } catch (err) {
    console.error("❌ Dispatch Update Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
