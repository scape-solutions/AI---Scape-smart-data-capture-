# SCAPE Bin-Picking Evaluator - App Teaser & Testing Guide

Welcome to the **SCAPE Bin-Picking Evaluator**, a premium, smart data capture tool designed to streamline technical feasibility checks and hardware selection (vision systems & grippers) for bin-picking projects.

Powered by the advanced **Gemini 2.5 Flash** model, the app uses state-of-the-art multimodal AI to automatically translate free-text descriptions and cell photos into structured project specifications.

---

## Strategic Vision & Purpose of this Version

To scale SCAPE's sales by **10x**, we need to evaluate **100x more projects** to identify the best, most feasible applications. Because human technical resources (SCAPE evaluators) are limited, this assessment process must be automated. 

This first version serves two primary purposes:
1. **Help to Integrators & End-Users:** The app guides users through the complex data capture process. It embeds SCAPE's specialized knowledge about bin-picking conditions (Yes/No/? answers) to actively **nudge the user** toward optimal "Yes" specifications (e.g. clarifying cycle times, check for entanglement, surface shininess, and CAD availability).
2. **Help to SCAPE Evaluators:** Ensure SCAPE receives complete, high-quality project data from day one, and generates an automated **AI Technical Evaluation Draft** that evaluators can use as a starting point to write their final review.

### Image & Visual Consistency
* **Current Version:** Uses uploaded cell and part images to run consistency checks, verifying that the text description matches the visual evidence.
* **Future Upgrade Roadmap:** Future versions will include trained models on "good" vs. "bad" bin-picking parts/geometries to give even richer visual feedback to both the integrator and SCAPE evaluator.

**The Ultimate Outcome:** Better, cleaner specifications and lightning-fast response times, enabling SCAPE to capture more customers without bottlenecking human evaluators.

---

## Key Highlights

### 1. Multimodal AI Auto-fill Assistant (Gemini 2.5 Flash)
* **Talk to your Project:** Describe your workspace, robot installation, or parts in plain text or voice.
* **Auto-Extraction:** The AI extracts complex parameters in real-time, auto-fills questionnaire fields, and suggests updates.
* **Smart Filtering & UX:** Displays only the modified fields in a clean accept-card with automatic text-wrapping (no clipped inputs).

### 2. Auto-Feasibility & Warning Badges
* When you request **AI Advice**, the system scans your draft data and highlights empty or concerning fields with colored warning markers (`🔴` or `⚠️`) directly next to form labels.
* Tooltips explain what is missing or suboptimal (e.g. cycle time ambitions or light interference risks).

### 3. Business Case & Additional Opportunities
* **ROI Mockup:** Enter shift counts and labor savings to instantly calculate project payback periods.
* **Cell Automation Scans:** A text logger and photo upload field to document other manual processes in the environment that are candidates for automation.

### 4. Seamless PWA & Mobile layout
* Fully optimized as a **Progressive Web App (PWA)** on mobile devices.
* Uses the **Visual Viewport API** to dynamically resize layouts above virtual keyboards, providing a clean chat interface with auto-scrolling questions.

---

## Screenshots

### 1. App Launch & Splash Screen
Branded entry point showing system readiness.
![App Splash Screen](/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/app_home_1781075494417.png)

### 2. Customer Project Workspace & Questionnaire
Modular step-by-step questionnaire form with active fields, help notes, and file upload fields.
![Customer Project Workspace](/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/local_app_home_real_1781085814796.png)

### 3. Evaluator Administrative Dashboard
Shows the case overview page where SCAPE evaluators can take cases, manage locks, review AI evaluator drafts, and submit verdicts.
![Evaluator Dashboard](/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/dashboard_evaluator_1780995012188.png)

---

## Easiest Way to Test It

To ensure a successful demo during your meeting tomorrow, here is how to log in and what to expect based on roles:

### Option A: Pre-Registered Demo Account (Highly Recommended)
Use our pre-configured demo credentials which work instantly on **all mobile web, desktop, and standalone PWA apps**:

* **Email:** `demo@scapesolutions.eu`
* **Password:** `ScapeEvaluator2026`
* **What to Expect (Admin View):** This account has been whitelisted as a **SCAPE Evaluator/Admin**. Logging in with this account lets you toggle between **User Mode** (Customer View) and **Evaluator Mode** (Admin View) in the top header. You will be able to see and manage all customer projects, write verdicts, and test the Prompts Editor.

### Option B: Registering a New Account (Customer Isolation View)
* **Works on:** Sign up with email/password or Google Sign-In.
* **Requirements:** The email domain must end in a whitelisted domain (e.g. `@scapesolutions.eu` or `@scapesolutions.com`) or be added manually to the whitelisted emails list in Firestore.
* **What to Expect (Customer View):** Any new account will log in as a **Customer / End User** by default. To show off multi-tenant security, this user will have a clean, blank dashboard and **cannot** see anyone else's projects or access admin tools.
