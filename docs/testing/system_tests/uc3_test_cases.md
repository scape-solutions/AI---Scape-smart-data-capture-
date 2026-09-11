# Use Case 3: Request Project Information Advice & Extract Field Observations - Black Box System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-3-request-project-information-advice--extract-field-observations)  
**Actors:** External Partner / Scape App Engineer  
**Scope:** Black box testing of the AI Advice slide-over drawer, feasibility advice generation, data modification diffing, field-level warning badges, report downloads (.MD/.PDF), and flag clearing upon re-generation.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Trigger Advice Drawer | "⚡ AI Advice" header button, "Get AI Advice" card button | TC-UC3-01, TC-UC3-02 |
| Step 2: Data Diff Section Display | `🔄 Data Changes Since Last Advice Request` markdown section | TC-UC3-02 |
| Step 3: Feasibility Report Generation | Narrative advice text detailing missing data, geometry, cycle time | TC-UC3-01, TC-UC3-07 |
| Step 4: Structured Field Observations | Colored warning strips beside form inputs, sidebar warning dots | TC-UC3-01, TC-UC3-03, TC-UC3-04 |
| Step 5: Severity Styling Levels | Amber styling (`⚠️` Warning) vs. Red styling (`🔴` Critical) | TC-UC3-03 |
| Step 6: Multi-Tab Observation Mapping | Observations spread across Step 0 and multiple Part tabs | TC-UC3-04 |
| Step 7: Report Format Downloads | Drawer header buttons: `.MD` download vs. `.PDF` download | TC-UC3-06 |
| Step 8: Re-generation & Flag Clearing | "Re-generate Advice" button, clearing resolved warnings | TC-UC3-02, TC-UC3-05 |
| Step 9: Exception Degradation | Graceful behavior on advice network or processing errors | TC-UC3-08 |

---

## 2. Black Box Test Cases

### TC-UC3-01: Standard AI Feasibility Review & Field Warning Display [Use Case Scenario]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Project State Setup | Enter 15kg part with physically impossible 0.5s cycle time; leave bin dimensions blank | Preliminary project data entered | [Pending] | Pending | Black Box: Use Case Scenario. Validates primary advice workflow. |
| 1.2 | Advice Trigger | Click "⚡ AI Advice" button in the top header | Slide-over AI Advice drawer opens with animated loading spinner | [Pending] | Pending | Opens advice drawer |
| 1.3 | Report Generation | Wait for generation to complete | Formatted Markdown advice report renders detailing missing bin dimensions and cycle-time realism | [Pending] | Pending | Verifies narrative report display |
| 1.4 | Sidebar Step Indicators | Close drawer; inspect sidebar navigation | Warning dots appear on Step 0 tab and Part 1 tab | [Pending] | Pending | Checks step-level visual indicators |
| 1.5 | Field-Level Warning Banners | Navigate to Part 1 -> Question 2.05 (Cycle time) | Colored warning banner appears beside the input: *"Cycle time 0.5s is physically infeasible for 15kg"* | [Pending] | Pending | Verifies localized field warning banners |

---

### TC-UC3-02: Zero Data Modification Diff Suppression [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Precondition Check | Project has previously generated advice; advice drawer closed | Advice report exists in project | [Pending] | Pending | Black Box: Boundary Value Analysis. Verifies zero false-positive diff reports. |
| 2.2 | Re-open Drawer | Click "⚡ AI Advice" without making any form edits | Drawer opens displaying previously generated advice | [Pending] | Pending | Opens existing advice |
| 2.3 | Re-generate Action | Click "Re-generate Advice" button | System re-runs feasibility analysis on identical data | [Pending] | Pending | Triggers re-run |
| 2.4 | Report Section Check | Inspect the top of the generated Markdown report | The section `🔄 Data Changes Since Last Advice Request` is NOT present | [Pending] | Pending | Confirms diff suppression when 0 fields changed |

---

### TC-UC3-03: Visual Warning (`⚠️`) vs. Critical (`🔴`) Severity Styling [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Input Setup | Enter shiny steel part (reflective: Warning) + impossible cycle time (Critical) | Inputs with different risk severities | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests severity UI partitions. |
| 3.2 | Advice Trigger | Click "⚡ AI Advice" | System generates feasibility analysis | [Pending] | Pending | Analyzes project |
| 3.3 | Warning Level Inspection | Inspect reflectivity question in Part 1 | Displays amber badge/banner (`bg-amber-50`, amber icon) noting potential optical reflection challenges | [Pending] | Pending | Verifies non-blocking warning styling |
| 3.4 | Critical Level Inspection | Inspect cycle time question in Part 1 | Displays red badge/banner (`bg-rose-50`, red icon) noting critical physical feasibility blocker | [Pending] | Pending | Verifies critical blocker styling |
| 3.5 | Visual Distinction | Compare both indicators side-by-side | Amber warning and red critical indicators are distinct and unambiguous | [Pending] | Pending | Ensures risk prioritization clarity |

---

### TC-UC3-04: Multi-Step Multi-Part Observation Mapping [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Multi-Section Setup | Incomplete bin dimensions in Step 0, Part 1 missing CAD, Part 2 missing dimensions | Deficiencies spread across multiple tabs | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests multiplicity handling. |
| 4.2 | Advice Trigger | Click "⚡ AI Advice" | Advice report generates | [Pending] | Pending | Runs full analysis |
| 4.3 | Navigation Bar Check | Inspect sidebar step tabs | Warning dots appear simultaneously on: Step 0, Part #1, and Part #2 | [Pending] | Pending | Verifies multi-tab indicator display |
| 4.4 | Navigation Verification | Click into Step 0, Part #1, and Part #2 sequentially | Each tab displays its own relevant observation banners without state collisions | [Pending] | Pending | Ensures clean observation mapping |

---

### TC-UC3-05: Resolved Observation Clearance on Re-generation [State Transition Testing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Precondition Check | Question 2.05 (Cycle time) displays red critical warning banner | Red banner active | [Pending] | Pending | Black Box: State Transition Testing. Catches persistent "zombie" warnings. |
| 5.2 | Parameter Correction | Change Cycle Time from 0.5s to realistic 12.0s | Input field updates | [Pending] | Pending | Fixes root issue |
| 5.3 | Re-generate Action | Open AI Advice drawer; click "Re-generate Advice" | System analyzes updated parameters | [Pending] | Pending | Re-runs advice |
| 5.4 | Banner Removal Check | Close drawer; navigate to Question 2.05 | The red warning banner has disappeared; Part 1 tab warning dot is cleared | [Pending] | Pending | Confirms removal of resolved warnings |

---

### TC-UC3-06: Feasibility Report Format Downloads (.MD vs. .PDF) [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Drawer Open | Open AI Advice drawer with completed report | Drawer header shows ".MD" and ".PDF" download buttons | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests download formats. |
| 6.2 | Markdown Download | Click ".MD" button | Browser downloads `[projectName]-ai-advice.md` containing raw text summary | [Pending] | Pending | Validates Markdown export |
| 6.3 | PDF Download | Click ".PDF" button | Browser compiles and downloads formatted branded PDF document | [Pending] | Pending | Validates PDF export |
| 6.4 | File Integrity Check | Open both downloaded files | Both files contain full report narrative and project details without file corruption | [Pending] | Pending | Confirms valid output formats |

---

### TC-UC3-07: Extensive Narrative Report Layout Boundary [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Complex Setup | Project with 5 parts and intricate cell constraints | High complexity project | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches layout breaks on long text. |
| 7.2 | Advice Trigger | Click "⚡ AI Advice" | AI returns long, multi-section Markdown report | [Pending] | Pending | Tests high-volume report |
| 7.3 | Drawer Scrolling | Scroll from top to bottom inside drawer | Drawer scrolls smoothly without header clipping, footer overlap, or horizontal text breaks | [Pending] | Pending | Verifies UI containment |
| 7.4 | Markdown Formatting | Inspect headings, bold markers, bullet points | All markdown syntax renders as styled HTML typography | [Pending] | Pending | Ensures custom markdown styling applies |

---

### TC-UC3-08: AI Advisory Service Failure Graceful Degradation [Error Guessing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Simulated Failure | Temporarily sever network during advice generation | Network interruption simulated | [Pending] | Pending | Black Box: Error Guessing. Catches unhandled promise exceptions. |
| 8.2 | UI Feedback | Inspect advice drawer and screen | System displays error notification: *"Could not generate advice. Please check your connection and try again."* | [Pending] | Pending | User-friendly error message |
| 8.3 | Data Immutability | Close drawer; inspect questionnaire inputs | Questionnaire data remains completely intact and editable; no form data lost | [Pending] | Pending | Verifies non-destructive failure |
