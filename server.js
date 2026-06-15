import { GoogleGenAI } from '@google/genai';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
initializeApp({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'scape-data-capture'
});

// Use the custom named Firestore database (not the default one)
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-scapebinpickinge-034f7a46-4395-4b38-89aa-1055263d83ac';
const db = getFirestore(FIRESTORE_DATABASE_ID);

// In-memory cache for dynamic allowed access config, with hardcoded fallbacks
let allowedConfig = {
  allowedDomains: ['scapesolutions.eu', 'scapesolutions.com'],
  allowedEmails: [],
  allowedEvaluators: [
    'rde@scapesolutions.eu',
    'jeo@scapesolutions.eu',
    'rkl@scapesolutions.eu',
    'evaluator-scape-solution',
    'rune.k.larsen@scapesolutions.eu'
  ],
  superusers: ['rune.k.larsen@scapesolutions.eu']
};

// Listen to Firestore config changes in real-time
db.collection('config').doc('access').onSnapshot((docSnap) => {
  if (docSnap.exists) {
    const data = docSnap.data();
    allowedConfig = {
      allowedDomains: data.allowedDomains || [],
      allowedEmails: data.allowedEmails || [],
      allowedEvaluators: data.allowedEvaluators || [],
      superusers: data.superusers || []
    };
    console.log("Updated access config successfully loaded from Firestore:", allowedConfig);
  } else {
    console.warn("config/access document does not exist in Firestore! Using hardcoded offline defaults.");
  }
}, (error) => {
  console.error("Error listening to Firestore config/access changes (expected locally if not authenticated):", error);
});

// Middleware to verify Firebase ID Token and check email domain/address.
// In local development (NODE_ENV !== 'production') token verification is skipped
// so you can test AI features without needing Application Default Credentials.
async function verifyFirebaseToken(req, res, next) {
  // --- DEV BYPASS ---
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DEV MODE] Skipping Firebase token verification for local development.');
    req.user = { email: 'dev@scapesolutions.eu', uid: 'dev-local' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const email = decodedToken.email;
    
    if (!email) {
      return res.status(403).json({ error: 'Forbidden: Token contains no email address.' });
    }

    const emailLower = email.toLowerCase();
    const domain = emailLower.split('@')[1];

    const isAllowedEmail = allowedConfig.allowedEmails.some(e => e.toLowerCase() === emailLower);
    const isAllowedDomain = allowedConfig.allowedDomains.some(d => d.toLowerCase() === domain);

    // Check if user has a valid Scape domain or is specifically whitelisted
    if (!isAllowedEmail && !isAllowedDomain) {
      console.warn(`Unauthorized access attempt from email: ${email}`);
      return res.status(403).json({ error: 'Forbidden: You do not have access to this application.' });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

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

// Dynamic prompts in-memory cache with filesystem fallbacks
const docsPath = fs.existsSync(path.join(__dirname, 'src', 'docs'))
  ? path.join(__dirname, 'src', 'docs')
  : path.join(__dirname, 'docs');

const localExternalAdvice = fs.readFileSync(path.join(docsPath, 'externalAdvicePrompt.md'), 'utf-8');
const localEvaluatorDraft = fs.readFileSync(path.join(docsPath, 'evaluatorDraftPrompt.md'), 'utf-8');
const localAutoFill = fs.readFileSync(path.join(docsPath, 'autoFillPrompt.md'), 'utf-8');
const localObservationsExtraction = fs.readFileSync(path.join(docsPath, 'observationsExtractionPrompt.md'), 'utf-8');

let activePrompts = {
  externalAdvicePrompt: localExternalAdvice,
  evaluatorDraftPrompt: localEvaluatorDraft,
  autoFillPrompt: localAutoFill,
  observationsExtractionPrompt: localObservationsExtraction,
  includeImagesForAdvice: true,
  includeImagesForDraft: true,
  includeImagesForChat: false
};

// Listen to Firestore prompt changes in real-time
db.collection('config').doc('prompts').onSnapshot((docSnap) => {
  if (docSnap && docSnap.exists) {
    const data = docSnap.data();
    activePrompts.externalAdvicePrompt = data.externalAdvicePrompt || localExternalAdvice;
    activePrompts.evaluatorDraftPrompt = data.evaluatorDraftPrompt || localEvaluatorDraft;
    activePrompts.autoFillPrompt = data.autoFillPrompt || localAutoFill;
    activePrompts.observationsExtractionPrompt = data.observationsExtractionPrompt || localObservationsExtraction;
    activePrompts.includeImagesForAdvice = data.includeImagesForAdvice !== false;
    activePrompts.includeImagesForDraft = data.includeImagesForDraft !== false;
    activePrompts.includeImagesForChat = !!data.includeImagesForChat;
    console.log("Updated AI prompts successfully loaded from Firestore.");
  } else {
    console.warn("config/prompts document does not exist in Firestore! Using local filesystem fallback prompts.");
  }
}, (error) => {
  console.error("Error listening to Firestore config/prompts changes:", error);
});

/**
 * Helper: Prepares data and images for Gemini API, stripping giant base64 strings in the JSON block
 */
function prepareAIRequest(project, basePrompt, includeImages = true) {
  const cleanProject = JSON.parse(JSON.stringify(project));
  
  // Exclude chatHistory and AI-generated fields so evaluations only use structured questionnaire fields
  delete cleanProject.chatHistory;
  delete cleanProject.report;
  delete cleanProject.evaluatorDraft;
  delete cleanProject.finalVerdict;
  delete cleanProject.fieldObservations;
  
  const imageParts = [];

  // Handle general cell images
  if (cleanProject.generalImages && Array.isArray(cleanProject.generalImages)) {
    if (includeImages) {
      cleanProject.generalImages.forEach((imgBase64) => {
        if (imgBase64.startsWith('data:')) {
          const mimeType = imgBase64.substring(5, imgBase64.indexOf(';'));
          const data = imgBase64.substring(imgBase64.indexOf(',') + 1);
          imageParts.push({ inlineData: { data, mimeType } });
        }
      });
    }
    cleanProject.generalImages = [`[${cleanProject.generalImages.length} general cell images provided as attachments]`];
  } else {
    cleanProject.generalImages = [];
  }

  if (cleanProject.parts && Array.isArray(cleanProject.parts)) {
    cleanProject.parts.forEach((part) => {
      if (part.images && Array.isArray(part.images)) {
        if (includeImages) {
          part.images.forEach((imgBase64) => {
            if (imgBase64.startsWith('data:')) {
              const mimeType = imgBase64.substring(5, imgBase64.indexOf(';'));
              const data = imgBase64.substring(imgBase64.indexOf(',') + 1);
              imageParts.push({ inlineData: { data, mimeType } });
            }
          });
        }
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

app.get('/api/debug-projects', async (req, res) => {
  try {
    const snap = await db.collection('projects').get();
    const list = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        projectName: data.projectName || data.generalResponses?.['1.01'] || 'Untitled',
        status: data.status || 'N/A',
        userId: data.userId || 'N/A',
        ownerEmail: data.ownerEmail || 'N/A'
      };
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Dedicated API Endpoint for External User Advice
 */
app.post('/api/ai/advice', verifyFirebaseToken, async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Gemini API key is not configured on this server." });
  }

  const { project } = req.body;
  if (!project) {
    return res.status(400).json({ error: "Missing required project data." });
  }

  try {
    const contents = prepareAIRequest(project, activePrompts.externalAdvicePrompt, activePrompts.includeImagesForAdvice);
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
app.post('/api/ai/draft', verifyFirebaseToken, async (req, res) => {
  const email = req.user.email;
  const isEvaluator = allowedConfig.allowedEvaluators.some(e => e.toLowerCase() === (email || '').toLowerCase());
  
  if (!isEvaluator) {
    console.warn(`Non-evaluator email ${email} attempted to generate technical draft`);
    return res.status(403).json({ error: 'Forbidden: Only authorized evaluators can generate technical drafts.' });
  }

  if (!ai) {
    return res.status(503).json({ error: "Gemini API key is not configured on this server." });
  }

  const { project } = req.body;
  if (!project) {
    return res.status(400).json({ error: "Missing required project data." });
  }

  try {
    const contents = prepareAIRequest(project, activePrompts.evaluatorDraftPrompt, activePrompts.includeImagesForDraft);
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
app.post('/api/ai/chat', verifyFirebaseToken, async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Gemini API key is not configured on this server." });
  }

  const { project, activePartIndex, history, schema } = req.body;
  if (!project || history === undefined || activePartIndex === undefined || !schema) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const cleanProject = JSON.parse(JSON.stringify(project));
    const includeImages = activePrompts.includeImagesForChat;
    const imageParts = [];

    // Process generalImages
    if (cleanProject.generalImages && Array.isArray(cleanProject.generalImages)) {
      if (includeImages) {
        cleanProject.generalImages.forEach((imgBase64) => {
          if (imgBase64.startsWith('data:')) {
            const mimeType = imgBase64.substring(5, imgBase64.indexOf(';'));
            const data = imgBase64.substring(imgBase64.indexOf(',') + 1);
            imageParts.push({ inlineData: { data, mimeType } });
          }
        });
      }
      cleanProject.generalImages = [`[${cleanProject.generalImages.length} general cell images]`];
    } else {
      cleanProject.generalImages = [];
    }

    // Strip images/cad files to save tokens
    cleanProject.parts.forEach((part) => {
      if (part.images && Array.isArray(part.images)) {
        if (includeImages) {
          part.images.forEach((imgBase64) => {
            if (imgBase64.startsWith('data:')) {
              const mimeType = imgBase64.substring(5, imgBase64.indexOf(';'));
              const data = imgBase64.substring(imgBase64.indexOf(',') + 1);
              imageParts.push({ inlineData: { data, mimeType } });
            }
          });
        }
        part.images = [`[${part.images.length} images]`];
      }
      if (part.cadFile && part.cadFile.dataUrl) {
        part.cadFile.dataUrl = "[CAD removed]";
      }
    });

    // Construct history for Gemini
    const contents = history.map((msg, i) => {
      let text = msg.text;
      if (i === history.length - 1 && msg.role === 'user') {
         text = `${activePrompts.autoFillPrompt.trim()}\n\nQUESTIONNAIRE SCHEMA:\n${JSON.stringify(schema, null, 2)}\n\nCURRENT PROJECT STATE:\n${JSON.stringify(cleanProject, null, 2)}\n\nACTIVE PART INDEX (0-based): ${activePartIndex}\n\nUSER MESSAGE:\n${text}`;
      }
      return { role: msg.role, parts: [{ text }] };
    });

    // Append images to the last user message's parts if includeImages is true and we have images
    if (includeImages && imageParts.length > 0) {
      const lastMsg = contents[contents.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        lastMsg.parts.push(...imageParts);
      }
    }

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

/**
 * Dedicated API Endpoint for Observations Extraction
 * Called server-side after advice is generated to extract structured field observations.
 */
app.post('/api/ai/extract-observations', verifyFirebaseToken, async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Gemini API key is not configured on this server." });
  }

  const { adviceText, schema } = req.body;
  if (!adviceText || !schema) {
    return res.status(400).json({ error: "Missing required adviceText or schema." });
  }

  try {
    const prompt = `${activePrompts.observationsExtractionPrompt}\n\n## QUESTIONNAIRE SCHEMA (field IDs and labels)\n${JSON.stringify(schema, null, 2)}\n\n## ADVICE REPORT TO ANALYSE\n${adviceText}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt],
    });
    res.json({ text: response.text || "" });
  } catch (error) {
    console.error("Gemini API Error in proxy server (Observations):", error);
    res.status(502).json({
      error: "Failed to extract observations from Gemini API.",
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
