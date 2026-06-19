import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK using local gcloud credentials
initializeApp({
  projectId: 'scape-data-capture'
});

// Must match the custom database ID used by the app
const db = getFirestore('ai-studio-scapebinpickinge-034f7a46-4395-4b38-89aa-1055263d83ac');

async function run() {
  const docRef = db.collection('config').doc('access');
  const docSnap = await docRef.get();
  
  let data = {};
  if (docSnap.exists) {
    data = docSnap.data();
    console.log("Current access config in Firestore:", JSON.stringify(data, null, 2));
  } else {
    console.log("Document config/access does not exist in Firestore! Creating one.");
  }
  
  const allowedEmails = data.allowedEmails || [];
  const targetEmail = "rune.k.larsen@gmail.com";
  
  if (!allowedEmails.map(e => e.toLowerCase()).includes(targetEmail.toLowerCase())) {
    allowedEmails.push(targetEmail);
    console.log(`Adding ${targetEmail} to allowedEmails...`);
  } else {
    console.log(`${targetEmail} is already in allowedEmails!`);
  }
  
  // Also make sure to preserve/add other configurations if not present
  const updatedData = {
    ...data,
    allowedEmails: allowedEmails,
    allowedDomains: data.allowedDomains || ['scapesolutions.eu', 'scapesolutions.com'],
    allowedEvaluators: data.allowedEvaluators || [
      'rde@scapesolutions.eu',
      'jeo@scapesolutions.eu',
      'rkl@scapesolutions.eu',
      'evaluator-scape-solution',
      'rune.k.larsen@scapesolutions.eu'
    ],
    superusers: data.superusers || ['rune.k.larsen@scapesolutions.eu']
  };
  
  await docRef.set(updatedData);
  console.log("Successfully updated config/access document in Firestore!");
  
  // Fetch again to verify
  const verifySnap = await docRef.get();
  console.log("Verified config in Firestore:", JSON.stringify(verifySnap.data(), null, 2));
}

run().catch(console.error);
