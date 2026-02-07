const express = require("express");
const router = express.Router();

router.post("/jobs", (req, res) => {
  console.log("📥 New job received:", req.body);
  res.status(201).json({ message: "Job saved successfully" });
});

module.exports = router;
