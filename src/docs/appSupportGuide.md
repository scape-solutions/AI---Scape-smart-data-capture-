<!--
DOCUMENT VERSION: appSupportGuide v1.0 | 2026-08-26 18:07
-->

# Scape Bin-Picker Projects - User & Support Guide

This guide provides authoritative documentation on using the Scape Bin-Picker Projects web application.

---

## 1. Application Navigation & Overview

- **Dashboard**: Click the **Dashboard** button next to the Scape logo in the top header bar at any time to view all your bin-picking projects, create a new project, or check project status.
- **Section Selector**: 
  - On desktop full screen, use the left-hand navigation menu to jump between questionnaire sections (*Project & Cell Info*, *Part Dimensions*, *Characteristics*, *Visual Evidence*, *Business Case*, *Additional Opportunities*, *Submit*, and *Scape Review*).
  - On mobile viewports or in **Split-Screen AI Mode**, use the indigo section pill button at the top (`⚙️ Project & Cell Info 7/9 ▾`) or scroll horizontally through the quick-swipe pill bar.
- **Show/Hide Field IDs**: Click the **Show Field IDs** toggle button at the top right of the questionnaire to display exact field numbers (e.g., `[1.01]`, `[2.04]`) next to every label.

---

## 2. Filling Out the Questionnaire & Field Guidance

- **Field Info Icons `(i)`**: Every field has a circular `(i)` info icon next to its label. 
  - Click `(i)` to open a short summary explaining the field.
  - Click **`Read Detailed Guidance →`** inside the popup to read comprehensive technical guidance on how the parameter affects vision selection, gripper tooling, robot reach, or cycle time calculations.
  - Click anywhere outside the popup to close it.
- **Cycle Time Fields (`2.04` and `2.05`)**:
  - `[2.04] Desired Average Cycle Time`: Enter the target cycle time in seconds.
  - `[2.05] Average Cycle Time Based On`: Select the calculation basis from the dropdown (*Average Cycle Time across full bin*, *Absolute Maximum Cycle Time*, *1 shift target*, or *1 bin container*).
- **Bin Dimensions (`1.04`)**:
  - Enter Width (`1.04_w`), Length (`1.04_l`), and Height (`1.04_h`) in mm.
  - Check the **Approximate / Best guess measurement** box if exact bin dimensions are not yet confirmed.

---

## 3. Uploading CAD Files & Images

- **CAD File Upload (`2.06`)**:
  - Allowed formats: **STL (`.stl`)**, **STEP (`.stp`, `.step`)**, and **IGES (`.igs`, `.iges`)**. DWG/DXF files are not accepted.
  - Maximum direct upload file size is **200 KB**.
  - *If your CAD file exceeds 200 KB*: Upload multiple clear screenshots/photos of the 3D model from different angles under the part image upload area (`images`).
- **Part & Cell Images**:
  - Drag and drop image files (`.jpg`, `.png`, `.webp`) directly onto the upload zones for General Cell Images (`1.06_images`) or Part Images (`images`).
  - Click any uploaded image to enlarge it in a full-screen **Lightbox Overlay**.
  - Image deletions require explicit confirmation to prevent accidental deletion.

---

## 4. AI Assistant & Auto-Fill Chat

- **Opening AI Mode**: Click the **`[🤖 AI]`** button in the top header bar to activate **Split-Screen AI Mode**, or click the floating AI button at the bottom right.
- **Resizing Panels**: Drag the vertical divider handle (with the blue `GripVertical` pill icon) left or right to adjust the width of the AI Assistant pane.
- **Applying AI Proposals**:
  - When you describe your project in free text or speech, the AI Assistant extracts parameters and shows yellow proposal cards (`Apply Changes`).
  - Review the proposed values and click **Apply Changes** to auto-fill the questionnaire.
- **Closing Chat**: Say *"done"*, *"finished"*, or *"jeg er færdig"* in the chat, or click the close toggle to return to full-screen form view.

---

## 5. Reviewing & Submitting Projects

- **Project Information Advice**: Under the **Scape Review** tab, click **Generate Advice** to receive an AI-generated technical feasibility report detailing vision camera choices, gripper recommendations, cycle time bottlenecks, and cell layout advice.
- **Field Badges (`🔴 Critical`, `⚠️ Note`, `✏️ Modified`)**:
  - Fields identified with potential technical risks in the Advice report will display `🔴 Critical` or `⚠️ Note` badges.
  - If you edit a field value after generating advice, the badge automatically updates to **`✏️ Modified (Re-evaluate)`** to indicate that data has changed. Click **Re-generate Advice** to update the analysis.
- **Submitting to Scape**: Navigate to the **Submit** tab, review missing important fields, enter your contact information, and click **Submit Evaluation to Scape**. Once submitted, the project status changes to `Submitted (Read-Only)`. You may cancel submission at the bottom of the Submit tab if you need to make further edits.

---

## 6. Scape Bin-Picking Rules: Parts & Bin Containers

- **SINGLE PART TYPE PER BIN**: A bin (container/box) in Scape Bin-Picking ALWAYS contains items of ONE single part type (or single part family) at a time. Scape NEVER picks from mixed-contents bins containing completely unrelated item types in the same box (e.g. gearboxes mixed with brake pads in one container is NEVER done).
- **Emne vs. Emnefamilie (Part vs. Part Family)**:
  - **Enkelt Emne (Single Part)**: Alle emner i kassen er 100% identiske.
  - **Emnefamilie (Part Family)**: Emnerne i kassen deler den samme grundlæggende geometri og form, men varierer kun i få målbare dimensioner (f.eks. aksler med samme diameter, men i længder på 100mm, 120mm og 150mm). De genkendes med den samme 3D-vision model og gribes typisk med den samme griber.
  - **Forskellige Emner**: Emner med helt forskellig geometri og funktion (f.eks. et beslag vs. en aksel). Disse blandes ALDRIG i den samme kasse hos Scape. Hvert unikt emne oprettes som et særskilt projekt/specifikation.

