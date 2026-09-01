# Scape Bin-Picker Projects — App Teaser & Testing Guide

**Live Web App & PWA Link:** <https://scape-bin-picker-projects.web.app/>  
*(Scan the on-screen QR code from any smartphone to test instantly on mobile)*

Welcome to **Scape Bin-Picker Projects**, a modern, AI-powered tool designed to streamline technical feasibility evaluations, part specifications, and hardware selection (vision systems & grippers) for robotic bin-picking cells.

Powered by **Gemini 2.5 Flash**, the platform translates plain-text cell descriptions, smartphone voice dictation, CAD files, and cell photos into structured, production-ready project specifications.

---

## Strategic Vision & Purpose

To scale SCAPE's sales by **10x**, we need to evaluate **100x more projects** to identify the best, most feasible automation opportunities. Because experienced bin-picking engineers are a limited resource, the initial data collection and technical pre-screening must be automated and frictionless.

This platform serves two core purposes:

1. **Guided Self-Service for Integrators & End-Users:**  
   The app guides users through the technical specifications process, embedding SCAPE’s specialized robotics knowledge directly into the UI. It actively **nudges the user** toward optimal parameters (e.g., distinguishing between average vs. maximum cycle times, checking for part entanglement, surface reflections, gripper clearance, and managing multiple part variants individually).

2. **Automated Technical Pre-Screening for SCAPE Evaluators:**  
   Ensures SCAPE receives complete, high-quality technical data from day one. It generates an automated **AI Technical Evaluation & Advice Draft** with camera recommendations and cycle-time calculations, allowing evaluators to deliver verified feasibility assessments in record time.

---

## Key Highlights & Latest Capabilities

### 1. Conversational AI Assistant (Text & Smartphone Dictation)
* **Natural Language Input:** Users can type or use their smartphone's native **speech-to-text dictation** directly in the chat box to describe their robot cell (e.g., *"We need to pick 2.5 kg forged steel brackets from a 1200x800x600 mm pallet bin using a Kuka KR10 robot at 5.5 sec cycle time"*).
* **Edit Before Sending:** Dictating directly into the text field allows users to review and adjust text before submitting, ensuring 100% accuracy.
* **Editable Yellow Proposal Cards:** The AI parses the parameters and presents an editable before/after card. Nothing is applied to the project until the user clicks **"Apply Changes"**.
* **Seamless AI Mode & Tab Navigation:** Switch easily between the AI Assistant chat and the questionnaire form.

### 2. Multi-Attachment Support (CAD & Cell Photos)
* **CAD File Uploads:** Supports direct drag-and-drop of `.step`, `.stp`, and `.stl` files (up to 200 KB) or multi-angle 3D screenshots for large models.
* **Placement & Cell Photos:** Dedicated upload areas for general cell layout and destination fixtures (field 2.12), ensuring vision and reach feasibility can be verified accurately.
* **Image Compression & Lightbox:** Automatically compresses mobile photos for rapid cloud sync and includes a 1-click lightbox zoom to inspect part details.

### 3. Automated "Project Information Advice" & Warning Badges
* **Pre-Submission AI Audit:** Click **`⚡ AI Advice`** to run an automated check on bin dimensions, part weight, cycle times, and potential glare/entanglement challenges.
* **Frozen Submission Snapshot:** When a user submits a project, the exact state of the advice and parameters is frozen into a permanent snapshot (`userSubmittedReport`), allowing SCAPE evaluators to see precisely what the customer submitted.
* **Smart Nudges & Guidance Popups:** Every field includes a circular info icon `(i)` with both **Short Summaries** and **Detailed Technical Guidance**, plus a global `Show Field IDs` toggle.

### 4. Interactive Onboarding & Video Guide (Built-in)
* **90-Second Walkthrough:** Click **"Guide & Video"** in the header or splash screen to access a full introduction video and a 3-step illustrated storyboard (*The Challenge, AI Capture, and Scape Verification*).
* **QR Code Quick Access:** A crisp ISO-compliant QR code is displayed on the front screen for 1-second mobile camera launch.

### 5. Dual-AI Support Architecture
* **Contextual Help AI:** A dedicated support assistant trained on the complete Scape bin-picking guide helps answer technical and app-related questions without polluting the evaluator prompt.

---

## Easiest Way to Test the Platform

### Option A: Pre-Registered Demo Account
Use our pre-configured demo credentials which work instantly:

* **Email:** `demo@scapesolutions.eu`
* **Password:** `ScapeEvaluator2026`
* **What to Expect:** This account has been whitelisted with **Evaluator** privileges. You can freely toggle between **User Mode** (to create and edit projects) and **Evaluator Mode** (to review submitted projects, generate Scape reviews, and approve/reject cases).

---

### Option B: Direct Google Sign-In (SCAPE Employees & Whitelist)
Log in via Google using your Google Workspace account. Our system dynamically maps your identity and grants Evaluator rights:

* **René Dencker Eriksen:** `rene.dencker.eriksen@scapesolutions.eu`
* **John Erland Østergaard:** `john.erland.oestergaard@scapesolutions.eu`
* **Per Juul Nielsen:** `per.juul.nielsen@scapesolutions.eu`
* **Rune Klausen Larsen:** `rune.k.larsen@scapesolutions.eu`

---

### Option C: Customer / New User View (Multi-Tenant Isolation)
* Sign up with any external email/password or personal Google account.
* **Customer Isolation:** The account will automatically default to **Customer / End-User mode**. It provides a clean, private workspace with full isolation from other users' projects and no access to internal administrative tools.

---

## Suggested 3-Minute Test Walkthrough

1. **Open the App:** Open <https://scape-bin-picker-projects.web.app/> (or scan the QR code).
2. **Check the Intro Guide:** Click **"Watch Intro & Instructions"** on the splash screen to view the 3-step visual storyboard.
3. **Create a Project:** Click **"+ New Project"** from the Dashboard.
4. **Talk to the AI:** Open the AI Assistant tab. Dictate or paste a cell description:
   > *"We have forged iron connecting rods weighing 1.2 kg in a 1200x800x500 mm steel bin. We need an average cycle time of 4.5 seconds using a Fanuc CRX robot."*
5. **Apply Proposed Changes:** Review the yellow proposal card and click **"Apply Changes"**.
6. **Get AI Advice:** Click **"AI Advice"** in the top navigation to view the automated feasibility analysis.
7. **Submit:** Click **"Submit Project"** to test the locked submission snapshot workflow.
