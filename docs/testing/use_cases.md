# Scape Bin-Picker Projects - Use Case Specifications

This document outlines the core use cases for the **Scape Bin-Picker Projects** application. Every specification reflects the current production architecture and user workflows, following the fully-dressed use case format.

---

## Use Case 1: Create and Auto-Save a Project Draft

### Summary
An External Partner initiates a new bin-picking project evaluation, chooses between an AI-guided or manual setup pathway, fills out project and work cell parameters, uploads part media and CAD files, and relies on real-time auto-saving to persist the draft in Firestore.

### Actors
*   **External Partner** (End User / Integrator)
*   **System** (Application frontend & Firebase Firestore)

### Preconditions
*   The user is authenticated.
*   The user has completed the onboarding profile setup (Terms of Service accepted).

### Postconditions
*   A new project document is created and maintained in Firestore with `status: 'draft'` and `isLocked: false`.
*   A unique Case ID is generated (e.g., `#A1B2C3`).
*   The project is listed on the user's dashboard and visible to Scape engineers.

### Base Sequence
1. The user clicks the **New Project** button on the Dashboard.
2. The system displays the **Create New Project** modal with two setup options:
   *   **Start with AI** (`isSplitScreen: true`): Interactive questionnaire with the AI Assistant panel active side-by-side.
   *   **Start Manually** (`isSplitScreen: false`): Standard step-by-step questionnaire view.
3. The user selects **Start Manually**.
4. The system initializes a project document in Firestore with default values (`projectName: "New SCAPE PICK-PILOT Project"`, `status: 'draft'`, `isLocked: false`), generates a unique ID, and opens the Questionnaire View at Step 0 (**Project & Cell Info**).
5. The user enters general cell details in Step 0 (Project Name, expected number of parts, bin type, bin dimensions, preferred robot brand, and optional cell environment photos).
6. The user navigates through the Part tabs and enters:
   *   **Part Basics** (Part name, dimensions L/W/H, weight, material, cycle time, CAD file availability).
   *   **Physical Properties & Grip** (Reflectivity, oil/lubrication, entanglement risk, suction/magnetic/finger gripper suitability).
   *   **Visual Evidence** (Part photos, orientation/placement photos).
7. The system automatically executes **continuous auto-saving** on every field blur, step transition, and file upload, updating the Firestore document in real time without requiring a manual save button.
8. The user clicks **Dashboard** in the navigation header.
9. The system verifies all pending writes are committed and redirects the user to the Dashboard, where the project card displays the `"Draft"` status badge and completion percentage.

### Alternate Sequences
*   **Start with AI Pathway:**
    1. In Step 3, the user selects **Start with AI**.
    2. The system initializes the project with `isSplitScreen: true`, opening the Questionnaire View with the AI Assistant chat pane docked on the left (or full-width on mobile) ready to receive requirements.
*   **Dynamic Part Count Adjustment:**
    1. The user updates the "Total of different parts in project" field (`1.02`) or clicks the **+ Add New Part** button in the sidebar.
    2. The system dynamically updates the parts array, appends new part folders (`Part #2`, `Part #3`, etc.) to the navigation sidebar, and auto-saves the updated structure.
*   **CAD File Validation & Size Ceiling (200 KB Limit):**
    1. In question 2.06, the user drags or selects a CAD file (`.stl`, `.step`, `.stp`, `.igs`, `.iges`).
    2. If the file exceeds 200 KB, the system blocks the upload, alerts the user to the database size constraint, and suggests uploading CAD screenshots in the **Visual Evidence** tab instead.
    3. If the file is valid and under 200 KB, the system converts it to a base64 Data URL, attaches it to the part's `cadFile` object, and auto-saves.
*   **Client-Side Image Compression:**
    1. The user uploads high-resolution photos of the cell or parts.
    2. The system compresses images on the client via canvas downscaling before writing to Firestore, ensuring low latency and adherence to document size constraints.

---

## Use Case 2: Auto-fill Questionnaire using AI Assistant (Text, Voice, Media)

### Summary
An External Partner interacts with the embedded AI Assistant (Google Gemini) via text, live microphone voice recording, or uploaded documents/images. The AI generates structured field proposals that the user can review in a visual diff comparison card and apply directly to the questionnaire.

### Actors
*   **External Partner**
*   **System** (Gemini AI Engine & Proxy Backend)

### Preconditions
*   The project is in `Draft` state (`isLocked == false`).
*   The user has the AI Assistant split-screen pane or drawer open.

### Postconditions
*   Questionnaire parameters are automatically populated and persisted in Firestore upon user approval.
*   Chat history and attachments are preserved in the project document.

### Base Sequence
1. The user enters input into the AI Assistant interface by:
   *   Typing a project description (e.g., *"We have a 1200x800x600 Euro bin with Universal Robot UR10e. Part weighs 2.5kg and has a shiny steel finish"*), OR
   *   Clicking the microphone icon to record a **live voice memo** (captured via the Web Audio `MediaRecorder` API), OR
   *   Attaching a technical datasheet, PDF (up to 10 MB), or part image.
2. The user clicks **Send** (or stops audio recording).
3. The system captures the current project state, active part index, questionnaire schema, and sanitized chat history, dispatching the request to `/api/ai/chat` (or the direct Gemini SDK on localhost).
4. Gemini analyzes the input using `autoFillPrompt` rules, separates verified data, and outputs:
   *   Markdown response containing structured sections (`---FACTS---`, `---QUESTIONS---`, `---END---`).
   *   A structured ````json ``` code block proposing changes to `generalResponses` and/or `parts`.
5. The client parses the response, displays the assistant's message in the chat feed, and renders an interactive **Apply Proposed Changes** card highlighting differences between proposed and current values.
6. The user clicks **Apply Changes**.
7. The system updates the questionnaire state with the proposed values, auto-saves to Firestore, and refreshes the form inputs.
8. The comparison card updates to show a confirmed state (`"Applied"`).

### Alternate Sequences
*   **Image Action Proposals (`assign_image`, `move_image`, `copy_image`, `delete_image`):**
    1. The user attaches an image in chat and instructs: *"Use this photo for Part 1"*.
    2. Gemini outputs a proposal with `suggestedAction: 'assign_image'` targeting part index `0`.
    3. The comparison card displays the image preview and target part.
    4. The user clicks **Apply Changes**, copying the image into the part's visual evidence array.
*   **Specialized Technical Query Delegation (`ask_support`):**
    1. The user asks an in-depth hardware or support question (e.g., *"Does Scape Mini support structured light cameras at 1.5m distance?"*).
    2. The primary AI identifies the technical nature of the inquiry and returns `{ suggestedAction: 'ask_support', query: '...' }`.
    3. The system forwards the query to the dedicated support endpoint `/api/support-chat` and injects a styled **Support AI** response bubble into the chat feed.
*   **Conversational Questions (No Changes Proposed):**
    1. The user asks an informational question (e.g., *"What is an EU-pallet?"*).
    2. The AI provides an explanation without returning a JSON proposal block.
    3. The system renders the explanation text with no comparison card or apply button.
*   **Superseded Proposals:**
    1. If the user sends a new message before approving an existing proposal card, the older proposal is marked as superseded, ensuring only the most recent recommendation can be applied.

---

## Use Case 3: Request Project Information Advice & Extract Field Observations

### Summary
An External Partner requests an automated feasibility review of their entered parameters. The AI evaluates data completeness, generates a narrative advice report, highlights data differences since previous advice runs, and extracts structured field-level warnings (`⚠️` / `🔴`) displayed across the questionnaire.

### Actors
*   **External Partner**
*   **Scape App Engineer** (Evaluator)
*   **System** (Gemini AI Engine)

### Preconditions
*   The project contains preliminary data.
*   The project is open in the Questionnaire View.

### Postconditions
*   The narrative advice report is saved in `project.report`.
*   Structured warnings are mapped to field IDs in `project.fieldObservations`.
*   A data snapshot and timestamp are stored in `lastAdviceResponsesSnapshot` and `lastAdviceTimestamp`.

### Base Sequence
1. The user clicks the **⚡ AI Advice** button in the Header or the **Get AI Advice** button in the Submit guidance card.
2. The system opens the **Slide-over AI Advice Drawer** (`isAdviceDrawerOpen`).
3. The system computes a data diff against `lastAdviceResponsesSnapshot` (`computeDataDiff`). If fields were modified since the last advice request, a `🔄 Data Changes Since Last Advice Request` markdown section is prepended.
4. The client packages project data and calls `/api/ai/advice` (Gemini 2.5 Pro with `externalAdvicePrompt`).
5. The server generates the narrative advice report detailing missing data, geometry risks, and cycle-time realism.
6. The system automatically sends the advice text to `/api/ai/extract-observations` with the questionnaire schema.
7. Gemini extracts field-specific concerns, returning a JSON map: `{ "[fieldId]": { "severity": "warning" | "critical", "text": "..." } }`.
8. The system updates Firestore with the report narrative, observations map, and current timestamp.
9. The drawer renders the formatted Markdown report. In the main form, field-level warning dots appear on sidebar steps, and colored warning banners appear beside the affected input fields.

### Alternate Sequences
*   **Download Advice Report:**
    1. While inside the AI Advice drawer, the user clicks **.MD** to download the Markdown file (`downloadMarkdownFile`), or clicks **.PDF** to download a formatted PDF report (`generateProjectPdf`).
*   **Re-generate Advice:**
    1. The user modifies flagged parameters in the questionnaire, re-opens the drawer, and clicks **Re-generate Advice**.
    2. The system re-executes diff analysis and API calls, refreshing the report and clearing resolved observations.

---

## Use Case 4: Submit Project for Evaluation & Direct Unsubmit

### Summary
An External Partner finalizes their project data, adds optional submission notes, and officially submits the project to Scape Solutions. The submission freezes a snapshot of the AI advice and transitions the project to `Submitted` status. Prior to an engineer locking the case, the partner retains the option to cancel submission (direct unsubmit).

### Actors
*   **External Partner**

### Preconditions
*   The project is in `Draft` state (`status: 'draft'`, `isLocked: false`).
*   The partner is viewing the **Submit** tab.

### Postconditions
*   `status` is set to `'submitted'`.
*   A frozen snapshot of the AI advice and observations is saved in `userSubmittedReport`, `userSubmittedObservations`, and `userSubmittedAdviceTimestamp`.
*   The project card on the Dashboard updates to show the `"Submitted"` badge.

### Base Sequence
1. The user navigates to the **Submit** section in the navigation sidebar.
2. The system renders the Data Accuracy & Submission Guidance box and an optional textarea for **Additional Submission Notes or Comments** (`userSubmissionNotes`).
3. The user enters any additional manufacturing context or delivery remarks.
4. The user clicks **Submit Project**.
5. The system captures the current AI advice report, field observations, and timestamp into frozen snapshot fields (`userSubmittedReport`, `userSubmittedObservations`, `userSubmittedAdviceTimestamp`).
6. The system updates Firestore with `status: 'submitted'`, records an audit log entry, and displays a success notification: *"Project successfully submitted for Scape evaluation!"*.
7. The user remains on the Submit tab; the button changes to **Submitted (Click to Unsubmit)**.

### Alternate Sequences
*   **Direct Unsubmit (Cancel Submission):**
    1. While `status === 'submitted'` and the project has not yet been locked by an engineer (`isLocked == false`), the user realizes a parameter needs correction.
    2. The user navigates to the bottom of the Submit tab and clicks **Submitted (Click to Unsubmit)**.
    3. The system reverts the project in Firestore to `status: 'draft'`, displays a confirmation toast (*"Project submission cancelled. You can now edit it again"*), and restores full editing rights without requiring administrative approval.
*   **Locked Against Direct Unsubmit:**
    1. If an evaluator has already clicked "Begin Evaluation (Lock Project)" or locked the project (`isLocked == true`), the direct unsubmit button is replaced by the **Request Edit Permission** button (see Use Case 5).

---

## Use Case 5: Request Project Unlock / Edit Permission

### Summary
An External Partner wishes to modify a project that has been locked by Scape Engineers or has received a final verdict. The partner submits an unlock request with a justification reason. A Scape App Engineer reviews and either approves (reverting the case to editable draft) or rejects the request.

### Actors
*   **External Partner** (Requester)
*   **Scape App Engineer** (Reviewer)

### Preconditions
*   The project is locked (`isLocked == true`) or has reached a final verdict (`status: 'approved' | 'rejected'`).

### Postconditions
*   **If approved:** The project is unlocked (`isLocked: false`), reverted to `status: 'draft'`, and pending flags are cleared.
*   **If rejected:** The project remains locked in its current status, and the pending request flags are dismissed.

### Base Sequence
1. The External Partner opens their locked project, navigates to the Submit tab, and clicks **Request Edit Permission**.
2. The system presents the **Request Edit Permission** modal with a text input.
3. The partner enters their justification (e.g., *"Part dimensions changed from 150mm to 195mm; need to re-upload CAD"*) and clicks **Submit**.
4. The system updates Firestore: `editRequestPending: true`, `editRequestReason: [reason]`, and appends a changelog entry.
5. In the partner's UI, the button is replaced with an amber status banner showing: *"Edit request pending approval by Scape Solutions"* along with their quoted reason.
6. The Scape App Engineer logs in and observes the project on the Dashboard with a pulsing amber **"Unlock Requested"** badge, or opens the project's **Review/approve** tab.
7. The engineer opens the approval panel, reviews the partner's justification, and clicks **Approve & Unlock**.
8. The system updates Firestore: sets `status: 'draft'`, `isLocked: false`, clears `editRequestPending` and `editRequestReason`, and records an audit log entry.
9. The partner's project is now fully editable.

### Alternate Sequences
*   **Engineer Rejects Request:**
    1. In Step 7, the engineer clicks **Reject Request**.
    2. The system clears `editRequestPending` and `editRequestReason`, maintains `isLocked: true` and existing status, and logs the rejection.
    3. The partner UI removes the pending banner, leaving the project locked.
*   **User Cancels Modal:**
    1. The partner clicks "Request Edit Permission" and then closes the modal without submitting.
    2. No state changes are made.

---

## Use Case 6: Evaluate Project and Publish Verdict

### Summary
A Scape App Engineer evaluates a submitted project, locks the case to begin evaluation, reviews the frozen submission advice snapshot, generates an AI Evaluator Draft with Gemini, refines the verdict narrative in Markdown, and publishes the official verdict report for customer access.

### Actors
*   **Scape App Engineer** (Evaluator / Admin)
*   **External Partner** (Recipient)

### Preconditions
*   The project has `status: 'submitted'`.
*   The engineer is authenticated and operating in **Evaluator Mode**.

### Postconditions
*   The project is assigned (`takenBy: [uid]`, `takenByName: [name]`).
*   `isLocked` is set to `true`.
*   `finalVerdict` narrative is stored in Firestore.
*   `isVerdictVisible` is set to `true`, making the verdict visible in the partner's **Scape Review** tab.
*   Project status is set to `'approved'` or `'rejected'`.

### Base Sequence
1. The engineer navigates to the Dashboard, identifies an unassigned submitted project, and clicks **Take Case**.
2. The system sets `takenBy` and `takenByName` to the engineer's credentials and logs the assignment.
3. The engineer opens the project and clicks the **Review/approve** tab in the sidebar.
4. If the case is not yet locked, the engineer clicks **Begin Evaluation (Lock Project)**, which sets `isLocked: true`.
5. The engineer expands the **User AI Advice Report (At Submission)** accordion to review the frozen snapshot of advice and observations submitted by the user.
6. In the **Evaluator AI Draft** box, the engineer clicks **Generate Evaluator Draft**.
7. The server calls `/api/ai/draft` using `evaluatorDraftPrompt` and Gemini 2.5 Pro, evaluating the project against Scape system requirements (Scape Mini vs. Scape Pro, gripper type, cycle-time feasibility).
8. The draft appears in the editor; the engineer reviews the layout in Markdown or raw text mode.
9. In the **Project Review from Scape Solutions** box, the engineer edits the verdict narrative, adds specific commercial or technical recommendations, and verifies formatting.
10. The engineer clicks **Publish Verdict to User**.
11. The system saves the `finalVerdict` text, sets `isVerdictVisible: true`, and logs the publication.
12. On the Dashboard (or via card actions), the engineer sets the project status to **Approve** (`status: 'approved'`).
13. The External Partner opens their project, navigates to the dedicated **Scape Review** tab, and reads the official verdict report.

### Alternate Sequences
*   **Save Verdict as Internal Draft (Private Mode):**
    1. The engineer edits the verdict but is not ready to release it to the customer.
    2. The engineer clicks **Save Draft**.
    3. The system saves the `finalVerdict` text in Firestore while keeping `isVerdictVisible: false`. The customer cannot see the verdict.
*   **Unpublish Verdict:**
    1. An engineer clicks **Unpublish Verdict**.
    2. The system sets `isVerdictVisible: false`, hiding the report from the partner while preserving the text.
*   **Direct Unlock by Evaluator:**
    1. While reviewing a submitted case, the engineer decides the customer needs to adjust input data.
    2. The engineer clicks **Unlock Project (Allow User Changes)**.
    3. The system sets `isLocked: false`, allowing the user to make changes directly without an unlock request.

---

## Use Case 7: Export Project Feasibility Report (PDF & Markdown)

### Summary
An External Partner or Scape Engineer exports questionnaire data, field observations, and uploaded imagery into a branded, printable PDF document or Markdown summary.

### Actors
*   **External Partner**
*   **Scape App Engineer**

### Preconditions
*   The project document exists in Firestore.

### Postconditions
*   A branded PDF document (`scape_evaluation_[projectName].pdf`) or Markdown file is generated and downloaded to the client machine.

### Base Sequence
1. The user initiates a PDF export from any of the available entry points:
   *   Clicking **.PDF** in the Slide-over AI Advice Drawer header, OR
   *   Clicking **Export PDF Verdict** in the Scape Review tab, OR
   *   Clicking **Export** -> **PDF Report** on the Dashboard project card (Evaluators / Superusers).
2. The client executes `generateProjectPdf` (`pdfGenerator.ts`) using the native `jsPDF` engine.
3. The system queries subcollections to fetch all base64 cell and part images.
4. The system compiles the document sections:
   *   **Branded Header Banner:** Dark slate header (#0F172A) with Scape red accent line (#BF1E2E), document title, Case ID, creation date, and status.
   *   **Customer Contact Information:** Project name, contact name, company, email, and phone.
   *   **General Work Cell Data:** Formatted summary of Step 0 parameters (bin type, dimensions, robot brand, and special constraints).
   *   **Parts Summary Table:** Formatted grid displaying part name, dimensions, weight, material, and CAD file name.
   *   **Detailed Part Responses:** Structured listing of all physical and handling questions for each part.
   *   **Field Observations Summary:** Highlighted warning strips displaying specific AI warnings (`[!]`) with severity color coding (amber for warnings, red for critical).
   *   **Visual Attachments Appendix:** 3-column photo grid displaying container photos, cell photos, part photos, and placement photos with figure labels.
   *   **Page Footer:** Running document title, date, and `"Page X of Y"` pagination on every page.
5. The system triggers a browser download of `scape_evaluation_[projectName].pdf`.

### Alternate Sequences
*   **Markdown Summary Export (.MD):**
    1. Inside the AI Advice Drawer, the user clicks **.MD**.
    2. The client executes `downloadMarkdownFile`, generating and downloading a clean Markdown summary (`[projectName]-ai-advice.md`).
*   **Superuser Bulk JSON Export:**
    1. A Superuser applies filters on the Dashboard and clicks **Export Filtered (JSON)**.
    2. The system fetches full project states and attachments, downloading a single aggregated `scape_projects_export_[date].json` file.

---

## Use Case 8: Extended Analysis & Business Case (ROI Simulation)

### Summary
An External Partner or Scape Engineer simulates the commercial feasibility of automating the bin-picking cell by entering labor and shift parameters to calculate annual savings and estimated payback periods.

### Actors
*   **External Partner**
*   **Scape App Engineer**

### Preconditions
*   The project draft is open in the Questionnaire View.

### Postconditions
*   ROI parameters are persisted under `generalResponses` (`businessCaseSavedLabor`, `businessCaseShifts`, `businessCaseWorkDays`).

### Base Sequence
1. The user clicks **Business Case** under the Extended Analysis section in the navigation sidebar.
2. The system renders the ROI Estimation Parameters interface with a disclaimer banner highlighting that calculations are simulation drafts for reference.
3. The user inputs or adjusts:
   *   **Operator Hourly Labor Cost (EUR)** (default: 50 EUR/h).
   *   **Operating Shifts per Day** (1, 2, or 3 shifts).
   *   **Expected Work Days per Year** (default: 220 days).
4. The system calculates operational metrics:
   *   Total annual operator hours saved per shift.
   *   Total estimated annual labor cost savings.
   *   Indicative payback period based on standard hardware/integration cost benchmarks.
5. The system auto-saves the values into `generalResponses`.

### Alternate Sequences
*   **Explore Additional Opportunities:**
    1. The user clicks **Additional Opportunities** in the Extended Analysis sidebar.
    2. The system displays questions regarding neighboring automation cells (feeder bowls, conveyors, secondary sorting, packaging lines) to identify broader automation potential.

---

## Use Case 9: Project Lifecycle & Case Management

### Summary
Users and evaluators manage the overall lifecycle of projects on the Dashboard, including archiving inactive cases, soft-deleting cases to the trash, permanently purging cases, and restoring deleted records.

### Actors
*   **External Partner** (Owner)
*   **Scape App Engineer** (Admin / Superuser)

### Preconditions
*   The user is on the Dashboard.

### Postconditions
*   Project document flags (`isInactive`, `isDeleted`) are updated or documents are permanently removed from Firestore.

### Base Sequence (Soft Delete to Trash)
1. The user clicks the **Delete** (trash icon) button on their project card.
2. The system displays a confirmation modal: *"Are you sure you want to move project [Name] to the trash?"*.
3. The user types `"delete"` to confirm and clicks **Move to Trash**.
4. The system updates the document: `isDeleted: true`, removes the card from the active dashboard view, and logs the action.

### Alternate Sequences
*   **Restore Project from Trash:**
    1. An engineer or owner selects **Status: Deleted** in the Dashboard filter bar.
    2. The card appears with a red `"Deleted"` badge and a **Restore** button.
    3. The user clicks **Restore**.
    4. The system updates Firestore: `isDeleted: false`, restoring the project to its previous state.
*   **Final Permanent Delete (Evaluator Only):**
    1. An evaluator views a project in the trash and clicks **Final Delete**.
    2. The confirmation modal informs the engineer that this action is irreversible.
    3. The engineer confirms; the system permanently deletes the project document and its associated image subcollection from Firestore.
*   **Toggle Inactive / Archive:**
    1. An evaluator clicks **Deactivate** on an active project card.
    2. The system sets `isInactive: true`.
    3. The project is hidden from the default dashboard view and can only be seen when the **Show Inactive** filter toggle is enabled. Clicking **Activate** restores the active status.
