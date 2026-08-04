# SCAPE Bin-Picking Evaluator - App Teaser & Testing Guide

**Live Web App & PWA Link:** <https://scape-bin-picker-projects.web.app/>

Welcome to the **SCAPE Bin-Picking Evaluator**, a premium, smart tool designed to streamline technical feasibility checks and hardware selection (vision systems & grippers) for bin-picking projects.

Powered by the advanced **Gemini 2.5 Flash** model, the app uses state-of-the-art multimodal AI to automatically translate free-text descriptions and cell photos into structured project specifications.

---

## Strategic Vision & Purpose of this Version

To scale SCAPE's sales by **10x**, we need to evaluate **100x more projects** to identify the best, most feasible applications. Because human technical resources (SCAPE evaluators) are limited, this assessment process must be automated. 

This first version serves two primary purposes:
1. **Help to Integrators & End-Users:** The app guides users through the complex "Bin-Picking Project Information" process. It embeds SCAPE's specialized knowledge about bin-picking conditions to actively **nudge the user** toward optimal specifications (e.g., distinguishing between absolute vs. average cycle times, checking for entanglement, surface shininess, and handling multiple part variants individually by adding new parts).
2. **Help to SCAPE Evaluators:** Ensure SCAPE receives complete, high-quality project data from day one, and generates an automated **AI Technical Evaluation Draft** that evaluators can use as a starting point to write their final review.

### Image & Visual Consistency
* **Current Version:** Uses uploaded cell and part images to run consistency checks, verifying that the text description matches the visual evidence. *Note: Due to file size limits, users are encouraged to upload screenshots of their CAD models rather than full heavy CAD files.*
* **Future Upgrade Roadmap:** Future versions will include trained models on "good" vs. "bad" bin-picking parts/geometries to give even richer visual feedback to both the integrator and SCAPE evaluator.

**The Ultimate Outcome:** Better, cleaner specifications and lightning-fast response times, enabling SCAPE to capture more customers without bottlenecking human evaluators.

---

## Key Highlights

### 1. Multimodal AI Auto-fill Assistant (Gemini 2.5 Flash)
* **Talk to your Project:** Describe your workspace, robot installation, or parts in plain text or voice.
* **Auto-Extraction:** The AI extracts complex parameters in real-time, auto-fills questionnaire fields, and suggests updates.
* **Smart Filtering & UX:** Displays only the modified fields in a clean accept-card with automatic text-wrapping (no clipped inputs).

### 2. Auto-Feasibility & Warning Badges
* When you request **Project Information Advice**, the system scans your draft data and highlights empty or concerning fields with colored warning markers (`🔴` eller `⚠️`) directly next to form labels.
* Tooltips explain what is missing or suboptimal (e.g. cycle time ambitions or light interference risks).

### 3. Iterative Feedback Workflow
* **Submit & Review:** Users submit their completed projects to Scape. Evaluators review them on their Dashboard and generate an AI Evaluator Draft.
* **Direct Unsubmit (Before Evaluation):** The user can cancel their submission and unsubmit the project immediately to make changes, as long as an evaluator has not locked the case yet.
* **Request Unlock / Edit Permission (During/After Evaluation):** If the project has been locked or already evaluated (Approved/Rejected), the user can click **"Request Edit Permission"**, specify a brief reason, and send it to Scape. Evaluators can review the request from their details screen to approve (reverts project to Draft and unlocks it) or reject it.

### 4. Seamless PWA & Mobile layout
* Fully optimized as a **Progressive Web App (PWA)** on mobile devices.
* Uses the **Visual Viewport API** to dynamically resize layouts above virtual keyboards, providing a clean chat interface with auto-scrolling questions.

---

## Screenshots

### 1. App Launch & Splash Screen
Branded entry point showing system readiness.
![App Splash Screen](/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/app_home_1781075494417.png)

### 2. Customer Project Workspace & Questionnaire (Cell Info Step)
Modular step-by-step questionnaire form with active fields, help notes, and file upload fields.
![Customer Project Workspace - Cell Info](/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/workspace_screenshot-1.png)

### 3. Questionnaire Active Warning Flags & Nudges (Part Dimensions Step)
Colored warnings (`🔴 CRITICAL`, `⚠️ NOTE`) next to fields that do not fit specs or are missing data.
![Customer Project Workspace - Warnings](/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/workspace_screenshot-2.png)

### 4. Interactive Multimodal AI Assistant Sidebar
Real-time chat where users can describe their cell. The AI parses the parameters, extracts structured facts, and applies them to the form.
![Customer Project Workspace - AI Assistant Sidebar](/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/workspace_screenshot-3.png)

### 5. Automated Data Capture Advice & Project Summary
AI feedback summarizing feasibility risks, checklist points, and details before submitting the project.
![Customer Project Workspace - Data Capture Advice](/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/workspace_screenshot-4.png)

### 6. Evaluator Administrative Dashboard
Shows the case overview page where SCAPE evaluators can take cases, manage locks, review AI evaluator drafts, and submit verdicts.
![Evaluator Dashboard](/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/dashboard_evaluator_1780995012188.png)

---

## Easiest Way to Test It

To ensure a successful demo, here is how to log in and what to expect based on roles. **Important Note:** Always use "User Mode" to input and document a project. "Evaluator Mode" is strictly for reviewing submitted projects.

### Option A: Pre-Registered Demo Account
Use our pre-configured demo credentials which work instantly:

* **Email:** `demo@scapesolutions.eu`
* **Password:** `ScapeEvaluator2026`
* **What to Expect:** This account has been whitelisted as an **Evaluator**. You can toggle between **User Mode** (to create projects) and **Evaluator Mode** (to review submitted projects). 

### Option B: Direct Google Sign-In for SCAPE Evaluators
If you log in via Google, our system dynamically maps your identity. Even if you use an email alias (like `rde@scapesolutions.eu`), Google safely resolves it to your primary email, ensuring you get the correct access instantly. 

The following team accounts are pre-qualified as **Evaluators**:
* **René Dencker Eriksen:** `rene.dencker.eriksen@scapesolutions.eu`
* **John Erland Østergaard:** `john.erland.oestergaard@scapesolutions.eu`
* **Per Juul Nielsen:** `per.juul.nielsen@scapesolutions.eu`
* **Rune Klausen Larsen:** `rune.k.larsen@scapesolutions.eu`

* **How to log in:** Click the **"Sign in with Google"** button and log in using your Google Workspace account. You will be authenticated immediately with full Evaluator rights.

### Option C: Registering a New Account (Customer Isolation View)
* **Works on:** Sign up with email/password or Google Sign-In.
* **What to Expect (Customer View):** Any new account not on the whitelist will log in as a **Customer / End User** by default. To show off multi-tenant security, this user will have a clean, blank dashboard and **cannot** see anyone else's projects or access admin tools.
