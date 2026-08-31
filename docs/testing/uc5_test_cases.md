# System Test Cases: UC5 - Request Project Unlock

This document defines the system test cases for **Use Case 5: Request Project Unlock / Edit Permission**. It includes the Test Case Allocation Matrix and 8 role-focused manual test cases.

---

## Test Case Allocation Matrix (UC5)

| Step | Variable / Selection | TC1 (Unlock Approved) | TC2 (Unlock Rejected) | TC3 (Cancel Modal) | TC4 (Empty Justify) | TC5 (Draft Check) | TC6 (UI Pending Check) | TC7 (Changelog Check) | TC8 (Auth Bypass) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **B1** | Initial Project State | `'submitted'` | `'submitted'` | `'submitted'` | `'submitted'` | `'draft'` | `'submitted'` | `'submitted'` | `'submitted'` |
| **B2** | Request Trigger | Click Request Edit | Click Request Edit | Click Request Edit | Click Request Edit | Hidden (blocked) | Click Request Edit | Click Request Edit | Direct API POST |
| **B3** | Justification Text | `"Need to fix robot"` | `"Wrong parts count"` | `[Blank]` | `[Blank]` | N/A | `"Check specs"` | `"Need to fix robot"` | `"Hack unlock"` |
| **B4** | Request Action | Click Submit | Click Submit | Click Cancel | Click Submit | N/A | Click Submit | Click Submit | Send endpoint payload |
| **B5** | Engineer Review | Click Approve | Click Reject | N/A | N/A | N/A | View review panel | Click Approve | Approve as Partner |
| **B6** | Firestore Status | `'draft'` | `'submitted'` | `'submitted'` | `'submitted'` | `'draft'` | `'submitted'` | `'draft'` | No change |
| **B7** | Firestore `isLocked` | `false` | `true` | `true` | `true` | `false` | `true` | `false` | No change |
| **B8** | Pending Flags | Cleared | Cleared | Cleared | N/A | N/A | `editRequestPending: true`| Cleared | No change |

---

## Manual Test Cases

### TC1: Successful Unlock Request and Approval (Happy Path)
* **Actors**: External Partner & Scape App Engineer
* **Purpose**: Verify that an External Partner can request edit permissions with a justification, and a Scape Engineer can approve the request to revert the project to draft status and unlock it.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **[Partner]** B2 & B3 | Click **Request Edit Permission**; Type: `"Need to change preferred robot brand to KUKA."` | Request modal opens. Text field accepts input. Click Submit. Modal closes. Banner displays: `"Unlock request pending review"`. | | | |
| **2** | B8: Firestore state | Check project doc flags | `editRequestPending` is set to `true`, and `editRequestReason` contains justification text. | | | |
| **3** | **[Engineer]** B5 | Login as Engineer; click **Review Request** on dashboard card; click **Approve & Unlock** | Engineer dashboard displays pulsing amber badge. Approval panel displays justification. Success toast: `"Project unlocked successfully"`. | | | |
| **4** | **[Partner]** B6 & B7 | Login as Partner; open dashboard | Project card status updates to `"Draft"`, lock icon is gone. Form inputs are editable. Firestore state: `status: 'draft'`, `isLocked: false`, pending flags cleared. | | | |

---

### TC2: Unlock Request Rejected by Engineer
* **Actors**: External Partner & Scape App Engineer
* **Purpose**: Verify that if the Engineer rejects the request, the project remains locked and the justification flags are cleared.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **[Partner]** Request | Submit unlock request (justification: `"Wrong parts count"`) | Request pending flags are saved in Firestore. | | | |
| **2** | **[Engineer]** B5 | Open request review; click **Reject Request** | Reject completes with toast. Dashboard badge is removed. | | | |
| **3** | B6-B8: DB & UI state | Firestore check | Project remains locked (`isLocked: true`, status `'submitted'`). Request pending flags are cleared (`editRequestPending: false`). Partner UI banner changes to `"Unlock request was rejected"`. | | | |

---

### TC3: Cancel Unlock Request Modal
* **Actor**: External Partner
* **Purpose**: Verify that canceling out of the request modal does not alter project fields or Firestore state.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B2: Request modal | Click **Request Edit Permission** | Justification modal appears. | | | |
| **2** | B4: Cancel action | Click **Cancel** (or ESC) | Modal closes. Dashboard and project state remain unchanged (`editRequestPending` remains `false`). | | | |

---

### TC4: Empty Request Justification Validation
* **Actor**: External Partner
* **Purpose**: Verify that partners cannot submit an unlock request with an empty justification.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B2 & B3: Modal input | Open request modal; leave text area `[Blank]` | Submit button is disabled, or clicking it shows red warning: `"Please enter a reason for requesting edit permission."` Submission is blocked. | | | |

---

### TC5: Block Request on Draft Projects
* **Actor**: External Partner
* **Purpose**: Verify that the "Request Edit Permission" button is hidden for projects that are already editable (Draft state).

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project status is `"Draft"` (`isLocked == false`) | View project details page. | | | |
| **2** | B2: Button Visibility | Check request button | The **Request Edit Permission** button is completely hidden/absent from the interface. | | | |

---

### TC6: UI Verification of Pending Status Badge
* **Actors**: External Partner & Scape App Engineer
* **Purpose**: Verify that a pending unlock request displays a distinct, pulsing amber badge on the Engineer dashboard.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Partner submitted unlock request | Engineer logs in and looks at Dashboard. | | | |
| **2** | B5: UI Badge | Check dashboard card badge | Project card has a pulsing amber badge: `"Unlock Requested"`. | | | |

---

### TC7: Unlock Request Logs in Changelog
* **Actors**: External Partner & Scape App Engineer
* **Purpose**: Verify that both the submission of the unlock request and the engineer's verdict are logged in the project's changelog.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Test case 1 has been executed | Retrieve project document from Firestore. | | | |
| **2** | B8: Changelog check | Inspect `changelog` field array | Contains entries for request: `{ action: 'request_unlock', reason: 'Need to change...', user: [partner-email] }` and approve: `{ action: 'approve_unlock', user: [engineer-email] }`. | | | |

---

### TC8: Auth Boundary Bypass Prevention
* **Actor**: External Partner (acting maliciously)
* **Purpose**: Verify that a customer cannot approve their own unlock requests or invoke the unlock API endpoints directly without admin/evaluator authorization.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project locked; Partner is logged in | Partner attempts to send mock POST request to unlock endpoint `/api/project/unlock` bypassing the UI. | | | |
| **2** | B8: API response | Direct API payload call | Backend checks role permissions, rejects request with `403 Forbidden`, and project remains locked. | | | |
