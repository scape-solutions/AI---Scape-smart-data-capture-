# Use Case 5: Request Project Unlock / Edit Permission - System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-5-request-project-unlock--edit-permission)  
**Actors:** External Partner (Requester), Scape App Engineer (Reviewer)  
**Scope:** Unlock Modal, Justification Input, Pending Flags, Evaluator Notification Badges, Approve & Unlock, Reject Request.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Open Unlock Modal | "Request Edit Permission" button on locked project | TC-UC5-01, TC-UC5-02, TC-UC5-07 |
| Step 2: Justification Text Input | Modal textarea (empty validation, 1,000 char boundary) | TC-UC5-01, TC-UC5-04 |
| Step 3: Request Submission | Click "Submit" inside modal | TC-UC5-01, TC-UC5-02 |
| Step 4: Pending State Propagation | `editRequestPending: true`, `editRequestReason`, amber banner | TC-UC5-02, TC-UC5-03 |
| Step 5: Evaluator Notification | Dashboard "Unlock Requested" pulsing badge, Review panel | TC-UC5-02, TC-UC5-05 |
| Step 6: Evaluator Action: Approve | "Approve & Unlock" action, revert to draft, clear pending | TC-UC5-05 |
| Step 7: Evaluator Action: Reject | "Reject Request" action, keep locked, clear pending | TC-UC5-06 |
| Step 8: Modal Cancellation | "Cancel" button, "X" close, backdrop click | TC-UC5-07 |
| Step 9: Unauthorized Write Attempt | Direct edit during pending approval | TC-UC5-08 |

---

## 2. System Test Cases (ZOMBEE)

### TC-UC5-01: Zero-Character Justification Validation [Zero]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Modal Activation | Click "Request Edit Permission" on locked project | Modal dialog opens with justification textarea | [Pending] | Pending | ZOMBEE: Zero. Catches empty unlock requests spamming engineers. |
| 1.2 | Justification Input | Leave textarea blank (0 characters or whitespace only) | Textarea remains empty | [Pending] | Pending | Validates zero-length string |
| 1.3 | Submit Action | Click "Submit" in modal | Form validation blocks submission; displays alert: *"Please provide a reason for the unlock request."* | [Pending] | Pending | Blocks invalid submission |
| 1.4 | Database State | `editRequestPending` | Remains `false` / unset in Firestore | [Pending] | Pending | Verifies database immutability |

---

### TC-UC5-02: Single Valid Unlock Request Submission [One]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Precondition Check | Project locked (`isLocked: true`) | User viewing Submit tab | [Pending] | Pending | ZOMBEE: One. Validates single standard unlock request cycle. |
| 2.2 | Modal Trigger | Click "Request Edit Permission" | Modal opens | [Pending] | Pending | Opens modal |
| 2.3 | Justification Input | Enter: *"Part dimensions changed from 150mm to 195mm; need to re-upload CAD."* | Text entered into textarea | [Pending] | Pending | Enters valid reason |
| 2.4 | Submit Action | Click "Submit" | Modal closes; Firestore updates: `editRequestPending: true`, `editRequestReason` saved | [Pending] | Pending | Verifies write and flags |
| 2.5 | Partner UI Banner | Submit tab view | Displays amber banner: *"Edit request pending approval by Scape Solutions"* quoting reason | [Pending] | Pending | Verifies requester feedback |
| 2.6 | Evaluator UI Badge | Evaluator logs in; views Dashboard | Project card displays pulsing amber **"Unlock Requested"** badge | [Pending] | Pending | Verifies evaluator notification |

---

### TC-UC5-03: Successive Lifecycle Request/Unlock Cycles [Many]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Previous Cycle Cleanup | Project previously unlocked, edited, re-submitted, and re-locked | Project is locked again; previous pending flags cleared | [Pending] | Pending | ZOMBEE: Many. Catches stale flag collisions from past cycles. |
| 3.2 | Secondary Request Trigger | Click "Request Edit Permission" | Modal opens cleanly | [Pending] | Pending | Initiates second request |
| 3.3 | Updated Justification | Enter: *"Tolerance specification updated by client."* | New justification text entered | [Pending] | Pending | Distinct reason input |
| 3.4 | Submit Action | Click "Submit" | `editRequestPending` set to `true`; `editRequestReason` overwrites old reason with new text | [Pending] | Pending | Verifies clean flag re-arming |
| 3.5 | Audit History | Changelog array | Second unlock request entry appended without corrupting first entry | [Pending] | Pending | Verifies changelog integrity |

---

### TC-UC5-04: Justification Text Boundary Formatting (1,000 Chars) [Boundary]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Textarea Input | Paste 1,000 characters of detailed engineering justification | Textarea accepts all 1,000 characters without crashing | [Pending] | Pending | ZOMBEE: Boundary. Catches UI layout clipping in reviewer panels. |
| 4.2 | Submit Action | Click "Submit" | Reason saved in Firestore without string truncation | [Pending] | Pending | Verifies full string persistence |
| 4.3 | Banner Rendering | View amber pending banner on Submit tab | Banner formats 1,000-character block cleanly with auto-wrapping | [Pending] | Pending | Verifies user layout |
| 4.4 | Review Panel Rendering | Evaluator views approval panel in Review tab | Accordion displays full text without overflowing card boundaries | [Pending] | Pending | Verifies reviewer layout |

---

### TC-UC5-05: Evaluator Action Partition: Approve & Unlock [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Precondition Check | Case has `editRequestPending: true`; Evaluator opens Review tab | Approval panel displays partner's justification | [Pending] | Pending | ZOMBEE: Equivalence. Validates approve pathway partition. |
| 5.2 | Approve Action | Click "Approve & Unlock" | System executes unlock transaction | [Pending] | Pending | Triggers unlock handler |
| 5.3 | Database State | `status`, `isLocked`, `editRequestPending`, `editRequestReason` | `status: 'draft'`, `isLocked: false`, `editRequestPending: false`, `editRequestReason: null` | [Pending] | Pending | Verifies state reset to editable draft |
| 5.4 | Partner Access Check | Partner refreshes project | Project fully editable; pending banner removed; direct save restored | [Pending] | Pending | Confirms full editing restoration |

---

### TC-UC5-06: Evaluator Action Partition: Reject Request [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Precondition Check | Case has `editRequestPending: true`; Evaluator opens Review tab | Approval panel displays partner's justification | [Pending] | Pending | ZOMBEE: Equivalence. Validates reject pathway partition. |
| 6.2 | Reject Action | Click "Reject Request" | System dismisses request without unlocking | [Pending] | Pending | Triggers rejection handler |
| 6.3 | Database State | `status`, `isLocked`, `editRequestPending`, `editRequestReason` | `isLocked: true` retained, original status retained, `editRequestPending: false`, `editRequestReason: null` | [Pending] | Pending | Ensures project stays locked |
| 6.4 | Partner UI Check | Partner views Submit tab | Amber pending banner dismissed; "Request Edit Permission" button restored; project remains locked | [Pending] | Pending | Confirms rejection display |

---

### TC-UC5-07: User Modal Cancellation Equivalence [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Modal Open | Click "Request Edit Permission"; type text | Modal open with typed text | [Pending] | Pending | ZOMBEE: Equivalence. Tests cancellation equivalence classes. |
| 7.2 | Method A: Cancel Button | Click "Cancel" button | Modal closes; Firestore not updated; `editRequestPending` remains false | [Pending] | Pending | Validates Cancel button |
| 7.3 | Method B: Close "X" | Open modal again; click "X" icon | Modal closes with zero Firestore mutations | [Pending] | Pending | Validates Close icon |
| 7.4 | Method C: Backdrop Click | Open modal again; click darkened backdrop | Modal closes without submitting | [Pending] | Pending | Validates Backdrop dismissal |

---

### TC-UC5-08: Client-Side Write Attempt While Unlock is Pending [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Precondition Check | Project locked; `editRequestPending: true` | User awaiting evaluator review | [Pending] | Pending | ZOMBEE: Exception. Catches client-side bypass of lock restrictions. |
| 8.2 | UI Read-Only Verification | Inspect form input elements | Inputs have `disabled: true` or `readOnly: true` attributes | [Pending] | Pending | Verifies UI locking |
| 8.3 | Script Manipulation | Enable input via browser DevTools; dispatch value change | Attempt direct write to Firestore document | [Pending] | Pending | Simulates client bypass |
| 8.4 | Database Security Rule | Firestore rule evaluation | Write rejected with `Permission Denied` (rules require `isLocked == false` for user updates) | [Pending] | Pending | Validates backend security enforcement |
