import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

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

async function main() {
  const docRef = doc(db, 'config', 'prompts');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    fs.writeFileSync('/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/firestore_evaluatorDraftPrompt.md', data.evaluatorDraftPrompt || '');
    fs.writeFileSync('/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/firestore_externalAdvicePrompt.md', data.externalAdvicePrompt || '');
    fs.writeFileSync('/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/firestore_autoFillPrompt.md', data.autoFillPrompt || '');
    console.log("SUCCESS: Prompts successfully fetched from Firestore and written to artifacts!");
  } else {
    console.log("Document config/prompts does not exist in Firestore!");
  }
}

main().catch(console.error);
