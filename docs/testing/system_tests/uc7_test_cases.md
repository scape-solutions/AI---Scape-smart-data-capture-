# Use Case 7: Export Project Feasibility Report - Black Box System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-7-export-project-feasibility-report-pdf--markdown)  
**Actors:** External Partner, Scape App Engineer  
**Scope:** Black box testing of client-side PDF generation, branded styling, contact details, parts tables, observations warning strips, 3-column photo appendix, Markdown summaries, and superuser bulk JSON exports.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Export Trigger Points | Advice drawer ".PDF", Scape Review "Export PDF Verdict", Dashboard card export | TC-UC7-01, TC-UC7-02 |
| Step 2: Document Header & Branding | Dark slate header (#0F172A), red accent (#BF1E2E), Case ID, status | TC-UC7-01, TC-UC7-04 |
| Step 3: Customer Contact Info | Project name, customer contact name, company, email, phone | TC-UC7-01 |
| Step 4: General Work Cell Data | Bin type, bin dimensions, preferred robot brand | TC-UC7-01 |
| Step 5: Parts Summary Table | Part name, dimensions, weight, material, CAD filename | TC-UC7-01, TC-UC7-03 |
| Step 6: Visual Evidence Appendix | 3-column photo grid, figure captions, multi-page layout | TC-UC7-02, TC-UC7-03 |
| Step 7: Observation Warning Strips | Amber strips for warnings, red strips for critical observations | TC-UC7-06 |
| Step 8: Multi-Page Pagination | Dynamic text pagination, running headers, "Page X of Y" footers | TC-UC7-04 |
| Step 9: Alternate Export Formats | Markdown export (.MD), Superuser bulk JSON export | TC-UC7-05 |
| Step 10: Exception Resilience | Malformed image recovery, filename sanitization | TC-UC7-07, TC-UC7-08 |

---

## 2. Black Box Test Cases

### TC-UC7-01: Complete Branded Feasibility PDF Export [Use Case Scenario]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Precondition Check | Project with complete contact details, 1 part, and 1 bin photo | Complete baseline project | [Pending] | Pending | Black Box: Use Case Scenario. Validates primary PDF export output. |
| 1.2 | Export Trigger | Click ".PDF" in AI Advice drawer | Browser compiles and downloads `scape_evaluation_[projectName].pdf` | [Pending] | Pending | Initiates PDF compilation |
| 1.3 | Header Inspection | Open downloaded PDF; inspect top banner | Dark slate header (#0F172A) with red line (#BF1E2E), Case ID, creation date, and status | [Pending] | Pending | Verifies branded styling |
| 1.4 | Contact & Cell Summary | Inspect customer and cell section | Displays company name, customer contact, email, bin dimensions, and robot brand | [Pending] | Pending | Verifies structured metadata |
| 1.5 | Parts Summary Table | Inspect parts section | Displays clean grid with Part Name, Dimensions, Weight, Material, and CAD file | [Pending] | Pending | Checks parts grid formatting |
| 1.6 | Footer Inspection | Inspect bottom of every page | Displays document title, date, and running "Page X of Y" pagination | [Pending] | Pending | Verifies running pagination |

---

### TC-UC7-02: PDF Generation with Zero Images and Zero Observations [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Precondition Check | Minimal project draft with 0 photos uploaded and 0 AI observations | Zero media project | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches crashes on empty photo/warning arrays. |
| 2.2 | Export Trigger | Click "Export" -> "PDF Report" on Dashboard project card | PDF compiles and downloads without error | [Pending] | Pending | Compiles minimal PDF |
| 2.3 | Visual Appendix Check | Inspect Visual Evidence section in PDF | Section displays placeholder: *"No visual evidence attached"* without creating empty blank pages | [Pending] | Pending | Checks clean empty state rendering |
| 2.4 | Observations Check | Inspect Observations section in PDF | Section is omitted cleanly or indicates no warnings flagged | [Pending] | Pending | Checks clean observation omission |

---

### TC-UC7-03: Multi-Part Multi-Image 3-Column Appendix Layout [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Precondition Check | Project with 4 parts and 15 photos across cell and part views | Heavy multi-image project | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests heavy media layout class. |
| 3.2 | Export Trigger | Click "Export" -> "PDF Report" | Browser downloads PDF document | [Pending] | Pending | Generates multi-image PDF |
| 3.3 | Grid Layout Inspection | Inspect Visual Attachments pages | Photos are arranged into a structured 3-column grid across multiple pages | [Pending] | Pending | Verifies 3-column layout |
| 3.4 | Caption Alignment | Inspect text below images | Each photo displays figure caption (e.g. *"Fig 1.1: Part #1 Front"*) centered below the image | [Pending] | Pending | Verifies caption alignment |
| 3.5 | No Overlapping Borders | Inspect grid spacing | No images overlap; margins between rows and columns are consistent | [Pending] | Pending | Checks visual spacing |

---

### TC-UC7-04: Extreme Text Length Pagination Boundary [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Precondition Check | Project containing 2,000-character submission notes and a long multi-page verdict | Boundary text volume | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches text colliding with footers. |
| 4.2 | Export Trigger | Click "Export PDF Verdict" in Scape Review tab | PDF compiler processes multi-page text | [Pending] | Pending | Generates multi-page report |
| 4.3 | Page Break Inspection | Check page transition zones | Text flows naturally across page breaks without cutting lines in half | [Pending] | Pending | Verifies clean pagination |
| 4.4 | Footer Collision Guard | Inspect bottom 25mm of every page | Body text never touches or overlaps the running footer banner | [Pending] | Pending | Checks footer margin clearance |

---

### TC-UC7-05: Alternate Export Formats (.MD vs. .PDF vs. JSON) [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Partition A: PDF Export | Click ".PDF" in AI Advice drawer | Downloads binary PDF document formatted for printing | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests output format classes. |
| 5.2 | Partition B: MD Export | Click ".MD" in AI Advice drawer | Downloads clean Markdown summary `[projectName]-ai-advice.md` | [Pending] | Pending | Validates Markdown summary export |
| 5.3 | Partition C: JSON Export | Superuser applies filter on Dashboard; clicks "Export Filtered (JSON)" | Downloads valid aggregated JSON file `scape_projects_export_[date].json` | [Pending] | Pending | Validates bulk data export |
| 5.4 | JSON Validity Check | Open downloaded JSON in text viewer | Valid JSON array containing complete project data objects | [Pending] | Pending | Verifies syntax validity |

---

### TC-UC7-06: Warning vs. Critical Strip Colors in PDF [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Setup | Project with 1 warning and 1 critical observation | Mixed severity observations | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests PDF warning strip colors. |
| 6.2 | Export Trigger | Generate PDF report | PDF renders Field Observations section | [Pending] | Pending | Generates PDF |
| 6.3 | Warning Strip Check | Inspect non-critical observation | Rendered inside amber strip (#D97706) with `[!]` label | [Pending] | Pending | Verifies amber styling |
| 6.4 | Critical Strip Check | Inspect critical observation | Rendered inside red strip (#DC2626) with `[!]` label | [Pending] | Pending | Verifies red styling |

---

### TC-UC7-07: Malformed Image Data Recovery [Error Guessing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Precondition Check | Project containing 1 partially corrupted photo | Corrupted image attached | [Pending] | Pending | Black Box: Error Guessing. Catches export crash on corrupted image assets. |
| 7.2 | Export Trigger | Click "Export PDF Report" | PDF generator processes all attachments | [Pending] | Pending | Attempts export |
| 7.3 | Output Verification | Inspect downloaded PDF | Document completes and downloads; corrupted image slot displays *"Image unavailable"* placeholder | [Pending] | Pending | Confirms graceful error recovery |
| 7.4 | Document Usability | Inspect other document pages | All other valid photos and text tables render perfectly | [Pending] | Pending | Prevents failed export |

---

### TC-UC7-08: Illegal Characters in Project Filename [Error Guessing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Project Name Input | Project named: `Pick & Place / Cell #1: 100% "Special"` | Contains slashes, quotes, colons, percent signs | [Pending] | Pending | Black Box: Error Guessing. Catches filesystem crash on download. |
| 8.2 | Export Trigger | Click "Export PDF Report" | System compiles PDF and sets download filename | [Pending] | Pending | Tests filename sanitizer |
| 8.3 | Filename Check | Inspect downloaded file on disk | Filename sanitized cleanly to: `scape_evaluation_Pick_Place_Cell_1_100_Special.pdf` | [Pending] | Pending | Verifies illegal characters removed |
| 8.4 | Browser Behavior | Inspect download tray | File downloads without browser security blocks or filesystem errors | [Pending] | Pending | Confirms smooth download |
