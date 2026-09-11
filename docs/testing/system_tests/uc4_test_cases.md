# Use Case 4: Submit Project for Evaluation & Direct Unsubmit - Black Box System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-4-submit-project-for-evaluation--direct-unsubmit)  
**Actor:** External Partner  
**Scope:** Black box testing of project submission, submission notes, advice snapshotting, status badge changes, self-service direct unsubmit, and evaluator lock barriers.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Submit Section Navigation | "Submit" tab in navigation sidebar | TC-UC4-01, TC-UC4-05 |
| Step 2: Submission Notes Entry | "Additional Submission Notes or Comments" textarea (optional, 2,000 char cap) | TC-UC4-01, TC-UC4-02, TC-UC4-03 |
| Step 3: Project Submission Action | "Submit Project" button click | TC-UC4-01, TC-UC4-08 |
| Step 4: Submission Snapshot Freeze | Preserving current AI advice report and observations at submission | TC-UC4-06 |
| Step 5: Status Badge & UI Update | Dashboard card updates to "Submitted", toast notification | TC-UC4-01, TC-UC4-04 |
| Step 6: Submit Button Transformation | Button switches to "Submitted (Click to Unsubmit)" | TC-UC4-01, TC-UC4-04, TC-UC4-05 |
| Step 7: Direct Unsubmit Action | Clicking "Submitted (Click to Unsubmit)" while unlocked | TC-UC4-04, TC-UC4-08 |
| Step 8: Evaluator Lock Enforcement | Button switches to "Request Edit Permission" once locked by engineer | TC-UC4-05, TC-UC4-07 |

---

## 2. Black Box Test Cases

### TC-UC4-01: Standard Project Submission Flow [Use Case Scenario]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Tab Navigation | Navigate to "Submit" section in sidebar | Submit tab displays Submission Guidance box and Notes textarea | [Pending] | Pending | Black Box: Use Case Scenario. Validates primary submission flow. |
| 1.2 | Notes Entry | Type: *"Parts arrive in standard EUR steel containers. Delivery expected Q3."* | Notes text appears in textarea | [Pending] | Pending | Adds context notes |
| 1.3 | Submit Action | Click "Submit Project" button | Success notification displays: *"Project successfully submitted for Scape evaluation!"* | [Pending] | Pending | Executes submission |
| 1.4 | Button Transformation | Inspect submit button | Button text transforms to: **"Submitted (Click to Unsubmit)"** | [Pending] | Pending | Verifies dynamic button state |
| 1.5 | Dashboard Badge Check | Navigate to Dashboard | Project card displays prominent **"Submitted"** status badge | [Pending] | Pending | Confirms status transition on Dashboard |

---

### TC-UC4-02: Submission with Blank Submission Notes [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Tab Navigation | Open Submit tab on ready project | Notes textarea is empty | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches blocking validation on optional inputs. |
| 2.2 | Submit Action | Click "Submit Project" leaving notes textarea blank (0 characters) | Submission succeeds without blocking or error | [Pending] | Pending | Tests empty optional notes |
| 2.3 | Status Verification | Inspect status indicator | Status updates to "Submitted"; button changes to "Submitted (Click to Unsubmit)" | [Pending] | Pending | Confirms smooth submission |

---

### TC-UC4-03: Submission Notes 2,000-Character Maximum Boundary [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Textarea Input | Paste exactly 2,000 alphanumeric characters into notes textarea | Textarea accepts and displays all 2,000 characters | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches buffer truncation. |
| 3.2 | Submit Action | Click "Submit Project" | Submission completes successfully | [Pending] | Pending | Verifies boundary payload |
| 3.3 | Text Retention Check | Refresh browser; return to Submit tab | Textarea displays full 2,000 characters without truncation or formatting breaks | [Pending] | Pending | Confirms data preservation |

---

### TC-UC4-04: Self-Service Direct Unsubmit Cycle [State Transition Testing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Precondition Check | Project is in "Submitted" status and has not been locked by an engineer | Button shows "Submitted (Click to Unsubmit)" | [Pending] | Pending | Black Box: State Transition Testing. Tests instant self-service reversal. |
| 4.2 | Unsubmit Action | Click "Submitted (Click to Unsubmit)" | Toast displays: *"Project submission cancelled. You can now edit it again"* | [Pending] | Pending | Executes direct unsubmit |
| 4.3 | Button Reversion | Inspect Submit tab button | Button reverts to **"Submit Project"** | [Pending] | Pending | Verifies button reset |
| 4.4 | Form Editability Check | Navigate to Part 1 Basics; edit Part Name | All form inputs are fully editable and accept updates | [Pending] | Pending | Confirms editing restoration |
| 4.5 | Dashboard Status Check | View project card on Dashboard | Card displays **"Draft"** status badge | [Pending] | Pending | Confirms status revert on Dashboard |

---

### TC-UC4-05: Lock Enforcement: Transition to Locked State [State Transition Testing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Submission State | Project submitted (`status: 'submitted'`) | Direct unsubmit button is visible | [Pending] | Pending | Black Box: State Transition Testing. Verifies lock guard behavior. |
| 5.2 | Evaluator Locking | Scape App Engineer begins evaluation / locks project | Case transitions to locked state | [Pending] | Pending | Reviewer locks case |
| 5.3 | Partner UI Check | Partner refreshes Submit tab | Button **"Submitted (Click to Unsubmit)"** is removed; replaced by **"Request Edit Permission"** | [Pending] | Pending | Verifies locked UI transformation |
| 5.4 | Questionnaire Check | Navigate to Part 1 tabs | Form fields are read-only and cannot be typed into | [Pending] | Pending | Confirms UI locking |

---

### TC-UC4-06: Submission Snapshot Immutability Verification [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Initial Advice Run | Generate AI Advice prior to submission; note advice text | Advice report generated | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests snapshot isolation. |
| 6.2 | Project Submission | Click "Submit Project" | Submission snapshot is frozen | [Pending] | Pending | Freezes snapshot |
| 6.3 | Post-Submit Re-run | Evaluator reviews submission accordion in Review tab | Accordion displays exact advice and observations that were present at submission time | [Pending] | Pending | Verifies frozen review data |

---

### TC-UC4-07: Unsubmit Collision During Active Review [Error Guessing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Race Condition Setup | Partner is viewing Submit tab; Engineer locks project simultaneously | Case locked in background | [Pending] | Pending | Black Box: Error Guessing. Catches unauthorized unsubmit during evaluation. |
| 7.2 | Stale Action Attempt | Partner clicks "Submitted (Click to Unsubmit)" before browser page reloads | System intercepts action and rejects unsubmit | [Pending] | Pending | Rejects stale click |
| 7.3 | Error Feedback | Inspect notification | Alert displays: *"Project is now under evaluation and locked. Please request edit permission."* | [Pending] | Pending | Informs user of lock |
| 7.4 | Status Preservation | Refresh page | Status remains strictly **"Submitted"** | [Pending] | Pending | Prevents illegal state rollback |

---

### TC-UC4-08: Rapid Submit / Unsubmit Toggling [Error Guessing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Setup | Unlocked project on Submit tab | Button interactive | [Pending] | Pending | Black Box: Error Guessing. Catches rapid click race conditions. |
| 8.2 | Rapid Clicks | Click "Submit Project" then immediately click "Click to Unsubmit" within 1 second | UI handles transitions smoothly without getting stuck in disabled loading state | [Pending] | Pending | Tests rapid toggling |
| 8.3 | Final Re-submit | Click "Submit Project" | Project successfully transitions to "Submitted" | [Pending] | Pending | Verifies clean recovery |
| 8.4 | Card Verification | Navigate to Dashboard | Single project card displays "Submitted" with zero duplicate cards | [Pending] | Pending | Confirms UI stability |
