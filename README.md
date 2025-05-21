# JW App

This repo contains a small demo that serves some verses from the **New World Translation of the Holy Scriptures** and a simple React interface.  The server is a Node/Express application and the frontend uses Vite.

## Installation

### Server
1. Install dependencies from the repository root:
   ```bash
   npm install
   ```
2. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your-key-here
   ```

### Frontend
1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

## Extracting the NWT data
The repository only contains a sample chapter (`nwt-source/genesis.txt`).  If you have the full NWT PDF, copy it to `nwt-source/nwt.pdf` and run:
```bash
node extract-nwt.cjs
```
This creates `nwt-raw.json` with the raw lines from the PDF.

To structure the Genesis text into JSON required by the server run:
```bash
node extract-genesis.cjs
```
The result will be placed in `nwt-source/genesis.json`.

## Running the app
1. Start the server (defaults to port `4000`):
   ```bash
   node server.cjs
   ```
2. In another terminal start the React development server:
   ```bash
   cd frontend
   npm run dev
   ```
The frontend will proxy API calls to the backend so both servers must be running.

## NWT Data and License
The text of the New World Translation of the Holy Scriptures is © Watch Tower Bible and Tract Society of Pennsylvania.  It is not included here in full and no claim of ownership is made.  Any data extracted from the translation is for demonstration and research purposes only.  Please consult [jw.org](https://www.jw.org/) for the official edition and licensing terms.
