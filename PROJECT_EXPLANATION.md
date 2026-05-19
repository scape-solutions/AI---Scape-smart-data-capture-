# Scape Bin-Picking Evaluator - Project Explanation

## Overview
The **Scape Bin-Picking Evaluator** is a professional web application designed to facilitate the assessment of robotic bin-picking projects. It streamlines the communication between potential customers (End Users/Integrators) and Scape Applications Engineers by providing a structured way to submit and evaluate project requirements.

## Core Functionality
1. **User Role Management**: 
   - **External Partners (End Users/Integrators)**: Can create and manage their own bin-picking project evaluations.
   - **Scape App Engineers (Evaluators)**: Have administrative access to review all submissions, provide expert verdicts, and manage project statuses.

2. **Structured Project Submissions**:
   - The app uses a multi-step questionnaire to collect critical project data, including:
     - **General Information**: Project name, bin types (EU-Pallet, Plastic Box, etc.), bin dimensions, and preferred robot brands.
     - **Part Characteristics**: Part name, dimensions, weight, material, and desired cycle times.
     - **Physical Properties**: Assessment of reflectivity (shininess), lubrication (oil/soap), and risk of entanglement.
     - **Visual Evidence**: Ability to upload high-resolution images of the parts.

3. **AI-Powered Analysis**:
   - **AI Advisor**: Provides real-time engineering tips during the data entry process using Google Gemini.
   - **Automated Feasibility Reports**: Generates a data-driven feasibility verdict based on Scape's systems (e.g., Scape Mini or Scape Pro), providing a technical score, risk analysis, and recommended next steps.

4. **Project Lifecycle Management**:
   - Projects can be saved as drafts, submitted for review (locking the data), and tracked through various statuses (Draft, Submitted, Approved, Rejected).
   - **Changelog**: Tracks all actions taken on a project for transparency.

## Technical Architecture
- **Frontend**: Built with **React** and **TypeScript**, using **Vite** as the build tool.
- **Styling**: Uses **Tailwind CSS** for a modern, responsive design and **Framer Motion** for smooth UI transitions.
- **Backend-as-a-Service**: Powered by **Firebase**:
  - **Firestore**: Real-time NoSQL database for projects and user profiles.
  - **Firebase Auth**: Secure user authentication (Google and Email/Password).
- **AI Engine**: Integrated with **Google Gemini API** (`@google/genai`) to process technical data and generate insights.
- **Icons**: **Lucide React** for consistent iconography.

## Project Lifecycle & Status Flags
The application uses several flags and statuses to manage the workflow between External Partners and Scape Evaluators.

### Primary Statuses (`status`)
- **Draft**: Initial state of a project. Only visible to the owner.
- **Submitted**: The user has completed the questionnaire and sent it for review. The project becomes **Locked**.
- **Approved / Rejected**: Final verdict set by a Scape App Engineer after evaluation.
- **Cancelled**: Project withdrawn by the owner.

### Control Flags
| Flag | Set By | Purpose |
| :--- | :--- | :--- |
| **Locked** (`isLocked`) | System / Evaluator | When `true`, the External Partner cannot edit project data. Automatically set on submission. Evaluators can unlock to request data changes. |
| **Specified** (`isFullySpecified`) | Evaluator | Indicates that the technical requirements are complete and high-quality. Acts as a "Technical Approval" of the data provided. |
| **Inactive** (`isInactive`) | Evaluator | Archives a project. Inactive projects are hidden by default in the dashboard to reduce clutter but can be toggled back on for reference. |
| **Taken** (`takenBy`) | Evaluator | Assigns a Scape App Engineer to the case. This prevents multiple engineers from working on the same project simultaneously. |
| **Verdict Visible** (`isVerdictVisible`) | Evaluator | Controls when the External Partner can see the feasibility report. Allows engineers to polish the AI-generated report before publication. |

## Key Files
- `src/App.tsx`: Main application logic, including state management, auth, and views.
- `src/questionnaire.ts`: Defines the structure and questions for the evaluation process.
- `src/lib/firebase.ts`: Firebase configuration and initialization.
- `firebase-blueprint.json`: Configuration for the Firebase project structure.
