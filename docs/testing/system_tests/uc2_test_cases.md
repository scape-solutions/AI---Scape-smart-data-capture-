# Use Case 2: Auto-fill Questionnaire using AI Assistant - System Test Cases

**Reference Document:** [`docs/testing/use_cases.md`](file:///c:/Users/kelsng/SoftwareEngineering/5thSemester/AI---Scape-smart-data-capture-/docs/testing/use_cases.md#use-case-2-auto-fill-questionnaire-using-ai-assistant-text-voice-media)  
**Actor:** External Partner  
**Scope:** AI Assistant Chat, Text/Audio/PDF Inputs, Gemini Auto-Fill Prompts, Diff Cards, Image Actions, Support Delegation.

---

## 1. Test Allocation Matrix

| Step | Variable or Selection | Test Cases |
|---|---|---|
| Step 1: User Input Modality | Text description, voice audio recording, file attachments | TC-UC2-01, TC-UC2-02, TC-UC2-03, TC-UC2-07 |
| Step 2: Audio Recording Capture | `MediaRecorder` API, mic permission, audio blob duration | TC-UC2-07 |
| Step 3: Attachment Size & Format | Technical datasheet PDF (10 MB ceiling), image files | TC-UC2-03, TC-UC2-04 |
| Step 4: AI Backend Dispatch | Endpoint `/api/ai/chat`, active part index context | TC-UC2-02, TC-UC2-03 |
| Step 5: Structured Proposal Generation | Markdown sections (`---FACTS---`, `---QUESTIONS---`), JSON proposal | TC-UC2-01, TC-UC2-02, TC-UC2-03 |
| Step 6: Diff Comparison Card | Proposed vs. current value comparison rendering | TC-UC2-01, TC-UC2-02, TC-UC2-08 |
| Step 7: Apply Changes Execution | Auto-save to Firestore, form input refresh | TC-UC2-02, TC-UC2-03 |
| Step 8: Image Action Proposal | `suggestedAction: 'assign_image'` targeting part index | TC-UC2-05 |
| Step 9: Technical Query Delegation | `suggestedAction: 'ask_support'` forwarded to `/api/support-chat` | TC-UC2-06 |
| Step 10: Proposal Concurrency | Multiple sequential prompts, superseded state | TC-UC2-08 |

---

## 2. System Test Cases (ZOMBEE)

### TC-UC2-01: Conversational Query with Zero Field Proposals [Zero]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 1.1 | Chat Pane Trigger | Open AI Assistant chat pane | Chat feed and input textarea render | [Pending] | Pending | ZOMBEE: Zero. Ensures conversational queries do not create ghost diff cards. |
| 1.2 | Text Input | Prompt: *"What is an EU-pallet and how does it fit bin picking?"* | Text appears in input | [Pending] | Pending | Conversational question |
| 1.3 | Send Action | Click "Send" (or press Enter) | User bubble appears; loading indicator activates | [Pending] | Pending | Dispatches to AI backend |
| 1.4 | Response Rendering | AI Markdown response | Explains EU-pallet dimensions (1200x800mm); no JSON block is emitted | [Pending] | Pending | Verifies textual output |
| 1.5 | UI Diff Card Check | Inspect chat feed | No "Apply Proposed Changes" diff card is rendered | [Pending] | Pending | Confirms zero changes proposed |
| 1.6 | Questionnaire State | Step 0 & Part fields | All form values remain completely unmodified | [Pending] | Pending | Verifies state immutability |

---

### TC-UC2-02: Single Field Extraction and Application via Text [One]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 2.1 | Context Selection | Set active tab to Part 1 | Active part index is 0 | [Pending] | Pending | ZOMBEE: One. Validates isolated single-field update via natural language. |
| 2.2 | Text Input | Prompt: *"The part weight is exactly 4.5kg."* | Text entered in input | [Pending] | Pending | Single parameter statement |
| 2.3 | Send Action | Click "Send" | AI returns response with JSON block proposing `{ parts: [{ weight: 4.5 }] }` | [Pending] | Pending | Verifies targeted extraction |
| 2.4 | Diff Card Inspection | Diff Card rendered | Displays Part 1 Weight: Current (Empty) -> Proposed ("4.5 kg") | [Pending] | Pending | Verifies visual diff display |
| 2.5 | Action Button | Click "Apply Changes" | Part 1 weight input populates with "4.5"; Firestore auto-saves; card marks "Applied" | [Pending] | Pending | Confirms state application and persistence |

---

### TC-UC2-03: Bulk Multimodal Field Extraction from Technical PDF [Many]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 3.1 | Attachment Input | Attach technical PDF datasheet (3 pages, 1.2 MB) | PDF chip displays in chat attachment tray | [Pending] | Pending | ZOMBEE: Many. Catches multi-field parsing and payload timeouts. |
| 3.2 | Text Input | Prompt: *"Extract all cell dimensions, robot model, and part properties from this sheet."* | Text entered alongside PDF attachment | [Pending] | Pending | Multi-parameter extraction prompt |
| 3.3 | Send Action | Click "Send" | File and prompt sent to `/api/ai/chat` | [Pending] | Pending | Verifies multimodal dispatch |
| 3.4 | Multi-Field Proposal | AI Response Diff Card | Diff card proposes: bin type, bin dimensions (1200x800x600), robot ("UR10e"), part material ("Steel"), weight ("3.2 kg") | [Pending] | Pending | Verifies multiple field extraction across scopes |
| 3.5 | Apply Action | Click "Apply Changes" | All corresponding inputs update across Step 0 and Part 1; Firestore auto-saves | [Pending] | Pending | Confirms bulk persistence |

---

### TC-UC2-04: AI Attachment Size Boundary Ceiling (10 MB Limit) [Boundary]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 4.1 | File Upload (Valid Boundary) | Attach PDF file of 9.9 MB | Attachment accepted; appears in chat tray | [Pending] | Pending | ZOMBEE: Boundary. Catches server 413 payload exhaustion errors. |
| 4.2 | File Upload (Exceeded Boundary) | Attach PDF file of 10.1 MB | Upload rejected immediately; alert displays: *"File exceeds the 10 MB attachment limit."* | [Pending] | Pending | Verifies client-side size ceiling |
| 4.3 | Dispatch Protection | Inspect network tab | No payload dispatched to `/api/ai/chat` for rejected file | [Pending] | Pending | Prevents cloud function crash |

---

### TC-UC2-05: Image Action Proposal Partition (`assign_image`) [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 5.1 | Image Attachment | Attach `part_sample.jpg` in AI chat | Image thumbnail renders in chat input tray | [Pending] | Pending | ZOMBEE: Equivalence. Validates image action routing logic. |
| 5.2 | Prompt Input | Prompt: *"Use this photo for Part 1."* | Text entered | [Pending] | Pending | Action command |
| 5.3 | Proposal Output | AI JSON response | Proposal includes `{ suggestedAction: 'assign_image', partIndex: 0 }` | [Pending] | Pending | Verifies action schema |
| 5.4 | Diff Card Display | Inspect Diff Card | Renders image thumbnail targeted for Part #1 Visual Evidence | [Pending] | Pending | Checks visual evidence preview |
| 5.5 | Apply Action | Click "Apply Changes" | Image appended to `parts[0].images`; visible in Part 1 Visual Evidence gallery | [Pending] | Pending | Verifies array update and storage |

---

### TC-UC2-06: Technical Query Delegation (`ask_support`) [Equivalence Partitioning]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 6.1 | Text Input | Prompt: *"Does Scape Mini support structured light cameras at 1.5m distance?"* | Text entered | [Pending] | Pending | ZOMBEE: Equivalence. Tests support routing equivalence partition. |
| 6.2 | Primary AI Analysis | Inspect backend response | Primary AI classifies technical question; outputs `{ suggestedAction: 'ask_support' }` | [Pending] | Pending | Verifies intent classification |
| 6.3 | Delegation Call | Network dispatch | System forwards query to `/api/support-chat` | [Pending] | Pending | Validates proxy delegation |
| 6.4 | Chat Feed Display | Response message bubble | Renders dedicated **Support AI** bubble quoting official camera operating distances | [Pending] | Pending | Verifies distinct styling and accurate data |

---

### TC-UC2-07: Audio Permission Denied / Empty Capture [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 7.1 | Microphone Permission Block | Set browser mic permission to "Blocked" | Permission blocked in browser settings | [Pending] | Pending | ZOMBEE: Exception. Catches unhandled audio capture crashes. |
| 7.2 | Audio Trigger | Click microphone icon | System catches error; displays toast: *"Microphone access denied. Please enable in browser settings."* | [Pending] | Pending | Graceful failure check |
| 7.3 | Empty Audio Duration | Allow mic; click record and stop after 0.05s | System detects empty buffer (< 0.1s); alerts *"Recording was too short"* | [Pending] | Pending | Prevents 0-byte audio dispatch |
| 7.4 | Input UI State | Inspect chat controls | Microphone button resets to inactive; text input remains fully usable | [Pending] | Pending | UI does not get stuck in recording state |

---

### TC-UC2-08: Superseded Proposal Card Invalidation [Exceptions]

| Step Number | Variable or Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
|---|---|---|---|---|---|---|
| 8.1 | First Prompt | Prompt 1: *"Part weight is 2kg."* | Diff Card 1 renders proposing `weight: 2` | [Pending] | Pending | ZOMBEE: Exception. Catches race conditions and stale state overwrites. |
| 8.2 | Interleaving Prompt | Send Prompt 2: *"Actually, part weight is 5kg."* without clicking Apply on Card 1 | Diff Card 2 renders proposing `weight: 5` | [Pending] | Pending | Sends conflicting prompt |
| 8.3 | Card 1 State | Inspect Diff Card 1 | Diff Card 1 updates to "Superseded" with "Apply" button disabled | [Pending] | Pending | Invalidates stale proposal |
| 8.4 | Card 2 State | Click "Apply Changes" on Diff Card 2 | Part weight updates to "5"; Card 2 marks "Applied" | [Pending] | Pending | Confirms only freshest state can be applied |
