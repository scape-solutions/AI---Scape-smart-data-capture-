# SCAPE Bin-Picking Evaluator - App Teaser & Testing Guide

Welcome to the **SCAPE Bin-Picking Evaluator**, a premium, smart data capture tool designed to streamline technical feasibility checks and hardware selection (vision systems & grippers) for bin-picking projects.

Powered by the advanced **Gemini 2.5 Flash** model, the app uses state-of-the-art multimodal AI to automatically translate free-text descriptions and cell photos into structured project specifications.

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

### Evaluator Administrative Dashboard
Shows the case overview page where evaluators can take cases, toggle locks, and submit verdicts.
![Evaluator Dashboard](/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/dashboard_evaluator_1780995012188.png)

### Project Creation & Form View
Provides a clean, modular questionnaire workspace with foldable navigation sidebar folders.
![Project Workspace](/Users/runeklausenlarsen/.gemini/antigravity-ide/brain/a80de74c-987b-42d0-bbfe-dcf5a9ff9af8/app_home_1781075494417.png)

---

## Easiest Way to Test It

To ensure a 100% successful login and evaluation demo during your meeting tomorrow, here are the testing options:

### Option A: Pre-Registered Demo Account (Bulletproof & Quickest)
Use our pre-configured demo credentials which bypass the need to verify email domains or type Google details. This works instantly on **all mobile web, desktop, and standalone PWA apps**:

* **Email:** `demo@scapesolutions.eu`
* **Password:** `ScapeEvaluator2026`
* *(Role: Scape Evaluator/Admin view)*

### Option B: Google Sign-In (Official Domain Flow)
* **Works on:** Any standard browser (Safari/Chrome/Edge) or standalone PWA on iOS/Android.
* **Requirements:** Sign in using any Google account belonging to the registered Scape domains (e.g. `@scapesolutions.eu` or `@scapesolutions.com`).
* *(To whitelist specific client emails, you can add them to `config/access` allowedEmails in Firestore).*
