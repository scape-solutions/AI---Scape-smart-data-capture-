# Use Case 4: Submit Project for Evaluation & Direct Unsubmit - System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-4-submit-project-for-evaluation--direct-unsubmit)  
**Actor:** External Partner  
**Scope:** Submit Tab, Submission Notes, Advice Snapshotting, Direct Unsubmit, Lock Guards, State Transitions.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Navigation to Submit Section | Submit tab view activation | TC-UC4-01, TC-UC4-06 |
| Step 2: Submission Notes Input | `userSubmissionNotes` (optional, character boundaries) | TC-UC4-01, TC-UC4-04 |
| Step 3: Submission Execution | "Submit Project" action, status change to `'submitted'` | TC-UC4-01, TC-UC4-03, TC-UC4-08 |
| Step 4: Advice Snapshotting | `userSubmittedReport`, `userSubmittedObservations`, timestamp | TC-UC4-01, TC-UC4-05 |
| Step 5: Submit Button State | Button transforms to "Submitted (Click to Unsubmit)" | TC-UC4-01, TC-UC4-06 |
| Step 6: Direct Unsubmit Execution | Click "Submitted (Click to Unsubmit)", revert to `'draft'` | TC-UC4-02, TC-UC4-03 |
| Step 7: Evaluator Lock Enforcement | `isLocked: true`, button switches to "Request Edit Permission" | TC-UC4-06, TC-UC4-07 |

---

## 2. System Test Cases (ZOMBEE)

### TC-UC4-01: Project Submission with Zero Submission Notes [Zero]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Step Navigation | Navigate to "Submit" tab in sidebar | Guidance box and notes textarea render | [Pending] | Pending | ZOMBEE: Zero. Catches validation blocking on empty optional fields. |
| 1.2 | Notes Input | `userSubmissionNotes` left empty (0 characters) | Textarea remains blank | [Pending] | Pending | Validates zero-length notes |
| 1.3 | Submit Action | Click "Submit Project" | Submission executes successfully without blocking | [Pending] | Pending | Checks validation logic |
| 1.4 | Database State | `status`, `userSubmissionNotes` | `status: 'submitted'`, `userSubmissionNotes` is empty string/null | [Pending] | Pending | Verifies status transition |
| 1.5 | UI Confirmation | Banner and button state | Toast: *"Project successfully submitted"*; button displays "Submitted (Click to Unsubmit)" | [Pending] | Pending | Verifies UI state change |

---

### TC-UC4-02: Single Direct Unsubmit Cycle Before Evaluator Lock [One]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Precondition Check | Project submitted (`status: 'submitted'`, `isLocked: false`) | Submit tab shows unsubmit button | [Pending] | Pending | ZOMBEE: One. Validates instant self-service submission reversal. |
| 2.2 | Unsubmit Action | Click "Submitted (Click to Unsubmit)" | System triggers unsubmit handler | [Pending] | Pending | Initiates unsubmit |
| 2.3 | Database State | `status` in Firestore | Reverts to `status: 'draft'` | [Pending] | Pending | Verifies status rollback |
| 2.4 | Form Access Check | Navigate to Part 1 Basics | Inputs are fully editable; fields are not locked | [Pending] | Pending | Confirms edit rights restoration |
| 2.5 | UI Feedback | Toast notification | Toast: *"Project submission cancelled. You can now edit it again"* | [Pending] | Pending | Verifies user feedback |

---

### TC-UC4-03: Rapid Toggling Between Submit and Unsubmit [Many]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Initial State | Project draft ready for submission | On Submit tab | [Pending] | Pending | ZOMBEE: Many. Catches race conditions and duplicate audit entries. |
| 3.2 | Rapid Cycle 1 | Click "Submit Project" then immediately click "Click to Unsubmit" | System handles state transitions without throwing uncaught promise errors | [Pending] | Pending | Rapid toggle 1 |
| 3.3 | Rapid Cycle 2 | Click "Submit Project" again | Transitions cleanly back to `'submitted'` | [Pending] | Pending | Rapid toggle 2 |
| 3.4 | Database Consistency | Inspect Firestore document | Final state is `status: 'submitted'`; timestamps are valid; no corrupted audit logs | [Pending] | Pending | Verifies state consistency |

---

### TC-UC4-04: Submission Notes Maximum Character Boundary [Boundary]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Textarea Input | Enter 2,000 characters into `userSubmissionNotes` | Textarea accepts and displays all 2,000 characters | [Pending] | Pending | ZOMBEE: Boundary. Catches buffer truncation and text overflow bugs. |
| 4.2 | Submit Action | Click "Submit Project" | Submission completes; payload accepted | [Pending] | Pending | Checks payload transmission |
| 4.3 | Persistence Check | Read `userSubmissionNotes` from Firestore | Exactly matches 2,000 characters without truncation | [Pending] | Pending | Verifies full string storage |
| 4.4 | Review View Rendering | View in Evaluator Review accordion | Text renders with clean word-wrapping without breaking layout | [Pending] | Pending | Verifies visual presentation |

---

### TC-UC4-05: Submission Snapshot Integrity Partition [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Draft Advice Setup | Generate AI Advice; note report text and timestamp | `project.report` and observations populated | [Pending] | Pending | ZOMBEE: Equivalence. Validates frozen submission snapshot partition. |
| 5.2 | Submission Action | Click "Submit Project" | System freezes snapshot fields | [Pending] | Pending | Freezes snapshot |
| 5.3 | Snapshot Verification | Compare snapshot vs. active | `userSubmittedReport == project.report`, `userSubmittedObservations == project.fieldObservations` | [Pending] | Pending | Verifies exact match |
| 5.4 | Post-Submit Mutation Test | Unsubmit, edit fields, re-generate advice | Active `project.report` updates; previous `userSubmittedReport` remains unchanged | [Pending] | Pending | Confirms snapshot isolation |

---

### TC-UC4-06: State Partition: Unlocked vs. Locked Submission View [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Partition A: Unlocked | Project submitted with `isLocked: false` | Submit tab displays button: **"Submitted (Click to Unsubmit)"** | [Pending] | Pending | ZOMBEE: Equivalence. Tests submission button state partition. |
| 6.2 | Transition Action | Evaluator locks project (`isLocked: true`) | Project state updates to locked | [Pending] | Pending | Locks case |
| 6.3 | Partition B: Locked | Refresh Submit tab | Button is replaced by **"Request Edit Permission"**; direct unsubmit button is completely hidden | [Pending] | Pending | Verifies lock guard in UI |

---

### TC-UC4-07: Direct Unsubmit Collision Against Engineer Lock [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Concurrent Setup | User viewing unlocked submitted case; Evaluator locks case in background | `isLocked` updated to `true` in Firestore | [Pending] | Pending | ZOMBEE: Exception. Catches unauthorized unsubmit during active review. |
| 7.2 | Stale Unsubmit Action | User clicks "Submitted (Click to Unsubmit)" before page reloads | System intercepts action; evaluates current server lock state | [Pending] | Pending | Attempts stale action |
| 7.3 | Error Handling | System response | Unsubmit is blocked; notification: *"Project is under evaluation and locked. Please request edit permission."* | [Pending] | Pending | Enforces lock protection |
| 7.4 | State Retention | Firestore document status | Status remains strictly `'submitted'` | [Pending] | Pending | Prevents unauthorized rollback |

---

### TC-UC4-08: Illegal Status Submission Attempt [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Precondition Check | Project currently in terminal `'approved'` or `'rejected'` state | Status is terminal | [Pending] | Pending | ZOMBEE: Exception. Catches illegal state transitions in state machine. |
| 8.2 | Unauthorized Dispatch | Dispatch submit payload via script or console | Firestore security rules evaluate request | [Pending] | Pending | Attempts illegal mutation |
| 8.3 | Rejection Response | Database response | Write rejected with Permission Denied | [Pending] | Pending | Validates security rules |
| 8.4 | Integrity Check | Project status | Remains `'approved'` or `'rejected'`; does not reset to `'submitted'` | [Pending] | Pending | Verifies terminal state immutability |
