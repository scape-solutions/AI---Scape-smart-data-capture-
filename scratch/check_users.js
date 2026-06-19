import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  projectId: 'scape-data-capture'
});

const db = getFirestore('ai-studio-scapebinpickinge-034f7a46-4395-4b38-89aa-1055263d83ac');

async function run() {
  console.log("Fetching users from Firestore...");
  const snap = await db.collection('users').get();
  console.log(`Found ${snap.size} users total:`);
  
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`- User UID: ${doc.id}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Company: ${data.company}`);
    console.log(`  Role: ${data.role}`);
    console.log(`  Requested Role: ${data.requestedRole}`);
    console.log(`  Is Admin: ${data.isAdmin}`);
    console.log("---------------------------------------");
  });
}

run().catch(console.error);
