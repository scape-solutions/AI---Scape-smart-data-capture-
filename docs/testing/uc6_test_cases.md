# System Test Cases: UC6 - Evaluate Project & Publish Verdict

This document defines the system test cases for **Use Case 6: Evaluate Project and Publish Verdict**. It includes the Test Case Allocation Matrix and 8 role-focused manual test cases.

---

## Test Case Allocation Matrix (UC6)

| Step | Variable / Selection | TC1 (Publish Approved) | TC2 (Generate AI Draft) | TC3 (Verdict Private) | TC4 (Edit RTF Draft) | TC5 (Publish Reject) | TC6 (Claim Conflict) | TC7 (Changelog Check) | TC8 (Partner Block) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **B1** | Initial Project State | `'submitted'` | `'submitted'` | `'submitted'` | `'submitted'` | `'submitted'` | `'submitted'` | `'submitted'` | `'submitted'` |
| **B2** | takenBy Assignment | Click Take Case | Click Take Case | Click Take Case | Click Take Case | Click Take Case | Click Take Case (Eng 1) | Click Take Case | None |
| **B3** | AI draft endpoint | N/A | Trigger `/api/ai/draft` | Trigger `/api/ai/draft` | Trigger `/api/ai/draft` | Trigger `/api/ai/draft` | N/A | N/A | blocked locally |
| **B4** | Report Modification | No change | View only | No change | Edit draft report | No change | N/A | N/A | N/A |
| **B5** | Verdict Selection | `'approved'` | None | `'approved'` | `'approved'` | `'rejected'` | N/A | `'approved'` | N/A |
| **B6** | Verdict Visibility | **ON** | **OFF** | **OFF** | **ON** | **ON** | N/A | **ON** | N/A |
| **B7** | Action Submit | Click Publish | N/A (Auto-save) | Click Save Draft | Click Publish | Click Publish | Click Take Case (Eng 2) | Click Publish | N/A |
| **B8** | Firestore Status | `'approved'` | `'submitted'` | `'submitted'` | `'approved'` | `'rejected'` | `takenBy: [Eng1]` | `'approved'` | No change |
| **B9** | Firestore `isVerdictVisible`| `true` | `false` | `false` | `true` | `true` | `false` | `true` | `false` |

---

## Manual Test Cases

### TC1: Engineer Self-Assigns and Publishes Approved Verdict (Happy Path)
* **Actors**: Scape App Engineer & External Partner
* **Purpose**: Verify that an Engineer can self-assign an submitted project, set an approved verdict, toggle visibility to ON, and publish it so the Partner can view the report.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **[Engineer]** B2: Claim | Click **Take Case** | Assignee field updates with Engineer's avatar/email. Firestore sets `takenBy: [engineer-email]`. | | | |
| **2** | **[Engineer]** B5-B7 | Tab: Evaluation; Select verdict: `"Approved"`; Toggle Visibility: `"ON"`; Click **Submit Technical Verdict** | Verdict is submitted with toast. Evaluation inputs lock. Firestore status sets to `'approved'`, `isVerdictVisible` is `true`. | | | |
| **3** | **[Partner]** B9: View | Log in as Partner; open dashboard | Project card status updates to `"Approved"`. Clicking card displays the published technical verdict and recommendations report. | | | |

---

### TC2: Generate AI Evaluator Draft Report
* **Actor**: Scape App Engineer
* **Purpose**: Verify that triggering the AI Draft generation successfully fetches and pre-populates the editor with Gemini-generated technical summary text.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Engineer has claimed project | Navigate to project Evaluation tab. | | | |
| **2** | B3: AI Draft Trigger | Click **Generate Evaluator Draft** | Loading screen appears. Proxy `/api/ai/draft` endpoint is called. | | | |
| **3** | B4: Editor Populated | Rich text editor displays text | Report editor is pre-populated with markdown summarizing parts compatibility, cycle times, and recommended Scape systems. | | | |

---

### TC3: Save Verdict as Draft (Private Mode)
* **Actors**: Scape App Engineer & External Partner
* **Purpose**: Verify that saving a verdict draft with visibility set to OFF stores the data but prevents the partner from viewing the verdict.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **[Engineer]** B6 & B7 | Toggle Visibility: `"OFF"`; Click **Save Verdict Draft** | Verdict details save successfully. Project status remains `'submitted'`. Firestore sets `isVerdictVisible: false`. | | | |
| **2** | **[Partner]** B9: View | Log in as Partner; check Dashboard | Project card still displays `"Submitted"` status. Details view does not render the evaluation report. | | | |

---

### TC4: Edit AI-Generated Draft text in Rich Text Editor
* **Actor**: Scape App Engineer
* **Purpose**: Verify that the Engineer can manually edit and refine the text inside the editor before publishing the verdict.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | AI Draft report is generated (TC2 execution) | Report editor contains text. | | | |
| **2** | B4: Text edit | Modify draft: add `"Recommending Scape Pro Gripper Option B."` | Editor updates and retains manually added text. | | | |
| **3** | B7: Action | Click Publish Verdict | Verdict publishes. Final saved `verdictText` contains the manual modification. | | | |

---

### TC5: Publish Rejected Verdict Flow
* **Actors**: Scape App Engineer & External Partner
* **Purpose**: Verify that publishing a rejected verdict updates the status to Rejected and renders appropriate alerts on the Partner dashboard.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **[Engineer]** B5 | Select verdict: `"Rejected"`; Visibility: `"ON"`; Click Publish | Save is successful. Firestore updates: `status: 'rejected'`, `isVerdictVisible: true`. | | | |
| **2** | **[Partner]** B8 & B9 | Log in as Partner; check Dashboard | Project card status updates to `"Rejected"` with a warning badge. Partner can open card to read reject justification details. | | | |

---

### TC6: Claim Conflict Block
* **Actors**: Scape Engineer 1 & Scape Engineer 2
* **Purpose**: Verify that once an engineer claims a project, another engineer cannot claim it.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **[Engineer 1]** Action | Click **Take Case** on submitted project | `takenBy` field is set to Engineer 1. | | | |
| **2** | **[Engineer 2]** UI | View same project card on dashboard | Card displays: `"Claimed by [Engineer 1]"`. The "Take Case" button is disabled/hidden. | | | |

---

### TC7: Audit Log for Case Actions
* **Actor**: Scape App Engineer
* **Purpose**: Verify that assignee claims and verdict publications are correctly audited in the project's changelog.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | TC1 has been executed | Retrieve project document from Firestore. | | | |
| **2** | B8: Changelog check | Inspect `changelog` field array | Firestore document includes entries: `{ action: 'assign_case', user: [engineer-email] }` and `{ action: 'publish_verdict', verdict: 'approved', user: [engineer-email] }`. | | | |

---

### TC8: Partner Blocked from Evaluator Tools
* **Actor**: External Partner
* **Purpose**: Verify that External Partners cannot view the evaluation tab or access direct endpoints to generate drafts or publish verdicts.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Partner is logged in | Navigate to direct evaluation URL or attempt to call POST `/api/ai/draft`. | | | |
| **2** | B8: Access denied | Direct access attempt | Application hides the evaluation tab. Direct API attempts return `403 Forbidden` and block action. | | | |
