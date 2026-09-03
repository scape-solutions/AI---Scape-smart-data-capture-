# System Test Cases: UC7 - Export Feasibility Report (PDF)

This document defines the system test cases for **Use Case 7: Export Project Feasibility Report (PDF)**. It includes the Test Case Allocation Matrix and 8 role-focused manual test cases.

---

## Test Case Allocation Matrix (UC7)

| Step | Variable / Selection | TC1 (Happy PDF) | TC2 (Engineer Draft PDF)| TC3 (Warning Check) | TC4 (No Image Check) | TC5 (Multi Image Check) | TC6 (Draft PDF Check) | TC7 (Reject PDF Check)| TC8 (Auth PDF Check) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **B1** | Project Status | `'approved'` | `'submitted'` | `'approved'` | `'approved'` | `'approved'` | `'draft'` | `'rejected'` | `'approved'` |
| **B2** | Verdict Visible | **ON** | **OFF** | **ON** | **ON** | **ON** | **OFF** | **ON** | **ON** |
| **B3** | Warnings in Form | None | Reflective Metal | Reflective Metal | None | None | None | Reflective Metal | None |
| **B4** | Uploaded Photos | Valid image | Valid image | Valid image | `[No upload]` | 5 valid images | Valid image | Valid image | Valid image |
| **B5** | Export Action | Click Export PDF | Click Export PDF | Click Export PDF | Click Export PDF | Click Export PDF | Click Export PDF | Click Export PDF | Direct GET request |
| **B6** | PDF Trigger | Success | Success | Success | Success | Success | Success | Success | Rejects request |
| **B7** | File Name | `Alpha_Report.pdf` | `Beta_Draft.pdf` | `Gamma_Report.pdf` | `Delta_Report.pdf` | `Epsilon_Report.pdf`| `Zeta_Draft.pdf` | `Eta_Report.pdf` | N/A |
| **B8** | Actor Role | Partner | Engineer | Partner | Partner | Partner | Partner | Partner | Unauth User |

---

## Manual Test Cases

### TC1: Export Branded Feasibility Report for Approved Case (Happy Path)
* **Actor**: External Partner
* **Purpose**: Verify that an External Partner can export a fully populated, branded PDF report for an approved project showing sections A, B, C, and D.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project status: `'approved'`, `isVerdictVisible: true` | Open the project details header. | | | |
| **2** | B5: Export Action | Click **Export as PDF** | Browser triggers file download of `[Project_Name]_Feasibility_Report.pdf`. | | | |
| **3** | B7: PDF Check | Open downloaded PDF | PDF contains: Branded header, Section A (factual tables), Section B (AI advice narrative), Section C (photos appendix), Section D (verdict Approved text). | | | |

---

### TC2: Export Draft Feasibility Report (Private Verdict)
* **Actor**: Scape App Engineer
* **Purpose**: Verify that the Scape Engineer can download a PDF including their evaluator draft verdict report, even if it is not marked visible to the customer yet.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Engineer is logged in; project evaluation verdict is saved draft (`isVerdictVisible: false`) | View project Evaluation tab. | | | |
| **2** | B5: Export Action | Click **Export as PDF** | PDF generates and initiates download. | | | |
| **3** | B7: PDF Check | Inspect Section D of PDF | Section D displays the evaluator's draft report with a `"DRAFT - INTERNAL USE ONLY"` watermark/header. | | | |

---

### TC3: Export Report with Warning Badges
* **Actor**: External Partner
* **Purpose**: Verify that warning badges on reflective/cycle-time fields render correct text indicators in the printed PDF.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project has warning badge `⚠️` on Material | Trigger PDF export. | | | |
| **2** | B7: PDF Check | Inspect Section A table in PDF | In the Part Characteristics table, the row for Part Material has a warning label `[⚠]` or `[!]` printed adjacent to the text `"Shiny Steel"`. | | | |

---

### TC4: Export Report with No Images Uploaded
* **Actor**: External Partner
* **Purpose**: Verify that exporting a report with no uploaded cell/part photos handles Section C gracefully without crashing.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project has no uploaded photos | Click Export as PDF. | | | |
| **2** | B7: PDF Check | Inspect Section C (Media) in PDF | PDF builds successfully. Section C prints a message: `"No cell or part photos uploaded."` (no console/runtime script crashes). | | | |

---

### TC5: Export Report with Multiple Images Uploaded
* **Actor**: External Partner
* **Purpose**: Verify that exporting a project with multiple images prints all thumbnail previews cleanly with correct page breaks.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project contains 5 uploaded part images | Trigger PDF export. | | | |
| **2** | B7: PDF Check | Inspect Section C in PDF | Thumbnails are aligned cleanly. Multi-page layout triggers correct page breaks so images do not overlap tables. | | | |

---

### TC6: Export Draft Project Report
* **Actor**: External Partner
* **Purpose**: Verify that exporting an active draft project displays all data fields but hides Section D (Verdict) entirely.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project is in `'draft'` state | Click Export as PDF. | | | |
| **2** | B7: PDF Check | Inspect Section D in PDF | Sections A, B, and C render successfully. Section D (Verdict) is completely omitted from the document, or displays a placeholder `"Verdict: Pending Evaluation"`. | | | |

---

### TC7: Export Rejected Case Report
* **Actor**: External Partner
* **Purpose**: Verify that a rejected case report compiles the rejected verdict, reason, and recommendations.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project is status `'rejected'` with visible verdict | Click Export as PDF. | | | |
| **2** | B7: PDF Check | Inspect Section D in PDF | Section D prints: `"Verdict: Rejected"`, followed by the engineer's rejection reasons and next-steps guidance. | | | |

---

### TC8: Read-only Download Security Check
* **Actor**: Unauthenticated User
* **Purpose**: Verify that direct endpoint hits to trigger PDF rendering for private projects fail for unauthorized users.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | User is logged out | Maliciously triggers direct GET/POST request to project PDF generator endpoint. | | | |
| **2** | B6: API response | Endpoint trigger payload | Backend blocks the request, returns `401 Unauthorized`, and no PDF content is downloaded. | | | |
