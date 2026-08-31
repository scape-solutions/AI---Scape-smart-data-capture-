import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Resolve directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root path configuration
const rootDir = path.resolve(__dirname, '..');
const testCasesPath = path.join(rootDir, 'docs', 'testing', 'system_test_cases.md');
const testLogPath = path.join(rootDir, 'docs', 'testing', 'manual_test_log.md');

// Helper to get Git information
function getGitInfo() {
  let commitHash = 'Unknown';
  let gitUser = 'QA Tester';
  try {
    commitHash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch (e) {
    // Not a git repository or git not installed
  }
  try {
    gitUser = execSync('git config user.name', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch (e) {
    // Git config not set
  }
  return { commitHash, gitUser };
}

// Helper to parse test cases from system_test_cases.md
function parseTestCases() {
  if (!fs.existsSync(testCasesPath)) {
    console.error(`\x1b[31mError: System test cases file not found at ${testCasesPath}\x1b[0m`);
    process.exit(1);
  }

  const content = fs.readFileSync(testCasesPath, 'utf8');
  const lines = content.split('\n');
  const testCases = [];
  
  // Pattern: ### ST-XX: Test Case Title
  const headerRegex = /^###\s+(ST-\d+):\s+(.*)$/;

  for (const line of lines) {
    const match = line.trim().match(headerRegex);
    if (match) {
      testCases.push({
        id: match[1],
        title: match[2].trim()
      });
    }
  }

  return testCases;
}

// Main logic
async function main() {
  console.log('\x1b[36mInitializing a new Manual System Test Run...\x1b[0m\n');

  const gitInfo = getGitInfo();
  const testCases = parseTestCases();

  if (testCases.length === 0) {
    console.error('\x1b[31mError: No test cases found in system_test_cases.md. Ensure headings follow the pattern "### ST-XX: Title"\x1b[0m');
    process.exit(1);
  }

  console.log(`Found ${testCases.length} test cases in system_test_cases.md.\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

  // Prompt for Tester Name
  const defaultTester = gitInfo.gitUser;
  const testerInput = await askQuestion(`Enter Tester Name [Default: ${defaultTester}]: `);
  const tester = testerInput.trim() || defaultTester;

  // Prompt for Environment
  const defaultEnv = 'Local';
  const envInput = await askQuestion(`Enter Test Environment (e.g., Local, Staging, Production) [Default: ${defaultEnv}]: `);
  const environment = envInput.trim() || defaultEnv;

  rl.close();

  // Create timestamp
  const now = new Date();
  const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19);
  const dateStr = now.toISOString().substring(0, 10);

  // Generate markdown section
  let runContent = `\n## Test Run: ${dateStr} (${timestampStr})\n\n`;
  runContent += `- **Date**: ${timestampStr}\n`;
  runContent += `- **Tester**: ${tester}\n`;
  runContent += `- **Environment**: ${environment}\n`;
  runContent += `- **Version / Commit**: \`${gitInfo.commitHash}\`\n\n`;
  
  runContent += `### Summary\n\n`;
  runContent += `| Total Cases | Passed | Failed | Blocked | Pending |\n`;
  runContent += `| ----------- | ------ | ------ | ------- | ------- |\n`;
  runContent += `| ${testCases.length}          | 0      | 0      | 0       | ${testCases.length}       |\n\n`;
  
  runContent += `### Test Case Status\n\n`;
  runContent += `| Test Case ID | Test Case Title | Status | Notes / Bugs |\n`;
  runContent += `| ------------ | --------------- | ------ | ------------ |\n`;
  
  for (const tc of testCases) {
    runContent += `| [${tc.id}](file:///docs/testing/system_test_cases.md#${tc.id.toLowerCase()}) | ${tc.title} | 🟡 Pending | |\n`;
  }
  runContent += `\n---\n`;

  // Write/Append to manual_test_log.md
  let fileHeader = '';
  if (!fs.existsSync(testLogPath)) {
    fileHeader = `# Scape Bin-Picker Projects - Manual System Test Log\n\n`;
    fileHeader += `This document tracks the execution runs of the manual system test cases defined in [system_test_cases.md](file:///docs/testing/system_test_cases.md).\n\n`;
    fileHeader += `---`;
  }

  const existingContent = fs.existsSync(testLogPath) ? fs.readFileSync(testLogPath, 'utf8') : '';
  const newContent = existingContent ? existingContent + runContent : fileHeader + runContent;

  fs.writeFileSync(testLogPath, newContent, 'utf8');

  console.log(`\n\x1b[32mSuccess! A new test run has been appended to ${testLogPath}\x1b[0m`);
}

main().catch((err) => {
  console.error('\x1b[31mAn unexpected error occurred:\x1b[0m', err);
  process.exit(1);
});
