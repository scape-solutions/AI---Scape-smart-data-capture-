# Use Case 9: Project Lifecycle & Case Management - System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-9-project-lifecycle--case-management)  
**Actors:** External Partner (Owner), Scape App Engineer (Admin / Superuser)  
**Scope:** Dashboard Actions, Soft Delete to Trash, Exact-String Modal Confirmation, Restoration, Permanent Purge, Inactive Archiving, Multi-Status Filtering.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Trashed View Trigger | Dashboard filter "Status: Deleted" | TC-UC9-01, TC-UC9-03 |
| Step 2: Soft Delete Trigger | Project card trash icon, modal appearance | TC-UC9-02, TC-UC9-04 |
| Step 3: Exact Word Verification | Typing `"delete"` to enable "Move to Trash" button | TC-UC9-02, TC-UC9-04 |
| Step 4: Soft Delete Persistence | `isDeleted: true`, card hidden from active dashboard | TC-UC9-02, TC-UC9-05 |
| Step 5: Multi-Status Filter Bar | "All", "Active Only", "Show Inactive", "Status: Deleted" | TC-UC9-03, TC-UC9-05 |
| Step 6: Project Restoration | Click "Restore" on deleted card, `isDeleted: false` | TC-UC9-08 |
| Step 7: Inactive / Archive Toggle | "Deactivate" action, `isInactive: true` | TC-UC9-05 |
| Step 8: Permanent Purge Permission | Evaluator vs. Partner privilege for "Final Delete" | TC-UC9-06 |
| Step 9: Cascading Purge Execution | "Final Delete" execution, root doc and subcollections | TC-UC9-07 |

---

## 2. System Test Cases (ZOMBEE)

### TC-UC9-01: Empty State Rendering When Zero Deleted Cases Exist [Zero]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Precondition Check | No projects have been moved to trash | Database has 0 deleted docs | [Pending] | Pending | ZOMBEE: Zero. Catches null-pointer exceptions in empty list views. |
| 1.2 | Filter Selection | Select "Status: Deleted" in filter bar | Filter updates | [Pending] | Pending | Triggers filter query |
| 1.3 | Empty State Display | Inspect Dashboard grid | Renders clean empty state: *"No deleted projects found"* | [Pending] | Pending | Verifies friendly empty UI |
| 1.4 | Stability Check | Inspect console | Zero unhandled React render errors or broken grid layouts | [Pending] | Pending | Confirms UI stability |

---

### TC-UC9-02: Single Project Soft-Delete Confirmation Flow [One]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Precondition Check | Active project card visible on Dashboard | Owner viewing project card | [Pending] | Pending | ZOMBEE: One. Validates standard single project soft deletion. |
| 2.2 | Delete Trigger | Click trash icon on project card | Modal opens: *"Are you sure you want to move project [Name] to the trash?"* | [Pending] | Pending | Opens confirmation modal |
| 2.3 | Confirmation Input | Type `"delete"` in confirmation input | "Move to Trash" button becomes active and clickable | [Pending] | Pending | Enters confirmation keyword |
| 2.4 | Move to Trash Action | Click "Move to Trash" | Modal closes; card disappears from active view; toast confirms soft delete | [Pending] | Pending | Executes soft delete |
| 2.5 | Database State | `isDeleted` in Firestore | `isDeleted: true` set; project document remains intact in database | [Pending] | Pending | Confirms soft-delete flag |

---

### TC-UC9-03: Multi-Status Filtering Across Active, Inactive, and Deleted [Many]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Test Data Setup | 10 projects: 5 active, 3 inactive, 2 deleted | Mixed project repository | [Pending] | Pending | ZOMBEE: Many. Catches compound Firestore query filter leaks. |
| 3.2 | Filter: Default Active | View default Dashboard | Displays exactly the 5 active projects; hides inactive and deleted | [Pending] | Pending | Verifies active isolation |
| 3.3 | Filter: Show Inactive | Enable "Show Inactive" toggle | Displays the 5 active projects plus the 3 inactive projects (8 total) | [Pending] | Pending | Verifies inactive inclusion |
| 3.4 | Filter: Status Deleted | Select "Status: Deleted" | Displays exclusively the 2 deleted projects with red "Deleted" badges | [Pending] | Pending | Verifies deleted isolation |
| 3.5 | Clean Separation | Inspect all views | No deleted projects appear in active queue; no active projects appear in trash queue | [Pending] | Pending | Ensures zero state bleeding |

---

### TC-UC9-04: Case-Sensitive Confirmation String Boundary Check [Boundary]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Modal Open | Open soft-delete modal | Confirmation input focused | [Pending] | Pending | ZOMBEE: Boundary. Enforces strict exact-match boundary on delete. |
| 4.2 | Partial String | Type `"del"` | "Move to Trash" button remains strictly disabled | [Pending] | Pending | Blocks partial string |
| 4.3 | Uppercase String | Type `"DELETE"` | "Move to Trash" button remains disabled (case-sensitive) | [Pending] | Pending | Blocks case mismatch |
| 4.4 | Trailing Whitespace | Type `"delete "` (with space) | "Move to Trash" button remains disabled (or trimmed cleanly) | [Pending] | Pending | Catches whitespace edge |
| 4.5 | Exact Match | Type `"delete"` | "Move to Trash" button immediately enables | [Pending] | Pending | Enables on exact match |

---

### TC-UC9-05: Lifecycle Partition: Inactive Archive vs. Trash Delete [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Partition A: Deactivate | Evaluator clicks "Deactivate" on project | `isInactive: true` set; hidden from default view; visible via "Show Inactive" toggle | [Pending] | Pending | ZOMBEE: Equivalence. Distinguishes archiving from deletion. |
| 5.2 | Re-activation Check | Click "Activate" on inactive card | `isInactive: false`; project immediately restored to standard active list | [Pending] | Pending | Verifies clean reactivation |
| 5.3 | Partition B: Move to Trash | Click trash icon; confirm deletion | `isDeleted: true` set; moved to trash view; excluded from active and inactive lists | [Pending] | Pending | Verifies trash separation |

---

### TC-UC9-06: Role Permission Partition: Permanent Purge Privilege [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Partition A: Partner | Partner views project in "Status: Deleted" | Card displays red "Deleted" badge and single action: **"Restore"** | [Pending] | Pending | ZOMBEE: Equivalence. Validates purge privilege partition. |
| 6.2 | Purge Button Hidden | Inspect card actions for Partner | **"Final Delete"** button is completely hidden from Partner view | [Pending] | Pending | Prevents unauthorized purge |
| 6.3 | Partition B: Evaluator | Evaluator/Admin views same deleted card | Card displays both **"Restore"** and **"Final Delete"** buttons | [Pending] | Pending | Verifies evaluator access |

---

### TC-UC9-07: Permanent Purge Cascading Subcollection Cleanup [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Precondition Check | Deleted project with uploaded cell and part images in subcollection | Multi-document project in trash | [Pending] | Pending | ZOMBEE: Exception. Catches orphaned storage subcollections in Firestore. |
| 7.2 | Final Delete Trigger | Evaluator clicks "Final Delete" | Irreversible warning modal appears | [Pending] | Pending | Warns about permanent purge |
| 7.3 | Confirm Purge | Confirm permanent deletion | System triggers batch delete of root project doc and associated image subcollections | [Pending] | Pending | Executes cascading purge |
| 7.4 | Firestore Verification | Query project ID in Firestore | Document and all child subcollections are completely deleted (0 documents remain) | [Pending] | Pending | Verifies complete cleanup |
| 7.5 | Direct URL Check | Navigate directly to `/project/[deletedId]` | System returns 404 / project not found; does not crash | [Pending] | Pending | Confirms non-existence |

---

### TC-UC9-08: Project Restoration State Idempotency [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Precondition Check | Trashed project had `status: 'submitted'`, `isLocked: true`, and field observations | Previously submitted project in trash | [Pending] | Pending | ZOMBEE: Exception. Catches state corruption/reset upon restore. |
| 7.2 | Restore Action | In "Status: Deleted" filter, click "Restore" | System restores project: `isDeleted: false` | [Pending] | Pending | Triggers restoration |
| 7.3 | State Check: Status | Inspect restored project card | Status remains strictly `'submitted'`; does NOT reset to `'draft'` | [Pending] | Pending | Ensures status integrity |
| 7.4 | State Check: Locks & Data | Open restored project | `isLocked` remains `true`; all questionnaire answers, photos, and advice snapshot remain intact | [Pending] | Pending | Verifies zero data loss |
