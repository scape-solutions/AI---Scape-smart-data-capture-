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

---

## 2. AI Assistant Access Forbidden for External/New Customers (Status: IDENTIFIED)

### Error Message
```
AI error: Forbidden: You do not have access to this application.
```

### Root Cause
1. **Global Access Verification:** The server protects all AI-related endpoints in [server.js](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/server.js) (`/api/ai/chat`, `/api/ai/extract-observations`, `/api/ai/advice`, and `/api/ai/draft`) with the same token verification middleware `verifyFirebaseToken`.
2. **Strict Domain/Email Filter:** The `verifyFirebaseToken` middleware restricts access strictly to emails matching allowed domains (`@scapesolutions.eu` or `@scapesolutions.com`) or explicit whitelisted emails in the Firestore `/config/access` document.
3. **Design Conflict:** While new external users (e.g., `user@gmail.com`) are allowed to register/sign up and create projects, they are completely blocked from using the AI Chat Assistant or extraction tools to help them populate their questionnaire.

### Recommended Fix

#### Step 1: Split Middleware Logic in [server.js](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/server.js)
Split `verifyFirebaseToken` into a general authentication middleware and a specialized evaluator/admin authorization middleware:

1. **`verifyFirebaseToken` (General Auth):** Only verifies the Firebase token signature and validity, populating `req.user`. This allows any successfully registered customer to use basic client-side helper APIs.
2. **`verifyEvaluatorToken` (Evaluator-only Auth):** Calls `verifyFirebaseToken` first, then enforces the email domain and whitelist filter.

```javascript
// Middleware to verify Firebase ID Token (Open to all signed-in users)
async function verifyFirebaseToken(req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    req.user = { email: 'dev@scapesolutions.eu', uid: 'dev-local' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Middleware to verify Evaluator/Admin access (Restricted to internal staff/whitelists)
async function verifyEvaluatorToken(req, res, next) {
  // First run the general token validation
  await verifyFirebaseToken(req, res, () => {
    const email = req.user.email;
    if (!email) {
      return res.status(403).json({ error: 'Forbidden: Token contains no email address.' });
    }

    const emailLower = email.toLowerCase();
    const domain = emailLower.split('@')[1];

    const isAllowedEmail = allowedConfig.allowedEmails.some(e => e.toLowerCase() === emailLower);
    const isAllowedDomain = allowedConfig.allowedDomains.some(d => d.toLowerCase() === domain);

    if (!isAllowedEmail && !isAllowedDomain) {
      console.warn(`Unauthorized access attempt from email: ${email}`);
      return res.status(403).json({ error: 'Forbidden: You do not have access to this resource.' });
    }
    next();
  });
}
```

#### Step 2: Update Endpoints Guard
Apply the general and restricted middleware blocks to the appropriate route handlers:

* **Customer Helper APIs (General Auth):**
  * `app.post('/api/ai/chat', verifyFirebaseToken, ...)`
  * `app.post('/api/ai/extract-observations', verifyFirebaseToken, ...)`
  * `app.post('/api/ai/advice', verifyFirebaseToken, ...)`
* **Internal Evaluator APIs (Restricted Auth):**
  * `app.post('/api/ai/draft', verifyEvaluatorToken, ...)`

---

## 3. AI Assistant State Sync Conflict (Status: IDENTIFIED)

### Error Message / Behavior
* When a user inputs data using the AI Chat Assistant (e.g., setting the project name to *"Project Kolding"*), the chat history records the conversation.
* If the user later edits the questionnaire form manually (e.g., renaming the project field to *"Project Kolding V2"*), the form updates correctly.
* However, when the user resumes chatting with the AI, the AI looks at the chat history, notices the discrepancy between the text history (*"Project Kolding"*) and the active form state (*"Project Kolding V2"*), and mistakenly tries to force-revert the form field back to the original name (*"Project Kolding"*).

### Root Cause
1. **Chat History Recency Bias:** The prompt instructs the AI to use the conversation history as context. When it sees a contradiction between user statements in the chat history and the current JSON state, it assumes the JSON state is out-of-sync or incorrect, rather than recognizing that the user made a deliberate manual edit in the UI.
2. **Lack of Manual Override Indicators:** The AI prompt has no instruction explaining that the `CURRENT PROJECT STATE` represents the ultimate source of truth, and that manual edits made by the user in the UI override historical chat mentions.

### Recommended Fix

#### Step 1: Update [src/docs/autoFillPrompt.md](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/src/docs/autoFillPrompt.md)
Add a rule under the **IMPORTANT RULES** section in the prompt:
* *"The `CURRENT PROJECT STATE` represents the user's latest manual choices. If a field in the current project state differs from what was previously discussed in the chat history, you MUST treat the current project state as the absolute source of truth. Do NOT try to overwrite manual changes back to historical values. Only update a field if the user explicitly requests a new change in their latest message."*

#### Step 2: Clear/Invalidate Discrepant History (Alternative approach)
When a user manually modifies a field in the form:
* We could append a system notification to the chat history: `{"role": "system", "text": "System: User manually updated Project Name to 'Project Kolding V2'"}`.
* This explicitly tells the AI that a manual edit occurred, aligning the history context.
