# AI Bin-Picker Service & Triage Companion (Holiday Assignment)

Welcome to Scape! To help you prepare for your internship starting in August, you are tasked with building and deploying a standalone practice application. 

### The Core Objective: Agentic "Vibe Coding" with Google Antigravity
The primary goal of this assignment is **not** to test your manual coding speed, but to train you in **Agentic Coding / Vibe Coding** using the **Google Antigravity (AGY) SDK**. 
In modern software development at Scape, we build applications by orchestrating and collaborating with autonomous AI agents. You will set up and use the **Google Antigravity SDK** as your exclusive coding agent assistant to build 90%+ of this application, learning how to specify requirements, prompt agents, and manage automated code generation.

---

## 1. Project Specification

You will build a mobile-friendly web application called **"AI Bin-Picker Service & Triage Companion"**. 
The app guides field service engineers (who may be junior or inexperienced) through inspecting, troubleshooting, and reporting on running Scape Bin-Picker robot cells.

### Core Features to Implement:
1. **Standardized Inspection Forms:** A step-by-step checklist to guide the supporter through physical inspection (gripper, camera, lighting) and interviews.
2. **AI-Guided Triage chatbot:** Powered by the **Google Antigravity SDK** on the backend. The supporter inputs symptoms, and the AI agent diagnoses and gives troubleshooting instructions.
3. **Service Report Logging:** Log hours spent, spare parts used, actions taken, and calculate costs.
4. **Site Opportunities Log:** Document sales and upgrade opportunities observed on-site.

---

## 2. Technical Stack

* **Frontend:** React + TypeScript (Vite).
* **Database & Auth:** Cloud Firestore and Firebase Authentication.
* **Backend (API Proxy):** Node.js + Express (running in a Docker container on Google Cloud Run).
* **AI Agent Developer & Core Engine:** **Google Antigravity SDK**.
* **Testing:** Automated unit tests (Vitest/Jest) for cost logic and simulated agent triage paths.

---

## 3. Four-Week Agentic Onboarding Plan

Every task below should be built by **prompting and collaborating with your Google Antigravity agent**. Your role is to write clean specifications, review the agent's changes, run the code, and feed errors back to the agent for debugging.

### Week 1: Google Antigravity SDK Setup & Frontend Vibe Coding
* **Goal:** Set up the Google Antigravity SDK and use it as your developer assistant to scaffold the UI without manual coding.
* **Tasks:**
  * Sign up for the **Antigravity AI Pro monthly subscription** (approximately €25/month) to gain access to the Pro model tier. This subscription model avoids pay-as-you-go token-billing surprises and is ideal for developer testing. *(Note: You can purchase this subscription privately for the month of July, and Scape will reimburse your expense and take over the billing from August onwards when you officially start).*
  * Obtain your API key from your **Antigravity AI Pro** dashboard.
  * Install the **Google Antigravity SDK** and configure your API key.
  * Initialize the Google Antigravity developer agent in your local environment.
  * Prompt the Antigravity developer agent to:
    - Scaffold a new React + TypeScript + Vite project.
    - Set up the folder structures.
    - Generate the UI layout and step-by-step inspection forms using modern CSS.
  * *Learning focus:* Getting familiar with the Antigravity agent lifecycle, prompting it for code generation, and reviewing its output.

### Week 2: AI-Driven Database & Local Emulator Setup
* **Goal:** Set up local mock databases and backend routing using the Antigravity agent.
* **Tasks:**
  * Prompt the Antigravity agent to:
    - Guide you through installing the **Firebase CLI** and running `firebase init`.
    - Configure the `firebase.json` for Firestore, Auth, and Emulators.
    - Write a Node/Express backend (`server.js`) that connects to the local Firebase Emulators.
  * Run `firebase emulators:start` and ask the Antigravity agent to write the frontend code that registers users and saves reports locally.
  * *Learning focus:* Using the Antigravity agent to debug connectivity, CORS errors, and database read/write rules.

### Week 3: Integrating Google Antigravity SDK & Triage Testing
* **Goal:** Implement the AI triage chatbot on the backend and write automated tests.
* **Tasks:**
  * Prompt the Antigravity agent to:
    - Integrate the **Google Antigravity SDK** on your Express backend.
    - Configure the AI Triage agent with a specific system persona ("Senior Robot Support Analyst").
    - Write automated unit tests (Vitest) for parts cost calculations.
    - Write a simulation script to mock robot cell issues (symptoms) and verify the AI agent's troubleshooting JSON output.
  * *Learning focus:* Prompt engineering, structuring AI outputs (JSON schemas), and test-driven agent development.

### Week 4: Cloud Deployments & Multi-Environment Setup
* **Goal:** Deploy dev and prod versions of your app to the cloud using Antigravity agent configurations.
* **Tasks:**
  * Create two separate projects on your personal Google/Firebase account (e.g., `service-companion-dev` and `service-companion-prod`).
  * Prompt the Antigravity agent to:
    - Write a multi-stage `Dockerfile` to package your app.
    - Generate the exact `gcloud run deploy` commands to mount the **Antigravity AI Pro API key** secret (e.g., `ANTIGRAVITY_API_KEY`).
    - Configure Firebase Hosting to route `/api/**` traffic to Cloud Run.
  * Deploy both environments (dev and prod) and verify they run independently in the cloud.
  * *Learning focus:* Cloud architecture, devops, and secrets management using the Antigravity agent.
