# Use Case 2: Auto-fill Questionnaire using AI Assistant - Black Box System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-2-auto-fill-questionnaire-using-ai-assistant-text-voice-media)  
**Actor:** External Partner  
**Scope:** Black box testing of AI Assistant chat interaction, natural language autofill, voice recording inputs, datasheet PDF parsing, image action proposals, support query delegation, and proposal lifecycle.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: User Input Modality | Text description, microphone voice recording, PDF/image attachment | TC-UC2-01, TC-UC2-02, TC-UC2-03, TC-UC2-07 |
| Step 2: Audio Recording Interaction | Microphone button, audio recording timer, permission handling | TC-UC2-07 |
| Step 3: Attachment Size Ceiling | Technical datasheet PDF attachment (10 MB boundary) | TC-UC2-02, TC-UC2-03 |
| Step 4: AI Response Generation | Markdown chat response sections (`---FACTS---`, `---QUESTIONS---`) | TC-UC2-01, TC-UC2-02, TC-UC2-06 |
| Step 5: Diff Card Verification | Visual diff card rendering proposed vs. current values | TC-UC2-01, TC-UC2-02, TC-UC2-08 |
| Step 6: "Apply Changes" Action | Applying proposed values to form inputs, confirmed "Applied" badge | TC-UC2-01, TC-UC2-02, TC-UC2-04 |
| Step 7: Image Action Proposals | Attaching image in chat -> assigning to Part 1 visual evidence | TC-UC2-04 |
| Step 8: Hardware Query Delegation | Routing technical hardware questions to dedicated Support AI | TC-UC2-05 |
| Step 9: Conversational Questions | Questions with no field modifications proposed | TC-UC2-06 |
| Step 10: Proposal Concurrency | Interleaving multiple prompts before applying | TC-UC2-08 |

---

## 2. Black Box Test Cases

### TC-UC2-01: Natural Language Parameter Extraction via Text [Use Case Scenario]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Chat Trigger | Open AI Assistant chat panel | Chat interface opens; message input is focused | [Pending] | Pending | Black Box: Use Case Scenario. Validates core natural language form auto-fill. |
| 1.2 | Text Prompt Input | Type: *"Part 1 weighs 4.5kg and is made of polished stainless steel"* | Message text appears in input field | [Pending] | Pending | Enters specific technical requirements |
| 1.3 | Send Action | Click "Send" button | Message sent; thinking spinner displays; AI response renders | [Pending] | Pending | Initiates AI analysis |
| 1.4 | Diff Card Inspection | View "Apply Proposed Changes" card | Card shows Part 1: Weight proposed as "4.5 kg", Material proposed as "Stainless Steel" | [Pending] | Pending | Verifies visual diff representation |
| 1.5 | Apply Action | Click "Apply Changes" button | Card updates to confirmed "Applied" state; questionnaire Part 1 inputs update immediately | [Pending] | Pending | Confirms form auto-population |
| 1.6 | Persistence Check | Navigate away to Step 0 and return | Part 1 inputs retain 4.5kg and Stainless Steel values | [Pending] | Pending | Verifies auto-save of applied changes |

---

### TC-UC2-02: Bulk Multimodal PDF Datasheet Extraction [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Attachment Input | Attach a 3-page technical datasheet PDF (1.5 MB) via paperclip icon | PDF filename badge appears in chat input tray | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests document attachment class. |
| 2.2 | Command Prompt | Type: *"Extract all cell dimensions, robot model, and part parameters from this sheet"* and click Send | Message and document upload dispatch to assistant | [Pending] | Pending | Requests bulk parameter extraction |
| 2.3 | Multi-Field Diff Card | Inspect AI response diff card | Diff card proposes multiple fields across Step 0 (bin dimensions, robot brand) and Part 1 (dimensions, weight, cycle time) | [Pending] | Pending | Verifies bulk extraction across multiple scopes |
| 2.4 | Apply Action | Click "Apply Changes" | All corresponding inputs update across Step 0 and Part 1 forms | [Pending] | Pending | Confirms bulk form population |

---

### TC-UC2-03: PDF Attachment Size Boundary (10 MB Ceiling) [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Valid Boundary Test | Attach technical PDF file of 9.9 MB | File is accepted and attaches to chat tray | [Pending] | Pending | Black Box: Boundary Value Analysis. Catches payload limits. |
| 3.2 | Exceeded Boundary Test | Attempt to attach PDF file of 10.1 MB | File is blocked immediately; alert displays: *"File exceeds the 10 MB attachment limit."* | [Pending] | Pending | Tests size limit enforcement |
| 3.3 | UI Safety Check | Inspect chat input | Chat input remains clean and responsive; blocked file is not sent | [Pending] | Pending | Prevents server payload error |

---

### TC-UC2-04: Image Action Proposal and Gallery Assignment [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | Image Attachment | Attach photo `part_sample.jpg` in chat; type: *"Use this photo for Part 1"* | Image thumbnail and prompt display in input | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests image action routing. |
| 4.2 | Send Action | Click "Send" | AI generates response proposing an image assignment action | [Pending] | Pending | Analyzes image intent |
| 4.3 | Proposal Card Display | Inspect proposal card | Card shows image preview targeted for Part #1 Visual Evidence | [Pending] | Pending | Checks visual confirmation card |
| 4.4 | Apply Action | Click "Apply Changes" | Card changes to "Applied" | [Pending] | Pending | Executes image assignment |
| 4.5 | Form Gallery Check | Navigate to Part 1 -> Visual Evidence tab | The uploaded photo appears inside Part 1 photo gallery | [Pending] | Pending | Verifies photo added to correct gallery |

---

### TC-UC2-05: Technical Hardware Query Delegation [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Technical Inquiry Input | Type: *"Does Scape Mini support structured light cameras at 1.5m distance?"* and click Send | Message sends to assistant | [Pending] | Pending | Black Box: Equivalence Partitioning. Tests support query routing. |
| 5.2 | Response Bubble Check | Inspect chat response | Dedicated **Support AI** bubble renders in the feed (distinct styling from general assistant) | [Pending] | Pending | Verifies specialized delegation |
| 5.3 | Content Accuracy | Read response text | Response quotes official camera specifications and operating range recommendations | [Pending] | Pending | Ensures hardware inquiry is accurately answered |
| 5.4 | No Phantom Diff Card | Inspect chat feed | No questionnaire diff card is rendered | [Pending] | Pending | Ensures informational queries propose no form edits |

---

### TC-UC2-06: Conversational Inquiries with Zero Proposed Changes [Boundary Value Analysis]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | General Inquiry | Type: *"What is an EU-pallet and how does it fit bin picking?"* | Message sends to assistant | [Pending] | Pending | Black Box: Boundary Value Analysis. Verifies zero field mutations on Q&A. |
| 6.2 | Response Inspection | Read assistant reply | Educational Markdown text explaining standard 1200x800mm EU-pallet dimensions | [Pending] | Pending | Confirms educational reply |
| 6.3 | Diff Card Suppression | Inspect chat container | No "Apply Proposed Changes" card or apply button is present | [Pending] | Pending | Confirms zero proposed changes |
| 6.4 | Form Value Check | Inspect questionnaire inputs | Form values remain completely unchanged | [Pending] | Pending | Ensures state immutability |

---

### TC-UC2-07: Microphone Audio Capture Exception Handling [Error Guessing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Permission Denial Test | Set browser mic permission to Blocked; click microphone button | System displays notification: *"Microphone access denied. Please enable microphone permissions in your browser."* | [Pending] | Pending | Black Box: Error Guessing. Catches audio permission crashes. |
| 7.2 | Empty Recording Test | Allow mic; click microphone button, then click stop after 0.05s | System detects negligible audio; alerts *"Recording was too short. Please try again."* | [Pending] | Pending | Catches zero-duration audio clicks |
| 7.3 | Input Field Recovery | Inspect chat controls | Microphone icon returns to normal state; text input remains fully usable | [Pending] | Pending | UI does not get stuck in recording mode |

---

### TC-UC2-08: Superseded Proposal Card Invalidation [State Transition Testing]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | Initial Proposal | Prompt: *"Part weight is 2kg"* | Diff Card 1 renders proposing `weight: 2` | [Pending] | Pending | Black Box: State Transition Testing. Catches stale state overwrite race conditions. |
| 8.2 | Conflicting Prompt | Without applying Card 1, type: *"Actually, the part weight is 5kg"* and Send | Diff Card 2 renders proposing `weight: 5` | [Pending] | Pending | Triggers newer proposal |
| 8.3 | Card 1 State Transition | Inspect older Diff Card 1 | Older Diff Card 1 is disabled, marked as "Superseded", and its "Apply" button is deactivated | [Pending] | Pending | Verifies invalidation of stale cards |
| 8.4 | Card 2 Application | Click "Apply Changes" on Diff Card 2 | Part weight updates to 5kg; Card 2 marks "Applied" | [Pending] | Pending | Ensures only latest recommendation applies |
