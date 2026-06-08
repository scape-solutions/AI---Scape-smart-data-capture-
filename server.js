import { GoogleGenAI } from '@google/genai';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set body limit to 50MB to accommodate high-resolution image uploads sent in the JSON payload
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Retrieve the Gemini API key from environment variables (e.g. injected via Secret Manager in Cloud Run)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let ai = null;

if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  console.log("Gemini AI client successfully initialized with server-side API Key.");
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not defined! AI proxy endpoints will fail.");
}

/**
 * API Proxy Endpoint for Google Gemini
 * Receives the model and contents payload from the frontend React client,
 * executes it using the server-side API key, and returns the response.
 */
app.post('/api/gemini', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ 
      error: "Gemini API key is not configured on this server environment." 
    });
  }

  const { model, contents } = req.body;
  if (!model || !contents) {
    return res.status(400).json({ 
      error: "Malformed request. Both 'model' and 'contents' fields are required." 
    });
  }

  try {
    const response = await ai.models.generateContent({ model, contents });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error in proxy server:", error);
    res.status(502).json({ 
      error: "Failed to generate content from Gemini API.",
      details: error.message || String(error)
    });
  }
});

// Serve the static web assets built by Vite
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Wildcard Route: Redirect all non-API GET requests to index.html for React router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Cloud Run provides the PORT environment variable
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Scape Bin-Picking Evaluator Server running on port ${PORT}`);
});
