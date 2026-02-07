const express = require("express");
const PDFDocument = require("pdfkit");
const db = require("../db/database");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const pdfOutputDir = path.join(__dirname, "../../pdfs");
if (!fs.existsSync(pdfOutputDir)) fs.mkdirSync(pdfOutputDir, { recursive: true });

/* ================= PDF GENERATOR ================= */
function generatePDF(res, job, reports = {}, mode = "preview") {
  try {
    console.log(`\n📄 Starting PDF generation for Job ${job.job_no} (Mode: ${mode})`);
    console.log(`📊 Reports received:`, Object.keys(reports).filter(k => reports[k]));
    
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 45, right: 45 },
      bufferPages: true
    });

    // Set response headers BEFORE writing
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 
      mode === "preview" 
        ? `inline; filename=Job_${job.job_no}_PREVIEW.pdf` 
        : `attachment; filename=Job_${job.job_no}.pdf`
    );

    // Pipe to response AND save to disk for debugging
    const filename = `Job_${job.job_no}_${Date.now()}.pdf`;
    const filepath = path.join(pdfOutputDir, filename);
    const fileStream = fs.createWriteStream(filepath);
    const stream = doc.pipe(res);
    doc.pipe(fileStream);

    console.log(`✅ PDF document created and piped to response`);
    console.log(`💾 PDF also saving to: ${filepath}`);

    // Handle errors
    doc.on("error", (err) => {
      console.error("❌ PDF document error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "PDF generation failed" });
      }
    });

    stream.on("error", (err) => {
      console.error("❌ Stream error:", err);
    });

    res.on("error", (err) => {
      console.error("❌ Response error:", err);
    });

    /* ================= CONTENT GENERATION ================= */

    const inspectionTemplate =
`After detailed inspection and diagnostic evaluation, the unit was found to have internal electrical malfunction.

Necessary diagnostic checks were carried out to identify the root cause.

(Detailed internal inspection checklists are maintained for internal service records and are not included in this report.)`;

    const serviceTemplate =
`The following service actions were performed:

• Internal electrical section serviced  
• Defective components replaced  
• Internal connections cleaned and secured  
• Cooling system checked and restored  
• Complete functional verification completed  

All repairs were carried out using standard industrial service procedures.`;

    const testingTemplate =
`The drive was tested under controlled conditions with rated input supply.

Test Results:
✔ Drive operates normally  
✔ No abnormal heating observed  
✔ Output parameters within permissible limits  
✔ Unit successfully passed load testing`;

    const warrantyTemplate =
`The repair is covered under warranty against workmanship-related defects.

WARRANTY PERIOD:
Start Date: ${job.warranty_start || "N/A"}
End Date: ${job.warranty_end || "N/A"}

Warranty does not cover physical damage, mishandling, improper installation, or electrical misuse.`;

  // Merge template + user input
  const inspectionReport = reports.inspection_report
    ? inspectionTemplate + "\n\nAdditional Remarks:\n" + reports.inspection_report
    : inspectionTemplate;

  const serviceReport = reports.service_report
    ? serviceTemplate + "\n\nAdditional Remarks:\n" + reports.service_report
    : serviceTemplate;

  const testingReport = reports.testing_report
    ? testingTemplate + "\n\nAdditional Remarks:\n" + reports.testing_report
    : testingTemplate;

  const warrantyReport = reports.warranty_report
    ? warrantyTemplate + "\n\nAdditional Remarks:\n" + reports.warranty_report
    : warrantyTemplate;

  /* ================= HEADER ================= */
    try {
      doc.font("Helvetica-Bold");
    } catch (e) {
      console.log("⚠️  Helvetica-Bold not available, using default font");
    }
    doc
      .fontSize(18)

  doc
    .moveDown(0.2)
    .fontSize(11)
    .font("Helvetica")
    .text("VFD INSPECTION & SERVICE REPORT", { align: "center" });

  doc.moveDown(0.8);
  doc.moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  /* ================= JOB DETAILS ================= */
  doc.fontSize(10).font("Helvetica-Bold").text("JOB DETAILS");
  doc.moveDown(0.4);
  doc.font("Helvetica");

  const jobDetails = [
    ["Job No", job.job_no],
    ["Client Name", job.client_name],
    ["Entry Date", job.entry_date],
    ["Make", job.make],
    ["Model No", job.model_no],
    ["Serial No", job.serial_no],
    ["Reported Fault", job.fault],
  ];

  jobDetails.forEach(([label, value]) => {
    doc.text(`${label.padEnd(15)} : ${value || "-"}`);
  });

  doc.moveDown(1);
  doc.moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  /* ================= TECHNICIAN CHECKS ================= */
  doc.fontSize(10).font("Helvetica-Bold").text("TECHNICIAN CHECKS");
  doc.moveDown(0.4);
  doc.font("Helvetica");

  const techChecks = [
    ["Input Status", job.input_status],
    ["Output Status", job.output_status],
    ["Choke", job.choke],
    ["Control Board", job.control_card],
    ["Control Board Supply", job.control_card_supply],
    ["Fan", job.fan],
    ["Power Card Condition", job.power_card_condition],
    ["Checked By", job.checked_by],
    ["Repaired By", job.repaired_by],
    ["Repairing Date", job.repairing_date],
  ];

  techChecks.forEach(([label, value]) => {
    if (value) doc.text(`${label.padEnd(25)} : ${value}`);
  });

  if (job.remarks) {
    doc.moveDown(0.5);
    doc.text("Remarks:", { underline: true });
    doc.text(job.remarks);
  }

  doc.moveDown(1);
  doc.moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  /* ================= SECTION HELPER ================= */
  function section(title, content) {
    try {
      const textToRender = content || "[Empty]";
      console.log(`📝 Rendering section "${title}" with text: ${textToRender.substring(0, 80)}...`);
      doc.fontSize(12);
      doc.font("Helvetica-Bold");
      doc.text(title);
      doc.moveDown(0.3);
      doc.fontSize(10.5);
      doc.font("Helvetica");
      doc.text(textToRender, { align: "left", lineGap: 3 });
      doc.moveDown(1.2);
      console.log(`✅ Section added: ${title}`);
    } catch (sectionErr) {
      console.error(`❌ Error in section "${title}":`, sectionErr);
    }
  }

  /* ================= REPORT SECTIONS ================= */
  section("INSPECTION REPORT", inspectionReport);
  section("SERVICE REPORT", serviceReport);
  section("TESTING REPORT", testingReport);
  section("WARRANTY REPORT", warrantyReport);

  /* ================= DECLARATION ================= */
  doc.fontSize(12).font("Helvetica-Bold").text("DECLARATION");
  doc.moveDown(0.3);
  doc
    .fontSize(10.5)
    .font("Helvetica")
    .text(
      "The above-mentioned equipment has been inspected, repaired, and tested as per standard service practices and is found to be in satisfactory working condition at the time of dispatch.",
      { align: "justify", lineGap: 3 }
    );

  doc.moveDown(2);

  /* ================= FOOTER ================= */
  doc.fontSize(10).text("For DAS TECHNO SERVICES");
  doc.moveDown(1.2);
  doc.text("Authorized Signatory");

  doc.moveDown(1.5);
  doc
    .fontSize(9)
    .text("Contact: +91 8401534497 / 8320534497")
    .text("Email: dts@dastechnoservices.com")
    .text("Shivri, Maharashtra");

  console.log(`✅ PDF content complete for Job ${job.job_no}, finalizing...`);
  doc.end();
  console.log(`✅ doc.end() called for Job ${job.job_no}`);
  } catch (err) {
    console.error("❌ PDF generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "PDF generation failed: " + err.message });
    }
  }
}

/* ================= TEST PDF ENDPOINT ================= */
router.get("/test", (req, res) => {
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=test.pdf");
  
  doc.pipe(res);
  doc.fontSize(25).text("TEST PDF", 100, 100);
  doc.fontSize(12).text("If you can see this, PDF generation is working!", 100, 200);
  doc.addPage().text("Page 2 - It works!", 100, 100);
  doc.end();
});

/* ================= PREVIEW ================= */
router.post("/preview/:id", (req, res) => {
  console.log("📥 Preview request received for job ID:", req.params.id);
  console.log("📊 Reports data:", JSON.stringify(req.body, null, 2));
  
  db.get("SELECT * FROM jobs WHERE id=?", [req.params.id], (err, job) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(404).json({ error: "Job not found" });
    }
    if (!job) {
      console.error("❌ Job not found");
      return res.status(404).json({ error: "Job not found" });
    }
    console.log("✅ Job found:", job.job_no);
    generatePDF(res, job, req.body, "preview");
  });
});

/* ================= GENERATE ================= */
router.post("/generate/:id", (req, res) => {
  console.log("📥 Generate request received for job ID:", req.params.id);
  console.log("📊 Reports data:", JSON.stringify(req.body, null, 2));
  
  const reports = req.body;

  db.run(
    `
    UPDATE jobs SET
      inspection_report=?,
      service_report=?,
      testing_report=?,
      warranty_report=?,
      dispatch_date=?,
      job_status='COMPLETED'
    WHERE id=?
    `,
    [
      reports.inspection_report || "",
      reports.service_report || "",
      reports.testing_report || "",
      reports.warranty_report || "",
      new Date().toISOString().split('T')[0],
      req.params.id,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.get("SELECT * FROM jobs WHERE id=?", [req.params.id], (err, job) => {
        if (err || !job) return res.status(404).json({ error: "Job not found" });
        generatePDF(res, job, reports, "generate");
      });
    }
  );
});

module.exports = router;
