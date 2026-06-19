import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  projectId: 'scape-data-capture'
});

const db = getFirestore('ai-studio-scapebinpickinge-034f7a46-4395-4b38-89aa-1055263d83ac');

async function run() {
  console.log("Searching projects for demo user...");
  const snap = await db.collection('projects').get();
  
  let found = 0;
  snap.forEach(doc => {
    const data = doc.data();
    const email = (data.ownerEmail || '').toLowerCase();
    const userId = data.userId || '';
    if (email.includes('demo') || userId.includes('demo') || data.projectName.toLowerCase().includes('demo')) {
      found++;
      console.log(`- Project ID: ${doc.id}`);
      console.log(`  Name: ${data.projectName}`);
      console.log(`  Owner Email: ${data.ownerEmail}`);
      console.log(`  User ID: ${data.userId}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Created At: ${data.createdAt ? data.createdAt.toDate().toISOString() : 'N/A'}`);
      console.log("---------------------------------------");
    }
  });
  console.log(`Done. Found ${found} projects matching 'demo'.`);
}

run().catch(console.error);
