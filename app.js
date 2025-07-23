// app.js
const express = require("express");
const upload = require("./tools/fileUpload");
const path = require("path");
const fs = require("fs");
const extractPdfText = require("./tools/PdfParser");

const app = express();
const port = 3000;
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!req.file.mimetype.includes("pdf")) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Only PDF files are allowed" });
  }

  try {
    const result = await extractPdfText(req.file.path);
    fs.unlinkSync(req.file.path);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(200).json({ data: result.tables });
  } catch (err) {
    console.error("Error:", err.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      error: "Failed to process PDF",
      details: err.message,
    });
  }
});

// Health check route
app.get("/", (req, res) => {
  res.send("✅ PDF to Table API is running!");
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
