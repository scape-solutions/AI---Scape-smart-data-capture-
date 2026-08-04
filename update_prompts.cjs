const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function run() {
  const localAutoFill = fs.readFileSync(path.join(__dirname, 'src/docs/autoFillPrompt.md'), 'utf-8');
  await db.collection('prompts').doc('default').set({
    autoFillPrompt: localAutoFill
  }, { merge: true });
  console.log("Updated Firestore with new autoFillPrompt");
}
run();
