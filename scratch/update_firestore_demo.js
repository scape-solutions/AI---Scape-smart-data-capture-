import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  projectId: 'scape-data-capture'
});

const db = getFirestore('ai-studio-scapebinpickinge-034f7a46-4395-4b38-89aa-1055263d83ac');

async function run() {
  const emails = ['demo@scapesolutions.eu', 'per.juul.nielsen@scapesolutions.eu'];
  console.log("Reading config/access document from Firestore...");
  const docRef = db.collection('config').doc('access');
  const docSnap = await docRef.get();
  
  let data = {
    allowedDomains: ['scapesolutions.eu', 'scapesolutions.com'],
    allowedEmails: [],
    allowedEvaluators: [],
    superusers: []
  };
  
  if (docSnap.exists) {
    data = docSnap.data();
    console.log("Current config in Firestore:", data);
  } else {
    console.log("config/access document does not exist, creating new default.");
  }
  
  // Add to allowedEvaluators if not present
  const allowedEvaluators = data.allowedEvaluators || [];
  // Add to allowedEmails if not present
  const allowedEmails = data.allowedEmails || [];

  for (const email of emails) {
    if (!allowedEvaluators.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
      allowedEvaluators.push(email);
      console.log(`Adding ${email} to allowedEvaluators...`);
    }
    if (!allowedEmails.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
      allowedEmails.push(email);
      console.log(`Adding ${email} to allowedEmails...`);
    }
  }

  const updatedConfig = {
    ...data,
    allowedEmails: allowedEmails,
    allowedEvaluators: allowedEvaluators
  };

  await docRef.set(updatedConfig);
  console.log("Successfully updated allowed config in Firestore database!");
  
  // Verify configuration
  const verifySnap = await docRef.get();
  console.log("Verified config in Firestore:", verifySnap.data());
}

run().catch(error => {
  console.error("Failed to update Firestore:", error);
});
