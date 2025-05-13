cat > extract-genesis.cjs << 'EOF'
// extract-genesis.cjs

const fs   = require('fs');
const path = require('path');

// 1) Read the raw Genesis text
const rawPath = path.join(__dirname, 'nwt-source', 'genesis.txt');
const text    = fs.readFileSync(rawPath, 'utf8');
const lines   = text.split(/\r?\n/);

// 2) Build our JSON structure
const bible          = { Genesis: {} };
let   currentChapter = null;

lines.forEach(line => {
  // if line says "Chapter N", start a new chapter
  const chapMatch = line.match(/^Chapter\s+(\d+)/);
  if (chapMatch) {
    currentChapter = Number(chapMatch[1]);
    bible.Genesis[currentChapter] = {};
    return;
  }
  // if line starts with "V Text…", parse a verse
  const verseMatch = line.match(/^(\d+)\s+(.+)/);
  if (verseMatch && currentChapter !== null) {
    const vnum = Number(verseMatch[1]);
    const vtxt = verseMatch[2].trim();
    bible.Genesis[currentChapter][vnum] = vtxt;
  }
});

// 3) Write out as JSON
const outPath = path.join(__dirname, 'nwt-source', 'genesis.json');
fs.writeFileSync(outPath, JSON.stringify(bible, null, 2), 'utf8');

console.log(`→ genesis.json written with ${Object.keys(bible.Genesis).length} chapters`);
EOF

