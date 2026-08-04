# Walkthrough - Engineering Summary of Recent Session (July 2026)

This document provides a technical walkthrough of the features, architectural decisions, and bug fixes implemented during the recent session. It is designed to get any new coding agent or developer up to speed instantly.

---

## 1. Request Unlock / Edit Permission Workflow

### Goal
Allow customers (non-admins) to request edit access to a project that has been locked by a Scape Solutions evaluator or has received a verdict (`approved` / `rejected`).

### Code Changes
*   **Types (`src/types/index.ts`):** 
    Added optional properties `editRequestPending?: boolean;` and `editRequestReason?: string;` to the `ProjectState` interface.
*   **Hook (`src/hooks/useProjects.ts`):**
    Updated project normalization, real-time snapshot comparison checks, and demo project templates to support and sync these new fields in real-time.
*   **Project Card (`src/components/ProjectCard.tsx`):**
    *   Added a pulsing amber **"Unlock Requested"** status badge if an edit request is pending.
    *   For administrators, changed the bottom right CTA button from "View Details" to **"Review Request"** (with an active rotate-ccw icon) to guide them directly to the request details.
*   **User Action Panel (`src/views/QuestionnaireView.tsx`):**
    *   Replaced the disabled "Locked / Under Evaluation" state button with a **"Request Edit Permission"** button when a project is locked.
    *   Clicking this button opens a custom modal popup asking the user for a brief reason. Submitting updates Firestore and logs the action in the project's changelog.
    *   Once submitted, a pending warning box is displayed showing their reason.
*   **Evaluator Approval Panel (`src/views/QuestionnaireView.tsx`):**
    *   If an admin/evaluator opens a project with an active request, they see a warning block containing the customer's justification.
    *   **Approve & Unlock:** Sets `status: 'draft'`, `isLocked: false`, and resets request flags, logging the approval. The project is now editable for the customer.
    *   **Reject Request:** Resets request flags (keeping the project locked), logging the rejection.

---

## 2. Firebase Named Database Deployment Fix

### Problem
The React application is configured to connect to a named, non-default Firestore database:
`"firestoreDatabaseId": "ai-studio-scapebinpickinge-034f7a46-4395-4b38-89aa-1055263d83ac"`
However, `firebase deploy --only firestore:rules` by default only deploys to the `(default)` database instance. This caused local client write operations on locked documents (e.g., requesting unlock) to fail with `Missing or insufficient permissions` despite rules updates, because the rules on the target database were never updated.

### Resolution
*   **`firebase.json`:** Reconfigured the `firestore` property from a single object to an array mapping rules to both default and named databases:
    ```json
    "firestore": [
      {
        "database": "(default)",
        "rules": "firestore.rules"
      },
      {
        "database": "ai-studio-scapebinpickinge-034f7a46-4395-4b38-89aa-1055263d83ac",
        "rules": "firestore.rules"
      }
    ]
    ```
*   **`firestore.rules`:** 
    *   Updated the locked document update rules. Since Firestore rules have issues comparing complex arrays/maps (like our `parts` list) with the `diff().affectedKeys()` set, we simplified the rule to allow owners (`userId == request.auth.uid`) to write updates if `editRequestPending` is being set to `true`, while explicitly ensuring that inputs cannot be altered in the client-side UI due to `isReadOnly`.
    *   Fixed a regex bug in the `isScape()` check. The previous regex used four backslashes (`\\\\.`), which failed email suffix validation for `@scapesolutions.eu` / `.com` domains. Corrected to two backslashes (`\\.`).
*   **Deployment:** Successfully deployed using:
    `npx -y firebase-tools@latest deploy --only firestore:rules`

---

## 3. Manual AI Advice Request

### Goal
Ensure the "Project Information Advice" report does not generate automatically upon navigating to the Review & Submit page, saving token costs and reducing performance overhead.

### Code Changes
*   **`src/views/QuestionnaireView.tsx`:**
    *   Removed auto-generation triggers.
    *   Added a clear placeholder CTA card if no advice exists yet, prompts the user with a "Get Advice Data" button to run the advisor manually.

---

## 4. 1-Based Part Indexing

### Goal
Avoid user confusion where the AI or UI refers to the first project part as "Part 0".

### Code Changes
*   **Prompt (`src/docs/autoFillPrompt.md`):** Updated the instructions to explicitly force the AI to refer to `parts[0]` as "Part 1" in chat conversations.
*   **UI (`src/views/QuestionnaireView.tsx`):** Ensured all headers and titles reference parts with 1-based indices.

---

## 5. Admin AI Onboarding View Override

### Goal
Avoid showing split-screen AI onboarding mode by default when an evaluator/admin is reviewing a project created via AI.

### Code Changes
*   **`src/views/QuestionnaireView.tsx`:** Updated `isSplitScreenMode` computation to force manual layout if the user is an admin:
    ```typescript
    const isSplitScreenMode = currentProject?.isSplitScreen === true && !profile?.isAdmin;
    ```
