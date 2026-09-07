# Use Case 6: Evaluate Project and Publish Verdict - System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-6-evaluate-project-and-publish-verdict)  
**Actors:** Scape App Engineer (Evaluator / Admin), External Partner (Recipient)  
**Scope:** Evaluator Assignment, Case Locking, AI Draft Generation, Markdown Verdict Editing, Publishing, Status Approval/Rejection, Visibility Toggles.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Case Assignment | "Take Case" action, `takenBy`, `takenByName` | TC-UC6-02 |
| Step 2: Case Locking | "Begin Evaluation (Lock Project)", `isLocked: true` | TC-UC6-02, TC-UC6-06 |
| Step 3: Submission Snapshot Review | Expand "User AI Advice Report (At Submission)" | TC-UC6-01, TC-UC6-03 |
| Step 4: AI Draft Generation | "Generate Evaluator Draft", call `/api/ai/draft` | TC-UC6-03, TC-UC6-07 |
| Step 5: Verdict Content Editing | Editor textarea, Markdown formatting | TC-UC6-01, TC-UC6-08 |
| Step 6: Verdict Publication | "Publish Verdict to User", `isVerdictVisible: true` | TC-UC6-01, TC-UC6-05, TC-UC6-08 |
| Step 7: Status Transition | Select "Approve" vs. "Reject" (`'approved'` vs. `'rejected'`) | TC-UC6-04 |
| Step 8: Private Draft Mode | "Save Draft", `isVerdictVisible: false` | TC-UC6-01, TC-UC6-05 |
| Step 9: Direct Evaluator Unlock | "Unlock Project (Allow User Changes)" | TC-UC6-06 |
| Step 10: Authorization Guard | Partner attempting evaluator endpoints/actions | TC-UC6-07 |

---

## 2. System Test Cases (ZOMBEE)

### TC-UC6-01: Private Draft Verdict with Zero Partner Visibility [Zero]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Precondition Check | Project submitted; Engineer in Review tab | Evaluator has case open | [Pending] | Pending | ZOMBEE: Zero. Catches premature leaks of confidential engineering notes. |
| 1.2 | Verdict Editing | Enter internal text: *"Commercial quote: 45,000 EUR. Internal feasibility confirmed."* | Text entered in editor | [Pending] | Pending | Enters internal draft |
| 1.3 | Save Draft Action | Click "Save Draft" | System saves `finalVerdict` text with `isVerdictVisible: false` | [Pending] | Pending | Saves private draft |
| 1.4 | Partner Portal Verification | Partner logs in; opens "Scape Review" tab | Tab displays *"Evaluation in progress"* without rendering draft text | [Pending] | Pending | Verifies partner isolation |
| 1.5 | Direct API Check | Inspect client payload fetched by Partner | `finalVerdict` is masked or suppressed by backend rules | [Pending] | Pending | Verifies API confidentiality |

---

### TC-UC6-02: Single Case Assignment ("Take Case") [One]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Precondition Check | Unassigned submitted project on Dashboard | Project card shows "Unassigned" | [Pending] | Pending | ZOMBEE: One. Validates isolated assignment to single engineer. |
| 2.2 | Take Case Action | Evaluator clicks "Take Case" | System assigns case | [Pending] | Pending | Initiates assignment |
| 2.3 | Database State | `takenBy`, `takenByName` | `takenBy: [evaluatorUid]`, `takenByName: [evaluatorName]` | [Pending] | Pending | Verifies Firestore assignment write |
| 2.4 | Dashboard Display | Inspect project card | Card displays assigned evaluator badge; "Take Case" replaced by "Review" | [Pending] | Pending | Verifies UI update |
| 2.5 | Multi-Evaluator Check | Second evaluator views dashboard | Card clearly indicates case is already assigned to First Evaluator | [Pending] | Pending | Prevents evaluation collisions |

---

### TC-UC6-03: Multi-Criteria AI Evaluator Draft Generation [Many]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Evaluator Panel | Open project in Review/approve tab | "Evaluator AI Draft" box visible | [Pending] | Pending | ZOMBEE: Many. Catches multi-variable synthesis failures in evaluation prompts. |
| 3.2 | Trigger Generation | Click "Generate Evaluator Draft" | Dispatches to `/api/ai/draft` with `evaluatorDraftPrompt` | [Pending] | Pending | Calls backend prompt |
| 3.3 | Multi-Section Synthesis | AI Output Content | Generates: Scape Mini vs. Pro choice, Gripper recommendation (vacuum vs. mechanical), cycle-time feasibility | [Pending] | Pending | Verifies multi-parameter synthesis |
| 3.4 | Editor Population | Markdown editor | Editor populates draft text; raw and preview modes format cleanly | [Pending] | Pending | Checks editor responsiveness |

---

### TC-UC6-04: Status Transition Boundary (Approved vs. Rejected) [Boundary]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Precondition Check | Verdict finalized and published | Evaluator selecting final status | [Pending] | Pending | ZOMBEE: Boundary. Validates strict union type transition boundaries. |
| 4.2 | Boundary Test A: Approve | Click "Approve" button | Status transitions strictly to `'approved'`; Dashboard displays green "Approved" badge | [Pending] | Pending | Verifies Approved terminal status |
| 4.3 | Boundary Test B: Reject | Click "Reject" button | Status transitions strictly to `'rejected'`; Dashboard displays red "Rejected" badge | [Pending] | Pending | Verifies Rejected terminal status |
| 4.4 | Database Validation | `status` in Firestore | Strictly matches union types (`'approved'` or `'rejected'`); no invalid strings | [Pending] | Pending | Enforces enum integrity |

---

### TC-UC6-05: Published vs. Unpublished Verdict State Partition [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Partition A: Publish | Evaluator clicks "Publish Verdict to User" | `isVerdictVisible: true` in Firestore; toast confirms publication | [Pending] | Pending | ZOMBEE: Equivalence. Validates verdict visibility toggling. |
| 5.2 | Partner View (Published) | Partner opens "Scape Review" tab | Formatted official verdict report renders with download buttons | [Pending] | Pending | Verifies published display |
| 5.3 | Partition B: Unpublish | Evaluator clicks "Unpublish Verdict" | `isVerdictVisible: false`; verdict text remains intact in database | [Pending] | Pending | Verifies safe unpublishing |
| 5.4 | Partner View (Unpublished) | Partner refreshes "Scape Review" tab | Verdict text is hidden; displays *"Evaluation in progress"* | [Pending] | Pending | Confirms instant revocation |

---

### TC-UC6-06: Direct Evaluator Unlock Without Partner Request [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Precondition Check | Submitted case locked by evaluator (`isLocked: true`) | Evaluator decides partner needs to modify parameters | [Pending] | Pending | ZOMBEE: Equivalence. Tests direct evaluator unlock pathway. |
| 6.2 | Direct Unlock Action | Evaluator clicks "Unlock Project (Allow User Changes)" | System unlocks project directly without an unlock request | [Pending] | Pending | Executes evaluator unlock |
| 6.3 | Database State | `isLocked`, `status` | `isLocked: false`, `status: 'draft'` | [Pending] | Pending | Verifies state transition |
| 6.4 | Partner Edit Rights | Partner opens project | Partner can immediately edit and auto-save fields | [Pending] | Pending | Confirms user edit restoration |

---

### TC-UC6-07: Non-Evaluator Role Authorization Barrier [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Precondition Check | Authenticated user has standard `role: 'enduser'` | User logged in as partner | [Pending] | Pending | ZOMBEE: Exception. Catches privilege escalation to evaluator controls. |
| 7.2 | Navigation Inspection | Check sidebar navigation items | "Review/approve" tab is completely hidden from sidebar | [Pending] | Pending | Verifies UI permission masking |
| 7.3 | Route / State Tampering | Force set `activeTab = 'review'` in browser console | System redirects back to Step 0 with error toast | [Pending] | Pending | Validates frontend route guard |
| 7.4 | Direct API Attack | POST directly to `/api/ai/draft` with user token | Backend middleware rejects request with HTTP 403 Forbidden | [Pending] | Pending | Verifies server-side authorization |

---

### TC-UC6-08: Empty Verdict Publishing Prevention [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Editor State | Evaluator clears verdict textarea (0 characters / whitespace) | Textarea is completely empty | [Pending] | Pending | ZOMBEE: Exception. Catches publishing blank reports to customer. |
| 8.2 | Publish Trigger | Click "Publish Verdict to User" | Validation intercepts action; alert: *"Cannot publish an empty verdict."* | [Pending] | Pending | Validates empty check |
| 8.3 | Database State | `isVerdictVisible`, `finalVerdict` | `isVerdictVisible` remains `false`; no empty verdict saved | [Pending] | Pending | Prevents database corruption |
