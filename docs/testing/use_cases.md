# Scape Bin-Picker Projects - Use Case Specifications

This document outlines the main features and use cases that were analyzed and implemented in the **Scape Bin-Picker Projects** application. Each specification follows the fully-dressed use case format.

---

## Use Case 1: Create and Save a Project Draft

### Summary
An External Partner starts a new project evaluation questionnaire, fills out preliminary details for the cell and target parts, uploads relevant files/images, and saves the data as an editable draft.

### Actors
*   **External Partner** (End User / Integrator)
*   **Scape App Engineer** (Evaluator)

### Preconditions
*   The user is authenticated.
*   The user has completed the onboarding profile setup.

### Postconditions
*   A project document is created/updated in the Firestore `projects` collection with `status: 'draft'` and `isLocked: false`.
*   The project is visible on the owner's dashboard and to Scape evaluators.

### Base Sequence
1. The user clicks the **New Project** button on the Dashboard.
2. The system initializes a blank project questionnaire template with default values.
3. The user enters general cell details in Step 0 (Project Name, expected number of parts, bin type, dimensions, and preferred robot brand).
4. The user navigates to the Part tabs and inputs part dimensions, weight, material, cycle times, and characteristic flags (reflectivity, oil presence, temperatures, etc.).
5. The user uploads part images, environment photos, and/or a 3D CAD STL model.
6. The user clicks **Save Draft**.
7. The system saves the current state to Firestore, displays a success toast notification, and navigates the user back to the Dashboard.

### Alternate Sequences
*   **Dynamic Part Count Adjustments:**
    1. The user changes the "Total of different parts in project" (Field 1.02) from `1` to `3`.
    2. The system instantly updates the navigation sidebar, adding two additional part folders (`Part #2` and `Part #3`) with their corresponding steps.
*   **CAD File Size Safety Warning:**
    1. The user drops a CAD file larger than 200 KB in the drop zone.
    2. The system blocks the attachment, displays an error message informing them of the limit, and suggests uploading screenshots/images of the CAD model instead.

---

## Use Case 2: Auto-fill Questionnaire using AI Assistant Chat

### Summary
A user utilizes the AI Assistant panel on the questionnaire view to talk to Google Gemini about their project parameters. The AI generates a suggested update payload, which the user can preview and apply to automatically fill in the form fields.

### Actors
*   **External Partner**
*   **Scape App Engineer**

### Preconditions
*   The project is in the `Draft` state (editable).
*   The AI Assistant sidebar is open.

### Postconditions
*   Questionnaire parameters are updated in Firestore according to the values proposed by the AI and confirmed by the user.

### Base Sequence
1. The user types a descriptive message in the AI Chat window (e.g., *"Our bin is 1200 by 800 and 600 high. We use a Universal Robot. The part is a shiny steel block weighing 2kg"*).
2. The user clicks **Send**.
3. The system captures the current project state, active part index, questionnaire schema, and chat history, forwarding it to the proxy endpoint `/api/ai/chat`.
4. The server calls the Google Gemini API with the `autoFillPrompt` rules.
5. Gemini processes the text, answers the user, and attaches a structured JSON proposal block defining changes to `generalResponses` and/or `parts`.
6. The client parses the response, displays the AI's chat message, and renders an **Apply Proposed Changes** comparison card.
7. The comparison panel lists only the proposed fields that differ from the current values.
8. The user clicks **Apply Changes**.
9. The system copies the proposed values into the questionnaire state, saves them to Firestore, and refreshes the form fields.

### Alternate Sequences
*   **Multimodal Image Assignments:**
    1. The user uploads an image to the chat and asks the AI to assign it.
    2. Gemini returns a proposed action of type `assign_image`.
    3. The system copies the image from the chat attachment list to the target part's images array.
*   **No Changes Proposed:**
    1. The user asks a general question (e.g., *"What is an EU-pallet?"*).
    2. Gemini answers the question without returning a JSON change proposal.
    3. The system displays the AI's reply but does not show the comparison card or the apply button.

---

## Use Case 3: Request Project Information Advice & Extract Observations

### Summary
A customer requests automated technical advice on their project inputs. The AI reviews the project completeness, generates an advice report, and extracts structured inline warnings displayed next to relevant fields.

### Actors
*   **External Partner**
*   **Scape App Engineer**

### Preconditions
*   The user is viewing the **Review & Submit** tab.

### Postconditions
*   The generated advice narrative is saved in the project's `report` field.
*   Structured warnings are mapped to specific field IDs under the `fieldObservations` property.

### Base Sequence
1. The user clicks the **Get Advice on Data** button on the Review page.
2. The client packages the project details and sends them to the `/api/ai/advice` endpoint.
3. The server invokes Gemini using the `externalAdvicePrompt` and returns the narrative report text.
4. The server automatically triggers the `/api/ai/extract-observations` endpoint, supplying the report and questionnaire schema.
5. Gemini extracts specific concerns and returns a JSON array of mappings: `{ fieldId: '1.04_w', level: 'warning', reason: '...' }`.
6. The client saves both the advice text and the structured observations array to Firestore.
7. The system renders the advice text block and highlights fields on the form with yellow `⚠️` or red `🔴` warning badges.

### Alternate Sequences
*   **No Advice Available:**
    1. The user opens the review tab of a new project.
    2. The system detects no advice has been generated yet, showing a placeholder card with the **Get Advice on Data** button.

---

## Use Case 4: Submit Project for Evaluation

### Summary
A customer finalize the questionnaire and submits it to Scape Solutions for evaluation. This locks the project to prevent any further changes.

### Actors
*   **External Partner**

### Preconditions
*   The project is in `Draft` state and owned by the logged-in user.
*   All required fields (e.g. Project Name, Part Name) are filled in.

### Postconditions
*   The project Firestore document is updated with `status: 'submitted'` and `isLocked: true`.
*   An audit entry is appended to the project's changelog.

### Base Sequence
1. The user navigates to the **Review & Submit** tab.
2. The user clicks the **Submit Case** button.
3. The system displays a confirmation dialog warning that the project will be locked.
4. The user clicks **Confirm**.
5. The system sets the status to `submitted` and lock flag to `true`, then logs the submit action.
6. The user is redirected to the Dashboard where the project card now shows a "Submitted" status and a lock icon.

### Alternate Sequences
*   **Missing Required Fields:**
    1. The user clicks "Submit Case" while the "Project Name" field is empty.
    2. The system displays validation errors and scrolls the user to the missing input, blocking submission until the data is resolved.

---

## Use Case 5: Request Project Unlock / Edit Permission

### Summary
A customer wishes to modify a locked project (either submitted or reviewed). They submit an unlock request with a justification, which is reviewed and approved/rejected by a Scape App Engineer.

### Actors
*   **External Partner** (Requester)
*   **Scape App Engineer** (Reviewer)

### Preconditions
*   The project is locked (`isLocked == true`) and has `Submitted`, `Approved`, or `Rejected` status.

### Postconditions
*   If approved, the project is unlocked (`isLocked: false`), reverted to `Draft` status, and request flags are cleared.
*   If rejected, the project remains locked and the request is dismissed.

### Base Sequence
1. The External Partner opens their locked project and clicks **Request Edit Permission**.
2. The system prompts the user for a brief reason in a modal.
3. The user types their justification (e.g., *"We changed the robot model to a KUKA"*) and submits.
4. The system updates Firestore: `editRequestPending: true`, `editRequestReason: [reason]`, and logs the request.
5. The Scape App Engineer logs in, sees the project card with a pulsing amber **"Unlock Requested"** status badge, and clicks **Review Request**.
6. The system displays the justification message in the approval panel.
7. The engineer clicks **Approve & Unlock**.
8. The system updates the project to `status: 'draft'`, `isLocked: false`, clears the request flags, and appends a changelog history entry.

### Alternate Sequences
*   **Rejection of Request:**
    1. The Scape Engineer reviews the request and clicks **Reject Request**.
    2. The system clears `editRequestPending` and `editRequestReason` but keeps `isLocked: true` and the existing status intact.
    3. The rejection action is recorded in the history log.

---

## Use Case 6: Evaluate Project and Publish Verdict

### Summary
A Scape App Engineer evaluates a submitted project, assigns themselves as the engineer, drafts technical specs with AI assistance, refines the review text, and publishes the final verdict.

### Actors
*   **Scape App Engineer**

### Preconditions
*   The project status is `Submitted`.
*   The engineer is logged in and operating in **Evaluator Mode**.

### Postconditions
*   The project is assigned (`takenBy: [engineer-email]`).
*   `status` is set to `Approved` or `Rejected`.
*   The finalized verdict report is stored and marked visible to the customer.

### Base Sequence
1. The engineer finds an unassigned submitted project on the dashboard and clicks **Take Case**.
2. The system registers the engineer in `takenBy` and records it in the history log.
3. The engineer opens the project and clicks the **Evaluation** tab.
4. The engineer clicks **Generate Evaluator Draft**.
5. The server proxy (/api/ai/draft) queries Gemini using the project data and the `evaluatorDraftPrompt` rules, and populates the technical report editor.
6. The engineer edits the report text, sets the decision verdict (e.g., Approved), and specifies recommendations.
7. The engineer clicks **Submit Technical Verdict**.
8. The system saves the report, changes the project status to `Approved`, sets `isVerdictVisible: true`, and logs the action.

### Alternate Sequences
*   **Keeping Verdict Private (Draft Mode):**
    1. The engineer writes the verdict but wants to consult a colleague before sharing.
    2. They save the verdict text but toggle "Verdict Visible" to **OFF** (`isVerdictVisible: false`).
    3. The customer cannot view the verdict review on their dashboard yet.

---

## Use Case 7: Export Project Feasibility Report (PDF)

### Summary
A user or evaluator exports the current questionnaire inputs, warning observations, and Scape technical verdict into a branded, printable PDF document.

### Actors
*   **External Partner**
*   **Scape App Engineer**

### Preconditions
*   The project document exists in Firestore.

### Postconditions
*   A branded PDF document is generated and downloaded to the client machine.

### Base Sequence
1. The user clicks **Export as PDF** from the project dashboard card dropdown or details header.
2. The client application triggers `pdfGenerator.ts` using `jspdf` and `jspdf-autotable`.
3. The system compiles the PDF sections:
    *   **Branded Header:** Document title, project name, owner, and date.
    *   **Section A (Factual Data):** Tables summarizing questionnaire parameters. Fields with concerns get a warning indicator `[!]` or `[⚠]`.
    *   **Section B (Data Capture Advice):** List of flagged fields and the full narrative AI advice report.
    *   **Section C (Media Appendix):** Uploaded cell and part photos.
    *   **Section D (Verdict):** Displays the published verdict text (or evaluator draft if run by an admin and no verdict is published yet).
4. The system compiles the PDF and initiates a browser file download.
