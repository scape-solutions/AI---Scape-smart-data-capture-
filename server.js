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
    'rene.dencker.eriksen@scapesolutions.eu',
    'john.erland.oestergaard@scapesolutions.eu',
    'rune.k.larsen@scapesolutions.eu',
    'per.juul.nielsen@scapesolutions.eu',
    'demo@scapesolutions.eu'
  ],
  superusers: ['rune.k.larsen@scapesolutions.eu'],
  activeEventPasscodes: {
    automatik26: {
      code: 'Automatik26',
      name: 'Automatik 2026 Messe',
      active: true,
      expiresAt: '2026-10-05',
      createdAt: '2026-09-01'
    }
  }
};

// Helper function to update in-memory access configuration
function updateAccessConfig(data) {
  allowedConfig = {
    allowedDomains: data.allowedDomains || [],
    allowedEmails: data.allowedEmails || [],
    allowedEvaluators: data.allowedEvaluators || [],
    superusers: data.superusers || [],
    activeEventPasscodes: data.activeEventPasscodes || {
      automatik26: {
        code: 'Automatik26',
        name: 'Automatik 2026 Messe',
        active: true,
        expiresAt: '2026-10-05',
        createdAt: '2026-09-01'
      }
    }
  };
  console.log("Updated access config successfully loaded from Firestore:", allowedConfig);
}

// Fetch configuration at startup to prevent cold-start race conditions
try {
  const startupSnap = await db.collection('config').doc('access').get();
  if (startupSnap.exists) {
    updateAccessConfig(startupSnap.data());
  } else {
    console.warn("config/access document does not exist in Firestore at startup! Using hardcoded offline defaults.");
  }
} catch (error) {
  console.error("Error fetching Firestore config/access at server startup:", error);
}

// Listen to Firestore config changes in real-time
db.collection('config').doc('access').onSnapshot((docSnap) => {
  if (docSnap.exists) {
    updateAccessConfig(docSnap.data());
  }
}, (error) => {
  console.warn("Error listening to Firestore config/access changes (expected locally if not authenticated):", error);
});

// Middleware to verify Firebase ID Token and check email domain/address or active event campaign registration.
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

    let hasAccess = isAllowedEmail || isAllowedDomain;

    // Option A: If not direct domain/email match, any registered user profile in Firestore has access
    if (!hasAccess) {
      try {
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
          const uData = userDoc.data();
          if (uData.isSuspended !== true) {
            hasAccess = true;
          } else {
            console.warn(`Suspended user attempted access: ${email}`);
            return res.status(403).json({ error: 'Forbidden: Your account has been suspended.' });
          }
        }
      } catch (err) {
        console.warn("Could not verify user registration in Firestore:", err);
      }
    }

    if (!hasAccess) {
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

// Daily Rate Limiter Middleware: Max 15 AI calls per user per day (Mic voice messages count as 1 AI call)
async function dailyAiRateLimiter(req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    return next(); // Skip in local dev
  }

  const uid = req.user?.uid;
  const email = req.user?.email || '';

  // Evaluators and superusers bypass the rate limit
  const isEvaluator = (allowedConfig.allowedEvaluators || []).some(e => e.toLowerCase() === email.toLowerCase()) ||
                      (allowedConfig.superusers || []).some(s => s.toLowerCase() === email.toLowerCase()) ||
                      email.toLowerCase().endsWith('@scapesolutions.eu') ||
                      email.toLowerCase().endsWith('@scapesolutions.com');
  if (isEvaluator) {
    return next();
  }

  const today = new Date().toISOString().split('T')[0];
  const limitDocRef = db.collection('user_limits').doc(`${uid}_${today}`);

  try {
    const limitDoc = await limitDocRef.get();
    let currentCalls = 0;
    if (limitDoc.exists) {
      currentCalls = limitDoc.data().totalCalls || 0;
    }

    const MAX_DAILY_CALLS = 15;
    if (currentCalls >= MAX_DAILY_CALLS) {
      return res.status(429).json({
        error: `Daily AI quota reached (${MAX_DAILY_CALLS}/${MAX_DAILY_CALLS} calls). Your quota resets at midnight. Contact Scape Solutions for full evaluation access.`
      });
    }

    // Increment usage asynchronously
    await limitDocRef.set({
      totalCalls: currentCalls + 1,
      lastCallAt: new Date().toISOString(),
      email
    }, { merge: true });

    next();
  } catch (err) {
    console.error("Rate limiter error:", err);
    next(); // Don't block user if rate limit check encounters Firestore error
  }
}

const app = express();
app.set('trust proxy', 1);

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
const APP_URL = process.env.APP_URL || 'https://scape-pick-pilot.web.app';
const OAUTH_CALLBACK_URL = `${APP_URL}/api/auth/google/callback`;

// We use Firestore instead of an in-memory Map to store the OAuth session state.
// This is necessary because Cloud Run might scale to multiple instances, 
// causing the callback request to land on a different instance than the start request.
const oauthSessionsRef = db.collection('oauth_sessions');

// Periodically clean up expired sessions from Firestore (runs in the background)
setInterval(async () => {
  try {
    const snapshot = await oauthSessionsRef.where('expiresAt', '<', Date.now()).get();
    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Cleaned up ${snapshot.size} expired OAuth sessions from Firestore.`);
    }
  } catch (error) {
    console.error('Error cleaning up expired OAuth sessions:', error);
  }
}, 5 * 60_000);

// Step 1 – PWA/mobile browser navigates here (same origin, stays in context)
// Server redirects to Google OAuth. The session state is stored server-side.
app.get('/api/auth/google/start', async (req, res) => {
  if (!GOOGLE_OAUTH_CLIENT_SECRET) {
    return res.status(503).send('Google OAuth not configured on this server. Please add GOOGLE_OAUTH_CLIENT_SECRET.');
  }

  // Dynamically resolve protocol and host to avoid redirecting to the wrong domain
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const currentAppUrl = `${protocol}://${host}`;
  const callbackUrl = `${currentAppUrl}/api/auth/google/callback`;

  console.log(`[OAuth Start] headers:`, req.headers);
  console.log(`[OAuth Start] resolved protocol: ${protocol}, host: ${host}`);
  console.log(`[OAuth Start] constructed redirect_uri: ${callbackUrl}`);

  const state = crypto.randomUUID();
  
  // Store session in Firestore to survive across Cloud Run instances
  try {
    await oauthSessionsRef.doc(state).set({
      status: 'pending',
      expiresAt: Date.now() + 10 * 60_000,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error('Failed to create OAuth session in Firestore:', error);
    return res.status(500).send('Internal Server Error while initializing login.');
  }

  // Set a cookie so the PWA/client can later look up its session
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'email profile',
    state,
    prompt: 'select_account',
    access_type: 'online'
  });

  res.redirect(authUrl);
});

// Step 2 – Google redirects here after the user authenticates
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const currentAppUrl = `${protocol}://${host}`;
  const callbackUrl = `${currentAppUrl}/api/auth/google/callback`;

  if (error || !code || !state) {
    return res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;padding:2rem;text-align:center">
      <h2>❌ Sign-in cancelled</h2><p>Please return to the app and try again.</p></body></html>`);
  }

  let sessionDoc;
  try {
    sessionDoc = await oauthSessionsRef.doc(state).get();
  } catch (error) {
    console.error('Error fetching OAuth session from Firestore:', error);
    return res.status(500).send('<html><body>Internal server error checking session. Please try again.</body></html>');
  }

  if (!sessionDoc.exists) {
    return res.status(400).send('<html><body>Invalid or expired session. Please try again.</body></html>');
  }

  const session = sessionDoc.data();
  if (session.status !== 'pending' || Date.now() > session.expiresAt) {
    return res.status(400).send('<html><body>Invalid or expired session. Please try again.</body></html>');
  }

  try {
    // Exchange authorization code for tokens using the dynamically resolved callbackUrl
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, 
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: callbackUrl,
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

    // Mark session as complete in Firestore (token expires in 5 minutes – must be picked up quickly)
    await oauthSessionsRef.doc(state).update({ 
      status: 'complete', 
      customToken, 
      email, 
      expiresAt: Date.now() + 5 * 60_000 
    });
    console.log(`Mobile OAuth: signed in ${email} (uid: ${firebaseUid})`);

    // Show a friendly success page that redirects the user back to the correct app landing URL
    res.send(`<!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta http-equiv="refresh" content="2;url=${currentAppUrl}">
      <title>Signed in</title>
      <style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f7}div{text-align:center;padding:2rem}h2{color:#1c1c1e}p{color:#6e6e73}</style>
    </head><body><div>
      <div style="font-size:3rem">✅</div>
      <h2>Signed in as ${email}</h2>
      <p>Returning to the app&hellip;</p>
    </div>
    <script>
      // Fallback robust passing of the token: LocalStorage and URL Hash
      try {
        localStorage.setItem('pwa_custom_token', '${customToken}');
      } catch (e) { console.error("LocalStorage set failed", e); }
      
      // Return to the PWA app which is polling or picking up the token
      setTimeout(() => {
        window.location.href = '/#token=' + encodeURIComponent('${customToken}');
      }, 1500);
    </script>
    </body></html>`);
  } catch (err) {
    console.error('PWA OAuth callback error:', err);
    try {
      await oauthSessionsRef.doc(state).update({ status: 'error', expiresAt: Date.now() + 2 * 60_000 });
    } catch (updateErr) {
      console.error('Failed to update session error state:', updateErr);
    }
    res.send('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h2>❌ Sign-in failed</h2><p>Please return to the app and try again.</p></body></html>');
  }
});

// Step 3 – PWA calls this on startup (cookie is sent automatically, shared across Safari & PWA)
// Returns the Firebase custom token if sign-in just completed in Safari.
app.get('/api/auth/check-pending', async (req, res) => {
  const state = req.cookies?.oauth_state;
  if (!state) return res.json({ status: 'none' });

  try {
    const sessionDoc = await oauthSessionsRef.doc(state).get();
    if (!sessionDoc.exists) return res.json({ status: 'none' });

    const session = sessionDoc.data();

    if (session.status === 'complete') {
      const { customToken, email } = session;
      // Clear the session from Firestore and cookie immediately (one-time use)
      await oauthSessionsRef.doc(state).delete();
      res.clearCookie('oauth_state');
      return res.json({ status: 'complete', customToken, email });
    }

    if (Date.now() > session.expiresAt) {
       await oauthSessionsRef.doc(state).delete();
       res.clearCookie('oauth_state');
       return res.json({ status: 'none' });
    }

    res.json({ status: session.status });
  } catch (error) {
    console.error('Error checking pending OAuth session:', error);
    res.json({ status: 'error', message: 'Failed to verify pending login.' });
  }
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

// Dynamic prompts in-memory cache loaded strictly from Firestore (no local filesystem fallbacks at runtime)
let activePrompts = {
  externalAdvicePrompt: '',
  evaluatorDraftPrompt: '',
  observationsExtractionPrompt: '',
  appSupportGuide: '',
  includeImagesForAdvice: true,
  includeImagesForDraft: true,
  includeImagesForChat: false
};

// Listen to Firestore prompt changes in real-time
db.collection('config').doc('prompts').onSnapshot((docSnap) => {
  if (docSnap && docSnap.exists) {
    const data = docSnap.data();
    activePrompts.externalAdvicePrompt = data.externalAdvicePrompt || '';
    activePrompts.evaluatorDraftPrompt = data.evaluatorDraftPrompt || '';
    activePrompts.autoFillPrompt = data.autoFillPrompt || '';
    activePrompts.observationsExtractionPrompt = data.observationsExtractionPrompt || '';
    activePrompts.appSupportGuide = data.appSupportGuide || data.appHelpGuide || '';
    activePrompts.includeImagesForAdvice = data.includeImagesForAdvice !== false;
    activePrompts.includeImagesForDraft = data.includeImagesForDraft !== false;
    activePrompts.includeImagesForChat = !!data.includeImagesForChat;
    console.log("Updated AI prompts successfully loaded from Firestore.");
  } else {
    console.warn("WARNING: config/prompts document does not exist in Firestore! AI prompts will be empty.");
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
app.post('/api/ai/advice', verifyFirebaseToken, dailyAiRateLimiter, async (req, res) => {
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
app.post('/api/ai/chat', verifyFirebaseToken, dailyAiRateLimiter, async (req, res) => {
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
        part.images = part.images.map((_, idx) => `[Image ${idx}]`);
      }
      if (part.cadFile && part.cadFile.dataUrl) {
        part.cadFile.dataUrl = "[CAD removed]";
      }
    });

    const systemInstruction = `${activePrompts.autoFillPrompt.trim()}

QUESTIONNAIRE SCHEMA:
${JSON.stringify(schema, null, 2)}

VERIFIED CURRENT PROJECT STATE (ABSOLUTE GROUND TRUTH):
${JSON.stringify(cleanProject, null, 2)}

ACTIVE PART INDEX (0-based): ${activePartIndex}

DATA DISCREPANCY RULE FOR CHAT HISTORY:
The chat history transcript below contains past conversation messages. If any user or assistant message in history mentions values that contradict VERIFIED CURRENT PROJECT STATE (for example, history mentions "CCC" but VERIFIED CURRENT PROJECT STATE has "AAA"), VERIFIED CURRENT PROJECT STATE is the final result of manual user edits and SUPERSEDES all historical chat messages. Treat conflicting history values as obsolete and NEVER propose overwriting VERIFIED CURRENT PROJECT STATE with obsolete values from history.`;

    // Construct history for Gemini
    const contents = history.map((msg, i) => {
      let text = msg.text;
      // Strip raw JSON proposal blocks from past assistant turns in history so obsolete JSON proposals don't pollute Gemini context
      if (msg.role === 'model' || msg.role === 'assistant') {
        text = text.replace(/```(?:json)?\s*[\s\S]*?\s*```/ig, '').trim();
      }

      const parts = [{ text }];
      
      // Pass images/PDFs from the chat history only for the current (very last) user message.
      // Older attachments in history are skipped to save tokens and prevent 429 quota/rate limit errors.
      const isLastMessage = (i === history.length - 1);
      if (isLastMessage && msg.images && Array.isArray(msg.images)) {
        msg.images.forEach(imgBase64 => {
          if (imgBase64.startsWith('data:')) {
            let mimeType = imgBase64.substring(5, imgBase64.indexOf(';'));
            if (mimeType === 'audio/x-m4a' || mimeType === 'audio/m4a') mimeType = 'audio/mp4';
            const data = imgBase64.substring(imgBase64.indexOf(',') + 1);
            parts.push({ inlineData: { data, mimeType } });
          }
        });
      }
      
      return { role: msg.role, parts };
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
      config: {
        systemInstruction,
      },
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

/**
 * Dedicated API Endpoint for Support AI (App Navigation & Technical Physics Guidance)
 * Dynamically assembles system prompt from appSupportGuide.md + fieldExplanations
 */
app.post('/api/support-chat', verifyFirebaseToken, async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Gemini API key is not configured on this server." });
  }

  const { query, supportHistory = [] } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Missing required support query." });
  }

  try {
    let helpGuideText = activePrompts.appSupportGuide || "";
    if (!helpGuideText) {
      try {
        const supportPath = path.join(__dirname, 'src', 'docs', 'appSupportGuide.md');
        if (fs.existsSync(supportPath)) {
          helpGuideText = fs.readFileSync(supportPath, 'utf-8');
        }
      } catch (e) {
        console.warn("Could not read appSupportGuide.md:", e);
      }
    }

    const systemInstruction = `You are Scape App Support & Technical AI.
Your job is to answer user questions about using the SCAPE PICK-PILOT web application, understanding field definitions, or explaining robotics physics constraints (such as cycle time tradeoffs, part weight/gripper suction, or vision scanner selection).

AUTHORITATIVE SCAPE APP DOCUMENTATION:
${helpGuideText}

STRICT RELEVANCE & GUARDRAILS:
1. ONLY answer questions directly related to SCAPE PICK-PILOT, the Scape application, bin-picking robotics technology, vision scanners, grippers, part specifications, cycle time calculations, or cell requirements.
2. If the user asks general non-relevant questions (e.g. tourist facts like "hvor højt er Rundetårn?", weather, cooking, sports, general trivia), you MUST politely refuse to answer. Reply in Danish:
   "Jeg kan desværre kun svare på spørgsmål vedrørende SCAPE PICK-PILOT appen, spørgeskemaet og Scape bin-picking teknologi. Har du et spørgsmål til dit bin-picking projekt eller dine emner?"
3. DOMAIN FACT - SCAPE BINS ARE NEVER MIXED: A bin container in Scape Bin-Picking ALWAYS contains items of ONE single part type (or single part family) at a time. Scape NEVER picks from mixed-contents bins containing completely unrelated items (e.g. gearboxes mixed with brake pads in one container is NEVER done).

FORMATTING & CHAT RULES:
1. Provide clear, direct, friendly natural language answers in markdown format. You may use markdown tables if helpful.
2. For Scape app interface, buttons, PDF exporting, and questionnaire fields, strictly follow the provided Scape App Documentation.
3. For general robotics or physics concepts, supplement with pre-trained engineering knowledge while adhering to Scape domain rules.
4. DO NOT output JSON questionnaire field proposals or ---FACTS---/---QUESTIONS--- blocks. Provide conversational support ONLY.`;

    const contents = (Array.isArray(supportHistory) ? supportHistory : []).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: query }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents,
      config: {
        systemInstruction
      }
    });

    res.json({ text: response.text || "No response received from Support AI." });
  } catch (error) {
    console.error("Gemini API Error in proxy server (Support Chat):", error);
    res.status(502).json({
      error: "Failed to process support query with Gemini API.",
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
