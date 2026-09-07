# Use Case 7: Export Project Feasibility Report - System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-7-export-project-feasibility-report-pdf--markdown)  
**Actors:** External Partner, Scape App Engineer  
**Scope:** Client-side PDF Generation (`jsPDF`), Branded Header & Footer, Parts Table, Observations Warning Strips, 3-Column Image Grid, Markdown & JSON Exports.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Export Trigger Points | Advice drawer `.PDF`, Scape Review "Export PDF Verdict", Dashboard card | TC-UC7-01, TC-UC7-02 |
| Step 2: Client PDF Compilation | `generateProjectPdf` (`pdfGenerator.ts`, `jsPDF`) | TC-UC7-01, TC-UC7-02, TC-UC7-04 |
| Step 3: Image Data Retrieval | Subcollection image queries, base64 strings | TC-UC7-01, TC-UC7-03, TC-UC7-07 |
| Step 4: Visual Layout Sections | Branded header (#0F172A slate, #BF1E2E red line), contact info, cell data | TC-UC7-02, TC-UC7-04 |
| Step 5: Parts Table & Pagination | 1-row vs. multi-row parts table, "Page X of Y" pagination | TC-UC7-02, TC-UC7-03, TC-UC7-04 |
| Step 6: Observations Warning Strips | Amber (#D97706) vs. Red (#DC2626) warning strips | TC-UC7-06 |
| Step 7: Visual Evidence Appendix | 3-column photo grid, figure labels, multi-page layout | TC-UC7-03 |
| Step 8: Alternate Export Formats | Markdown export (`.MD`), Superuser bulk JSON export | TC-UC7-05 |
| Step 9: Filename Sanitization | Special characters, quotes, slashes in project name | TC-UC7-08 |

---

## 2. System Test Cases (ZOMBEE)

### TC-UC7-01: PDF Compilation with Zero Images and Zero Observations [Zero]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Precondition Check | Project draft with basic text answers; 0 photos uploaded; 0 AI observations | Clean minimal project document | [Pending] | Pending | ZOMBEE: Zero. Catches null-pointer crashes on empty array iteration. |
| 1.2 | Export Trigger | Click "Export" -> "PDF Report" on project card | `generateProjectPdf` initializes | [Pending] | Pending | Triggers PDF generator |
| 1.3 | Compilation Execution | jsPDF rendering cycle | Compiles cleanly without throwing `TypeError: Cannot read properties of undefined` | [Pending] | Pending | Verifies empty collection handling |
| 1.4 | Appendix Layout | Visual Evidence section | Section renders placeholder: *"No visual evidence attached"* without blank orphan pages | [Pending] | Pending | Checks visual placeholder |
| 1.5 | Download Check | Browser download event | `scape_evaluation_[projectName].pdf` downloads and opens properly | [Pending] | Pending | Verifies PDF validity |

---

### TC-UC7-02: Single Part Complete PDF Generation [One]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Precondition Check | Standard project with 1 part, customer contact details, and 1 bin photo | Complete single-part project | [Pending] | Pending | ZOMBEE: One. Validates standard baseline PDF structure. |
| 2.2 | Export Trigger | Click ".PDF" in AI Advice Drawer header | PDF compilation starts | [Pending] | Pending | Initiates drawer export |
| 2.3 | Header Inspection | Header banner styling | Dark slate banner (#0F172A) with Scape red accent line (#BF1E2E), Case ID, and creation date | [Pending] | Pending | Verifies corporate branding |
| 2.4 | Parts Summary Table | Part details grid | Displays single row with: Part Name, Dimensions, Weight, Material, and CAD file name | [Pending] | Pending | Verifies 1-row table formatting |
| 2.5 | Footer Inspection | Page footer | Displays running document title, date, and "Page 1 of N" pagination | [Pending] | Pending | Checks running footer |

---

### TC-UC7-03: Multi-Part Multi-Image 3-Column Appendix Formatting [Many]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Precondition Check | Project with 4 parts and 15 photos across bin, cell, and part views | Heavy multi-image project | [Pending] | Pending | ZOMBEE: Many. Catches memory leaks and image overlap in PDF grids. |
| 3.2 | Export Trigger | Click "Export" -> "PDF Report" | System fetches all base64 images from subcollection | [Pending] | Pending | Bulk image fetch |
| 3.3 | Appendix Grid Layout | Visual Attachments section | Images are laid out into a structured 3-column grid across multiple pages | [Pending] | Pending | Verifies 3-column layout |
| 3.4 | Figure Labels | Text below photos | Figure captions (e.g. *"Fig 1.1: Part #1 Front"*) align centered below each image | [Pending] | Pending | Checks label alignment |
| 3.5 | Layout Pagination | Page break checks | No image overlaps across page margins; page breaks insert cleanly | [Pending] | Pending | Ensures clean multi-page grid |

---

### TC-UC7-04: Extreme Text Length and Page Break Boundary [Boundary]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Precondition Check | Project containing 2,000-character submission note and long multi-paragraph verdict | Boundary text volume | [Pending] | Pending | ZOMBEE: Boundary. Catches missing pagination height checks (`checkAddPage`). |
| 4.2 | Export Trigger | Click "Export PDF Verdict" in Scape Review tab | PDF compiler processes long text strings | [Pending] | Pending | Tests pagination boundary |
| 4.3 | Page Splitting | Text rendering across pages | Text splits across page breaks cleanly without clipping lines | [Pending] | Pending | Verifies dynamic pagination |
| 4.4 | Footer Collision Guard | Page margin bottom | Text never collides with or overlaps the footer boundary (20mm margin) | [Pending] | Pending | Prevents footer collision |

---

### TC-UC7-05: Export Format Partition (.PDF vs. .MD vs. JSON) [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Partition A: PDF | Click "Export" -> "PDF Report" | Downloads formatted visual binary PDF | [Pending] | Pending | ZOMBEE: Equivalence. Tests export format equivalence classes. |
| 5.2 | Partition B: Markdown | Click ".MD" in AI Advice Drawer | Downloads raw Markdown text summary `[projectName]-ai-advice.md` | [Pending] | Pending | Verifies markdown summary |
| 5.3 | Partition C: JSON | Superuser clicks "Export Filtered (JSON)" | Downloads valid aggregated JSON file `scape_projects_export_[date].json` | [Pending] | Pending | Verifies bulk data export |
| 5.4 | JSON Syntax Check | Parse downloaded JSON file | JSON parses with zero syntax errors; contains array of complete project objects | [Pending] | Pending | Validates JSON schema |

---

### TC-UC7-06: Visual Observation Strip Severity Color Partition [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Precondition Check | Project has 1 warning observation and 1 critical observation | Mixed severity observations | [Pending] | Pending | ZOMBEE: Equivalence. Tests PDF observation strip color classes. |
| 6.2 | Export Trigger | Generate and open PDF report | PDF renders Field Observations section | [Pending] | Pending | Compiles observations |
| 6.3 | Warning Strip Check | Inspect warning item | Rendered inside amber strip (#D97706) with `[!]` label | [Pending] | Pending | Verifies warning strip color |
| 6.4 | Critical Strip Check | Inspect critical item | Rendered inside red strip (#DC2626) with `[!]` label | [Pending] | Pending | Verifies critical strip color |

---

### TC-UC7-07: Corrupted / Malformed Base64 Image Data Resilience [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Corrupted Image State | Inject invalid base64 string (`"data:image/jpeg;base64,CORRUPTED_STRING"`) into 1 image | Corrupted image data in Firestore | [Pending] | Pending | ZOMBEE: Exception. Catches jsPDF crashes on corrupted image decodes. |
| 7.2 | Export Trigger | Click "Export PDF Report" | PDF generator encounters corrupted image during rendering loop | [Pending] | Pending | Triggers error handling |
| 7.3 | Exception Interception | jsPDF `addImage` try/catch block | Error is caught; placeholder box printed with text *"Image decode error"*; console warning logged | [Pending] | Pending | Ensures graceful error handling |
| 7.4 | PDF Output | Inspect completed PDF | PDF completes and downloads successfully; other valid images render normally | [Pending] | Pending | Prevents failed export |

---

### TC-UC7-08: Special Characters in Filename Sanitization [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Project Name Input | Name: `Robo-Pick / Cell #1: 100% "Special" <Beta>` | Project name contains illegal filesystem characters | [Pending] | Pending | ZOMBEE: Exception. Catches filesystem crashes on illegal download names. |
| 8.2 | Export Trigger | Click "Export PDF Report" | Filename sanitizer executes | [Pending] | Pending | Tests sanitization regex |
| 8.3 | Sanitized Filename | Inspect downloaded filename | Filename sanitized to: `scape_evaluation_Robo-Pick_Cell_1_100_Special_Beta.pdf` | [Pending] | Pending | Verifies characters stripped/replaced |
| 8.4 | File System Write | Save to disk | Download completes without browser or OS filesystem errors | [Pending] | Pending | Confirms successful download |
