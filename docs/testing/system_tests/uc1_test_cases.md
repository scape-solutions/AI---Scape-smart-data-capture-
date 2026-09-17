# Use Case 1: Create and Auto-Save a Project Draft - Black Box System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-1-create-and-auto-save-a-project-draft)  
**Actor:** External Partner (End User / Integrator)  
**Scope:** Black box testing of project creation, setup pathways, parameter inputs, CAD file validation, image uploads, and continuous auto-save behavior.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Click "New Project" | Dashboard button trigger | TC-UC1-01, TC-UC1-02, TC-UC1-07 |
| Step 2: Setup Pathway Selection | "Start Manually" vs. "Start with AI" modal options | TC-UC1-01, TC-UC1-02 |
| Step 3: Project Document Initialization | Default project state (Project Name, Draft status badge, completion 0%) | TC-UC1-07 |
| Step 4: Step 0 - Project & Cell Info | Project Name, Question `1.02` (Total parts), bin dimensions, robot | TC-UC1-01, TC-UC1-03 |
| Step 5: Part Navigation & Input | Part Name, Dimensions (L/W/H), Weight, Material, Cycle time | TC-UC1-01, TC-UC1-03 |
| Step 6: Dynamic Part Scaling | Modifying total parts or clicking "+ Add New Part" | TC-UC1-03 |
| Step 7: CAD File Upload (2.06) | Drag-and-drop / file picker (200 KB size limit, supported CAD formats) | TC-UC1-04, TC-UC1-05 |
| Step 8: Visual Evidence Upload | Image file picker (JPG/PNG vs. HEIC format) | TC-UC1-06 |
| Step 9: Continuous Auto-Save & Network | Field blur auto-save, offline disconnection and reconnection | TC-UC1-01, TC-UC1-08 |

---

## 2. Black Box Test Cases

### TC-UC1-01: Standard Manual Project Creation & Continuous Auto-Save [Use Case Scenario]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Action Button | Click "New Project" on Dashboard | "Create New Project" modal appears with two setup options | [Pending] | Pending | Black Box: Use Case Scenario. Verifies primary creation flow. |
| 1.2 | Setup Pathway Selection | Click "Start Manually" | Modal closes; Questionnaire View opens at Step 0 (Project & Cell Info) | [Pending] | Pending | Validates manual workflow initialization |
| 1.3 | Project Name Input | Enter "Project Delta" into Project Name field and press Tab | Header displays "Project Delta"; auto-save indicator shows changes saved | [Pending] | Pending | Tests blur-triggered auto-save |
| 1.4 | Part 1 Basics Input | Navigate to Part 1 -> Part Basics; enter Name: "Shaft", L: 120, W: 30, H: 30, Weight: 1.5 kg | Form fields accept values; blur triggers silent background save | [Pending] | Pending | Confirms questionnaire input handling |
| 1.5 | Dashboard Return | Click "Dashboard" in navigation header | Redirects to Dashboard; project card shows "Project Delta" with "Draft" badge and updated completion percentage | [Pending] | Pending | Verifies persistent state without manual save button |

---

### TC-UC1-02: Setup Pathway Partition: Manual vs. AI Split-Screen [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Pathway A Selection | Click "New Project" -> Click "Start Manually" | Questionnaire opens in standard single-pane layout; AI Assistant panel is closed | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests standard layout class. |
| 2.2 | Dashboard Return | Return to Dashboard | Dashboard displays newly created manual project card | [Pending] | Pending | Prepares second partition |
| 2.3 | Pathway B Selection | Click "New Project" -> Click "Start with AI" | Questionnaire opens with AI Assistant chat pane docked side-by-side on the left | [Pending] | Pending | Tests split-screen AI layout class |
| 2.4 | AI Panel Responsiveness | Inspect AI chat pane | Chat feed and message input are immediately interactive and ready for input | [Pending] | Pending | Ensures AI onboarding view is active |

---

### TC-UC1-03: Multi-Part Dynamic Addition and Tab Isolation [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Part Count Input | In Step 0, change "Total of different parts" (`1.02`) from 1 to 3 | Sidebar navigation immediately appends `Part #2` and `Part #3` tabs | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests multiplicity scaling. |
| 3.2 | Part 1 Entry | Go to Part #1; enter Part Name: "Gear A" | Part #1 displays "Gear A" | [Pending] | Pending | Enters unique data for Part 1 |
| 3.3 | Part 2 Entry | Go to Part #2; enter Part Name: "Bracket B" | Part #2 displays "Bracket B" | [Pending] | Pending | Enters unique data for Part 2 |
| 3.4 | Part 3 Entry | Go to Part #3; enter Part Name: "Pin C" | Part #3 displays "Pin C" | [Pending] | Pending | Enters unique data for Part 3 |
| 3.5 | Isolation Verification | Click back to Part #1 | Part #1 still shows "Gear A"; values entered in Part 2 and 3 do not overwrite Part 1 | [Pending] | Pending | Catches state bleeding between parts |

---

### TC-UC1-04: CAD File Upload 200 KB Strict Boundary [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Step Navigation | Navigate to Part 1 -> Part Basics -> Question 2.06 | CAD file dropzone is visible | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches database quota breach. |
| 4.2 | Valid Boundary File | Upload `.stl` CAD file of exactly 200.0 KB (204,800 bytes) | File is accepted; toast displays *"CAD file uploaded successfully!"*; filename chip appears | [Pending] | Pending | Tests maximum allowed boundary |
| 4.3 | Exceeded Boundary File | Upload `.stl` CAD file of 200.1 KB (204,900 bytes) | File is blocked; alert displays: *"CAD file size exceeds the strict 200 KB database limit. Please simplify CAD or upload screenshots."* | [Pending] | Pending | Tests upper boundary rejection |
| 4.4 | File State Check | Inspect CAD file dropzone | Previous valid 200.0 KB file is preserved; rejected file is not attached | [Pending] | Pending | Verifies rejection safety |

---

### TC-UC1-05: Valid CAD File Format Equivalence Classes [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Format Class 1: STL | Upload `model.stl` (< 200 KB) in Question 2.06 | File accepted; filename chip displayed | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests standard mesh CAD format. |
| 5.2 | Format Class 2: STEP | Upload `model.step` (< 200 KB) in Question 2.06 | File accepted; filename chip displayed | [Pending] | Pending | Tests standard STEP format |
| 5.3 | Format Class 3: STP | Upload `model.stp` (< 200 KB) in Question 2.06 | File accepted; filename chip displayed | [Pending] | Pending | Tests short STEP format |
| 5.4 | Format Class 4: IGES | Upload `model.igs` (< 200 KB) in Question 2.06 | File accepted; filename chip displayed | [Pending] | Pending | Tests IGES format |
| 5.5 | Invalid Format Class | Attempt to upload `model.exe` or `model.pdf` | File picker disallows selection or system rejects with invalid format error | [Pending] | Pending | Tests invalid format rejection |

---

### TC-UC1-06: Unsupported Image Format (.HEIC) Rejection [Error Guessing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Tab Navigation | Navigate to Part 1 -> Visual Evidence tab | Image upload zones render | [Pending] | Pending | Black Box: Error Guessing. Catches mobile camera format incompatibility. |
| 6.2 | HEIC Photo Upload | Select Apple iPhone photo `photo.heic` | Upload is intercepted; alert: *"Apple HEIC images are not supported directly. Please convert to JPG/PNG first."* | [Pending] | Pending | Verifies user-friendly error popup |
| 6.3 | UI State Integrity | Inspect upload container and gallery | No broken image placeholder appears; gallery remains unchanged | [Pending] | Pending | Ensures client-side compression pipeline does not freeze |

---

### TC-UC1-07: Zero-Input Project Initialization and Defaults [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Project Creation | Click "New Project" -> "Start Manually" | Questionnaire opens | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches unhandled empty state crashes. |
| 7.2 | Immediate Exit | Provide 0 inputs; click "Dashboard" immediately | Redirects to Dashboard without error | [Pending] | Pending | Tests zero user input handling |
| 7.3 | Dashboard Card Check | Inspect new project card | Card displays default name `"New SCAPE PICK-PILOT Project"`, a unique Case ID, "Draft" status, and 0% completion | [Pending] | Pending | Verifies graceful default initialization |
| 7.4 | Re-open Project | Click the project card | Project opens smoothly at Step 0; 1 empty part tab exists | [Pending] | Pending | Confirms project persistence without initial input |

---

### TC-UC1-08: Offline Resiliency During Continuous Form Editing [Error Guessing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Network Simulation | Disconnect device internet / set Network to Offline | Application remains open | [Pending] | Pending | Black Box: Error Guessing. Catches data loss on workshop Wi-Fi drops. |
| 8.2 | Field Modifications | Modify Project Name and Part 1 Dimensions | Fields accept inputs without freezing or showing white error screens | [Pending] | Pending | Verifies responsive client-side state |
| 8.3 | Tab Transition | Click through Part Basics tabs while offline | Navigation functions smoothly without blocking page navigation | [Pending] | Pending | Checks offline UI transitions |
| 8.4 | Network Reconnect | Re-enable internet connection; wait 5 seconds; refresh browser (F5) | Page reloads; all values entered while offline are fully preserved | [Pending] | Pending | Confirms auto-flush and persistence upon reconnect |
