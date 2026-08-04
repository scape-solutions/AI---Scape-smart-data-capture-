# Scape Software Engineering Roadmap (1-2 Years)

This roadmap outlines the technical infrastructure, developer workflows, and agentic integrations required to transform Scape's current application base into a scalable, multi-developer software department (2–3 engineers) maintaining production systems alongside active development.

---

## 1. Multi-Environment Architecture

To ensure production stability, developers must never have direct write access or local connectivity to the production database and backend.

### Project Separation (Dev, Staging, Prod)
* **Development (`-dev`):** A separate GCP/Firebase project where developers test experimental schemas, security rules, and code. Dev features connect to local Firebase Emulators or the dev cloud project.
* **Production (`-prod`):** The locked production project (`scape-bin-picker-projects`). Only automated deployment keys or the root Super User (Rune) have write access.
* **External Access Management:**
  * External developers (such as interns) do not need Google Workspace accounts (`@scapesolutions.eu`).
  * Add their personal Google accounts (`@gmail.com`) to the **Firebase Console** (*Users and permissions*) and **GCP IAM & Admin** as **Editor** or **Developer** under the dev project only.

---

## 2. Git Workflow & Branching Strategy

A structured code review process is essential to onboard new team members and maintain code quality.

* **Feature Branching:** Developers must work in isolated branches:
  * Format: `feature/name-of-feature` or `bugfix/issue-description`.
* **Pull Requests (PR):** Direct pushes to `main` are disabled. Developers submit a PR to merge code.
* **Code Reviews:** Every PR must be reviewed and approved by another developer before merging. This facilitates knowledge sharing and keeps the code standard consistent.

---

## 3. Automated CI/CD Pipelines

Remove manual shell scripts (`deploy.sh` and `firebase deploy`) to eliminate deployment errors.

### GitHub Actions Workflow
* **On Commit/PR:** Trigger automated linting (`npm run lint`), TypeScript checks (`tsc`), and unit tests to validate the build.
* **On Merge to `main`:** Automatically compile, package into a Docker container, push to GCP Artifact Registry, and deploy to the Cloud Run dev service.
* **On Release/Tag:** Deploy to the production Cloud Run service and Firebase Hosting.

---

## 4. Agentic AI & Google Antigravity SDK Integration

To accelerate development and build smarter systems, Scape utilizes agentic workflows.

### Google Antigravity SDK
* **Autonomous Agents:** Use the Google Antigravity (AGY) SDK to build multi-agent architectures (e.g., specialists for parsing PDF reports, analyzing gripper suction telemetry, or generating triage recommendations).
* **Standardized Prompting:** Keep agent system prompts and extraction schemas central in files (like `src/docs/*Prompt.md`) to allow versioning and easy refinement.
* **Developer AI Multiplier:** Equip new developers (especially juniors and interns) with IDE agents (like Cursor, Cline, or Gemini Advanced) trained on the repository structure. Keep repository documentation like [KODEBASE_OVERSIGT.md](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/docs/KODEBASE_OVERSIGT.md) and [TODO.md](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/docs/TODO.md) updated so AI tools remain accurate.

---

## 5. Production Observability

Monitor costs, errors, and agent behavior in real-time.

* **LLM Call Tracking:** Integrate tracking tools (such as **Langfuse** or Google Cloud Vertex AI Trace) to monitor Gemini API latency, token consumption (including thinking tokens), and costs.
* **Error Reporting:** Implement frontend and backend error boundaries linked to a reporting platform (like **Sentry** or **GCP Error Reporting**) to capture uncaught exceptions and alert the development team before users notice issues.
