import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK using local application default credentials
initializeApp({
  projectId: 'scape-data-capture'
});

const db = getFirestore('ai-studio-scapebinpickinge-034f7a46-4395-4b38-89aa-1055263d83ac');
const auth = getAuth();

async function run() {
  const email = 'demo@scapesolutions.eu';
  const password = 'ScapeEvaluator2026';
  
  console.log(`Checking if user ${email} exists in Firebase Auth...`);
  
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`User ${email} already exists with UID: ${userRecord.uid}`);
    
    // Update password to ensure it matches ScapeEvaluator2026
    await auth.updateUser(userRecord.uid, {
      password: password
    });
    console.log(`Successfully updated password for ${email}.`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`User ${email} does not exist. Creating user...`);
      userRecord = await auth.createUser({
        email: email,
        password: password,
        emailVerified: true
      });
      console.log(`Successfully created user ${email} with UID: ${userRecord.uid}`);
    } else {
      throw error;
    }
  }

  // Ensure user is in the Firestore config/access document
  console.log("Checking config/access document in Firestore...");
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
    console.log("config/access document does not exist, creating standard setup.");
  }
  
  // Update allowedEvaluators
  const allowedEvaluators = data.allowedEvaluators || [];
  if (!allowedEvaluators.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
    allowedEvaluators.push(email);
    console.log(`Adding ${email} to allowedEvaluators...`);
  }
  
  // Update allowedEmails
  const allowedEmails = data.allowedEmails || [];
  if (!allowedEmails.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
    allowedEmails.push(email);
    console.log(`Adding ${email} to allowedEmails...`);
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
  console.error("Failed to ensure demo user:", error);
});
