import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

admin.initializeApp({
  projectId: 'scape-data-capture'
});

const db = getFirestore();

async function main() {
  const snap = await db.collection('config').doc('prompts').get();
  if (snap.exists) {
    const data = snap.data();
    fs.writeFileSync('/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/firestore_evaluatorDraftPrompt.md', data.evaluatorDraftPrompt || '');
    fs.writeFileSync('/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/firestore_externalAdvicePrompt.md', data.externalAdvicePrompt || '');
    fs.writeFileSync('/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/firestore_autoFillPrompt.md', data.autoFillPrompt || '');
    console.log("Prompts successfully fetched and written to artifacts!");
  } else {
    console.log("Document config/prompts does not exist!");
  }
}

main().catch(console.error);
