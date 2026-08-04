# Decisions Document

## Summary of Decisions Made

1. **Terminology Update**
   - All occurrences have been renamed to **"Project Information Advice"** across code, UI, PDF generation, and documentation.
2. **Route Slug**
   - Confirmed the route slug `/scape-bin-picker-projects` is correct and remains unchanged.
3. **UI Label**
   - UI label for the advice component is exactly **"Project Information Advice"**.
4. **External Marketing Assets**
   - Only the **Teaser** documentation required updates; other marketing assets remain unchanged.
5. **Alias**
   - No additional route alias is needed.
6. **Implementation Plan Approval**
   - The implementation plan was reviewed and approved by the user before proceeding with changes.

7. **Simplified Locking and Request Unlock Mechanism (July 2026)**
   - Added a "Request Edit Permission" button for customers viewing locked projects (`isLocked === true` or status is `submitted`, `approved`, or `rejected`).
   - Reverted the strict database lock check using `diff().affectedKeys()` in `firestore.rules`. Instead, allowed owners to write to their documents, but enforced read-only state strictly in the client-side UI (`isReadOnly` logic) to bypass complex diff evaluation issues on named databases.
   - Configured `firebase.json` for named database multi-db rules mapping so deployments apply to `"ai-studio-scapebinpickinge-034f7a46-4395-4b38-89aa-1055263d83ac"`.
   - The evaluator can approve or reject the request under the "Review / Submit" view. If approved, the project is reverted to `draft`, unlocked, and the request is reset.

8. **AI Advice Request UX Change**
   - Disabled automatic generation of AI-advice. Instead, created a "Get Advice Data" button that the customer must click to fetch/generate advice manually.

9. **Part Indexing 1-based Naming**
   - Reconfigured AI prompt and components so that `parts[0]` is named "Part 1" (rather than "Part 0") to align with customer-facing expectations.

10. **Admin AI Onboarding View Override**
    - Forced `isSplitScreenMode` to `false` for evaluators/admins (`profile?.isAdmin === true`) so they do not default to split-screen onboarding mode when inspecting projects created via AI.

All changes have been applied to the codebase, Firebase configuration, and relevant markdown files.
