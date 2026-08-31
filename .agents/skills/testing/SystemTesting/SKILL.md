---
name: system-testing
description: >-
  Use this skill to design, document, and execute system-level end-to-end tests
  for the Scape Bin-Picker Projects application. It outlines the manual testing
  workflow across role-focused test matrices and separate use case document files.
---

# System Testing Guidelines - Scape Bin-Picker Projects

System testing verifies the fully integrated application—combining the React frontend, the Node.js Express server (`server.js`), Firestore database, and external APIs (like Google Gemini)—against the use case specifications.

This skill provides the structure and procedures to execute system testing effectively using role-focused test matrices.

---

## 1. System Testing Scope & Targets

System tests focus on complete multi-user workflows, role-based boundaries, and database side effects. Verification targets include:

1. **Role-Based Workflows**:
   - **External Partners**: Form creation, saving drafts, AI auto-filling chat, generating warnings, submitting cases, and requesting unlocks.
   - **Scape App Engineers**: Self-assigning cases, generating AI evaluator reports, refining verdicts, publishing verdicts, and review approvals.
2. **Firestore State Transitions**:
   - Validation of `status`, `isLocked`, `takenBy`, `editRequestPending`, and audit logs in `changelog`.
3. **API Integrations & PDF Exports**:
   - Validation of `/api/ai/*` endpoints and branded PDF report compilation.

---

## 2. Test Case Structure & Matrix Format

Test cases are organized into **7 separate document files** (one for each system use case) located in `docs/testing/`:

*   [uc1_test_cases.md](file:///docs/testing/uc1_test_cases.md) - Create and Save a Project Draft
*   [uc2_test_cases.md](file:///docs/testing/uc2_test_cases.md) - Auto-fill Questionnaire using AI Assistant Chat
*   [uc3_test_cases.md](file:///docs/testing/uc3_test_cases.md) - Request Advice & Observations
*   [uc4_test_cases.md](file:///docs/testing/uc4_test_cases.md) - Submit Project for Evaluation
*   [uc5_test_cases.md](file:///docs/testing/uc5_test_cases.md) - Request Project Unlock
*   [uc6_test_cases.md](file:///docs/testing/uc6_test_cases.md) - Evaluate Project & Publish Verdict
*   [uc7_test_cases.md](file:///docs/testing/uc7_test_cases.md) - Export Feasibility Report (PDF)

Each file contains a **Test Case Allocation Matrix** mapping variables/steps to 8 comprehensive test cases (TC1 to TC8), followed by compact, precise manual checklist tables:

```markdown
### TCX: [Test Case Title]
* **Actor**: [External Partner / Scape App Engineer / Unauthenticated User]
* **Purpose**: [Brief explanation of what is being tested]

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | [Variable] | [Value to enter] | [Expected UI & DB change] | | | |
```

---

## 3. Manual Testing Procedure

To execute the manual system tests and validate the system:

1. **Start the local environment**:
   Ensure Firestore Emulator and Node Express server are running:
   ```powershell
   npm run dev
   ```
2. **Open the target use case file**:
   Select the use case test document (e.g. `uc1_test_cases.md`) you wish to validate.
3. **Execute the steps**:
   - Open your browser (and an incognito tab to represent secondary roles like the Scape Engineer).
   - Follow the steps listed in the test case table exactly.
4. **Log the results**:
   - Fill in the **Actual Result**, **Pass/Fail** (use `🟢 Pass` or `🔴 Fail`), and **Comments** columns directly in the Markdown tables to document your run.

---

## 4. Converting Test Cases to Word (.docx) Format

For official test documentation or report submission, you can convert the Markdown test files (`uc1_test_cases.md` to `uc7_test_cases.md`) into Microsoft Word (`.docx`) format using one of the following methods:

### Method A: Using Pandoc (Recommended CLI Method)
Pandoc is a powerful document converter that converts Markdown directly to DOCX on the command line.

1. **Install Pandoc** (if not already installed):
   - On Windows (PowerShell):
     ```powershell
     winget install mdq.pandoc
     ```
2. **Convert a single file**:
   ```powershell
   pandoc -s docs/testing/uc1_test_cases.md -o docs/testing/uc1_test_cases.docx
   ```
3. **Convert all 7 files in batch** (PowerShell command):
   ```powershell
   Get-ChildItem docs/testing/uc*_test_cases.md | ForEach-Object {
       $docxPath = $_.FullName -replace '\.md$', '.docx'
       pandoc -s $_.FullName -o $docxPath
       Write-Host "Converted: $($_.Name) -> $(Split-Path $docxPath -Leaf)"
   }
   ```

### Method B: Using VS Code Extensions (GUI Method)
1. Open VS Code Extensions (`Ctrl+Shift+X`).
2. Search for and install the **vscode-markdown-docx** extension.
3. Open the target Markdown test file (e.g., `uc1_test_cases.md`).
4. Press `F1` (or right-click inside the document), search for `Export to DOCX`, and select it.

