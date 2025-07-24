const express = require("express");
const upload = require("./tools/fileUpload");
const path = require("path");
const fs = require("fs");
const extractPdfText = require("./tools/PdfParser");
const generateExcel = require("./generator/generateExcel");

const app = express();
const port = 3000;


const uploadDir = path.join(__dirname, "uploads");
const downloadDir = path.join(__dirname, "downloads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);





app.post("/upload", upload.array("file"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No PDF files uploaded." });
  }

  const results = [];

  for (const file of req.files) {
    const result = {
      file: file.originalname,
      success: false,
      error: null,
      tables: null,
    };

    try {
      console.log(`📄 Processing: ${file.originalname} => ${file.path}`);

      if (!file.mimetype.includes("pdf")) {
        result.error = "Only PDF files are allowed.";
        results.push(result);
        continue;
      }

      const parsed = await extractPdfText(file.path);
      if (parsed.success) {
        result.success = true;
        result.tables = parsed.tables;
      } else {
        result.error = parsed.error || "Failed to parse PDF.";
      }
    } catch (err) {
      console.error(`❌ Error processing file ${file.originalname}:`, err.message);
      result.error = err.message;
    }

    // Push result BEFORE deleting file
    results.push(result);

    // Delete file after processing
    if (file?.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupErr) {
        console.warn(`⚠️ Failed to delete file: ${file.path}`);
      }
    }
  }

  const outputPath = path.join(downloadDir, "output.xlsx");
  await generateExcel(results, outputPath);

  res.status(200).json({
    message: "Excel exported successfully.",
    file: "output.xlsx",
    path: outputPath,
    result: results,
  });
});







app.get("/", (req, res) => {
  res.send("✅ PDF to Table API is running!");
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
