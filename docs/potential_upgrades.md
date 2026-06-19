# Potential Upgrades for Scape Bin-Picking Evaluator

This document lists potential feature upgrades and improvements to keep in mind for future development cycles.

---

## 1. CAD File Analysis & Geometry Recognition

Currently, CAD files uploaded to parts are stripped from the AI payload to save tokens because LLMs cannot directly parse binary/ASCII 3D geometries.

### Option A: Auto-Rendering to Multi-Angle 2D Images
* **Concept:** Convert/render the uploaded 3D CAD model into standard 2D images (top, front, side, isometric views) or a rotating GIF/video.
* **Implementation:**
  * **Client-side:** Use a library like `Three.js` (WebGl) in the browser to automatically take screenshots of the model when the user uploads it.
  * **Server-side:** Use a headless renderer (e.g., Python VTK/Trimesh with xvfb or standard libraries) to render screenshots on upload.
* **AI Integration:** Feed these rendered images as visual attachments (inline data parts) to Gemini, enabling the visual evaluation of protrusions, holes, flat regions, and symmetries.

### Option B: Server-Side CAD Metadata Extraction
* **Concept:** Programmatically analyze the CAD file on the server to extract physical features.
* **Implementation:** Use a python service using libraries like `cadquery`, `trimesh`, or `pymesh`.
* **AI Integration:** Pass the extracted metadata as a clean structured text block in the JSON state:
  ```json
  "cadMetadata": {
    "dimensionsMm": {"x": 120, "y": 80, "z": 45},
    "volumeCm3": 150.4,
    "surfaceAreaCm2": 310.2,
    "totalFlatFaces": 6,
    "symmetryType": "bilateral"
  }
  ```

### Option C: 2D CAD Drawings (DWG / DXF / SVG) Handling
* **Concept:** Support 2D layouts and mechanical blueprints.
* **Implementation:**
  * Since raw `.dwg` (binary) and `.dxf` (complex vector list) formats cannot be natively understood by Gemini, implement a server-side conversion tool (e.g., using `libreoffice`, `ezdxf`, or a PDF converter) to convert them to PDF or PNG on upload.
  * Support `.svg` format natively, as Gemini can read SVG XML structures or render SVG files visually.
* **AI Integration:** Send the rendered PDF/PNG drawing sheets directly to Gemini. Gemini has exceptional visual layout capabilities and can read dimensions, title blocks, and geometry annotations from blueprints.

---

## 2. Advanced Multi-Modal Vision Analysis

* **Detailed Grip point recognition:** Train or prompt Gemini to identify optimal mechanical gripper jaw layouts and magnet alignment areas directly from photos of the parts/cell layout.
* **Auto-crop & compress:** Add automated client-side downscaling and cropping of uploaded images to reduce data capture overhead while maintaining high resolution on target objects.

---

## 3. In-App Voice Dictation (Web Speech API) for AI Assistant

To improve the mobile and PWA data entry UX, replace the reliance on native virtual keyboards for voice dictation with an integrated, in-app speech-to-text system.

### The Problem
* Native iOS/Android virtual keyboards occupy 40-50% of the screen height on mobile/PWA.
* Engaging native voice dictation keeps the keyboard open, leaving a very small layout height to view chat logs and auto-fill questions.

### Proposed Solution
* Add a dedicated **Microphone Button** and an **English/Danish Language Toggle (DA/EN)** directly in the chat input bar.
* When tapped, programmatically call `.blur()` on the input area to **completely hide the virtual keyboard**, restoring 100% of the screen height for reading questions.
* Leverage the native browser's Web Speech API (`window.webkitSpeechRecognition` or `window.SpeechRecognition`) to record and transcribe voice.
* Display a clean bottom overlay showing a recording wave/pulsing indicator.
* On completion, automatically populate or submit the transcribed text.

### Platform & Browser Support
* **Safari & iOS PWA:** Fully supported via `webkitSpeechRecognition`. Under Apple's App Store rules, iOS browsers (like Chrome on iPhone) use Apple's WebKit rendering engine and support it perfectly. Requires a one-time microphone permission grant.
* **Android Chrome:** Fully supported natively.
* **Firefox:** Partial support. The application can feature-detect compatibility (`'webkitSpeechRecognition' in window`) and degrade gracefully by hiding the microphone button if unsupported.

---

## 4. Prompt Name Standardization Across UI, Database, and Code

Der er behov for at få strømlinet og ensrettet navnene på prompts på tværs af hele systemet. Vi skal have lavet navnene på de prompts ens på tværs af:
1. Navne brugt i brugerinterfacet (UI)
2. Prompt filnavne i `src/docs`
3. Koden og Firestore databasen

There are current discrepancies in how prompts are referenced across the project. For example:
* **UI Tab Name:** "Data Capture Advice" | **File:** `externalAdvicePrompt.md` | **Code/DB:** `externalAdvicePrompt`
* **UI Tab Name:** "Technical Evaluation" | **File:** `evaluatorDraftPrompt.md` | **Code/DB:** `evaluatorDraftPrompt`
* **UI Tab Name:** "AI Chat Assistant" | **File:** `autoFillPrompt.md` | **Code/DB:** `autoFillPrompt`

### Goal
Standardize all prompt identifiers, filenames, database keys, and UI labels to use matching terminology (e.g., `dataCaptureAdvice`, `technicalEvaluation`, and `chatAssistant`) across the user interface, filenames under [src/docs/](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/src/docs/), and the codebase.




