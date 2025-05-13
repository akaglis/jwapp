// server.cjs
const express = require("express");
const cors    = require("cors");
const path    = require("path");

// load the Genesis JSON we just extracted
const genesisData = require("./nwt-source/genesis.json").Genesis;

const app = express();
app.use(cors());

// GET /api/genesis → returns the full Genesis object
app.get("/api/genesis", (req, res) => {
  res.json(genesisData);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`📖  Bible API listening on http://localhost:${PORT}`);
});

