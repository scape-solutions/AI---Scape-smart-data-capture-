# Use Case 8: Extended Analysis & Business Case (ROI Simulation) - System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-8-extended-analysis--business-case-roi-simulation)  
**Actors:** External Partner, Scape App Engineer  
**Scope:** ROI Parameter Inputs, Shift Multipliers, Annual Cost Savings Math, Payback Periods, Auto-Save to `generalResponses`, Additional Opportunities.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Open Business Case Tab | Extended Analysis -> Business Case navigation | TC-UC8-01, TC-UC8-02 |
| Step 2: Disclaimer Banner | Simulation draft disclaimer display | TC-UC8-02 |
| Step 3: Labor Cost Input | `businessCaseSavedLabor` (EUR/h, zero, negative, non-numeric) | TC-UC8-01, TC-UC8-05, TC-UC8-07, TC-UC8-08 |
| Step 4: Shift Multiplier Input | `businessCaseShifts` (1, 2, or 3 shifts per day) | TC-UC8-02, TC-UC8-03, TC-UC8-04 |
| Step 5: Work Days Input | `businessCaseWorkDays` (default 220, zero handling) | TC-UC8-01, TC-UC8-02, TC-UC8-03 |
| Step 6: ROI Calculations | Saved operator hours, annual savings, payback period | TC-UC8-01, TC-UC8-02, TC-UC8-03 |
| Step 7: Continuous Auto-Save | Persistence in `generalResponses` | TC-UC8-02, TC-UC8-03 |
| Step 8: Additional Opportunities | Feeder bowls, conveyors, secondary sorting questions | TC-UC8-06 |

---

## 2. System Test Cases (ZOMBEE)

### TC-UC8-01: Zero Labor Rate / Zero Work Days Handling [Zero]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Navigation | Click "Business Case" in sidebar | ROI Estimation interface renders | [Pending] | Pending | ZOMBEE: Zero. Catches divide-by-zero crashes producing `NaN` or `Infinity`. |
| 1.2 | Zero Labor Cost | Set Operator Hourly Labor Cost to 0 EUR | Input accepts 0 | [Pending] | Pending | Enters 0 cost |
| 1.3 | Calculation Result (Zero Cost) | Annual Savings display | Annual savings displays 0 EUR; Payback displays "N/A" or "Infinite" with note | [Pending] | Pending | Verifies graceful fallback |
| 1.4 | Zero Work Days | Set Work Days per Year to 0 | Input accepts 0 | [Pending] | Pending | Enters 0 work days |
| 1.5 | Calculation Result (Zero Days) | Total hours & savings | Total hours saved displays 0 hrs; system does not crash or throw unhandled exceptions | [Pending] | Pending | Ensures math safety |

---

### TC-UC8-02: Single Shift Baseline ROI Calculation Accuracy [One]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Precondition Check | Open Business Case tab | Disclaimer banner visible at top | [Pending] | Pending | ZOMBEE: One. Validates 1-shift mathematical baseline precision. |
| 2.2 | Input: Labor Cost | Set Hourly Labor Cost to 50 EUR/h | Input displays 50 | [Pending] | Pending | Sets baseline labor |
| 2.3 | Input: Shift Count | Select 1 shift per day | Single shift selected | [Pending] | Pending | Sets 1 shift |
| 2.4 | Input: Work Days | Set 220 work days | Input displays 220 | [Pending] | Pending | Sets baseline days |
| 2.5 | Mathematical Check | Annual Metrics | • Hours saved: 1,650 hrs (`1 * 220 * 7.5`)<br>• Annual savings: 82,500 EUR (`1,650 * 50`)<br>• Payback calculated correctly against benchmark | [Pending] | Pending | Confirms exact arithmetic |
| 2.6 | Auto-Save Check | Inspect Firestore `generalResponses` | `businessCaseSavedLabor: 50`, `businessCaseShifts: 1`, `businessCaseWorkDays: 220` saved | [Pending] | Pending | Verifies database sync |

---

### TC-UC8-03: Multi-Shift Maximum Capacity Calculation [Many]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Input: Shift Count | Select 3 shifts per day | 3 shifts active | [Pending] | Pending | ZOMBEE: Many. Catches multi-shift multiplier bugs underestimating savings. |
| 3.2 | Input: Labor Cost | Set Hourly Labor Cost to 65 EUR/h | Input displays 65 | [Pending] | Pending | High labor cost |
| 3.3 | Input: Work Days | Set 250 work days per year | Input displays 250 | [Pending] | Pending | High utilization |
| 3.4 | Mathematical Check | Multi-Shift Annual Savings | • Hours saved: 5,625 hrs (`3 * 250 * 7.5`)<br>• Annual savings: 365,625 EUR (`5,625 * 65`)<br>• Payback period reflects high-utilization amortization | [Pending] | Pending | Verifies 3x scaling factor |
| 3.5 | Persistence Check | Reload page | Values and calculated metrics persist cleanly from `generalResponses` | [Pending] | Pending | Confirms persistence |

---

### TC-UC8-04: Shift Selector Discrete Boundary Limits (1 to 3) [Boundary]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Shift Options Check | Inspect Shift Selector controls | Only options 1, 2, and 3 shifts are presented | [Pending] | Pending | ZOMBEE: Boundary. Enforces strict boundary domain for shifts. |
| 4.2 | Minimum Boundary Test | Select lowest option: 1 shift | 1 shift active; calculation uses multiplier 1 | [Pending] | Pending | Verifies min shift limit |
| 4.3 | Maximum Boundary Test | Select highest option: 3 shifts | 3 shifts active; calculation uses multiplier 3 | [Pending] | Pending | Verifies max shift limit |
| 4.4 | Out-of-Bounds Protection | Attempt script injection: `businessCaseShifts = 5` | Input sanitization restricts value to 3 max | [Pending] | Pending | Prevents boundary breach |

---

### TC-UC8-05: Standard Manufacturing Labor Rate Equivalence [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Low Cost Partition | Set Labor Cost to 35 EUR/h | Savings: 57,750 EUR (1 shift); payback updates dynamically | [Pending] | Pending | ZOMBEE: Equivalence. Tests realistic EU manufacturing cost brackets. |
| 5.2 | Standard Cost Partition | Set Labor Cost to 50 EUR/h | Savings: 82,500 EUR (1 shift); payback updates dynamically | [Pending] | Pending | Mid-tier EU rate |
| 5.3 | High Cost Partition | Set Labor Cost to 75 EUR/h | Savings: 123,750 EUR (1 shift); payback updates dynamically | [Pending] | Pending | Premium EU automation market |
| 5.4 | Real-Time Sync | Inspect UI delay | Metrics recompute on input without requiring page refresh | [Pending] | Pending | Verifies reactive UI |

---

### TC-UC8-06: Additional Automation Opportunities Section Partition [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Navigation Action | Click "Additional Opportunities" in sidebar | Section opens | [Pending] | Pending | ZOMBEE: Equivalence. Tests extended analysis section partition. |
| 6.2 | Question Display | Inspect questions | Displays questions on feeder bowls, conveyors, secondary sorting, packaging | [Pending] | Pending | Verifies question schema |
| 6.3 | Parameter Entry | Select "Yes" for conveyors and secondary sorting | Values selected | [Pending] | Pending | Enters automation opportunities |
| 6.4 | Persistence Check | Inspect Firestore `generalResponses` | Opportunity keys saved under `generalResponses`; independent of ROI metrics | [Pending] | Pending | Confirms isolated persistence |

---

### TC-UC8-07: Negative Numeric Input Rejection [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Labor Cost Input | Attempt to enter -50 EUR/h | Input element constraint (`min="0"`) rejects minus sign or resets value to 0 | [Pending] | Pending | ZOMBEE: Exception. Catches negative savings and nonsensical payback values. |
| 7.2 | Work Days Input | Attempt to enter -220 days | Input blocks negative numbers | [Pending] | Pending | Enforces positive integers |
| 7.3 | Calculations Guard | Metric outputs | Annual savings never display negative values | [Pending] | Pending | Ensures data sanity |

---

### TC-UC8-08: Non-Numeric String Input Handling [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Labor Cost Input | Paste string: `"Fifty Euros"` | Input parser ignores non-numeric characters; field retains previous valid number | [Pending] | Pending | ZOMBEE: Exception. Catches JavaScript string concatenation/type coercion bugs. |
| 8.2 | Currency Symbols | Paste string: `"$65/hr"` | Parser strips symbol or rejects string; prevents string coercion in arithmetic | [Pending] | Pending | Prevents `NaN` outputs |
| 8.3 | Form Stability | Inspect UI | No NaN rendered in UI; auto-save saves valid number to Firestore | [Pending] | Pending | Ensures state robustness |
