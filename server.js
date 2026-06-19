import { GoogleGenAI } from '@google/genai';
import express from 'express';
import cookieParser from 'cookie-parser';
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
app.use(cookieParser());

// ─── Server-side Google OAuth for iOS PWA ─────────────────────────────────────
// iOS PWA blocks popups AND signInWithRedirect never returns to the standalone
// context. This server-side flow uses cookies (shared between Safari & PWA on
// the same domain, unlike localStorage) to bridge the auth result back to the PWA.

import crypto from 'crypto';

const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || '782472107063-6shdo17lf2lsvvuifsmg15hhffuu0k4h.apps.googleusercontent.com';
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
const APP_URL = process.env.APP_URL || 'https://scape-data-capture.web.app';
const OAUTH_CALLBACK_URL = `${APP_URL}/api/auth/google/callback`;

// In-memory session store: state token → { status, customToken, email, expiresAt }
const oauthSessions = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, s] of oauthSessions.entries()) {
    if (now > s.expiresAt) oauthSessions.delete(key);
  }
}, 60_000);

// Step 1 – PWA navigates here (same origin, stays in PWA context)
// Server redirects to Google OAuth. The session state is stored server-side.
app.get('/api/auth/google/start', (req, res) => {
  if (!GOOGLE_OAUTH_CLIENT_SECRET) {
    return res.status(503).send('Google OAuth not configured on this server. Please add GOOGLE_OAUTH_CLIENT_SECRET.');
  }
  const state = crypto.randomUUID();
  oauthSessions.set(state, { status: 'pending', expiresAt: Date.now() + 10 * 60_000 });

  // Set a cookie so the PWA can later look up its session
  // Cookies are shared between Safari and PWA on the same iOS domain
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_CALLBACK_URL,
    response_type: 'code',
    scope: 'email profile',
    state,
    prompt: 'select_account',
    access_type: 'online'
  });

  res.redirect(authUrl);
});

// Step 2 – Google redirects here after the user authenticates (runs in Safari)
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error || !code || !state) {
    return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;padding:2rem;text-align:center">
      <h2>❌ Sign-in cancelled</h2><p>Please return to the app and try again.</p></body></html>`);
  }

  const session = oauthSessions.get(state);
  if (!session || session.status !== 'pending') {
    return res.status(400).send('<html><body>Invalid or expired session. Please try again.</body></html>');
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: GOOGLE_OAUTH_CLIENT_ID,
        client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: OAUTH_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('No access token: ' + JSON.stringify(tokenData));

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const { sub, email, name, picture } = await userRes.json();
    if (!email) throw new Error('No email in Google userinfo response');

    // Get or create the Firebase user so the UID is consistent with normal Google Sign-In
    let firebaseUid;
    try {
      const existing = await getAuth().getUserByEmail(email);
      firebaseUid = existing.uid;
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        const created = await getAuth().createUser({ email, displayName: name, photoURL: picture });
        firebaseUid = created.uid;
      } else throw e;
    }

    // Create a short-lived Firebase custom token (1 hour)
    const customToken = await getAuth().createCustomToken(firebaseUid, { email });

    // Mark session as complete (token expires in 5 minutes – must be picked up quickly)
    oauthSessions.set(state, { status: 'complete', customToken, email, expiresAt: Date.now() + 5 * 60_000 });
    console.log(`PWA OAuth: signed in ${email} (uid: ${firebaseUid})`);

    // Show a friendly success page – iOS will open this in Safari, not the PWA.
    // The user needs to manually return to the app, which will auto-complete sign-in
    // by reading the shared cookie.
    res.send(`<!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta http-equiv="refresh" content="2;url=${APP_URL}">
      <title>Signed in</title>
      <style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f7}div{text-align:center;padding:2rem}h2{color:#1c1c1e}p{color:#6e6e73}</style>
    </head><body><div>
      <div style="font-size:3rem">✅</div>
      <h2>Signed in as ${email}</h2>
      <p>Returning to the app&hellip;</p>
    </div></body></html>`);
  } catch (err) {
    console.error('PWA OAuth callback error:', err);
    oauthSessions.set(state, { status: 'error', expiresAt: Date.now() + 2 * 60_000 });
    res.send('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h2>❌ Sign-in failed</h2><p>Please return to the app and try again.</p></body></html>');
  }
});

// Step 3 – PWA calls this on startup (cookie is sent automatically, shared across Safari & PWA)
// Returns the Firebase custom token if sign-in just completed in Safari.
app.get('/api/auth/check-pending', (req, res) => {
  const state = req.cookies?.oauth_state;
  if (!state) return res.json({ status: 'none' });

  const session = oauthSessions.get(state);
  if (!session) return res.json({ status: 'none' });

  if (session.status === 'complete') {
    const { customToken, email } = session;
    // Clear the session and cookie immediately (one-time use)
    oauthSessions.delete(state);
    res.clearCookie('oauth_state');
    return res.json({ status: 'complete', customToken, email });
  }

  res.json({ status: session.status });
});
// ──────────────────────────────────────────────────────────────────────────────

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
      model: 'gemini-2.5-pro',
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
      model: 'gemini-2.5-pro',
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
      model: 'gemini-2.5-pro',
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
