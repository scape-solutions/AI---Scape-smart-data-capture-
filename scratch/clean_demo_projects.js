/**
 * scratch/clean_demo_projects.js
 * 
 * Description:
 * This script connects to the Firestore database, authenticates using the provided
 * credentials, queries specifically for project documents where "isDemo === true",
 * and deletes only those projects. It leaves all other projects untouched.
 * 
 * Usage:
 * node scratch/clean_demo_projects.js <your-login-email> <your-login-password>
 * 
 * Example:
 * node scratch/clean_demo_projects.js rune@scapesolutions.dk mySecretPassword123
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load config
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error("Error: firebase-applet-config.json not found in the project root directory.");
  process.exit(1);
}
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Arguments check
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("Usage: node scratch/clean_demo_projects.js <email> <password>");
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    console.log(`Connecting to database and authenticating user ${email}...`);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log(`Logged in successfully!`);

    const projectsColl = collection(db, 'projects');
    const demoQuery = query(projectsColl, where('isDemo', '==', true));
    
    console.log("Querying for demo projects...");
    const snapshot = await getDocs(demoQuery);
    
    if (snapshot.empty) {
      console.log("No demo projects found with 'isDemo: true'. Nothing to delete.");
      process.exit(0);
    }
    
    console.log(`Found ${snapshot.size} demo projects. Starting deletion...`);
    
    let count = 0;
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const pName = data.projectName || "Unnamed Project";
      
      await deleteDoc(doc(db, 'projects', docSnap.id));
      count++;
      console.log(`[${count}/${snapshot.size}] Deleted Project: "${pName}" (ID: ${docSnap.id})`);
    }
    
    console.log(`\nCleanup complete! Successfully deleted ${count} demo projects.`);
    process.exit(0);
  } catch (err) {
    console.error("Error during cleanup:", err);
    process.exit(1);
  }
}

run();
