// server.cjs
// ─────────────────────────────────────────────────────────────────────────────
// 1) Load your .env right away
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const fetch   = (...args) => import('node-fetch').then(({default: f}) => f(...args));

/* ─────────────────────────────────────────────────────────────────────────────
   2) Grab your Genesis data that we just generated in nwt-source/genesis.json
   ──────────────────────────────────────────────────────────────────────────── */
const genesisPath = path.join(__dirname, 'nwt-source', 'genesis.json');
let genesisData;
try {
  genesisData = JSON.parse(fs.readFileSync(genesisPath, 'utf8')).Genesis;
} catch (err) {
  console.error('Could not load genesis.json:', err);
  process.exit(1);
}

/* ─────────────────────────────────────────────────────────────────────────────
   3) Spin up Express
   ──────────────────────────────────────────────────────────────────────────── */
const app = express();
app.use(cors());
app.use(express.json());  // so we can read JSON bodies

// 3a) Serve Genesis JSON
app.get('/api/genesis', (req, res) => {
  res.json(genesisData);
});

// 3b) AI Research endpoint
app.post('/api/ai', async (req, res) => {
  const { question, reference } = req.body;
  if (!question) return res.status(400).json({ answer: '(no question)' });

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model:    'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are a helpful assistant answering questions about ${reference}.` },
          { role: 'user',   content: question }
        ]
      })
    });
    const data = await openaiRes.json();
    const answer = data.choices?.[0]?.message?.content || '(no answer)';
    res.json({ answer });
  } catch (err) {
    console.error('AI error', err);
    res.status(500).json({ answer: 'Error contacting AI service' });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   4) Start listening
   ──────────────────────────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
