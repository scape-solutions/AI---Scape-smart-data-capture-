import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

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

async function main() {
  const email = `temp-access-updater@scapesolutions.eu`;
  const password = "TempAccessPassword123!";
  
  console.log(`Authenticating client as Scape user: ${email}...`);
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    console.log("Temporary account created successfully!");
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log("Account already exists, signing in...");
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Signed in successfully!");
    } else {
      throw err;
    }
  }

  console.log("Fetching config/access document from Firestore...");
  const docRef = doc(db, 'config', 'access');
  const snap = await getDoc(docRef);
  
  let data = {};
  if (snap.exists()) {
    data = snap.data();
    console.log("Current access config in Firestore:", JSON.stringify(data, null, 2));
  } else {
    console.log("Document config/access does not exist in Firestore! It will be created.");
  }
  
  const allowedEmails = data.allowedEmails || [];
  const targetEmail = "rune.k.larsen@gmail.com";
  
  if (!allowedEmails.map(e => e.toLowerCase()).includes(targetEmail.toLowerCase())) {
    allowedEmails.push(targetEmail);
    console.log(`Adding ${targetEmail} to allowedEmails...`);
  } else {
    console.log(`${targetEmail} is already in allowedEmails!`);
  }
  
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
  
  console.log("Saving updated config/access to Firestore...");
  await setDoc(docRef, updatedData);
  console.log("SUCCESS: config/access updated successfully!");
  
  // Fetch again to verify
  const verifySnap = await getDoc(docRef);
  console.log("Verified config in Firestore:", JSON.stringify(verifySnap.data(), null, 2));
}

main().catch(console.error);
