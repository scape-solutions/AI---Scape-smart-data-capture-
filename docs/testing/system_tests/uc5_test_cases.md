# Use Case 5: Request Project Unlock / Edit Permission - Black Box System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-5-request-project-unlock--edit-permission)  
**Actors:** External Partner (Requester), Scape App Engineer (Reviewer)  
**Scope:** Black box testing of the unlock request modal, justification input validation, amber pending banners, evaluator dashboard notification badges, unlock approvals, and unlock rejections.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Unlock Modal Trigger | "Request Edit Permission" button on locked project | TC-UC5-01, TC-UC5-02, TC-UC5-05 |
| Step 2: Justification Reason Input | Textarea (empty validation, 1,000 char boundary, valid reason) | TC-UC5-01, TC-UC5-02, TC-UC5-03 |
| Step 3: Modal Submission | Click "Submit" in modal | TC-UC5-01, TC-UC5-02, TC-UC5-03 |
| Step 4: Partner Pending Banner | Amber banner displaying quoted justification reason | TC-UC5-01, TC-UC5-03, TC-UC5-07 |
| Step 5: Evaluator Dashboard Badge | Pulsing amber **"Unlock Requested"** badge on project card | TC-UC5-01, TC-UC5-08 |
| Step 6: Evaluator Action: Approve | Click "Approve & Unlock" in Review/approve tab | TC-UC5-01, TC-UC5-06 |
| Step 7: Evaluator Action: Reject | Click "Reject Request" in Review/approve tab | TC-UC5-04 |
| Step 8: Modal Dismissal | Cancel button, "X" icon, backdrop click | TC-UC5-05 |
| Step 9: Form Lock Protection | Field inputs remaining read-only while pending approval | TC-UC5-07 |

---

## 2. Black Box Test Cases

### TC-UC5-01: Complete Unlock Request and Approval Lifecycle [Use Case Scenario]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Precondition Check | Project is locked by Scape Engineer; Partner viewing Submit tab | "Request Edit Permission" button is displayed | [Pending] | Pending | Black Box: Use Case Scenario. Validates standard end-to-end unlock approval. |
| 1.2 | Modal Trigger | Click "Request Edit Permission" | "Request Edit Permission" modal opens with justification textarea | [Pending] | Pending | Opens request modal |
| 1.3 | Reason Entry | Type: *"Part dimensions changed from 150mm to 195mm; need to re-upload CAD model."* | Text entered in textarea | [Pending] | Pending | Enters valid justification |
| 1.4 | Submit Request | Click "Submit" in modal | Modal closes; button replaced by amber banner: *"Edit request pending approval by Scape Solutions"* quoting reason | [Pending] | Pending | Verifies pending state in UI |
| 1.5 | Evaluator View | Engineer logs in; views Dashboard | Project card displays pulsing amber **"Unlock Requested"** badge | [Pending] | Pending | Verifies reviewer notification |
| 1.6 | Reviewer Approval | Engineer opens project Review tab; clicks **"Approve & Unlock"** | Notification confirms unlock; case status reverts to "Draft" | [Pending] | Pending | Reviewer approves request |
| 1.7 | Partner Edit Check | Partner refreshes project | Amber banner is gone; project status is "Draft"; all questionnaire inputs are fully editable | [Pending] | Pending | Confirms complete edit rights restoration |

---

### TC-UC5-02: Empty Justification Text Validation [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Modal Open | Click "Request Edit Permission" on locked case | Modal opens | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches blank unlock requests spamming engineers. |
| 2.2 | Empty Submission | Leave textarea completely blank (0 characters); click "Submit" | Validation alert displays: *"Please provide a reason for the unlock request."* | [Pending] | Pending | Tests 0-character validation |
| 2.3 | Whitespace Submission | Enter only spaces/tabs; click "Submit" | Validation alert displays: *"Please provide a reason for the unlock request."* | [Pending] | Pending | Tests whitespace rejection |
| 2.4 | Modal State | Inspect modal | Modal remains open; request is not sent | [Pending] | Pending | Prevents empty request submission |

---

### TC-UC5-03: High-Volume Justification Text (1,000 Characters) [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Textarea Input | Paste 1,000 characters of technical justification into modal | Textarea accepts all 1,000 characters | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches layout clipping in review panels. |
| 3.2 | Submit Request | Click "Submit" | Request submits successfully | [Pending] | Pending | Submits boundary text |
| 3.3 | Banner Layout Check | View amber pending banner on Submit tab | 1,000-character text block wraps cleanly without overflowing container borders | [Pending] | Pending | Verifies partner UI layout |
| 3.4 | Review Panel Check | Engineer views justification in Review tab | Review panel renders full 1,000-character explanation cleanly | [Pending] | Pending | Verifies reviewer UI layout |

---

### TC-UC5-04: Engineer Rejection Pathway [State Transition Testing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Precondition Check | Project has pending unlock request | Amber banner visible to Partner | [Pending] | Pending | Black Box: State Transition Testing. Tests rejection branch. |
| 4.2 | Reviewer Rejection | Engineer opens project Review tab; clicks **"Reject Request"** | System dismisses request; logs rejection | [Pending] | Pending | Rejection executed |
| 4.3 | Partner UI Check | Partner refreshes project Submit tab | Amber banner is removed; "Request Edit Permission" button returns; project remains locked | [Pending] | Pending | Verifies banner dismissal while locked |
| 4.4 | Form Lock Check | Attempt to edit questionnaire fields | Fields remain strictly disabled/read-only | [Pending] | Pending | Confirms project remains locked |

---

### TC-UC5-05: Modal Dismissal Equivalence Classes [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Method A: Cancel Button | Click "Request Edit Permission", type text, click "Cancel" button | Modal closes; no request is submitted; button remains "Request Edit Permission" | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests modal cancellation. |
| 5.2 | Method B: Close "X" | Click "Request Edit Permission", type text, click "X" icon in top right | Modal closes with zero changes | [Pending] | Pending | Tests "X" icon dismissal |
| 5.3 | Method C: Backdrop Click | Click "Request Edit Permission", type text, click outside modal on dark backdrop | Modal closes without submitting | [Pending] | Pending | Tests backdrop dismissal |

---

### TC-UC5-06: Successive Lifecycle Unlock Re-arming [State Transition Testing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Lifecycle Re-run Setup | Case was previously unlocked, edited, re-submitted, and re-locked | Project is locked again | [Pending] | Pending | Black Box: State Transition Testing. Catches stale state collisions from previous unlock cycles. |
| 6.2 | Second Unlock Trigger | Click "Request Edit Permission" | Modal opens cleanly with empty textarea | [Pending] | Pending | Initiates second request |
| 6.3 | New Justification | Type: *"Secondary modification: Updated gripper payload constraint."* and click Submit | Submits successfully; amber banner displays the new justification text | [Pending] | Pending | Verifies updated text display |
| 6.4 | Reviewer Panel Check | Engineer views Review tab | Displays the fresh gripper payload justification; older justification is replaced | [Pending] | Pending | Confirms clean state re-arming |

---

### TC-UC5-07: Form Tampering Guard While Pending [Error Guessing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Precondition Check | Project is locked with an unlock request currently pending | Amber pending banner visible | [Pending] | Pending | Black Box: Error Guessing. Catches premature write access during review. |
| 7.2 | UI Element Inspection | Navigate to Part 1 Basics; inspect inputs | All textboxes, radio buttons, and file dropzones are visually dimmed and disabled | [Pending] | Pending | Verifies UI read-only guard |
| 7.3 | Click Attempt | Click into Part Name or Dimension fields | Fields reject cursor focus and do not allow keyboard input | [Pending] | Pending | Prevents premature data changes |

---

### TC-UC5-08: Evaluator Dashboard Badge Notification Display [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Precondition Check | Partner submits unlock request on Project "Cell Beta" | Request is pending | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests dashboard visual notification state. |
| 8.2 | Dashboard Display | Engineer navigates to Dashboard | Project card for "Cell Beta" displays pulsing amber **"Unlock Requested"** badge | [Pending] | Pending | Verifies prominent notification badge |
| 8.3 | Card Click | Click "Cell Beta" card | Project opens directly to Review/approve tab ready for evaluator decision | [Pending] | Pending | Verifies direct evaluator navigation |
