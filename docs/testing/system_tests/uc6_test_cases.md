# Use Case 6: Evaluate Project and Publish Verdict - Black Box System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-6-evaluate-project-and-publish-verdict)  
**Actors:** Scape App Engineer (Evaluator), External Partner (Recipient)  
**Scope:** Black box testing of Evaluator Mode, case assignment ("Take Case"), case locking, AI Evaluator Draft generation, markdown verdict editing, private draft saving, publishing verdicts, status approvals/rejections, and direct evaluator unlock.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Case Assignment | "Take Case" action button on Dashboard project card | TC-UC6-01, TC-UC6-02 |
| Step 2: Evaluation Locking | "Begin Evaluation (Lock Project)" button in Review/approve tab | TC-UC6-01, TC-UC6-06 |
| Step 3: Submission Snapshot Review | "User AI Advice Report (At Submission)" accordion | TC-UC6-01 |
| Step 4: Evaluator AI Draft | "Generate Evaluator Draft" button (Mini vs. Pro, gripper, cycle feasibility) | TC-UC6-01, TC-UC6-08 |
| Step 5: Verdict Content Editing | Markdown editor (formatting, raw vs. preview mode) | TC-UC6-01, TC-UC6-07 |
| Step 6: Private Draft Mode | "Save Draft" action button (internal private review) | TC-UC6-03 |
| Step 7: Verdict Publication | "Publish Verdict to User" button | TC-UC6-01, TC-UC6-04, TC-UC6-05 |
| Step 8: Terminal Status Selection | "Approve" vs. "Reject" status toggle | TC-UC6-01 |
| Step 9: Verdict Revocation | "Unpublish Verdict" action button | TC-UC6-05 |
| Step 10: Direct Evaluator Unlock | "Unlock Project (Allow User Changes)" button | TC-UC6-06 |
| Step 11: Non-Evaluator Role Protection | Partner account attempting evaluator views/actions | TC-UC6-08 |

---

## 2. Black Box Test Cases

### TC-UC6-01: Complete Evaluator Review Flow [Use Case Scenario]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Case Assignment | Click "Take Case" on an unassigned submitted project card | Project card updates to show current engineer's name as assignee | [Pending] | Pending | Black Box: Use Case Scenario. Validates standard end-to-end evaluation flow. |
| 1.2 | Navigation to Review | Open project; click "Review/approve" tab | Review panel opens | [Pending] | Pending | Opens evaluator workspace |
| 1.3 | Case Locking | Click "Begin Evaluation (Lock Project)" | Project is locked; direct unsubmit disabled for user | [Pending] | Pending | Locks case against partner edits |
| 1.4 | Submission Snapshot | Expand "User AI Advice Report (At Submission)" | Accordion expands displaying frozen advice report and observations submitted by user | [Pending] | Pending | Checks submission snapshot |
| 1.5 | AI Draft Generation | Click "Generate Evaluator Draft" | AI draft loads into editor with Scape system recommendation, gripper selection, and feasibility narrative | [Pending] | Pending | Verifies evaluator AI draft |
| 1.6 | Verdict Editing | Add text: *"Scape Pro recommended due to bin depth. Cycle time feasible."* | Text added cleanly in editor | [Pending] | Pending | Edits verdict narrative |
| 1.7 | Verdict Publication | Click "Publish Verdict to User" | Notification confirms publication; button changes to "Unpublish Verdict" | [Pending] | Pending | Publishes verdict to partner |
| 1.8 | Status Approval | Click "Approve" status button | Project card on Dashboard updates with green **"Approved"** badge | [Pending] | Pending | Approves project |
| 1.9 | Partner Confirmation | Partner logs in; opens "Scape Review" tab | Partner sees official verdict report rendered with download buttons | [Pending] | Pending | Confirms customer visibility |

---

### TC-UC6-02: Single Case Assignment ("Take Case") [State Transition Testing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Precondition Check | Unassigned submitted project on Dashboard | Card displays "Unassigned" badge and "Take Case" button | [Pending] | Pending | Black Box: State Transition Testing. Catches evaluation collisions. |
| 2.2 | Take Case Action | Engineer A clicks "Take Case" | Button changes to "Review"; card displays "Assigned to [Engineer A]" | [Pending] | Pending | Assigns case to Engineer A |
| 2.3 | Second Engineer View | Engineer B logs in and views same project card | Card displays "Assigned to [Engineer A]"; "Take Case" button is not available | [Pending] | Pending | Prevents conflicting assignments |

---

### TC-UC6-03: Private Draft Mode (Zero Partner Visibility) [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Verdict In-Progress | In Review tab, type internal draft notes: *"Target price: 50,000 EUR. Awaiting sensor test."* | Text entered in verdict editor | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests private vs. published visibility. |
| 3.2 | Save Draft Action | Click **"Save Draft"** button | Toast confirms: *"Draft saved successfully"* | [Pending] | Pending | Saves internal draft |
| 3.3 | Partner Portal Check | External Partner opens their project -> "Scape Review" tab | Tab displays *"Evaluation in progress"* notice; draft text is completely hidden | [Pending] | Pending | Confirms private draft confidentiality |

---

### TC-UC6-04: Published Verdict Display in Customer Portal [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Publish Action | Evaluator clicks **"Publish Verdict to User"** | System confirms publication | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests published visibility state. |
| 4.2 | Partner Tab Activation | Partner opens project | Navigation sidebar displays active **"Scape Review"** tab | [Pending] | Pending | Tab is accessible |
| 4.3 | Report Layout Check | Open "Scape Review" tab | Official verdict displays formatted headings, Scape system selection, and "Export PDF Verdict" button | [Pending] | Pending | Verifies customer-facing layout |

---

### TC-UC6-05: Instant Verdict Revocation ("Unpublish Verdict") [State Transition Testing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Precondition Check | Project currently has a published verdict | Partner can view Scape Review tab | [Pending] | Pending | Black Box: State Transition Testing. Tests revocation of published reports. |
| 5.2 | Unpublish Action | Evaluator clicks **"Unpublish Verdict"** | Notification confirms verdict unpublished; button changes to "Publish Verdict to User" | [Pending] | Pending | Revokes verdict publication |
| 5.3 | Evaluator Text Check | Inspect editor | Verdict text is fully preserved in the editor (not deleted) | [Pending] | Pending | Preserves text content |
| 5.4 | Partner Tab Check | Partner refreshes "Scape Review" tab | Verdict text is hidden; displays *"Evaluation in progress"* message | [Pending] | Pending | Confirms instant customer revocation |

---

### TC-UC6-06: Evaluator Direct Unlock ("Unlock Project") [State Transition Testing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Precondition Check | Project is locked under active evaluation (`isLocked: true`) | User cannot edit form fields | [Pending] | Pending | Black Box: State Transition Testing. Tests direct evaluator unlock pathway. |
| 6.2 | Direct Unlock Action | Evaluator clicks **"Unlock Project (Allow User Changes)"** | Toast confirms: *"Project unlocked for user edits"* | [Pending] | Pending | Evaluator unlocks case |
| 6.3 | Partner Edit Check | Partner opens project | All inputs in Part Basics and Step 0 immediately accept keyboard input and auto-save | [Pending] | Pending | Confirms full editing restoration |
| 6.4 | Status Verification | Check project badge | Badge reverts to **"Draft"** | [Pending] | Pending | Verifies status transition to Draft |

---

### TC-UC6-07: Empty Verdict Publishing Guard [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Editor State | Clear all text in verdict editor (0 characters) | Editor is blank | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches publishing blank reports. |
| 7.2 | Publish Attempt | Click "Publish Verdict to User" | System blocks action; displays alert: *"Cannot publish an empty verdict."* | [Pending] | Pending | Validates non-empty requirement |
| 7.3 | Visibility Check | Check partner view | Verdict remains unpublished | [Pending] | Pending | Prevents publishing blank white screens |

---

### TC-UC6-08: Non-Evaluator Role Protection [Error Guessing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Account Role | Log in with standard External Partner account | Logged in as partner | [Pending] | Pending | Black Box: Error Guessing. Catches unauthorized privilege escalation. |
| 8.2 | Navigation Check | Inspect project navigation sidebar | "Review/approve" tab is completely hidden from the sidebar | [Pending] | Pending | Verifies UI masking |
| 8.3 | Card Action Check | Inspect project cards on Dashboard | "Take Case" button is not visible on any project card | [Pending] | Pending | Verifies evaluator action protection |
