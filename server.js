import { GoogleGenAI } from '@google/genai';
import express from 'express';
import path from 'path';
import fs from 'fs';
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

// Load prompts securely from the filesystem
const docsPath = fs.existsSync(path.join(__dirname, 'src', 'docs'))
  ? path.join(__dirname, 'src', 'docs')
  : path.join(__dirname, 'docs');

const externalAdvicePrompt = fs.readFileSync(path.join(docsPath, 'externalAdvicePrompt.md'), 'utf-8');
const evaluatorDraftPrompt = fs.readFileSync(path.join(docsPath, 'evaluatorDraftPrompt.md'), 'utf-8');
const autoFillPrompt = fs.readFileSync(path.join(docsPath, 'autoFillPrompt.md'), 'utf-8');

/**
 * Helper: Prepares data and images for Gemini API, stripping giant base64 strings in the JSON block
 */
function prepareAIRequest(project, basePrompt) {
  const cleanProject = JSON.parse(JSON.stringify(project));
  const imageParts = [];

  if (cleanProject.parts && Array.isArray(cleanProject.parts)) {
    cleanProject.parts.forEach((part) => {
      if (part.images && Array.isArray(part.images)) {
        part.images.forEach((imgBase64) => {
          if (imgBase64.startsWith('data:')) {
            const mimeType = imgBase64.substring(5, imgBase64.indexOf(';'));
            const data = imgBase64.substring(imgBase64.indexOf(',') + 1);
            imageParts.push({ inlineData: { data, mimeType } });
          }
        });
        part.images = [`[${part.images.length} images provided as attachments]`];
      }
      if (part.cadFile && part.cadFile.dataUrl) {
        part.cadFile.dataUrl = "[CAD data removed to save tokens]";
      }
    });
  }

  const finalPromptText = `${basePrompt}\n\nData:\n${JSON.stringify(cleanProject, null, 2)}`;
  return [finalPromptText, ...imageParts];
}

/**
 * Dedicated API Endpoint for External User Advice
 */
app.post('/api/ai/advice', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Gemini API key is not configured on this server." });
  }

  const { project } = req.body;
  if (!project) {
    return res.status(400).json({ error: "Missing required project data." });
  }

  try {
    const contents = prepareAIRequest(project, externalAdvicePrompt);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error in proxy server (Advice):", error);
    res.status(502).json({ 
      error: "Failed to generate advice from Gemini API.",
      details: error.message || String(error)
    });
  }
});

/**
 * Dedicated API Endpoint for Evaluator Draft (Verdict)
 */
app.post('/api/ai/draft', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Gemini API key is not configured on this server." });
  }

  const { project } = req.body;
  if (!project) {
    return res.status(400).json({ error: "Missing required project data." });
  }

  try {
    const contents = prepareAIRequest(project, evaluatorDraftPrompt);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error in proxy server (Draft):", error);
    res.status(502).json({ 
      error: "Failed to generate evaluator draft from Gemini API.",
      details: error.message || String(error)
    });
  }
});

/**
 * Dedicated API Endpoint for Auto-fill Chat Assistant
 */
app.post('/api/ai/chat', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Gemini API key is not configured on this server." });
  }

  const { project, activePartIndex, history, schema } = req.body;
  if (!project || history === undefined || activePartIndex === undefined || !schema) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const cleanProject = JSON.parse(JSON.stringify(project));
    
    // Strip images/cad files to save tokens
    cleanProject.parts.forEach((part) => {
      if (part.images) part.images = [`[${part.images.length} images]`];
      if (part.cadFile) part.cadFile.dataUrl = "[CAD removed]";
    });

    // Construct history for Gemini
    const contents = history.map((msg, i) => {
      let text = msg.text;
      if (i === history.length - 1 && msg.role === 'user') {
         text = `${autoFillPrompt.trim()}\n\nQUESTIONNAIRE SCHEMA:\n${JSON.stringify(schema, null, 2)}\n\nCURRENT PROJECT STATE:\n${JSON.stringify(cleanProject, null, 2)}\n\nACTIVE PART INDEX (0-based): ${activePartIndex}\n\nUSER MESSAGE:\n${text}`;
      }
      return { role: msg.role, parts: [{ text }] };
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });

    res.json({ text: response.text || "" });
  } catch (error) {
    console.error("Gemini API Error in proxy server (Chat):", error);
    res.status(502).json({ 
      error: "Failed to process message from Gemini API.",
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
