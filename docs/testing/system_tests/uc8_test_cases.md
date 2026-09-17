# Use Case 8: Extended Analysis & Business Case (ROI Simulation) - Black Box System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-8-extended-analysis--business-case-roi-simulation)  
**Actors:** External Partner, Scape App Engineer  
**Scope:** Black box testing of ROI simulation parameters, labor rate calculations, shift multipliers, work days inputs, dynamic payback estimations, non-numeric validation, and additional automation opportunities.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: Extended Analysis Navigation | "Business Case" tab in sidebar | TC-UC8-01, TC-UC8-05 |
| Step 2: Disclaimer Banner Display | Simulation draft disclaimer box | TC-UC8-01 |
| Step 3: Labor Cost Input | Operator Hourly Labor Cost (EUR) input (zero, EU rates, negative, text) | TC-UC8-01, TC-UC8-03, TC-UC8-04, TC-UC8-06, TC-UC8-07 |
| Step 4: Operating Shift Selector | 1, 2, or 3 shifts per day (discrete boundary options) | TC-UC8-01, TC-UC8-02 |
| Step 5: Work Days Input | Expected Work Days per Year (default 220, zero handling, positive numbers) | TC-UC8-01, TC-UC8-03 |
| Step 6: ROI Mathematical Outputs | Total annual hours saved, estimated annual cost savings, payback period | TC-UC8-01, TC-UC8-02, TC-UC8-03, TC-UC8-04 |
| Step 7: Additional Opportunities | Feeder bowls, conveyors, secondary sorting questions | TC-UC8-05 |
| Step 8: Persistence Across Sessions | Auto-save retention of ROI inputs upon page reload | TC-UC8-08 |

---

## 2. Black Box Test Cases

### TC-UC8-01: Standard Baseline ROI Calculation [Use Case Scenario]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Tab Navigation | Click "Business Case" under Extended Analysis in sidebar | ROI parameters interface renders with simulation disclaimer banner | [Pending] | Pending | Black Box: Use Case Scenario. Validates baseline 1-shift ROI arithmetic. |
| 1.2 | Labor Cost Input | Enter 50 EUR/h in Operator Hourly Labor Cost field | Input accepts 50 | [Pending] | Pending | Enters standard hourly cost |
| 1.3 | Shift Selection | Select "1 shift per day" | Shift selector sets multiplier to 1 | [Pending] | Pending | Sets single shift |
| 1.4 | Work Days Input | Set Expected Work Days per Year to 220 | Input accepts 220 | [Pending] | Pending | Sets standard year |
| 1.5 | Calculation Verification | Check calculated output cards | • Hours saved: **1,650 hrs** (`1 * 220 * 7.5`)<br>• Annual savings: **82,500 EUR** (`1,650 * 50`)<br>• Indicative payback period calculated and displayed with summary badge | [Pending] | Pending | Confirms exact baseline arithmetic |

---

### TC-UC8-02: Discrete Shift Selector Boundaries (1 vs. 3 Shifts) [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Minimum Shift Boundary | Select "1 shift" (with 250 days, 60 EUR/h) | Calculates: 1,875 hrs saved; **112,500 EUR** annual savings | [Pending] | Pending | Black Box: Boundary Value Analysis. Tests min shift boundary. |
| 2.2 | Maximum Shift Boundary | Select "3 shifts" (with 250 days, 60 EUR/h) | Calculates: 5,625 hrs saved; **337,500 EUR** annual savings (exactly 3x multiplier) | [Pending] | Pending | Tests max shift boundary |
| 2.3 | Option Domain Check | Inspect shift selector control | Only discrete options 1, 2, and 3 are present; cannot select 0 or 4+ | [Pending] | Pending | Verifies discrete range constraint |

---

### TC-UC8-03: Zero Labor Cost & Zero Work Days Handling [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Zero Labor Rate | Set Hourly Labor Cost to 0 EUR | Input displays 0 | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches divide-by-zero crashes. |
| 3.2 | Output Check (Zero Cost) | Inspect annual savings and payback | Annual savings displays 0 EUR; Payback displays "N/A" with explanatory note without crashing UI | [Pending] | Pending | Graceful fallback check |
| 3.3 | Zero Work Days | Set Work Days per Year to 0 | Input displays 0 | [Pending] | Pending | Sets zero days |
| 3.4 | Output Check (Zero Days) | Inspect hours and savings | Displays 0 hours saved and 0 EUR savings; no `NaN` or `Infinity` rendered | [Pending] | Pending | Verifies zero multiplication safety |

---

### TC-UC8-04: EU Industrial Labor Cost Brackets [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Bracket A: Low-Cost EU | Set Labor Cost to 35 EUR/h (1 shift, 220 days) | Annual savings: **57,750 EUR**; payback period updates dynamically | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests realistic industrial labor rates. |
| 4.2 | Bracket B: Standard EU | Set Labor Cost to 50 EUR/h (1 shift, 220 days) | Annual savings: **82,500 EUR**; payback period updates dynamically | [Pending] | Pending | Mid-tier manufacturing market |
| 4.3 | Bracket C: High-Cost EU | Set Labor Cost to 75 EUR/h (1 shift, 220 days) | Annual savings: **123,750 EUR**; payback period updates dynamically | [Pending] | Pending | Premium automation market |
| 4.4 | Real-Time Calculation | Observe metric cards on keystroke | Outputs recalculate instantaneously without page refresh or lag | [Pending] | Pending | Verifies reactive UI calculation |

---

### TC-UC8-05: Additional Automation Opportunities Partition [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Section Navigation | Click "Additional Opportunities" under Extended Analysis | Additional Opportunities questionnaire view opens | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests secondary automation section. |
| 5.2 | Question Display | Inspect available questions | Questions display regarding feeder bowls, conveyors, secondary sorting, and packaging | [Pending] | Pending | Verifies questionnaire schema |
| 5.3 | Option Selection | Select "Yes" for conveyors and secondary sorting | Selections are recorded; visual checkmarks activate | [Pending] | Pending | Enters opportunities |
| 5.4 | Section Isolation | Navigate back to Business Case | Business Case ROI parameters remain completely unaffected | [Pending] | Pending | Confirms section isolation |

---

### TC-UC8-06: Negative Number Input Rejection [Error Guessing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Negative Cost Attempt | Attempt to type "-50" into Hourly Labor Cost field | Minus sign is blocked, or value automatically resets to 0 | [Pending] | Pending | Black Box: Error Guessing. Catches negative savings and nonsensical payback calculations. |
| 6.2 | Negative Days Attempt | Attempt to type "-220" into Work Days field | Minus sign is blocked | [Pending] | Pending | Enforces positive integer constraint |
| 6.3 | Calculation Sanity | Inspect savings output | Savings never display negative figures | [Pending] | Pending | Ensures data sanity |

---

### TC-UC8-07: Non-Numeric Character Prevention [Error Guessing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Text String Paste | Attempt to paste `"Fifty Euros"` into Labor Cost field | Input ignores alphabetic characters; retains previous valid number | [Pending] | Pending | Black Box: Error Guessing. Catches string concatenation bugs. |
| 7.2 | Currency Symbols | Attempt to paste `"$65/hr"` into Labor Cost field | Currency symbols and slashes are stripped or rejected | [Pending] | Pending | Prevents `NaN` outputs |
| 7.3 | Form Stability | Inspect UI cards | No `NaN` or unformatted strings appear in calculation cards | [Pending] | Pending | Verifies robust input parsing |

---

### TC-UC8-08: ROI Parameter Persistence Across Sessions [State Transition Testing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Custom Parameter Input | Set 65 EUR/h, 2 shifts, 240 days | Calculated savings: 234,000 EUR | [Pending] | Pending | Black Box: State Transition Testing. Verifies auto-save across session reloads. |
| 8.2 | Page Refresh | Press browser refresh button (F5) | Page reloads cleanly | [Pending] | Pending | Reloads browser |
| 8.3 | Value Persistence | Navigate to Business Case tab | Inputs still show 65 EUR/h, 2 shifts, 240 days; savings shows 234,000 EUR | [Pending] | Pending | Confirms auto-save retention |
