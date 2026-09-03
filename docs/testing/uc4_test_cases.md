# System Test Cases: UC4 - Submit Project for Evaluation

This document defines the system test cases for **Use Case 4: Submit Project for Evaluation**. It includes the Test Case Allocation Matrix and 8 role-focused manual test cases.

---

## Test Case Allocation Matrix (UC4)

| Step | Variable / Selection | TC1 (Happy Submit) | TC2 (Cancel Modal) | TC3 (Missing Name) | TC4 (Missing Parts) | TC5 (Multi Part Check) | TC6 (UI Lock Check) | TC7 (Changelog Audit) | TC8 (Auth Check) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **B1** | Form Validity | All valid | All valid | Missing Name | Missing Part name | Valid (3 parts) | All valid | All valid | All valid |
| **B2** | Submit Action | Click Submit | Click Submit | Click Submit | Click Submit | Click Submit | Click Submit (prior) | Click Submit (prior) | Access via URL |
| **B3** | Confirmation Modal | Click Confirm | Click Cancel | Hidden (blocked) | Hidden (blocked) | Click Confirm | N/A | N/A | N/A |
| **B4** | Toast Notification | `"Submitted successfully"` | None | `"Validation errors"` | `"Validation errors"` | `"Submitted successfully"` | None | None | `"Unauthorized"` |
| **B5** | Redirect Target | Dashboard | Review page | Review page | Review page | Dashboard | Dashboard | Dashboard | Login / Dashboard |
| **B6** | Firestore Status | `'submitted'` | `'draft'` | `'draft'` | `'draft'` | `'submitted'` | `'submitted'` | `'submitted'` | No change |
| **B7** | Firestore `isLocked` | `true` | `false` | `false` | `false` | `true` | `true` | `true` | No change |
| **B8** | Actor Role | Partner | Partner | Partner | Partner | Partner | Partner | Partner | Unauth User |

---

## Manual Test Cases

### TC1: Successful Project Submission & Lock (Happy Path)
* **Actor**: External Partner
* **Purpose**: Verify that a fully completed project draft submits successfully, displays confirmation, locks the form, and redirects the user.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B1 & B2: Submit Trigger | Nav to **Review & Submit**; Click **Submit Case** | Confirmation Modal pops up warning: `"This action will lock your project details."` | | | |
| **2** | B3: Confirm Action | Click **Confirm** | Modal closes. Toast displays: `"Project submitted successfully"`. | | | |
| **3** | B5: Redirect Target | Redirection outcome | Redirects user to Dashboard page. Project card shows lock icon and status `"Submitted"`. | | | |
| **4** | B6 & B7: DB State | Firestore update | Document has `status: 'submitted'` and `isLocked: true`. | | | |

---

### TC2: Cancel Submission in Confirmation Modal
* **Actor**: External Partner
* **Purpose**: Verify that canceling in the submission modal leaves the project in an editable draft state.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B2: Submit Trigger | Click **Submit Case** | Confirmation Modal pops up. | | | |
| **2** | B3: Cancel Action | Click **Cancel** (or press ESC / click overlay) | Modal closes. User remains on the Review page. | | | |
| **3** | B6 & B7: DB State | Firestore state | Document status remains `'draft'`, and `isLocked` remains `false`. Form is fully editable. | | | |

---

### TC3: Block Submission on Empty Project Name
* **Actor**: External Partner
* **Purpose**: Verify that submission is blocked and validation errors are shown if the Project Name is missing.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B1: Form Validity | Project Name: `[Blank]`, other inputs valid | Form validation fails. | | | |
| **2** | B2: Submit Trigger | Click **Submit Case** | Submission is blocked. No modal appears. Red warning alert details missing Project Name. | | | |
| **3** | B5: UI Focus | Auto-scroll | Screen auto-scrolls to focus on the Project Name input box. | | | |

---

### TC4: Block Submission on Missing Part Details
* **Actor**: External Partner
* **Purpose**: Verify that submission is blocked if mandatory part details (e.g., Part Name) are not filled in.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B1: Form Validity | General info valid, Part Name: `[Blank]` | Form validation fails. | | | |
| **2** | B2: Submit Trigger | Click **Submit Case** | Submission is blocked. Toast displays: `"Please resolve validation errors before submission."` | | | |

---

### TC5: Submit with Multiple Parts Validation
* **Actor**: External Partner
* **Purpose**: Verify that submission succeeds when all defined part tabs are fully completed in a multi-part project.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B1: Form Validity | Parts dropdown = `3`; Part 1, Part 2, and Part 3 tabs fully filled | Form validation passes. | | | |
| **2** | B2 & B3: Submit Action | Click Submit -> Click Confirm | Project submits successfully and redirects. All 3 part states are saved. | | | |

---

### TC6: UI Verification Post-Lock
* **Actor**: External Partner
* **Purpose**: Verify that all interactive form elements, file inputs, and actions are disabled on a submitted project.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project has been submitted (`isLocked == true`) | Open the project details view. | | | |
| **2** | B6: Inputs disabled | Text inputs, dropdowns, radio selections | All elements display in disabled/greyed-out read-only state. | | | |
| **3** | B6: Uploads disabled | Drop zones for photos & CAD | Image file drops are disabled. Upload icons are replaced with a locked icon. | | | |

---

### TC7: Audit Entry Verification in Changelog
* **Actor**: External Partner
* **Purpose**: Verify that the project's changelog array contains a correct audit entry tracking the submission.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project has been submitted (TC1 execution) | Retrieve project document in Firestore. | | | |
| **2** | B6: Changelog check | Check `changelog` field array | Firestore document includes entry matching: `{ action: 'submit', timestamp: [Date], user: [partner-email] }`. | | | |

---

### TC8: Role-based Auth Access Verification
* **Actor**: Unauthenticated User
* **Purpose**: Verify that users who are not signed in cannot access project submission endpoints or view private submitted projects via direct URLs.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | User is logged out | Navigate to dashboard URL or specific project details URL: `/projects/{projectId}`. | | | |
| **2** | B5: Redirect outcome | Direct link access | Application blocks access, redirects user to `/login` page, and shows toast: `"Please login to access this project."` | | | |
