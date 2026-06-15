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

---

## 2. Advanced Multi-Modal Vision Analysis

* **Detailed Grip point recognition:** Train or prompt Gemini to identify optimal mechanical gripper jaw layouts and magnet alignment areas directly from photos of the parts/cell layout.
* **Auto-crop & compress:** Add automated client-side downscaling and cropping of uploaded images to reduce data capture overhead while maintaining high resolution on target objects.
