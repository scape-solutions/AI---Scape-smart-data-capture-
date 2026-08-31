# System Test Cases: UC1 - Create and Save a Project Draft

This document defines the system test cases for **Use Case 1: Create and Save a Project Draft**. It includes the Test Case Allocation Matrix and 8 role-focused manual test cases.

---

## Test Case Allocation Matrix (UC1)

| Step | Variable / Selection | TC1 (Happy AI) | TC2 (Happy Manual) | TC3 (Blank Validation) | TC4 (Min Boundary) | TC5 (Max Boundary) | TC6 (Invalid Values) | TC7 (Upload Edge) | TC8 (Lock Verification) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **B1** | Action Selection | New Project | New Project | New Project | New Project | New Project | New Project | New Project | New Project |
| **B2** | Creation Method | Start with AI | Start Manually | Start with AI | Start Manually | Start with AI | Start Manually | Start with AI | Start Manually |
| **B3** | Project Name | `"Alpha Project"` | `"Beta Project"` | `[Blank]` | `"A"` (Min) | `250` chars (Max) | `""` (Only spaces) | `"Upload Test"` | `"Locked Project"` |
| **B4** | Expected Parts | `2` | `5` | `[Blank]` | `1` (Min) | `10` (Max) | `0` (Zero) | `1` | `1` |
| **B5** | Bin Type | First option | Last option | First option | Last option | First option | Last option | First option | First option |
| **B6-8**| Bin Dimensions (mm) | `1200 x 800 x 600` | `800 x 600 x 400` | `[Blank]` | `100` (Min) | `5000` (Max) | `-10` (Negative) | `1200 x 800 x 600` | `1200 x 800 x 600` |
| **B9** | Preferred Robot | First option | Last option | First option | Last option | First option | Last option | First option | First option |
| **B10**| Additional Project Notes| `"Notes text"` | `[Blank]` | `"Advice text"` | `"A"` | `1000` chars | `[Special chars]` | `"Notes"` | `"Lock Check"` |
| **B11**| Cell Photos | Valid PNG | Valid JPG | `[No upload]` | Valid PNG | Multiple PNGs | Valid JPG | Oversized / Corrupt | Valid PNG |
| **B13**| Part Name | `"Part A"` | `"Part B"` | `[Blank]` | `"P"` | `250` chars | `""` (Only spaces) | `"Part C"` | `"Part D"` |
| **B14**| Part Dimensions (mm) | `150` | `200` | `[Blank]` | `1` (Min) | `2000` (Max) | `0` (Zero) | `150` | `150` |
| **B15**| Part Weight (kg) | `2.5` | `8.0` | `[Blank]` | `0.1` (Min) | `100.0` (Max) | `-5.0` (Negative) | `2.5` | `2.5` |
| **B16**| Part Material | `"Shiny Steel"` | `"Cast Iron"` | `[Blank]` | `"M"` | `100` chars | `[Numbers only]` | `"Aluminium"` | `"Steel"` |
| **B17**| Desired Cycle Time (s) | `15` | `30` | `[Blank]` | `1` (Min) | `300` (Max) | `0` (Zero) | `15` | `15` |
| **B19**| CAD File Available | Yes (Valid JPG) | No | Yes | No | Yes | No | Oversized (>200KB) | Yes |
| **B21-27**| Characteristics | Defaults | Custom | Defaults | Custom | Defaults | Custom | Defaults | Defaults |
| **B32**| Part Images | Valid PNG | Valid JPG | `[No upload]` | Valid PNG | Multiple PNGs | Valid JPG | Corrupt file | Valid PNG |

---

## Manual Test Cases

### TC1: Happy Path - AI-Assisted
* **Actor**: External Partner
* **Purpose**: Verify successful project draft creation starting with the AI assistant, entering standard valid values, uploading valid PNG files, and saving.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B1 & B2: Creation Method | New Project -> Start with AI | App initializes the questionnaire with the AI Chat panel visible on the sidebar. | | | |
| **2** | B3-B10: General Info | Project Name: `"Alpha Project"`, Parts: `2`, Bin Type: `EU-Pallet`, Dimensions: `1200x800x600`, Robot: `Universal` | Form fields accept values successfully. AI helper suggestions are responsive. | | | |
| **3** | B11: Cell Photos | Valid PNG file | File uploads successfully and displays as a thumbnail preview. | | | |
| **4** | B13-B18: Part Details | Part Name: `"Part A"`, Dimensions: `150`, Weight: `2.5`, Material: `"Shiny Steel"`, Cycle Time: `15` | Part Details section accepts values and registers shiny surface warning flag. | | | |
| **5** | B19-B32: Part Media | CAD: Yes (under 200KB), Part Images: Valid PNG | CAD and part images upload successfully and show previews. | | | |
| **6** | B33: Action Selection | Save Draft | Displays success toast: `"Draft saved successfully"`. Redirects to Dashboard. Firestore document has `status: 'draft'`, `isLocked: false`. | | | |

---

### TC2: Happy Path - Manual Draft
* **Actor**: External Partner
* **Purpose**: Verify successful manual project draft creation without AI assistance, selecting alternative (last) options, leaving optional fields blank, and uploading JPG files.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B1 & B2: Creation Method | New Project -> Start Manually | App initializes a blank questionnaire template without opening the AI Chat panel. | | | |
| **2** | B3-B10: General Info | Project Name: `"Beta Project"`, Parts: `5`, Bin: Last option, Dimensions: `800x600x400`, Robot: Last option, Notes: `[Blank]` | Mandatory fields accept inputs; blank optional fields do not trigger validation warnings. | | | |
| **3** | B11: Cell Photos | Valid JPG file | JPG image uploads successfully. | | | |
| **4** | B13-B18: Part Details | Part Name: `"Part B"`, Weight: `8.0`, Material: `"Cast Iron"`, Notes: `[Blank]` | Part details are saved successfully. | | | |
| **5** | B19-B32: Part Media | CAD: No, Part Images: Valid JPG | JPG images upload successfully. CAD is set to "No". | | | |
| **6** | B33: Action Selection | Save Draft | Toast: `"Draft saved successfully"`. Project card appears on Dashboard with `"Draft"` status. | | | |

---

### TC3: Blank Field & Mandatory Validation
* **Actor**: External Partner
* **Purpose**: Verify that mandatory fields trigger validation errors when left blank and prevent saving/dashboard navigation.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B3: Project Name | `[Blank]` | Input box displays red warning: `"Project Name is required"`. | | | |
| **2** | B4: Expected Parts | `[Blank]` | Red warning: `"Expected number of parts is required"`. | | | |
| **3** | B6-B8: Bin Dimensions | `[Blank]` | Red warning: `"Bin dimensions are required"`. | | | |
| **4** | B13: Part Name | `[Blank]` | Red warning: `"Part name is required"`. | | | |
| **5** | B14-B15: Part Specs | `[Blank]` | Red warning: `"Part dimensions and weight are required"`. | | | |
| **6** | B33: Save Action | Click Save Draft | Form blocks navigation, displays validation summary, and scrolls focus to the first empty input field. | | | |

---

### TC4: Minimum Allowed Boundary Values
* **Actor**: External Partner
* **Purpose**: Verify that the system accepts the minimum allowed values for all input fields.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B3: Project Name | `"A"` (1 character) | Value is accepted without length warnings. | | | |
| **2** | B4: Expected Parts | `1` | Value is accepted. | | | |
| **3** | B6-B8: Bin Dimensions | `100` | Minimum valid bin dimension of 100mm is accepted. | | | |
| **4** | B13: Part Name | `"P"` (1 character) | Part name is accepted. | | | |
| **5** | B14-B15: Part Specs | Dimensions: `1`mm, Weight: `0.1`kg | Minimum dimensions and weight are accepted. | | | |
| **6** | B17: Cycle Time | `1` second | Minimum cycle time is accepted. | | | |

---

### TC5: Maximum Allowed Boundary Values
* **Actor**: External Partner
* **Purpose**: Verify that the system accepts the maximum allowed values and character lengths.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B3: Project Name | `250` characters | Input field accepts text and shows characters remaining count. | | | |
| **2** | B4: Expected Parts | `10` | Maximum limit of parts is accepted. | | | |
| **3** | B6-B8: Bin Dimensions | `5000` | Maximum dimension of 5000mm is accepted. | | | |
| **4** | B10: Project Notes | `1000` characters | Text field accepts up to 1000 characters without trimming. | | | |
| **5** | B11: Cell Photos | Multiple PNG files | Multi-image drop zone accepts up to the maximum permitted file uploads (e.g. 5). | | | |
| **6** | B13: Part Name | `250` characters | Long part name is accepted. | | | |

---

### TC6: Out-of-Bounds Input Rejections
* **Actor**: External Partner
* **Purpose**: Verify that values outside the allowed bounds are rejected with validation errors.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B3: Project Name | `""` (only spaces) | Input fails validation, showing `"Invalid project name"`. | | | |
| **2** | B4: Expected Parts | `0` or `-3` | Rejects input and displays: `"Number of parts must be between 1 and 10"`. | | | |
| **3** | B6-B8: Bin Dimensions | `-50` or `0` | Displays validation error: `"Dimensions must be positive values"`. | | | |
| **4** | B15: Part Weight | `-1.5` | Displays validation error: `"Weight must be greater than zero"`. | | | |
| **5** | B17: Cycle Time | `0` or `-5` | Displays validation error: `"Cycle time must be greater than zero"`. | | | |
| **6** | B33: Save Action | Click Save Draft | System blocks progress and refuses to commit values to Firestore. | | | |

---

### TC7: File Upload Edge Cases & Error Handling
* **Actor**: External Partner
* **Purpose**: Verify that oversized, corrupt, or invalid file uploads are blocked with descriptive error messages.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B11: Cell Photos | Invalid file type (e.g., `.txt`) | Drop zone rejects file and displays toast: `"Invalid file format. Only JPG/PNG images are allowed."` | | | |
| **2** | B11: Cell Photos | Corrupt/0-byte image | System blocks upload and alerts: `"File is corrupt or empty."` | | | |
| **3** | B19: CAD Upload | CAD STL file > `200 KB` | Drop zone blocks file, shows error message, and suggests uploading screenshots instead. | | | |
| **4** | B32: Part Images | Oversized photo (> `5 MB`) | Blocks file upload and alerts: `"Image size exceeds the maximum limit of 5MB."` | | | |

---

### TC8: Multi-user Locking Check
* **Actors**: External Partner & Scape App Engineer
* **Purpose**: Verify that once a draft is submitted, it becomes locked and cannot be edited by the owner (External Partner), but is visible and claimable by the Scape App Engineer.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **[Partner]** Action | Click Submit Case | App locks the project in Firestore: `isLocked: true`, `status: 'submitted'`. | | | |
| **2** | **[Partner]** UI | Open Project Details | Form input fields are disabled (read-only). "Save Draft" and "Submit" buttons are hidden. | | | |
| **3** | **[Engineer]** Action | Login & open Dashboard | Submitted project card is visible on the Engineer's evaluator dashboard. | | | |
| **4** | **[Engineer]** UI | Click **Take Case** | Engineer succeeds in self-assigning the project. `takenBy` field is updated in Firestore with the engineer's email. | | | |
