import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

// Load config
const configPath = './firebase-applet-config.json';
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function main() {
  console.log("🔍 Scanning Firestore for projects with corrupted fields or duplicates...\n");
  const snap = await getDocs(collection(db, 'projects'));
  
  let corruptedCount = 0;
  const duplicatesMap: Record<string, { id: string; name: string; createdAt: any; isCorrupted: boolean }[]> = {};

  snap.docs.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;
    const name = data.projectName || data.generalResponses?.['1.01'] || 'Untitled Project';
    const hasFieldId = 'id' in data;
    const fieldIdValue = data.id;

    // If 'id' is stored as a field inside Firestore, it is polluted
    const isCorrupted = hasFieldId; 

    if (isCorrupted) {
      corruptedCount++;
      console.log(`⚠️  Polluted Document Found:`);
      console.log(`   - Firestore Document ID: ${id}`);
      console.log(`   - Project Name:          "${name}"`);
      console.log(`   - Internal 'id' value:   ${JSON.stringify(fieldIdValue)}`);
      console.log(`     (This 'id' field is overriding the actual Firestore ID on older loads!)\n`);
    }

    // Group by project name and user to find potential duplicates
    const key = `${name.toLowerCase().trim()}_${data.userId}`;
    if (!duplicatesMap[key]) {
      duplicatesMap[key] = [];
    }
    duplicatesMap[key].push({
      id,
      name,
      createdAt: data.createdAt?.toDate ? docSnap.data().createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null),
      isCorrupted
    });
  });

  console.log("--------------------------------------------------");
  console.log(`📈 Scan Summary:`);
  console.log(`- Total Projects in Database: ${snap.size}`);
  console.log(`- Projects polluted with internal 'id' fields: ${corruptedCount}`);
  
  console.log("\n👥 Checking for duplicate project groups...");
  let duplicateGroups = 0;
  
  Object.keys(duplicatesMap).forEach(key => {
    const list = duplicatesMap[key];
    if (list.length > 1) {
      duplicateGroups++;
      console.log(`\n👥 Duplicate Group Found for Project Name "${list[0].name}":`);
      list.forEach((item, index) => {
        const timeStr = item.createdAt ? item.createdAt.toLocaleString('da-DK') : 'N/A';
        console.log(`   [${index + 1}] ID: ${item.id} | Created: ${timeStr} | Polluted: ${item.isCorrupted ? 'YES ⚠️' : 'NO'}`);
      });
    }
  });

  if (duplicateGroups === 0) {
    console.log("✅ No duplicate project groups found.");
  }
}

main().catch(err => {
  console.error("Error scanning database:", err);
  process.exit(1);
});
