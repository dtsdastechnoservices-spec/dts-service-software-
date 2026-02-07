const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./src/dts.db");

db.serialize(() => {
  // USERS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  // JOBS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      -- CUSTOMER INFO (visible in PDF)
      entry_date TEXT,
      job_no TEXT,
      make TEXT,
      model_no TEXT,
      serial_no TEXT,
      fault TEXT,
      client_name TEXT,

      -- TECHNICIAN CHECKS (internal only)
      input_choke TEXT,
      output_choke TEXT,
      choke TEXT,
      control_card TEXT,
      control_card_supply TEXT,
      fan TEXT,
      power_card TEXT,
      checked_by TEXT,
      repaired_by TEXT,

      -- REPAIR & WARRANTY DETAILS (filled later)
      repair_date TEXT,
      warranty_start TEXT,
      warranty_end TEXT,
      final_remarks TEXT,
      dispatch_date TEXT,

      -- REPORTS (stored for future use)
      inspection_report TEXT,
      service_report TEXT,
      testing_report TEXT,
      warranty_report TEXT,

      -- STATUS
      job_status TEXT DEFAULT 'JOB RECEIVED',

      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
});

module.exports = db;
