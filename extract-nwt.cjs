// extract-nwt.js

const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

(async function run() {
  try {
    // Path to the PDF in the nwt-source folder
    const filePath = path.join(__dirname, "nwt-source", "nwt.pdf");
    const dataBuffer = fs.readFileSync(filePath);

    // Parse PDF text
    const { text } = await pdf(dataBuffer);

    // Split into non-empty trimmed lines
    const lines = text
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    // Write raw lines to JSON for inspection
    const outPath = path.join(__dirname, "nwt-raw.json");
    fs.writeFileSync(outPath, JSON.stringify(lines, null, 2));
    console.log(`→ nwt-raw.json written with ${lines.length} lines`);
  } catch (err) {
    console.error("Extraction error:", err);
    process.exit(1);
  }
})();
