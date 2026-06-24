# Project To-Do List

This document tracks actionable tasks and fixes derived from recent testing feedback (Rene's email correspondence).

## High Priority Fixes & UI Updates

- [ ] **Rename Terminology:**
  - Rename the UI element "Data Capture Advice" to "Bin-Picking Information Advice".
  - Ensure references to "Data Capture" in user-facing text are updated to "Bin-Picking Project Information" where appropriate.

- [ ] **Cycle Time Clarification:**
  - Update the "Average Cycle Time Based On" field (2.05) or add a selector to allow the user to explicitly define if their requirement is an "Absolute maximum cycle time" or an "Average cycle time".

- [ ] **Placement Requirements (Image Upload):**
  - Add functionality to allow users to upload images for "Short description of place requirements" (field 2.12). It is often easier to provide a photo of the destination fixture/machine than to describe it in words.

- [ ] **CAD File Upload UX:**
  - **Drag and Drop:** Fix the drag-and-drop area for CAD files so that dropping a file (e.g., .stp) properly attaches it to the form. *(Husk JS-validering i onDrop)*
  - **File Size/Format Guidance:** Update the UI text around the 200 KB limit to clearly instruct users that if their CAD file is too large, they should instead upload screenshots/images of the CAD model from different angles.
  
- [ ] Image File Upload UX:
  - **Drag and Drop**: Fix the drag-and-drop area for image files so that dropping a file properly attaches it to the form instead of useing a file browser. *(Husk JS-validering i onDrop)*

- [ ] **Bin Dimensions "Best Guess":**
  - Add a "Best guess" or "Approximate" checkbox next to the bin dimension fields for cases where the customer does not have exact measurements.

- [ ] **Clean Up Hardcoded Whitelists:**
  - Remove the hardcoded fallback arrays (`ALLOWED_EVALUATORS` and `SUPERUSERS`) in `src/config/evaluators.ts`. Now that Firestore dynamic configuration is fully functional, these local fallbacks pose a minor privacy leak and are obsolete.

- [ ] **Delete Project Safeguard:**
  - Update the delete project confirmation modal to require the user to explicitly type the project name (or a specific confirmation phrase) before the delete action can succeed, to prevent accidental deletions.

- [ ] **Project History Spam & Roles:**
  - **Overactive Logging:** The `saveProject` function in `useProjects.ts` currently logs "Status updated to [status]" on *every* auto-save, resulting in massive spam. Change the logic so it only logs a status update if the status actually *changed* from its previous state.
  - **Include User Roles:** Update the `logChange` payload to include the user's role (`profile?.role`). Then update the UI (e.g., `HistoryModal.tsx`) to display the role alongside the name (e.g., "User: Demo 1 (Evaluator)").
  - **Log Actual Changes (Diffing):** Implement logic in `saveProject` to compare the new data against the existing project state and log *what* was actually changed (e.g., "Updated bin dimensions", "Added new part", "Uploaded image").

- [ ] **Image Lightbox / Enlarge:**
  - Implement a feature where clicking on any uploaded image (both general cell images and part images) opens it in a larger popup/lightbox overlay, allowing users and evaluators to inspect image details easily.
