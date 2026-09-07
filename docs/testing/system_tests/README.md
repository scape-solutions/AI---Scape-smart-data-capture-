# Scape Bin-Picker Projects - System Testing Suite (ZOMBEE)

This directory contains the complete system testing specifications for the **Scape Bin-Picker Projects** application, derived from [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md).

## Testing Methodology: ZOMBEE
The test cases are formulated using the **ZOMBEE** testing approach:
* **Z - Zero:** Testing empty states, 0 parts/items, uninitialized variables, blank inputs, and default initializations.
* **O - One:** Testing single entity behavior (1 part, single field change, 1 attachment, single case assignment).
* **M - Many:** Testing high multiplicity (multiple parts, bulk media uploads, concurrent field mutations, 3-shift models).
* **B - Boundary:** Testing threshold boundaries and ceilings (200 KB CAD limit, 10 MB PDF attachment ceiling, discrete 1–3 shift limits, 2,000 char note limit).
* **E - Equivalence Partitioning:** Testing representative valid/invalid classes (Manual vs. AI Split-Screen setup, valid vs. invalid CAD extensions, published vs. unpublished verdicts, unlocked vs. locked cases).
* **E - Exceptions:** Testing error states, network disconnects, permission rejections (HEIC photos, audio mic block, illegal status transitions, non-evaluator authorization guards).

---

## Structure of Each Test Specification
Each use case file contains:
1. **Use Case Summary & Traceability:** Mapping to the production use case specification.
2. **Test Allocation Matrix:** A matrix mapping each workflow step and variable/selection to its designated ZOMBEE test cases (`Step`, `Variable or Selection`, `Test Cases`).
3. **Individual Test Case Run Tables:** Detailed step-by-step test execution tables (`Step Number`, `Variable or Selection`, `Value`, `Expected Result`, `Actual Result`, `Pass/Fail`, `Comments`).

---

## Test Suites by Use Case

| Use Case | Title | Link to Test Suite | ZOMBEE Test Count |
|---|---|---|---|
| **UC1** | Create and Auto-Save a Project Draft | [`uc1_test_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/system_tests/uc1_test_cases.md) | 8 Test Cases |
| **UC2** | Auto-fill Questionnaire using AI Assistant (Text, Voice, Media) | [`uc2_test_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/system_tests/uc2_test_cases.md) | 8 Test Cases |
| **UC3** | Request Project Information Advice & Extract Field Observations | [`uc3_test_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/system_tests/uc3_test_cases.md) | 8 Test Cases |
| **UC4** | Submit Project for Evaluation & Direct Unsubmit | [`uc4_test_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/system_tests/uc4_test_cases.md) | 8 Test Cases |
| **UC5** | Request Project Unlock / Edit Permission | [`uc5_test_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/system_tests/uc5_test_cases.md) | 8 Test Cases |
| **UC6** | Evaluate Project and Publish Verdict | [`uc6_test_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/system_tests/uc6_test_cases.md) | 8 Test Cases |
| **UC7** | Export Project Feasibility Report (PDF & Markdown) | [`uc7_test_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/system_tests/uc7_test_cases.md) | 8 Test Cases |
| **UC8** | Extended Analysis & Business Case (ROI Simulation) | [`uc8_test_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/system_tests/uc8_test_cases.md) | 8 Test Cases |
| **UC9** | Project Lifecycle & Case Management | [`uc9_test_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/system_tests/uc9_test_cases.md) | 8 Test Cases |
