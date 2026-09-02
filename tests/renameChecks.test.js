// renameChecks.test.js – verifies that old terminology has been replaced
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');

const filesToCheck = [
  path.join(projectRoot, 'src', 'App.tsx'),
  path.join(projectRoot, 'src', 'components', 'SplashScreen.tsx'),
  path.join(projectRoot, 'index.html'),
  path.join(projectRoot, 'docs', 'USER_MANUAL.md'),
];

const oldTerms = [
  'Bin-Picking Information Advice',
  'Data Capture Advice',
  'Bin-Picking Project Information',
];

let failed = false;

for (const filePath of filesToCheck) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found (skipping): ${filePath}`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const found = oldTerms.filter(term => content.includes(term));
  if (found.length > 0) {
    console.error(`❌  Old terminology found in ${filePath}: ${found.join(', ')}`);
    failed = true;
  } else {
    console.log(`✅  No old terminology in ${filePath}`);
  }

  if (content.includes('PICK-PILOT')) {
    console.log(`✅  Branded with PICK-PILOT: ${filePath}`);
  }
}

if (failed) {
  console.error('❌  Rename verification failed.');
  process.exit(1);
} else {
  console.log('✅  All rename checks passed.');
  process.exit(0);
}
