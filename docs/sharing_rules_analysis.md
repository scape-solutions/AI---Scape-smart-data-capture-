# Technical Analysis: Firestore Rules Complexity & Testing for Project Sharing

This document analyzes the complexity of implementing the **Collaboration & Project Sharing** rules in Firebase Firestore, compares two architectural options, and outlines a strategy for writing automated tests using the Firebase Rules Unit Testing SDK.

---

## 1. Firestore Security Rules: Complexity Analysis

To implement the sharing model, we must allow **Viewers (read-only access)** to see projects they do not own, while strictly prohibiting them from modifying questionnaire inputs. We must also allow users to request access via a share link.

### Option A: Inline `joinRequests` array inside the Project Document
In this option, all sharing data (`sharedViewers` and `joinRequests`) lives directly on the project document `/projects/{projectId}`.

*   **Complexity:** **High.**
*   **Rule Draft:**
    ```javascript
    match /projects/{projectId} {
      allow read: if isScape() || (
        resource != null && (
          resource.data.userId == request.auth.uid ||
          request.auth.uid in resource.data.get('sharedViewers', [])
        )
      );

      allow update: if isScape() || (
        resource != null && (
          // Case 1: Owner can update everything
          resource.data.userId == request.auth.uid ||
          
          // Case 2: External user adds themselves to joinRequests via link
          (
            isSignedIn() &&
            request.resource.data.get('joinRequests', []).hasAll([request.auth.uid]) &&
            // CRITICAL: Ensure they do NOT touch any other fields in the document!
            request.resource.data.userId == resource.data.userId &&
            request.resource.data.generalResponses == resource.data.generalResponses &&
            request.resource.data.parts == resource.data.parts &&
            request.resource.data.status == resource.data.status
          )
        )
      );
    }
    ```
*   **Drawback:** Comparing large nested maps/arrays (like `parts` and `generalResponses`) in Firestore Rules is highly fragile, expensive in rules evaluation cost, and prone to "Missing or insufficient permissions" errors if the client SDK sends minor format updates.

---

### Option B (Recommended): Separate `/joinRequests` Collection
Instead of writing to the locked project document, users requesting access create a small request document in a separate `/joinRequests` collection (e.g., ID: `projectId_userId`).

*   **Complexity:** **Very Low.**
*   **Workflow:**
    1. A guest clicks the link and creates a request document in `/joinRequests` with `status: 'pending'`.
    2. The owner receives a notification (since they can read pending requests for their `projectId`).
    3. The owner approves it. The client SDK adds the guest's UID to `sharedViewers` on the project document (valid because the **owner** is writing) and deletes the request.
*   **Rule Draft:**
    ```javascript
    // Rules for main project (Simple & Secure)
    match /projects/{projectId} {
      allow read: if isScape() || (
        resource != null && (
          resource.data.userId == request.auth.uid ||
          request.auth.uid in resource.data.get('sharedViewers', [])
        )
      );
      // Only the owner can write
      allow update: if isScape() || (resource != null && resource.data.userId == request.auth.uid);
    }

    // Rules for requests (Simple & Clean)
    match /joinRequests/{requestId} {
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow read, delete: if isSignedIn() && (
        resource.data.userId == request.auth.uid || 
        // Or if the logged-in user is the owner of the target project
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid
      );
    }
    ```
*   **Pros:** 
    *   No complex diff/map validations needed on the project document.
    *   Clean separation of concerns.
    *   Extremely secure.

---

## 2. Automated Testing Strategy for Security Rules

To ensure rules behave correctly without manual clicking, we can write automated unit tests using the Firebase Emulator Suite.

### Prerequisites
1.  **Firebase Local Emulator Suite:** Must run the Firestore Emulator locally during testing.
2.  **Testing Library:** Install `@firebase/rules-unit-testing` and `jest` / `vitest`.

### Test Setup Template (`tests/firestore.rules.test.ts`)
Below is an example of an automated test script that validates the sharing rules:

```typescript
import { 
  initializeTestEnvironment, 
  assertSucceeds, 
  assertFails, 
  RulesTestEnvironment 
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'scape-data-capture-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080
    }
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Project Sharing Security Rules', () => {
  
  it('should allow Owner to read and update their project', async () => {
    const ownerDb = testEnv.authenticatedContext('user_owner').firestore();
    const projectRef = doc(ownerDb, 'projects/project_1');
    
    // Create project
    await assertSucceeds(setDoc(projectRef, {
      userId: 'user_owner',
      status: 'draft',
      sharedViewers: []
    }));
    
    // Update project
    await assertSucceeds(updateDoc(projectRef, {
      status: 'submitted'
    }));
  });

  it('should deny unauthorized guest from reading the project', async () => {
    // Setup project in DB as admin/system
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'projects/project_1'), {
        userId: 'user_owner',
        status: 'draft',
        sharedViewers: []
      });
    });

    const guestDb = testEnv.authenticatedContext('user_guest').firestore();
    const projectRef = doc(guestDb, 'projects/project_1');
    
    // Guest attempt to read should fail
    await assertFails(getDoc(projectRef));
  });

  it('should allow shared viewers to read but NOT update the project', async () => {
    // Setup shared project in DB
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'projects/project_1'), {
        userId: 'user_owner',
        status: 'draft',
        sharedViewers: ['user_viewer']
      });
    });

    const viewerDb = testEnv.authenticatedContext('user_viewer').firestore();
    const projectRef = doc(viewerDb, 'projects/project_1');
    
    // Viewer should succeed reading
    await assertSucceeds(getDoc(projectRef));
    
    // Viewer attempt to edit should fail
    await assertFails(updateDoc(projectRef, {
      status: 'submitted'
    }));
  });

  it('should enforce lobby approval flow in joinRequests collection', async () => {
    const guestDb = testEnv.authenticatedContext('user_guest').firestore();
    const requestRef = doc(guestDb, 'joinRequests/project_1_user_guest');

    // Guest should succeed creating a join request
    await assertSucceeds(setDoc(requestRef, {
      projectId: 'project_1',
      userId: 'user_guest',
      status: 'pending'
    }));

    // Random other guest should fail to read or delete it
    const otherDb = testEnv.authenticatedContext('user_other').firestore();
    await assertFails(getDoc(doc(otherDb, 'joinRequests/project_1_user_guest')));
  });
});
```

### Benefits of Automated Rules Tests
*   **Prevents Regression:** Ensures future changes to rules (e.g. lock overrides) do not accidentally open backdoors or lock out valid viewers.
*   **Fast Verification:** Validates rule behavior in milliseconds without manual login/logout testing in the browser.
*   **Emulator Isolation:** Runs entirely offline without touching your production Firebase database.
