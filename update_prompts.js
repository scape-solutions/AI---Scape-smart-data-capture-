import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  "projectId": "scape-data-capture",
  "appId": "1:782472107063:web:87434860427dde04959bb2",
  "apiKey": "AIzaSyBguDkxnl0xc1oKRPeCXyV7xQaOOHaCLeE",
  "authDomain": "scape-data-capture.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-scapebinpickinge-034f7a46-4395-4b38-89aa-1055263d83ac",
  "storageBucket": "scape-data-capture.firebasestorage.app",
  "messagingSenderId": "782472107063",
  "measurementId": ""
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

async function run() {
  console.log("Reading local prompts from src/docs...");
  const docsPath = path.join(__dirname, 'src', 'docs');
  const localPrompts = {
    externalAdvicePrompt: fs.readFileSync(path.join(docsPath, 'externalAdvicePrompt.md'), 'utf-8'),
    evaluatorDraftPrompt: fs.readFileSync(path.join(docsPath, 'evaluatorDraftPrompt.md'), 'utf-8'),
    autoFillPrompt: fs.readFileSync(path.join(docsPath, 'autoFillPrompt.md'), 'utf-8'),
    observationsExtractionPrompt: fs.readFileSync(path.join(docsPath, 'observationsExtractionPrompt.md'), 'utf-8'),
    appSupportGuide: fs.existsSync(path.join(docsPath, 'appSupportGuide.md')) ? fs.readFileSync(path.join(docsPath, 'appSupportGuide.md'), 'utf-8') : ''
  };

  const email = `temp-sync-bot-${Date.now()}@scapesolutions.eu`;
  const password = "TempPassword123!";
  
  console.log(`Registering/signing in sync bot: ${email}...`);
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      throw err;
    }
  }

  console.log("Syncing prompts to Firestore...");
  const docRef = doc(db, 'config', 'prompts');
  await setDoc(docRef, {
    externalAdvicePrompt: localPrompts.externalAdvicePrompt,
    evaluatorDraftPrompt: localPrompts.evaluatorDraftPrompt,
    autoFillPrompt: localPrompts.autoFillPrompt,
    observationsExtractionPrompt: localPrompts.observationsExtractionPrompt,
    appSupportGuide: localPrompts.appSupportGuide
  }, { merge: true });

  console.log("SUCCESS: Cloud prompts are now synchronized with local files!");
  process.exit(0);
}

run().catch(error => {
  console.error("Error running update_prompts script:", error);
  process.exit(1);
});
