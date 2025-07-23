// server.js or routes/pdf.js
const express = require('express');
const upload = require('./tools/fileUpload'); // Adjust the path as necessary
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.post('/upload', upload.single('file'), (req, res) => {
  const pdfPath = req.file.path;
  const pythonScript = path.join(__dirname, 'python', 'pdfExtract.py');

  exec(`python3 ${pythonScript} "${pdfPath}"`, (error, stdout, stderr) => {
    fs.unlinkSync(pdfPath);

    if (error) {
      console.error('Python error:', error);
      return res.status(500).json({ error: 'Python script failed.' });
    }

    try {
      const result = JSON.parse(stdout);
      res.json({ tables: result });
    } catch (err) {
      console.error('JSON parse error:', err);
      res.status(500).json({ error: 'Failed to parse Python output.' });
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
