# System Test Cases: UC3 - Request Advice & Observations

This document defines the system test cases for **Use Case 3: Request Project Information Advice & Extract Observations**. It includes the Test Case Allocation Matrix and 8 role-focused manual test cases.

---

## Test Case Allocation Matrix (UC3)

| Step | Variable / Selection | TC1 (Happy Advice) | TC2 (Initial Review) | TC3 (Clean Advice) | TC4 (Advice Error) | TC5 (Extract Error) | TC6 (Tooltip Verify) | TC7 (Overwrite Advice) | TC8 (Locked Advice) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **B1** | Form Data Status | Highly reflective metal | Empty / New | Standard optimal specs | Partially filled | Highly reflective metal | Highly reflective metal | Updated from reflective to plastic | Pre-existing reflective |
| **B2** | Active Tab | Review & Submit | Review & Submit | Review & Submit | Review & Submit | Review & Submit | Review & Submit | Review & Submit | Review & Submit |
| **B3** | Advice Button | Visible & Clicked | Visible (Not Clicked) | Visible & Clicked | Visible & Clicked | Visible & Clicked | Visible & Clicked | Visible & Clicked | Hidden |
| **B4** | API Response (Advice) | Success (Markdown) | N/A | Success (Markdown) | `500` Error | Success (Markdown) | Success (Markdown) | Success (New Markdown) | N/A |
| **B5** | API Response (Extract) | Success (warnings JSON) | N/A | Success (Empty array) | N/A | `500` Error | Success (warnings JSON) | Success (Empty array) | N/A |
| **B6** | Advice Panel UI | Renders Markdown | Renders Placeholder | Renders Markdown | Renders Error alert | Renders Markdown | Renders Markdown | Renders New Markdown | Renders Saved report |
| **B7** | Warning Badges | `⚠️` on Material field | None | None | None | None | `⚠️` on Material field | Removed from Material | `⚠️` on Material (disabled) |
| **B8** | Firestore State | Report & warnings saved | No fields saved | Report saved | No fields saved | Report saved | Report saved | Report & warnings overwritten | Read-only |

---

## Manual Test Cases

### TC1: Successful Advice & Observations (Happy Path)
* **Actor**: External Partner
* **Purpose**: Verify that requesting advice on reflective part parameters generates a narrative advice report, extracts structured observations, and renders warning badges on the form.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B1: Form Data Status | Material: `"Shiny Steel"`, Cycle Time: `"10"` | Reflective metal characteristics are active in questionnaire state. | | | |
| **2** | B2 & B3: Tab Trigger | Nav to **Review & Submit**; Click **Get Advice on Data** | Loading overlay is displayed. API calls `/api/ai/advice` and `/api/ai/extract-observations` trigger. | | | |
| **3** | B6: Advice Panel UI | Gemini response returns advice narrative | The advice markdown details bin-picking challenges with reflective steel block. | | | |
| **4** | B7: Warning Badges | observations array includes warning for Material | Form fields show a yellow warning badge `⚠️` next to Part Material input. | | | |
| **5** | B8: Firestore verification | Open project doc | Firestore contains the report text in `report` and warning mapping in `fieldObservations`. | | | |

---

### TC2: Review Tab Initial Placeholder
* **Actor**: External Partner
* **Purpose**: Verify that the review page displays a friendly placeholder card and call-to-action when no advice has been generated yet.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B1 & B2: Tab Trigger | Open new draft; navigate to **Review & Submit** | Form has never run AI advice. | | | |
| **2** | B6 & B7: UI state | Placeholder card | Card displays: `"No advice report generated yet. Let the AI review your entries..."` Warning badges are completely absent. | | | |

---

### TC3: Clean Advice (No Warnings Generated)
* **Actor**: External Partner
* **Purpose**: Verify that optimal inputs generate an encouraging advice report and return zero structured warnings/badges.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B1: Form Data | Material: `"Matt Plastic"`, Cycle Time: `"40"`, Parts: `"1"` | Non-reflective, slow cycle time, clean configuration. | | | |
| **2** | B3: Action | Click **Get Advice on Data** | Run completes successfully. | | | |
| **3** | B6 & B7: UI State | Advice markdown visible; no badges | AI report details positive feasibility. No warning badges are rendered on any form fields. | | | |

---

### TC4: Advice API Failure Error Handling
* **Actor**: External Partner
* **Purpose**: Verify that system handles proxy API errors gracefully without crashing the UI.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B3: Action | Click **Get Advice on Data** (with network disconnected or API disabled) | Proxy returns a `500` server error. | | | |
| **2** | B6: UI State | Error warning banner | Loading screen closes. Alert displays: `"Unable to generate advice. Please try again later."` | | | |

---

### TC5: Observations Extraction Failure
* **Actor**: External Partner
* **Purpose**: Verify that if the advice endpoint succeeds but the observation extractor fails, the narrative report is still saved and displayed.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B5: Extraction API | `/api/ai/advice` succeeds; `/api/ai/extract-observations` fails | Server logs error but returns the report text. | | | |
| **2** | B6 & B7: UI State | Narrative report visible; no warning badges | The markdown advice report renders successfully. No inline warnings/badges are shown on the fields. | | | |

---

### TC6: UI Warning Badge Tooltips
* **Actor**: External Partner
* **Purpose**: Verify that hovering over a warning badge displays the correct reason text returned by Gemini.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Warning badge `⚠️` is visible on Part Material | Test case 1 has been executed. | | | |
| **2** | B7: Hover Badge | Hover cursor over the warning badge icon | Tooltip appears displaying: `"Reflective steel surfaces may cause camera glare issues..."` (or matching JSON reason). | | | |

---

### TC7: Re-run Advice (Overwrite Mode)
* **Actor**: External Partner
* **Purpose**: Verify that editing form parameters and re-running advice successfully updates the report and clears stale warning badges.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project has warning `⚠️` on Material | Reflective material is currently in state. | | | |
| **2** | B1: Form Edit | Change Material to `"Black Rubber"` | Form state changes. Warning badge remains visible temporarily. | | | |
| **3** | B3: Action | Click **Get Advice on Data** again | Re-run completes. | | | |
| **4** | B6-B8: UI & DB State | Warning badge removed; database report updated | Warning badge `⚠️` is removed from Material field. Report is updated to mention rubber characteristics. | | | |

---

### TC8: Locked Case - Advice Display
* **Actors**: External Partner & Scape App Engineer
* **Purpose**: Verify that locked projects display historical advice reports but hide the advice generator trigger button.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project is locked (`isLocked == true`) with existing report | View Review & Submit tab. | | | |
| **2** | B3: Advice Button | Hidden / Disabled | The **Get Advice on Data** button is hidden. | | | |
| **3** | B6: Advice Panel | Renders historical report | Displays the previously saved AI advice text block. | | | |
