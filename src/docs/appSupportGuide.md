<!--
DOCUMENT VERSION: appSupportGuide v2.0 | 2026-09-01
AUTHORITATIVE SCAPE BIN-PICKING KNOWLEDGE BASE & APP MANUAL
-->

# Scape Bin-Picker Projects — Authoritative Knowledge Base & Technical Guide

This document is the master knowledge base and technical manual for **Scape Bin-Picker Projects**. It contains complete domain rules for robotic bin-picking, vision sensor selection, gripper engineering, cycle time physics, and the complete dictionary of all questionnaire fields and app workflows.

---

## 1. Core Scape Bin-Picking Rules & Domain Facts

### Rule 1: SINGLE PART TYPE PER CONTAINER (NEVER MIXED BINS)
- In Scape Bin-Picking, a bin (pallet, container, or KLT box) **ALWAYS contains items of ONE single part type (or one single part family) at a time**.
- Scape **NEVER** picks from mixed-contents bins containing completely unrelated items (e.g., gearboxes mixed with brake pads in one container is never done).

### Rule 2: Part Variants vs. Part Families (`[1.02]`)
- **Single Part (Enkelt emne)**: All parts in the container are 100% identical.
- **Part Family (Emnefamilie)**: Parts share the same basic geometry, features, and cross-section, but vary across defined dimensional ranges (e.g., steel shafts with 25 mm diameter in lengths of 100 mm, 150 mm, and 200 mm, or stamped brackets in small/medium/large sizes).
  - **Part Family Rule**: If parts belong to the same part family and are very similar, the user **only needs to provide full descriptions and 3D CAD files for the smallest and largest parts**.
  - **Overview Document**: The user must attach an overview document (drawing, PDF, or spreadsheet) listing all variant dimensions and weights.
- **Distinct Different Parts**: Items with completely different shapes or functions must be documented as separate individual part variants.

---

## 2. Robotics, Vision & Gripper Technical Principles

### 3D Vision Sensors & Mounting
- **Fixed Overhead Scanner**: Mounted above the bin on a rigid aluminum tower. Scans the bin while the robot is moving or placing parts (background scanning), saving precious cycle time. Standard for stationary bin locations.
- **Robot-Mounted Scanner**: Camera mounted directly on the robot wrist. Flexible for multi-bin layouts or mobile robot (AMR) setups, but requires robot stopping time to take scans.
- **Slide Gantry Scanner**: Scanner moves on a linear axis above long Euro-pallet bins (1200 mm) or dual-bin setups to maintain high resolution across all corners.
- **Optical Properties & Glare (`[2.11]`)**: Highly shiny, mirror-like, or chrome-plated metal scatters structured light. Identifying reflective parts triggers anti-glare polarization filters or specialized laser scanners.

### Gripper Mechanics & Tooling (`[2.03]`, `[2.07]`, `[2.10]`, `[2.14]`)
- **Vacuum Suction Tooling**: Primary choice for flat or gently curved parts with non-porous surfaces. Fast and lightweight. High robot acceleration (e.g. >15 m/s²) limits maximum allowed part weight per suction cup.
- **Mechanical Grippers (2-finger / 3-finger parallel jaws)**: Required for heavy parts (>5 kg), complex castings, oily parts where suction cups might slip, or parts with deep cavities.
- **Magnetic Grippers**: Used for ferromagnetic parts (iron/steel) when geometry prevents suction or jaw clamping. *Trade-off*: No vacuum-loss drop detection; requires very parallel surface approach.
- **Surface Fluids & Oil (`[2.07]`)**: Presence of stamping oil, coolant, or wash fluids requires oil-resistant fluoroelastomer (FKM/Viton) or silicone suction cups, or mechanical clamping.
- **High Temperature (`[2.10]`, `[2.10_temp]`)**: Temperatures >50°C degrade standard NBR rubber. Temperatures above 100°C require heat-resistant silicone/viton cups or active pneumatic cooling.

### Scape Handling Station & 3D Orientation Control (`[2.12]`, `[2.13]`)
- **Why Re-gripping is Needed**: Parts in a chaotic bin are picked in whatever pose is accessible. The robot's initial grip is rarely the exact grip needed to insert the part into a tight CNC machine chuck or welding fixture (`[2.12]`).
- **Scape Handling Station**: The robot places the picked part onto an intermediate station plate and re-grips it with high precision (e.g. ±0.1 mm) before delivery.
- **3D Orientation Control (SW20-01) & Side Determination (`[2.13]`)**:
  - *Flat parts*: May look identical from above, but have a small feature (e.g., countersunk hole, laser marking, or deburred edge) on one side determining correct orientation.
  - *Rotationally symmetric parts*: Rings, flanges, or shafts may have an off-center hole, keyway, or notch that breaks symmetry.
  - When `2.13 = Yes`, Scape vision or the Handling Station verifies feature orientation and flips/rotates the part so it is placed in the guaranteed pose.

### Cycle Time Physics & Bottlenecks (`[2.04]`, `[2.05]`)
- **`[2.04] Desired Cycle Time (sec)`**: The target duration to pick, re-grip, and place one part.
- **`[2.05] Cycle Time Basis`**:
  - **`1 cycle (Absolute line sync — no buffer)`**: Hard mandatory limit per part. Every single part must arrive at this exact cadence with zero line buffer.
  - **`1 full bin container (Average across full bin)`**: Average time per part across an entire container. Accounts for fast top-layer picks vs. slower bottom-corner picks and occasional re-scans.
  - **`1 shift target (Average over 8 hours)`**: Total shift production rate target.
  - **`Specific number of cycles`**: Average calculated over a set batch (e.g., 20 or 50 parts).
- **Physical Bottlenecks**:
  - A 180° robot base axis-1 rotation adds 1.0–2.0 seconds.
  - Two-robot setups (one picking from bin to handling station, one feeding the line) typically reduce cycle time by 30–40%, but significantly increase cell cost and footprint.
  - Slim bins with deep walls (>600 mm) require collision-avoidance deceleration near the bottom.

---

## 3. Complete Field Dictionary & Engineering Rationale

### Section 1: Project & Cell Information

| Field ID | Field Label | Short Summary | Detailed Technical Engineering Rationale |
| :--- | :--- | :--- | :--- |
| **`contact_*`** | Form Filled By Contact Info | Company, Contact Name, Email, Telephone of the submitter. | Ensures clear direct communication between Scape application engineers and the person who filled the specification. |
| **`1.01`** | Project Name | Unique descriptive title identifying the customer installation or automation project. | Used to track evaluation files, CAD models, and technical reports across Scape engineering databases. Clear naming avoids project confusion in multi-cell studies. |
| **`1.02`** | Total of different parts in project | The number of distinct part variants picked in this robotic cell. | Determines cell complexity, recipe switching, and tool-changer requirements. *Part Family Rule*: If variants belong to the same family and are very similar, full details are only required for the smallest and largest parts, plus an overview document. Example: 2 unique parts + 1 family with 20 sizes = write 4. |
| **`1.03`** | Bin type | Container format (EU-Pallet, Metal Solid, Metal Lattice, Plastic Box, Cardboard, Table). | Determines vision camera mounting height, FOV, and gripper extension tube length. Deep or lattice bins require slim gripper shafts to prevent collisions with bin rims. |
| **`1.03_other`**| Specify bin type & bottom | Custom container description including bottom profile (flat, lattice, wavy). | Captures bottom profile geometry such as corrugated sheet ribs or welded wire mesh that affects bottom-layer picks. |
| **`1.04`** | Bin Outer Dimensions (mm) | Outer dimensions of the container (Length x Width x Height in mm, e.g. 1200x800x600). | Outer dimensions define scanning volume and maximum robot reach. Standardized by AI into `LxWxH mm` format. |
| **`1.04_image`**| Upload Photo of Bin / Container | Photo of the container showing rim height, wall profile, and bottom geometry with parts inside. | Allows Scape engineers to inspect container construction, bottom ribs, and rim clearance. |
| **`1.05`** | Preferred Robot Brand | Preferred robot manufacturer (UR, Fanuc, ABB, KUKA, etc.). | Governs robot controller communication protocols, payload capacities, speed curves, and software driver compatibility with Scape software. |
| **`1.05_other`** | Specify Robot Brand and Model | Exact model number if using a non-standard robot brand. | Allows Scape engineers to verify exact payload-inertia curves, kinematic reach envelopes, and communication options. |
| **`1.06`** | Additional Project Notes / Info | Ambient conditions, floor space constraints, or customer preferences. | Captures ambient lighting (skylights, direct sun), safety fence perimeters, or environmental hazards that impact feasibility. |
| **`generalImages`** | Upload Cell & Environmental Photos | Photos of the robot cell installation area, ceiling, and container feeding. | Allows Scape vision engineers to inspect ceiling lights (sunlight interference), physical obstructions, and bin delivery mechanisms. |

---

### Section 2: Part Dimensions & Characteristics

| Field ID | Field Label | Short Summary | Detailed Technical Engineering Rationale |
| :--- | :--- | :--- | :--- |
| **`2.01`** | Part Name / Number | Component name or internal part ID. | Distinguishes part recipes, CAD files, and gripper configurations in multi-part automation cells. |
| **`2.02`** | Part Dimensions (mm) | Bounding box dimensions (Length × Width × Height in mm). | Determines 3D scanner point cloud density. Small parts (<20 mm) require high-resolution scanners (Scape Mini Grid), while large parts require high payload grippers. |
| **`2.03`** | Part Weight (kg) | Mass of a single individual part in kilograms. | Dictates robot payload rating and gripper holding force. Total payload must include part, gripper, sensors, and acceleration safety margins. |
| **`2.03_material`** | Part Material | Composition material (Cast Iron, Steel, Aluminum, Plastic). | Determines gripper feasibility (magnetic grippers require ferromagnetic steel/iron; vacuum cups require non-porous surfaces) and optical properties. |
| **`2.04`** | Desired Cycle Time (sec) | Target picking cycle time per part in seconds. | Dictates required robot motion speeds, vision processing times, and potential need for dual-gripper tooling or multi-robot cells. |
| **`2.05`** | Cycle Time Measurement Basis | Number of cycles or period over which cycle time is measured (1 cycle absolute, full bin, full shift). | Clarifies whether cycle time is a hard synchronized line pace (1 cycle with zero buffer) or an average over a full container or shift. |
| **`2.05_custom`**| Custom Cycles / Buffer details | Specific number of cycles or buffer capacity description. | Used to calculate line pacing, buffer station size, and latency tolerance during bin emptying. |
| **`2.06`** | CAD file available for part? | Availability of 3D CAD files (STL, STEP, IGES). | Scape 3D recognition relies on 3D CAD models to generate point-cloud matching templates. STL (~0.01 mm accuracy) or STEP eliminates manual teaching. |
| **`2.07`** | Any oil/soap/lubrication? | Presence of oil, machining coolant, or wet fluids. | Fluids cause vacuum cup slippage and reduce friction. Oily parts require oil-resistant FKM/Viton cups, contoured jaws, or magnetic grippers. |
| **`2.08`** | Separated by slip sheet? | Layer sheets (cardboard/plastic) between part layers. | Requires slip-sheet removal routines or secondary suction cups on the gripper so the robot can remove sheets when a layer is emptied. |
| **`2.09`** | Risk of entanglement? | Tendency of parts to hook, interlock, or nest together. | Interlocked parts (springs, hooks, stamped brackets) may lift in clusters. Triggers specialized shaking routines or force-sensing release. |
| **`2.10`** | Any temperature issues? | Elevated part temperature (>50°C). | Hot parts from forging or casting degrade standard rubber cups and sensors. Requires heat-resistant silicone/fluoroelastomer cups or cooled jaws. |
| **`2.10_temp`** | Expected Temperature (°C) | Approximate part temperature in °C. | Determines specific thermal ratings for gripper seals, vacuum tubing, and pneumatic actuators. |
| **`2.11`** | Is the part very shiny? | High surface reflectivity, polished metal, or chrome finish. | Reflective surfaces scatter 3D scanner light. Identifying shiny parts prompts laser scanners or anti-reflection algorithms. |
| **`2.12`** | Place requirements description | Destination specification (CNC chuck, fixture, conveyor). | Placement criteria define required tolerance (e.g. ±0.2 mm into a chuck vs rough drop). High precision requires Scape Handling Station re-gripping. |
| **`2.13`** | Determine part orientation / which side is up? | Flat parts with orientation features or symmetric parts with symmetry-breaking features. | When parts must be placed in a specific orientation, Scape software uses 3D pose estimation or a Handling Station to verify and re-orient parts mid-flight. |
| **`2.14`** | Any special gripper requirements? | Forbidden contact zones, precision tolerances, or mandated brands. | Identifies non-standard conditions such as polished visible surfaces, restricted clamping zones, or required vacuum sensors. |
| **`2.14_desc`** | Specify gripper requirements | Detailed description of forbidden zones or clamping specs. | Provides exact tooling instructions for gripper designers regarding allowed touchpoints and forbidden contact areas. |
| **`2.15`** | Additional Part Notes / Info | Extra information regarding variants, coatings, or handling. | Captures specialized knowledge like fragile features, surface coatings, or batch variations influencing algorithms. |
| **`images`** | Upload Part Images | Photos of the physical part from multiple angles. | Allows vision engineers to inspect surface texture, chamfers, holes, reflectivity, and potential gripping locations prior to testing. |

---

## 4. Application Navigation & Features

### Dashboard & Project Lifecycle
1. **Dashboard**: View all customer projects, filter by status (`Draft`, `Submitted`, `Under Review`, `Approved`, `Rejected`), and create new projects.
2. **Project Creation**: Click **"+ Create New Project"** or scan the on-screen QR code on mobile.
3. **Multi-Part Management**: Use the Part tabs (`Part 1`, `Part 2`, `+ Add Part`) to define multiple part variants in the same project.

### AI Assistant & Voice Dictation
- Open the **AI Assistant** tab to describe your cell in natural language.
- Use mobile speech-to-text dictation directly in the input box to dictate and edit parameters before sending.
- The AI generates yellow **Proposed Changes** cards. Review proposed values and click **Apply Changes** to auto-populate the questionnaire.

### AI Project Advice & Frozen Submissions
- **`⚡ AI Advice`**: Click `⚡ AI Advice` to run an automated technical audit of bin dimensions, part weight, cycle times, and glare risks.
- **Frozen Snapshot (`userSubmittedReport`)**: When the user clicks **Submit Project**, the exact state of all fields and advice is permanently frozen so Scape evaluators review the exact data submitted.
- **Request Edit Permission**: Once a project is submitted or locked by an evaluator, users can request unlock permissions with a brief reason.

### Exporting & PDF Reports
- Users and evaluators can generate a comprehensive, branded **PDF Specification Report** at any time containing all dimensions, photos, advice findings, and Scape engineering evaluation notes.
