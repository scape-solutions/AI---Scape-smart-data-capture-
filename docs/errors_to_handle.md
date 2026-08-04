# Errors to be Handled

This document tracks identified errors and bugs in the Scape Bin-Picking Evaluator application that need to be fixed in future development cycles.

---

## 1. Firestore Write Error: Unsupported Field Value `undefined` (Status: CORRECTED)

### Error Message
```
Error: An error occurred (Failed to write projects/JfrxWZbQQ7v0KZ8AcBjJ): 
Function updateDoc() called with invalid data. Unsupported field value: undefined 
(found in field takenBy in document projects/JfrxWZbQQ7v0KZ8AcBjJ)
```

### Root Cause
1. **Firestore Constraints:** Firebase/Firestore does not support `undefined` values inside data objects passed to `updateDoc()`, `addDoc()`, or `setDoc()`. Passing a field with the value `undefined` causes Firestore to reject the write operation.
2. **Missing Normalization:** In [src/hooks/useProjects.ts](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/src/hooks/useProjects.ts#L23-L57), the `normalizeProject(p)` function does not assign default values to the optional properties of `ProjectState`.
3. **State Syncing Bug:** When the real-time project listener triggers in [useProjects.ts](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/src/hooks/useProjects.ts#L912-L988), it compares the active project against the updated database copy. In the state merge, it explicitly does:
   ```typescript
   takenBy: updated.takenBy,
   takenByName: updated.takenByName
   ```
   If the project document in the database does not have these fields, `updated.takenBy` and `updated.takenByName` evaluate to `undefined`. This injects explicit `undefined` values into the React state `currentProject`.
4. **Invalid Writes:** When a user modifies questionnaire fields or saves project data, `saveProject()` is called. It spreads the active `currentProject` into the database update payload:
   ```typescript
   const { id, generalImages, ...projectDataWithoutId } = project;
   const data = {
     ...projectDataWithoutId,
     // ... other fields
   };
   ```
   Since `projectDataWithoutId` contains `takenBy: undefined`, the payload contains an `undefined` field, which Firestore rejects.

### Recommended Fix

#### Step 1: Update `normalizeProject`
Update `normalizeProject` in [src/hooks/useProjects.ts](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/src/hooks/useProjects.ts#L23) to supply safe fallback values (e.g., `null` or `false`) instead of letting them evaluate to `undefined`:

```typescript
export function normalizeProject(p: any): ProjectState {
  const generalResponses = p?.generalResponses || {};
  
  let parts = Array.isArray(p?.parts) ? p.parts : [];
  if (parts.length === 0) {
    parts = [{ responses: {}, images: [] }];
  }
  
  const normalizedParts = parts.map((part: any) => ({
    responses: part?.responses || {},
    images: Array.isArray(part?.images) ? part.images : [],
    cadFile: part?.cadFile || null
  }));

  return {
    ...p,
    projectName: p?.projectName || generalResponses['1.01'] || p?.generalResponses?.['1.01'] || "Untitled Project",
    generalResponses,
    parts: normalizedParts,
    generalImages: Array.isArray(p?.generalImages) ? p.generalImages : [],
    report: p?.report || null,
    evaluatorDraft: p?.evaluatorDraft || null,
    finalVerdict: p?.finalVerdict || null,
    fieldObservations: p?.fieldObservations || null,
    status: p?.status || 'draft',
    userId: p?.userId || '',
    isLocked: !!p?.isLocked,
    isVerdictVisible: !!p?.isVerdictVisible,
    ownerName: p?.ownerName || 'Unknown',
    ownerCompany: p?.ownerCompany || 'Unknown',
    ownerEmail: p?.ownerEmail || 'Unknown',
    ownerPhone: p?.ownerPhone || 'Unknown',
    
    // Fix: Normalize all optional fields to prevent undefined values
    takenBy: p?.takenBy || null,
    takenByName: p?.takenByName || null,
    isInactive: !!p?.isInactive,
    isDeleted: !!p?.isDeleted,
    isDemo: !!p?.isDemo,
    isImportPending: !!p?.isImportPending
  };
}
```

#### Step 2: Implement a Safe Write Sanitizer (Optional but Recommended)
To prevent similar bugs from other fields in the future, add a helper function inside the database write operations (e.g., `saveProject`, `updateProjectField`) to strip any `undefined` properties before sending payloads to Firestore:

```typescript
const sanitizeFirestorePayload = (data: any) => {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key]; // Remove undefined fields entirely
    }
  });
  return sanitized;
};
```
And apply it in `saveProject` and `updateProjectField` right before passing the object to `updateDoc` or `addDoc`.
