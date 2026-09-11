# Use Case 9: Project Lifecycle & Case Management - Black Box System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-9-project-lifecycle--case-management)  
**Actors:** External Partner (Owner), Scape App Engineer (Admin / Superuser)  
**Scope:** Black box testing of Dashboard project management, soft deleting to trash, exact confirmation string checks, project restoration, multi-status filter isolation, inactive archiving, and permanent deletion privileges.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Soft Delete Action | Project card trash icon, confirmation modal prompt | TC-UC9-01, TC-UC9-02 |
| Step 2: Confirmation String Verification | Typing exact word `"delete"` to enable "Move to Trash" | TC-UC9-01, TC-UC9-02 |
| Step 3: Trashed State Display | Project removed from active view, visible under "Status: Deleted" | TC-UC9-01, TC-UC9-04 |
| Step 4: Trash Restoration | "Restore" button click on trashed card | TC-UC9-03 |
| Step 5: Dashboard Filter Isolation | "All", "Active Only", "Show Inactive", "Status: Deleted" | TC-UC9-04, TC-UC9-05 |
| Step 6: Inactive Archiving Toggle | "Deactivate" action (Evaluator) vs. "Activate" restore | TC-UC9-05 |
| Step 7: Permanent Purge Role Privileges | Partner account vs. Evaluator account on trashed project | TC-UC9-06 |
| Step 8: Permanent Purge Execution | "Final Delete" button and irreversible confirmation modal | TC-UC9-07 |
| Step 9: Zero Trashed Cases Empty State | Dashboard rendering when no projects are in trash | TC-UC9-08 |

---

## 2. Black Box Test Cases

### TC-UC9-01: Standard Soft Delete to Trash Flow [Use Case Scenario]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Card Identification | Locate project "Project Gamma" on Dashboard | Project card is visible in active list | [Pending] | Pending | Black Box: Use Case Scenario. Validates primary soft deletion workflow. |
| 1.2 | Trash Trigger | Click the trash icon button on the project card | Confirmation modal displays: *"Are you sure you want to move project Project Gamma to the trash?"* | [Pending] | Pending | Opens delete confirmation |
| 1.3 | Confirmation Entry | Type `"delete"` in the confirmation input field | "Move to Trash" button transitions from disabled to active/clickable | [Pending] | Pending | Enters required confirmation |
| 1.4 | Move to Trash Action | Click "Move to Trash" button | Modal closes; "Project Gamma" disappears from the active dashboard view | [Pending] | Pending | Executes soft delete |
| 1.5 | Trashed View Verification | In Dashboard filter bar, select "Status: Deleted" | "Project Gamma" appears with a red **"Deleted"** badge and a **"Restore"** button | [Pending] | Pending | Confirms placement in trash queue |

---

### TC-UC9-02: Strict Exact-Match Boundary Check on Delete [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Modal Open | Open delete confirmation modal | Confirmation input is focused; "Move to Trash" button is disabled | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches accidental deletes on partial typing. |
| 2.2 | Partial String Test | Type `"del"` | "Move to Trash" button remains strictly disabled | [Pending] | Pending | Blocks partial string |
| 2.3 | Uppercase String Test | Type `"DELETE"` | "Move to Trash" button remains disabled (strict case sensitivity) | [Pending] | Pending | Blocks case mismatch |
| 2.4 | Trailing Space Test | Type `"delete "` (with trailing space) | "Move to Trash" button remains disabled (or trimmed cleanly) | [Pending] | Pending | Tests trailing whitespace |
| 2.5 | Exact Match Test | Type exact lowercase `"delete"` | "Move to Trash" button immediately enables | [Pending] | Pending | Enables on exact match |

---

### TC-UC9-03: Project Restoration from Trash [State Transition Testing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Precondition Check | Project "Cell Omega" in "Status: Deleted" filter with previous "Submitted" status | Project card displays red "Deleted" badge | [Pending] | Pending | Black Box: State Transition Testing. Catches status corruption upon restore. |
| 3.2 | Restore Action | Click **"Restore"** button on the project card | Notification confirms: *"Project restored successfully"* | [Pending] | Pending | Restores project |
| 3.3 | Active View Return | Switch Dashboard filter back to "Active Only" | "Cell Omega" appears back in the active project list | [Pending] | Pending | Returns to active list |
| 3.4 | State Integrity Check | Open "Cell Omega" | Status remains **"Submitted"**; previous questionnaire answers, photos, and lock flags remain 100% intact | [Pending] | Pending | Confirms zero data loss |

---

### TC-UC9-04: Dashboard Multi-Status Filter Isolation [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Multi-Status Setup | Dashboard containing active projects, inactive projects, and trashed projects | Mixed project states | [Pending] | Pending | Black Box: Equivalence Partitioning. Catches filter query leaks. |
| 4.2 | Filter: Active Only | Select "Active Only" filter | Displays exclusively active projects; zero inactive or deleted cards visible | [Pending] | Pending | Verifies active isolation |
| 4.3 | Filter: Show Inactive | Enable "Show Inactive" toggle | Displays active projects alongside inactive (archived) projects | [Pending] | Pending | Verifies inactive inclusion |
| 4.4 | Filter: Status Deleted | Select "Status: Deleted" filter | Displays exclusively deleted projects; zero active cards visible | [Pending] | Pending | Verifies trash isolation |

---

### TC-UC9-05: Deactivate (Archive) vs. Soft Delete Partition [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Partition A: Deactivate | Evaluator clicks "Deactivate" on an active card | Card is marked inactive; hidden from default view; visible when "Show Inactive" is enabled | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests archiving vs deletion. |
| 5.2 | Re-activate Check | Click "Activate" on the inactive card | Card immediately returns to the standard active dashboard view | [Pending] | Pending | Tests simple reactivation |
| 5.3 | Partition B: Soft Delete | Click trash icon; confirm deletion | Card is moved to trash; completely excluded from both active and inactive views | [Pending] | Pending | Verifies distinct trash queue |

---

### TC-UC9-06: Permanent Purge Role Permission Partition [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Partition A: Partner View | Partner logs in; filters by "Status: Deleted" | Project card displays red "Deleted" badge and single action button: **"Restore"** | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests role privilege limits. |
| 6.2 | Action Inspection | Inspect card buttons for Partner | **"Final Delete"** button is completely hidden from the Partner interface | [Pending] | Pending | Prevents unauthorized customer purges |
| 6.3 | Partition B: Evaluator View | Evaluator logs in; views same deleted card | Card displays two action buttons: **"Restore"** AND **"Final Delete"** | [Pending] | Pending | Verifies admin purge access |

---

### TC-UC9-07: Permanent Delete Execution [State Transition Testing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Precondition Check | Evaluator viewing a project in "Status: Deleted" filter | Evaluator has case in trash | [Pending] | Pending | Black Box: State Transition Testing. Tests terminal permanent delete. |
| 7.2 | Final Delete Trigger | Click **"Final Delete"** button | Modal warns that permanent deletion is irreversible and will remove all project media | [Pending] | Pending | Warns about permanent purge |
| 7.3 | Confirm Purge | Confirm permanent deletion in modal | Modal closes; project card is permanently removed from the dashboard | [Pending] | Pending | Executes permanent purge |
| 7.4 | Direct URL Check | Navigate directly to the project's URL in browser | Application returns a clean "Project not found (404)" screen without crashing | [Pending] | Pending | Confirms permanent removal |

---

### TC-UC9-08: Zero Trashed Cases Empty State Display [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Precondition Check | No projects currently reside in the trash | Zero deleted projects | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches empty collection render bugs. |
| 8.2 | Filter Selection | Select "Status: Deleted" in filter bar | Filter updates | [Pending] | Pending | Triggers trash filter |
| 8.3 | Empty State Check | Inspect Dashboard view | Clean empty state renders: *"No deleted projects found"* | [Pending] | Pending | Verifies clean empty message |
| 8.4 | Navigation Stability | Switch between filters | UI transitions smoothly without console exceptions or broken card layouts | [Pending] | Pending | Confirms UI stability |
