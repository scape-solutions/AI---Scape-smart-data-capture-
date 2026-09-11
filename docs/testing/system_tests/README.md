# Scape Bin-Picker Projects - System Testing Suite (Black Box Methodology)

This directory contains the complete system testing specifications for the **Scape Bin-Picker Projects** application, derived directly from [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md).

## Testing Methodology: Black Box Testing
All test cases strictly evaluate system behavior from the perspective of an external actor (External Partner or Scape App Engineer), focusing on visible user actions, screen inputs, UI states, toasts, dialogs, and downloaded artifacts without referencing internal source code or private variables.

The test cases employ the established black box test design techniques:
* **Use Case Scenario Testing (UC):** Verifying primary end-to-end user workflows and business critical paths.
* **Equivalence Partitioning (EP):** Partitioning input domains, setup pathways, file format types, role privileges, and visibility states into valid and invalid equivalence classes.
* **Boundary Value Analysis (BVA):** Testing limits at minimum, maximum, and extreme boundaries (e.g. 200 KB CAD limit, 10 MB PDF attachment ceiling, 1–3 shift limits, 2,000 char note limit, 0-character validations).
* **State Transition Testing (ST):** Validating lifecycle state changes (Draft -> Submitted -> Locked -> Approved/Rejected -> Trashed -> Restored).
* **Error Guessing (EG):** Testing real-world edge cases, unsupported media formats (.heic), rapid toggles, offline network interruptions, and unauthorized access attempts.

---

## Structure of Each Test Specification
Each use case file contains:
1. **Use Case Summary & Scope:** Traceability back to the production use case.
2. **Test Allocation Matrix:** Mapping each workflow step and variable/selection to its designated black box test cases (`Step`, `Variable or Selection`, `Test Cases`).
3. **Black Box Test Case Tables:** Step-by-step test execution tables (`Step Number`, `Variable or Selection`, `Value`, `Expected Result`, `Actual Result`, `Pass/Fail`, `Comments`).

---

## Test Suites by Use Case

| Use Case | Title | Link to Test Suite | Black Box Test Count |
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
