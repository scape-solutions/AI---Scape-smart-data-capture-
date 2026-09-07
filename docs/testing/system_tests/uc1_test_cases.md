# Use Case 1: Create and Auto-Save a Project Draft - System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-1-create-and-auto-save-a-project-draft)  
**Actor:** External Partner (End User / Integrator)  
**Scope:** Project Creation, Manual & AI Pathways, Parameter Entry, CAD Validation, Client Compression, Continuous Auto-Save.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Click "New Project" | Modal trigger | TC-UC1-01, TC-UC1-05 |
| Step 2: Setup Pathway Selection | `isSplitScreen` (`"Start Manually"` vs. `"Start with AI"`) | TC-UC1-01, TC-UC1-05 |
| Step 3: Project Document Initialization | Default document state (`projectName`, `status`, `parts`) | TC-UC1-01 |
| Step 4: Step 0 - Project & Cell Info | `projectName`, `1.02` (Total parts), bin dimensions, robot | TC-UC1-02, TC-UC1-03 |
| Step 5: Part Navigation & Input | Part basics, physical properties, field blur event | TC-UC1-02, TC-UC1-03 |
| Step 6: Dynamic Part Adjustment | Adding new part folders (`Part #2`, `Part #3`) | TC-UC1-03 |
| Step 7: CAD File Upload (2.06) | File size (200 KB limit), extension types (`.stl`, `.step`, `.stp`, `.igs`, `.iges`) | TC-UC1-04, TC-UC1-06 |
| Step 8: Visual Evidence Upload | Image file format (`.heic` vs. `.jpg`/`.png`), client-side compression | TC-UC1-07 |
| Step 9: Continuous Auto-Save & Network | Firestore write sync, offline recovery | TC-UC1-02, TC-UC1-08 |

---

## 2. System Test Cases (ZOMBEE)

### TC-UC1-01: Default Initialization with Zero User Input [Zero]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Action Button | Click "New Project" on Dashboard | Create New Project modal opens with options | [Pending] | Pending | ZOMBEE: Zero. Catches null pointer exceptions in empty document init. |
| 1.2 | Setup Pathway Selection | Click "Start Manually" | Initializes Firestore doc with default values; navigates to Step 0 | [Pending] | Pending | Validates `isSplitScreen: false` |
| 1.3 | Project Document Verification | `projectName`, `status`, `isLocked`, `parts` | `projectName: "New SCAPE PICK-PILOT Project"`, `status: 'draft'`, `isLocked: false`, `parts.length: 1` (empty) | [Pending] | Pending | Verify initial database structure |
| 1.4 | Navigation Header | Click "Dashboard" | Redirects to Dashboard; card renders with "Draft" badge and 0% completion | [Pending] | Pending | Ensures zero-input project is safely listed without UI crash |

---

### TC-UC1-02: Single Part Parameter Entry with Blur Auto-Save [One]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Step 0 Field Input | `projectName` | Enter "Project Delta" and press Tab (blur) | Document auto-saves; header updates project title | [Pending] | Pending | ZOMBEE: One. Catches data loss caused by missing blur triggers. |
| 2.2 | Sidebar Tab Selection | Navigate to Part 1 -> Part Basics | Tab switches to question 2.01 | [Pending] | Pending | Verifies active step state |
| 2.3 | Part 1 Basics Inputs | Part Name, Dimensions (L/W/H), Weight | Name: "Shaft", L: 120mm, W: 30mm, H: 30mm, Weight: 1.5kg | Inputs display entered values | [Pending] | Pending | Populates single part baseline |
| 2.4 | Field Blur Event | Blur weight input | Auto-save triggers in background; Firestore document updates | [Pending] | Pending | Checks no manual save button is required |
| 2.5 | Browser Refresh / Reload | Press F5 / Browser Refresh | All entered values persist exactly upon page reload | [Pending] | Pending | Verifies persistence integrity |

---

### TC-UC1-03: Multi-Part Dynamic Addition and Isolation [Many]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Step 0 Field Input | Question `1.02` ("Total of different parts") | Enter "3" (or click "+ Add New Part" twice) | Sidebar dynamically appends `Part #2` and `Part #3` folders | [Pending] | Pending | ZOMBEE: Many. Catches state bleeding between array elements. |
| 3.2 | Part #1 Input | Part 1 Name | Enter "Small Gear" | Part #1 updates to "Small Gear" | [Pending] | Pending | Verifies index 0 isolation |
| 3.3 | Part #2 Input | Part 2 Name | Enter "Large Bracket" | Part #2 updates to "Large Bracket" | [Pending] | Pending | Verifies index 1 isolation |
| 3.4 | Part #3 Input | Part 3 Name | Enter "Cylindrical Pin" | Part #3 updates to "Cylindrical Pin" | [Pending] | Pending | Verifies index 2 isolation |
| 3.5 | Tab Switching & Cross-Check | Switch back to Part #1 | Part #1 still displays "Small Gear"; values in Part 2 and 3 do not overwrite Part 1 | [Pending] | Pending | Ensures independent array mutation in React state |

---

### TC-UC1-04: CAD File Size Boundary Ceiling (200 KB Limit) [Boundary]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Step Navigation | Part Basics -> Question 2.06 | CAD file dropzone visible | [Pending] | Pending | ZOMBEE: Boundary. Catches Firestore 1 MB document threshold breach. |
| 4.2 | CAD File Upload (Valid Boundary) | `.stl` file of 200.0 KB (204,800 bytes) | File accepted; toast "CAD file uploaded successfully!"; base64 saved in `cadFile` | [Pending] | Pending | Tests upper boundary acceptance |
| 4.3 | CAD File Upload (Exceeded Boundary) | `.stl` file of 200.1 KB (204,900 bytes) | Upload rejected; modal/alert displays 200 KB database limit warning | [Pending] | Pending | Tests boundary rejection |
| 4.4 | Database State Verification | `parts[0].cadFile` | Retains previous 200.0 KB file; rejected oversized file is not written | [Pending] | Pending | Prevents Firestore payload rejection |

---

### TC-UC1-05: Pathway Partition: Manual vs. AI Split-Screen [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | New Project Modal | Click "New Project" | Modal displays "Start with AI" and "Start Manually" | [Pending] | Pending | ZOMBEE: Equivalence. Tests pathway state partition. |
| 5.2 | Partition A Selection | Click "Start Manually" | Initializes project with `isSplitScreen: false`; AI panel remains closed | [Pending] | Pending | Verifies standard layout |
| 5.3 | Return to Dashboard | Navigate to Dashboard; click "New Project" | Modal displays setup options | [Pending] | Pending | Prepares second partition |
| 5.4 | Partition B Selection | Click "Start with AI" | Initializes project with `isSplitScreen: true`; AI Assistant pane renders docked on the left | [Pending] | Pending | Verifies split-screen layout |

---

### TC-UC1-06: Valid CAD File Format Equivalence [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | File Upload Input | Question 2.06 CAD file picker | Dropzone displays accepted types (`.stl`, `.step`, `.stp`, `.igs`, `.iges`) | [Pending] | Pending | ZOMBEE: Equivalence. Tests file format acceptance classes. |
| 6.2 | Extension Test: STL | Upload `sample_part.stl` (< 200 KB) | Accepted, converted to base64 Data URL | [Pending] | Pending | Validates mesh CAD format |
| 6.3 | Extension Test: STEP | Upload `sample_part.step` (< 200 KB) | Accepted, converted to base64 Data URL | [Pending] | Pending | Validates standard STEP format |
| 6.4 | Extension Test: STP | Upload `sample_part.stp` (< 200 KB) | Accepted, converted to base64 Data URL | [Pending] | Pending | Validates short STEP extension |
| 6.5 | Extension Test: IGES | Upload `sample_part.igs` (< 200 KB) | Accepted, converted to base64 Data URL | [Pending] | Pending | Validates IGES format |

---

### TC-UC1-07: Unsupported Image Format (.HEIC) Exception Rejection [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Step Navigation | Part 1 -> Visual Evidence tab | Image upload zones displayed | [Pending] | Pending | ZOMBEE: Exception. Catches unhandled format exceptions. |
| 7.2 | File Selection | Upload iPhone camera file `photo.heic` | Upload intercepted; alert: *"Apple HEIC images are not supported directly. Please convert to JPG/PNG first."* | [Pending] | Pending | Validates HEIC rejection filter |
| 7.3 | Component Stability Check | Inspect UI and console | No unhandled promise rejection; upload resets cleanly | [Pending] | Pending | Ensures client-side compression pipeline does not freeze |
| 7.4 | Database State Verification | `parts[0].images` | Array length remains unchanged (0 images) | [Pending] | Pending | Confirms no corrupted base64 strings written |

---

### TC-UC1-08: Network Disconnection During Auto-Save [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Network Emulation | In DevTools, set Network to "Offline" | Browser simulates connection loss | [Pending] | Pending | ZOMBEE: Exception. Catches offline data loss and unhandled write rejections. |
| 8.2 | Form Input Edit | Enter Part Name "Emergency Valve" | Field displays input locally | [Pending] | Pending | Verifies local React state responsiveness |
| 8.3 | Field Blur Event | Blur field | System queues write locally without crashing or throwing white screen error | [Pending] | Pending | Tests offline resilience |
| 8.4 | Network Restoration | Restore Network to "Online" | Queued write flushes to Firestore; document updates successfully | [Pending] | Pending | Ensures data synchronization upon reconnection |
