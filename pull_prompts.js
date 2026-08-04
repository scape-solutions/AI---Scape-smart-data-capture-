import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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
  const email = `temp-pull-bot-${Date.now()}@scapesolutions.eu`;
  const password = "TempPassword123!";
  
  console.log(`Registering/signing in pull bot: ${email}...`);
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      throw err;
    }
  }

  console.log("Fetching active prompts from Firestore...");
  const docRef = doc(db, 'config', 'prompts');
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) {
    console.log("Error: config/prompts document does not exist in Firestore!");
    return;
  }

  const cloudData = snap.data();
  const docsPath = path.join(__dirname, 'src', 'docs');

  const keys = [
    { key: 'externalAdvicePrompt', file: 'externalAdvicePrompt.md' },
    { key: 'evaluatorDraftPrompt', file: 'evaluatorDraftPrompt.md' },
    { key: 'autoFillPrompt', file: 'autoFillPrompt.md' },
    { key: 'observationsExtractionPrompt', file: 'observationsExtractionPrompt.md' }
  ];

  for (const { key, file } of keys) {
    const cloudVal = cloudData[key];
    if (cloudVal && cloudVal.trim()) {
      const filePath = path.join(docsPath, file);
      fs.writeFileSync(filePath, cloudVal);
      console.log(`Updated local file: src/docs/${file} from Firestore.`);
    } else {
      console.log(`Skipped key '${key}' (empty or not found in Cloud config/prompts).`);
    }
  }

  console.log("SUCCESS: Local files are now updated to match Cloud active prompts!");
}

run().catch(error => {
  console.error("Error running pull_prompts script:", error);
  process.exit(1);
});
