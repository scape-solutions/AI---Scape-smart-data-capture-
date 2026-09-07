# Use Case 3: Request Project Information Advice & Extract Field Observations - System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-3-request-project-information-advice--extract-field-observations)  
**Actor:** External Partner / Scape App Engineer  
**Scope:** AI Advice Drawer, Data Diffing, Gemini Feasibility Advice, Structured Field Observations, Severity Styling, Report Downloads.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Trigger Advice Drawer | "⚡ AI Advice" header button, "Get AI Advice" submit card | TC-UC3-01, TC-UC3-02 |
| Step 2: Data Diff Calculation | Compare against `lastAdviceResponsesSnapshot` (`computeDataDiff`) | TC-UC3-01 |
| Step 3: Advice Report Generation | Call `/api/ai/advice`, Markdown report output | TC-UC3-02, TC-UC3-04 |
| Step 4: Observation Extraction | Call `/api/ai/extract-observations`, schema mapping | TC-UC3-02, TC-UC3-03, TC-UC3-07 |
| Step 5: Observation Mapping & Persistence | `project.fieldObservations`, severity: `warning` vs. `critical` | TC-UC3-02, TC-UC3-03, TC-UC3-05 |
| Step 6: UI Warning Decoration | Step sidebar warning dots, field-level warning banners | TC-UC3-02, TC-UC3-03, TC-UC3-05 |
| Step 7: Advice Report Export | Drawer header buttons: `.MD` vs. `.PDF` | TC-UC3-06 |
| Step 8: Re-generation & State Refresh | "Re-generate Advice" button, clearing resolved flags | TC-UC3-01, TC-UC3-08 |

---

## 2. System Test Cases (ZOMBEE)

### TC-UC3-01: Zero Data Modification Diff Suppression [Zero]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Precondition Check | Project with previous advice run | `lastAdviceResponsesSnapshot` is present in Firestore | [Pending] | Pending | ZOMBEE: Zero. Catches false-positive diff reports. |
| 1.2 | Drawer Open Action | Click "⚡ AI Advice" in Header | Slide-over AI Advice drawer opens | [Pending] | Pending | Opens existing advice |
| 1.3 | Re-generate Action | Click "Re-generate Advice" with 0 form edits | Diff algorithm evaluates zero changes | [Pending] | Pending | Diff comparison executes |
| 1.4 | Report Header Check | Inspect generated Markdown text | The section `🔄 Data Changes Since Last Advice Request` is NOT prepended | [Pending] | Pending | Verifies diff section suppression |
| 1.5 | Database Snapshot | `lastAdviceTimestamp` | Updates to new timestamp while response snapshot remains identical | [Pending] | Pending | Verifies state update |

---

### TC-UC3-02: Single Field Critical Risk Extraction [One]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Data Input | Part 1 Cycle Time: 0.5s for 15kg steel part | Input field updated with physically impossible cycle time | [Pending] | Pending | ZOMBEE: One. Validates targeted single-observation extraction. |
| 2.2 | Advice Trigger | Click "⚡ AI Advice" | System dispatches to `/api/ai/advice` and `/api/ai/extract-observations` | [Pending] | Pending | Verifies dual endpoint flow |
| 2.3 | Report Observation | Narrative report content | Report explicitly notes cycle time is unrealistically short for 15kg | [Pending] | Pending | Feasibility analysis check |
| 2.4 | Field Observation Map | `project.fieldObservations` in Firestore | Contains single entry: `{"2.05": { severity: "critical", text: "Cycle time 0.5s is physically infeasible for 15kg" }}` | [Pending] | Pending | Validates structured schema map |
| 2.5 | UI Warning Indicators | Part 1 tab & cycle time input | Red warning dot appears on Part 1 sidebar; red warning strip renders beside question 2.05 | [Pending] | Pending | Confirms UI warning decoration |

---

### TC-UC3-03: Multiple Observations Across Steps and Parts [Many]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Multi-Field Deficiencies | Step 0: Missing bin dimensions; Part 1: Highly reflective; Part 2: Missing CAD | Multiple incomplete/high-risk fields across project | [Pending] | Pending | ZOMBEE: Many. Catches observation map collisions and state overwrites. |
| 3.2 | Advice Trigger | Click "⚡ AI Advice" | System processes all project sections | [Pending] | Pending | Runs full analysis |
| 3.3 | Observations Output | `project.fieldObservations` | Contains multiple keys across scopes (`"1.03"`, `"2.07"`, `"2.06"`) with mixed severities | [Pending] | Pending | Verifies multi-key preservation |
| 3.4 | Sidebar Step Indicators | Inspect sidebar navigation | Warning badges appear concurrently on: Step 0, Part #1, and Part #2 | [Pending] | Pending | Verifies multi-tab indicator display |
| 3.5 | Form Banner Check | Navigate to affected questions | Each flagged question displays its specific observation banner | [Pending] | Pending | Confirms localized field banners |

---

### TC-UC3-04: Advice Response Markdown Formatting Boundary [Boundary]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Complex Project State | 5 parts with detailed physical constraints | Large project payload prepared | [Pending] | Pending | ZOMBEE: Boundary. Catches Markdown rendering and token overflow issues. |
| 4.2 | Advice Trigger | Click "⚡ AI Advice" | Gemini returns extensive multi-section report (> 2,500 tokens) | [Pending] | Pending | Verifies long response handling |
| 4.3 | Drawer Layout Check | Inspect Advice Drawer | Drawer handles full vertical scroll smoothly without layout clipping | [Pending] | Pending | Verifies UI containment |
| 4.4 | Markdown Syntax Check | Inspect headers, tables, bold text | Formatted cleanly without unescaped tags or raw markdown symbols | [Pending] | Pending | Ensures custom markdown styling applies |

---

### TC-UC3-05: Severity Styling Partition (Warning vs. Critical) [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Observation Setup | Project contains 1 `warning` and 1 `critical` observation | Map has both severity levels | [Pending] | Pending | ZOMBEE: Equivalence. Tests visual severity class separation. |
| 5.2 | Warning Class Inspection | Inspect field with `severity: 'warning'` | Displays amber indicator (`bg-amber-50`, `border-amber-200`, amber dot) | [Pending] | Pending | Verifies non-blocking warning styling |
| 5.3 | Critical Class Inspection | Inspect field with `severity: 'critical'` | Displays red indicator (`bg-rose-50`, `border-rose-200`, red dot) | [Pending] | Pending | Verifies critical blocker styling |
| 5.4 | Distinction Check | Compare visual appearance | Warnings and Criticals are visually distinct and cannot be confused | [Pending] | Pending | Ensures risk prioritization |

---

### TC-UC3-06: Export Format Partition (.MD vs. .PDF) [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Advice Drawer Header | Open drawer with completed report | Header displays `.MD` and `.PDF` buttons | [Pending] | Pending | ZOMBEE: Equivalence. Tests report download formats. |
| 6.2 | Partition A: Markdown | Click ".MD" button | Triggers download of `[projectName]-ai-advice.md` containing raw text | [Pending] | Pending | Validates text export |
| 6.3 | Partition B: PDF | Click ".PDF" button | Calls `generateProjectPdf`, compiles styled PDF document, triggers download | [Pending] | Pending | Validates binary PDF export |
| 6.4 | File Content Check | Open both downloaded files | Both files accurately present the full narrative advice report | [Pending] | Pending | Verifies content parity |

---

### TC-UC3-07: Observation Extraction API Failure Resilience [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Mock Failure | Mock `/api/ai/extract-observations` returning HTTP 500 | Server error simulated during extraction | [Pending] | Pending | ZOMBEE: Exception. Catches cascading failures between chained endpoints. |
| 7.2 | Advice Trigger | Click "⚡ AI Advice" | `/api/ai/advice` succeeds; extraction fails | [Pending] | Pending | Chained call executes |
| 7.3 | Report Preservation | Inspect Drawer | Narrative advice report displays fully and is saved in `project.report` | [Pending] | Pending | Ensures report is not lost |
| 7.4 | Error Notification | Inspect UI toast | Toast notifies: *"Field observations could not be extracted"* without crashing app | [Pending] | Pending | Graceful degradation check |

---

### TC-UC3-08: Resolved Observation Clearing on Re-generation [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Initial State | Field 2.05 (Cycle time) flagged with critical warning | Question 2.05 displays red banner | [Pending] | Pending | ZOMBEE: Exception. Catches sticky "zombie" warnings. |
| 8.2 | Field Correction | Change Cycle Time from 0.5s to realistic 12s | Value updated in input | [Pending] | Pending | Fixes root issue |
| 8.3 | Re-generate Advice | Open drawer; click "Re-generate Advice" | System re-runs feasibility analysis | [Pending] | Pending | Refreshes advice |
| 8.4 | Observation Clearance | Inspect Question 2.05 and sidebar | Red banner disappears from Question 2.05; red dot cleared from sidebar tab | [Pending] | Pending | Verifies resolved observation removal |
| 8.5 | Database State | `project.fieldObservations` | Key `"2.05"` is removed from Firestore document map | [Pending] | Pending | Ensures clean database state |
