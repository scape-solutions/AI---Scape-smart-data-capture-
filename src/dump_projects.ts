import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

admin.initializeApp({
  projectId: 'scape-data-capture'
});

const db = getFirestore();

async function main() {
  console.log("🔍 Fetching all projects from Firestore via Admin SDK to check statuses...\n");
  const snap = await db.collection('projects').get();
  
  snap.docs.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;
    const name = data.projectName || data.generalResponses?.['1.01'] || 'Untitled Project';
    const status = data.status || 'N/A';
    const userId = data.userId || 'N/A';
    const ownerEmail = data.ownerEmail || 'N/A';
    const isLocked = data.isLocked ?? false;
    const isDemo = data.isDemo ?? false;
    const isDeleted = data.isDeleted ?? false;

    console.log(`- Project ID:   ${id}`);
    console.log(`  Name:         "${name}"`);
    console.log(`  Status:       ${status}`);
    console.log(`  User ID:      ${userId}`);
    console.log(`  Owner Email:  ${ownerEmail}`);
    console.log(`  Locked:       ${isLocked}`);
    console.log(`  Demo:         ${isDemo}`);
    console.log(`  Deleted:      ${isDeleted}`);
    console.log(`-------------------------------------------`);
  });
}

main().catch(err => {
  console.error("Error dumping projects:", err);
  process.exit(1);
});
