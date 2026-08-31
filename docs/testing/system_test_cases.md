# System Test Cases - Scape Bin-Picker Projects

This document contains the system-level end-to-end test cases formulated using the [System Testing Skill](file:///.agents/skills/testing/SystemTesting/SKILL.md) based on the [Use Case Specifications](file:///docs/testing/use_cases.md).

These test cases verify the behavior of the React frontend, Node.js Express server (`server.js`), Firestore database, and Gemini AI integration.

---

## Use Case 1: Create and Save a Project Draft

### ST-01: Create and Save a Standard Project Draft (Base Sequence)

- **Use Case Reference**: UC-1: Create and Save a Project Draft (Base Sequence)
- **Actor(s)**: External Partner
- **Preconditions**:
  - The user is authenticated as an External Partner.
  - The user is on the Dashboard.
- **Test Steps**:
  1. Click the **New Project** button on the Dashboard.
  2. Input general cell details: Project Name = `"Test Project Alpha"`, preferred robot brand = `"Universal Robots"`, bin type = `"EU-Pallet"`.
  3. Navigate to the `Part #1` tab and input part name = `"Gear Block"`, weight = `2.5`, material = `"Shiny Steel"`, cycle time = `15`.
  4. Upload a screenshot/image of the part under the part images section.
  5. Click **Save Draft**.
- **Expected UI Behavior**:
  - A success toast notification is displayed: `"Draft saved successfully"`.
  - The user is redirected to the Dashboard.
  - A new project card titled `"Test Project Alpha"` appears on the dashboard with status `"Draft"`.
- **Expected Database & Backend State**:
  - **Firestore Path**: `projects/{projectId}`
  - **Verification Fields**:
    - `status`: `'draft'`
    - `isLocked`: `false`
    - `name`: `'Test Project Alpha'`
    - `generalResponses.robotBrand`: `'Universal Robots'`
    - `parts[0].partName`: `'Gear Block'`
    - `parts[0].images`: Array containing 1 image storage reference URL.
  - **Changelog Entry**: `{ action: 'create', timestamp: [timestamp], user: [user-email] }`

### ST-02: Dynamic Part Count Expansion (Alternate Sequence)

- **Use Case Reference**: UC-1: Create and Save a Project Draft (Dynamic Part Count Adjustments)
- **Actor(s)**: External Partner
- **Preconditions**:
  - The user is on the new project questionnaire screen.
- **Test Steps**:
  1. Change the value in the "Total of different parts in project" dropdown from `1` to `3`.
- **Expected UI Behavior**:
  - The sidebar/navigation instantly updates, displaying folders or tabs for `Part #1`, `Part #2`, and `Part #3`.
  - Navigating to `Part #2` or `Part #3` displays blank questionnaire steps for those parts.
- **Expected Database & Backend State**:
  - **Firestore Path**: N/A (State kept in local component memory until saved).

### ST-03: CAD File Size Safety Warning (Alternate Sequence)

- **Use Case Reference**: UC-1: Create and Save a Project Draft (CAD File Size Safety Warning)
- **Actor(s)**: External Partner
- **Preconditions**:
  - The user is editing a project draft on the part upload tab.
- **Test Steps**:
  1. Attempt to upload a 3D CAD STL model file of size `250 KB` to the CAD upload drop zone.
- **Expected UI Behavior**:
  - The upload is blocked immediately.
  - An error alert/toast is displayed: `"File size exceeds the 200 KB limit. Please upload screenshots/images of the CAD model instead."`
- **Expected Database & Backend State**:
  - No file is uploaded to storage, and no change is made to the Firestore document.

---

## Use Case 2: Auto-fill Questionnaire using AI Assistant Chat

### ST-04: Auto-fill Form Fields via AI Chat Proposal (Base Sequence)

- **Use Case Reference**: UC-2: Auto-fill Questionnaire using AI Assistant Chat (Base Sequence)
- **Actor(s)**: External Partner
- **Preconditions**:
  - The user is editing an unlocked project draft (`isLocked == false`).
  - The AI Assistant chat sidebar is open.
- **Test Steps**:
  1. Type in the chat window: `"Our bin is 1200 by 800 and 600 high. We use a Universal Robot. The part is a shiny steel block weighing 2kg."`
  2. Click **Send**.
  3. Once the AI responds, review the **Apply Proposed Changes** comparison card showing the changes.
  4. Click **Apply Changes**.
- **Expected UI Behavior**:
  - A loading spinner is shown during the AI request.
  - The chat feed renders a message from Gemini answering the query and rendering an comparison card showing:
    - Bin Length: `1200`
    - Bin Width: `800`
    - Bin Height: `600`
    - Robot Brand: `Universal Robots`
    - Part Material: `Shiny Steel`
    - Part Weight: `2`
  - Clicking **Apply Changes** updates the questionnaire form fields instantly and displays a success toast.
- **Expected Database & Backend State**:
  - **Backend Request**: POST `/api/ai/chat` payload containing the questionnaire state, active index, schema, and chat input.
  - **Firestore Path**: `projects/{projectId}`
  - **Verification Fields**:
    - `generalResponses.binLength`: `1200`
    - `generalResponses.binWidth`: `800`
    - `generalResponses.binHeight`: `600`
    - `generalResponses.robotBrand`: `'Universal Robots'`
    - `parts[0].material`: `'Shiny Steel'`
    - `parts[0].weight`: `2`

### ST-05: AI Multimodal Image Assignment (Alternate Sequence)

- **Use Case Reference**: UC-2: Auto-fill Questionnaire using AI Assistant Chat (Multimodal Image Assignments)
- **Actor(s)**: External Partner
- **Preconditions**:
  - The user has attached an image in the AI Chat window.
- **Test Steps**:
  1. Type: `"Please set this image as the photo for Part #1."`
  2. Click **Send**.
  3. Review the proposed action card and click **Apply Changes**.
- **Expected UI Behavior**:
  - The chat renders the proposal representing an image assignment.
  - The comparison card lists the image attachment being added to Part #1.
  - Upon applying, the uploaded image is added to the image gallery preview of Part #1.
- **Expected Database & Backend State**:
  - **Backend Request**: POST `/api/ai/chat` returning an action type `assign_image`.
  - **Firestore Path**: `projects/{projectId}`
  - **Verification Fields**:
    - `parts[0].images`: Array containing the new image reference URL.

### ST-06: General Question without Form Field Proposals (Alternate Sequence)

- **Use Case Reference**: UC-2: Auto-fill Questionnaire using AI Assistant Chat (No Changes Proposed)
- **Actor(s)**: External Partner
- **Preconditions**:
  - The AI Assistant chat sidebar is open.
- **Test Steps**:
  1. Type: `"What is a standard EU-pallet?"`
  2. Click **Send**.
- **Expected UI Behavior**:
  - Gemini responds with a text explanation of an EU-pallet (dimensions 1200x800 mm).
  - No comparison card or **Apply Changes** button is rendered in the chat message interface.
- **Expected Database & Backend State**:
  - No changes are written to the project's Firestore document.

---

## Use Case 3: Request Project Information Advice & Extract Observations

### ST-07: Request AI Advice and Field Observation Badges (Base Sequence)

- **Use Case Reference**: UC-3: Request Project Information Advice & Extract Observations (Base Sequence)
- **Actor(s)**: External Partner
- **Preconditions**:
  - The project draft is populated.
  - The user is viewing the **Review & Submit** tab.
- **Test Steps**:
  1. Click the **Get Advice on Data** button on the Review page.
- **Expected UI Behavior**:
  - A loading overlay appears while the analysis runs.
  - A detailed advice narrative text block is displayed on the screen.
  - Field inputs throughout the questionnaire containing risk factors (e.g., highly reflective steel material) display warning badges (`⚠️` or `🔴`) with custom inline tooltips detailing the AI's concern.
- **Expected Database & Backend State**:
  - **Backend Request**: POST `/api/ai/advice` and POST `/api/ai/extract-observations` are triggered sequentially.
  - **Firestore Path**: `projects/{projectId}`
  - **Verification Fields**:
    - `report`: String containing the full markdown text of the Gemini advice.
    - `fieldObservations`: Array of objects matching the structure: `{ fieldId: string, level: 'warning' | 'danger', reason: string }`
  - **Changelog Entry**: `{ action: 'generate_advice', timestamp: [timestamp], user: [user-email] }`

### ST-08: Review Tab Placeholder (Alternate Sequence)

- **Use Case Reference**: UC-3: Request Project Information Advice & Extract Observations (No Advice Available)
- **Actor(s)**: External Partner
- **Preconditions**:
  - A new project draft has just been created, and no advice has been generated.
- **Test Steps**:
  1. Navigate to the **Review & Submit** tab.
- **Expected UI Behavior**:
  - The page displays a placeholder card stating: `"No advice report generated yet. Let the AI review your entries to detect issues."`
  - The **Get Advice on Data** button is prominently displayed.
  - No warning badges (`⚠️` or `🔴`) are shown on any form fields.

---

## Use Case 4: Submit Project for Evaluation

### ST-09: Successfully Submit and Lock a Case (Base Sequence)

- **Use Case Reference**: UC-4: Submit Project for Evaluation (Base Sequence)
- **Actor(s)**: External Partner
- **Preconditions**:
  - The project is in `"Draft"` state.
  - All mandatory questionnaire fields are populated.
- **Test Steps**:
  1. Navigate to the **Review & Submit** tab.
  2. Click **Submit Case**.
  3. Click **Confirm** in the confirmation dialog modal.
- **Expected UI Behavior**:
  - A confirmation modal warning about project locking is shown.
  - After confirmation, a success toast displays: `"Project submitted successfully"`.
  - The user is redirected to the Dashboard.
  - The project card on the dashboard displays a lock icon and status `"Submitted"`.
  - Clicking on the project card opens a read-only view of the form (inputs are disabled).
- **Expected Database & Backend State**:
  - **Firestore Path**: `projects/{projectId}`
  - **Verification Fields**:
    - `status`: `'submitted'`
    - `isLocked`: `true`
  - **Changelog Entry**: `{ action: 'submit', timestamp: [timestamp], user: [user-email] }`

### ST-10: Block Submission on Validation Failure (Alternate Sequence)

- **Use Case Reference**: UC-4: Submit Project for Evaluation (Missing Required Fields)
- **Actor(s)**: External Partner
- **Preconditions**:
  - The project is in `"Draft"` state, but the mandatory field `"Project Name"` is empty.
- **Test Steps**:
  1. Navigate to the **Review & Submit** tab.
  2. Click **Submit Case**.
- **Expected UI Behavior**:
  - The system blocks the submission.
  - Error messages are displayed next to the missing inputs.
  - The browser automatically scrolls the page to focus on the first missing field (Project Name).
- **Expected Database & Backend State**:
  - The project status remains `'draft'` and `isLocked` remains `false` in Firestore.

---

## Use Case 5: Request Project Unlock / Edit Permission

### ST-11: Request Unlock and Approve (Base Sequence)

- **Use Case Reference**: UC-5: Request Project Unlock / Edit Permission (Base Sequence)
- **Actor(s)**: External Partner, Scape App Engineer
- **Preconditions**:
  - The project is locked (`isLocked == true`) with status `"Submitted"`.
- **Test Steps**:
  1. **[External Partner]**: Open the project and click **Request Edit Permission**.
  2. **[External Partner]**: Type `"We need to change the part dimension from 100 to 120."` in the modal and click **Submit Request**.
  3. **[Scape App Engineer]**: Log in and locate the project on the Dashboard (badge indicates `"Unlock Requested"`). Click **Review Request**.
  4. **[Scape App Engineer]**: Read the justification and click **Approve & Unlock**.
- **Expected UI Behavior**:
  - **Partner UI**: Request modal closes, and a banner displays `"Unlock request pending review"`.
  - **Engineer UI**: Review panel displays justification: `"We need to change the part dimension from 100 to 120."` Clicking approve shows success toast `"Project unlocked successfully"`.
  - **Partner Dashboard**: The project card status updates to `"Draft"`, and the lock icon is removed. Form fields are editable again.
- **Expected Database & Backend State**:
  - **After Step 2 (Firestore)**:
    - `editRequestPending`: `true`
    - `editRequestReason`: `'We need to change the part dimension from 100 to 120.'`
    - `changelog`: Log entry `{ action: 'request_unlock', reason: '...', user: ... }`
  - **After Step 4 (Firestore)**:
    - `status`: `'draft'`
    - `isLocked`: `false`
    - `editRequestPending`: `false`
    - `editRequestReason`: `null` (or field deleted)
    - `changelog`: Log entry `{ action: 'approve_unlock', user: [engineer-email] }`

### ST-12: Reject Unlock Request (Alternate Sequence)

- **Use Case Reference**: UC-5: Request Project Unlock / Edit Permission (Rejection of Request)
- **Actor(s)**: External Partner, Scape App Engineer
- **Preconditions**:
  - An unlock request has been submitted (`editRequestPending == true`).
- **Test Steps**:
  1. **[Scape App Engineer]**: Click **Review Request** for the project.
  2. **[Scape App Engineer]**: Click **Reject Request**.
- **Expected UI Behavior**:
  - The engineer sees a success toast confirming rejection.
  - The project's dashboard badge returns to normal.
  - **Partner UI**: The project remains locked (`isLocked == true`), and the banner changes to `"Unlock request was rejected"`.
- **Expected Database & Backend State**:
  - **Firestore Path**: `projects/{projectId}`
  - **Verification Fields**:
    - `isLocked`: `true`
    - `editRequestPending`: `false`
    - `editRequestReason`: `null` (or field deleted)
    - `changelog`: Log entry `{ action: 'reject_unlock', user: [engineer-email] }`

---

## Use Case 6: Evaluate Project and Publish Verdict

### ST-13: Self-Assign, Generate AI Draft, and Publish Verdict (Base Sequence)

- **Use Case Reference**: UC-6: Evaluate Project and Publish Verdict (Base Sequence)
- **Actor(s)**: Scape App Engineer
- **Preconditions**:
  - A project has status `"Submitted"` and is unassigned (`takenBy` is null/empty).
- **Test Steps**:
  1. On the Evaluator Dashboard, locate the project card and click **Take Case**.
  2. Open the project detail view and navigate to the **Evaluation** tab.
  3. Click **Generate Evaluator Draft**.
  4. Review the AI-populated feasibility text in the editor, make a manual modification, and choose verdict status = `"Approved"`.
  5. Toggle **Verdict Visible** to **ON** and click **Submit Technical Verdict**.
- **Expected UI Behavior**:
  - Clicking **Take Case** adds the engineer's avatar/email as assignee on the card.
  - Clicking **Generate Evaluator Draft** shows a loading overlay and then fills the rich-text evaluator area with technical summaries.
  - Clicking **Submit Technical Verdict** locks the evaluation section and updates the status to `"Approved"`.
- **Expected Database & Backend State**:
  - **After Step 1 (Firestore)**:
    - `takenBy`: `[engineer-email]`
    - `changelog`: Entry `{ action: 'assign_case', user: [engineer-email] }`
  - **After Step 3 (Backend Request)**:
    - POST `/api/ai/draft` executed with project parameters.
  - **After Step 5 (Firestore)**:
    - `status`: `'approved'`
    - `isVerdictVisible`: `true`
    - `verdictText`: `[edited verdict report]`
    - `changelog`: Entry `{ action: 'publish_verdict', verdict: 'approved', user: [engineer-email] }`

### ST-14: Draft Verdict Kept Private (Alternate Sequence)

- **Use Case Reference**: UC-6: Evaluate Project and Publish Verdict (Keeping Verdict Private / Draft Mode)
- **Actor(s)**: Scape App Engineer, External Partner
- **Preconditions**:
  - Scape App Engineer is editing an evaluation report.
- **Test Steps**:
  1. **[Scape App Engineer]**: Write report and select verdict status = `"Approved"`.
  2. **[Scape App Engineer]**: Ensure the **Verdict Visible** toggle is set to **OFF**.
  3. **[Scape App Engineer]**: Click **Save Verdict Draft**.
  4. **[External Partner]**: Log in and view the project dashboard.
- **Expected UI Behavior**:
  - **Engineer UI**: Save is successful; status update matches.
  - **Partner UI**: The partner's dashboard card still displays `"Submitted"` status and has no verdict report visible. The feasibility details are hidden.
- **Expected Database & Backend State**:
  - **Firestore Path**: `projects/{projectId}`
  - **Verification Fields**:
    - `isVerdictVisible`: `false`
    - `verdictText`: `[report text]`
    - `status`: `'submitted'` (or internal status if separate)

---

## Use Case 7: Export Project Feasibility Report (PDF)

### ST-15: Export Full Branded Feasibility Report (Base Sequence)

- **Use Case Reference**: UC-7: Export Project Feasibility Report (PDF) (Base Sequence)
- **Actor(s)**: External Partner
- **Preconditions**:
  - The project has a published verdict (`status == 'approved'`, `isVerdictVisible == true`).
- **Test Steps**:
  1. Open the project details header.
  2. Click **Export as PDF**.
- **Expected UI Behavior**:
  - The browser triggers a file download for a file named `[Project_Name]_Feasibility_Report.pdf`.
- **Expected Verification of PDF Output Content (Manual PDF Inspection)**:
  - **Branded Header**: Displays "Scape Bin-Picker Feasibility Report", Project Name, Owner, and Date.
  - **Section A (Factual Data)**: Tables summarizing all questionnaire responses. If highly reflective characteristics or cycle time constraints were flagged, warnings like `[⚠]` or `[!]` are displayed adjacent to those rows.
  - **Section B (Observations)**: Renders the structured advice report narrative generated by Gemini.
  - **Section C (Media)**: Embedded thumbnails of uploaded cell and part photos.
  - **Section D (Verdict)**: Displays the engineer's verdict: `"Verdict: Approved"`, along with the technical verdict details and recommendations text.
- **Expected Database & Backend State**:
  - No database state changes (Read-only operation).
