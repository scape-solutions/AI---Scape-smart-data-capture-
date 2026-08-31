# System Test Cases: UC2 - AI Auto-fill Chat

This document defines the system test cases for **Use Case 2: Auto-fill Questionnaire using AI Assistant Chat**. It includes the Test Case Allocation Matrix and 8 role-focused manual test cases.

---

## Test Case Allocation Matrix (UC2)

| Step | Variable / Selection | TC1 (Text Auto-fill) | TC2 (Image Assign) | TC3 (General Info) | TC4 (Empty Send) | TC5 (Boundary Chat) | TC6 (Conflict Test) | TC7 (Chat File Edge) | TC8 (Locked State) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **B1** | Action Selection | Open AI Chat | Open AI Chat | Open AI Chat | Open AI Chat | Open AI Chat | Open AI Chat | Open AI Chat | Open AI Chat |
| **B2** | Chat Input Message | `"Bin is 1200x800x600, robot UR"` | `"Assign this image to Part 1"` | `"What is Scape Mini?"` | `[Blank]` | `"Bin is 100x100x100, weight 0.1"` | `"Wait, robot is KUKA now"` | `"Analyze this design"` | `"Try updating bin to 900"` |
| **B3** | Chat Attachment | None | Valid PNG | None | None | None | None | Oversized PDF | None |
| **B4** | API Endpoint | `/api/ai/chat` | `/api/ai/chat` | `/api/ai/chat` | blocked locally | `/api/ai/chat` | `/api/ai/chat` | blocked locally | blocked locally (UI) |
| **B5** | AI Response Type | JSON proposal | Image action | Plain text | N/A | Boundary JSON | Conflict JSON | N/A | N/A |
| **B6** | Comparison Card | Rendered | Rendered | Hidden | Hidden | Rendered | Rendered | Hidden | Hidden |
| **B7** | Action Applied | Click Apply | Click Apply | N/A | N/A | Click Apply | Click Apply | N/A | N/A |
| **B8** | Firestore State | Updated | Updated | No change | No change | Updated | Overwritten | No change | Read-only |

---

## Manual Test Cases

### TC1: AI Text Auto-fill (Base Sequence)
* **Actor**: External Partner
* **Purpose**: Verify that entering valid descriptive parameters in the AI chat window generates a correct proposal card and updates the questionnaire upon clicking Apply.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B1 & B2: Chat Input | Open AI Chat panel; Type: `"Our bin is 1200 by 800 and 600 high. We use a Universal Robot."` | Loading indicator is displayed. `/api/ai/chat` endpoint is called. | | | |
| **2** | B5 & B6: AI Response | Plain text answer + Proposal payload | AI responds with text, and renders the **Apply Proposed Changes** card showing the bin dimensions and robot brand. | | | |
| **3** | B7: Apply Action | Click **Apply Changes** | Comparison card disappears. Form fields in General Info update automatically to `1200`, `800`, `600`, and `Universal Robots`. | | | |
| **4** | B8: Firestore verification | Save Draft | Values are saved successfully in the project draft in Firestore. | | | |

---

### TC2: AI Image Assignment (Alternate Sequence)
* **Actor**: External Partner
* **Purpose**: Verify that attaching an image in chat and asking the AI to assign it updates the active part's image array.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B2 & B3: Chat Input | Attach valid PNG; Type: `"Use this image for Part 1"` | Message and image thumbnail are sent to backend. | | | |
| **2** | B5 & B6: Response | Action proposal of type `assign_image` | AI proposes assigning the image. Comparison card lists Part 1 images additions. | | | |
| **3** | B7: Apply Action | Click **Apply Changes** | Image is copied from chat to the Part 1 images array, rendering in the part details gallery. | | | |

---

### TC3: General Question (No Proposal Card)
* **Actor**: External Partner
* **Purpose**: Verify that general questions do not render empty or unnecessary comparison proposal cards.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B2: Chat Input | Type: `"What is a standard EU-pallet?"` and send | Request goes to `/api/ai/chat`. | | | |
| **2** | B5 & B6: Response | Text answer explaining EU-pallet dimensions | AI explains the pallet. No comparison card, apply button, or warnings are rendered in the feed. | | | |

---

### TC4: Empty Chat Input Blocked
* **Actor**: External Partner
* **Purpose**: Verify that the system blocks sending empty messages in the chat interface.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B2: Chat Input | `[Blank]` (or spaces only) | The **Send** button is disabled, or clicking it does not trigger any action. No API calls are made. | | | |

---

### TC5: Boundary Parameters Extraction
* **Actor**: External Partner
* **Purpose**: Verify that the AI correctly parses minimum/maximum boundary parameters from natural text.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B2: Chat Input | `"We have a tiny bin 100x100x100 and a 0.1kg part"` | Gemini processes values successfully. | | | |
| **2** | B5 & B6: Response | Proposal JSON with minimum boundary values | Comparison card lists proposed values: dimensions = `100`, weight = `0.1`. | | | |
| **3** | B7: Apply Action | Click **Apply Changes** | Values are successfully copied into the form fields. | | | |

---

### TC6: Conflict Resolution / Overwrite
* **Actor**: External Partner
* **Purpose**: Verify that applying a new AI proposal correctly overwrites previous form values.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Robot brand in form is `"Universal Robots"` | Current state is loaded in memory. | | | |
| **2** | B2: Chat Input | `"Actually we changed the robot, it's KUKA now."` | Request is processed. | | | |
| **3** | B6: Response | Proposal JSON updating `robotBrand` to `KUKA` | Comparison card displays old value (`Universal Robots`) vs new proposed value (`KUKA`). | | | |
| **4** | B7: Apply Action | Click **Apply Changes** | Form field updates to `KUKA`. Old value is replaced. | | | |

---

### TC7: Chat File Upload Edge Cases
* **Actor**: External Partner
* **Purpose**: Verify that sending unsupported or oversized files in the chat panel is blocked.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | B3: Chat Attachment | Attach a `.pdf` file (or text document) | App blocks attachment in the chat input area, displaying: `"Only PNG, JPG, and JPEG images can be uploaded to chat."` | | | |

---

### TC8: Locked Case - AI Apply Blocked
* **Actors**: External Partner & Scape App Engineer
* **Purpose**: Verify that once a project is submitted and locked, the AI Chat panel is read-only or does not allow changes to be applied.

| Step | Variable / Selection | Value | Expected Result | Actual Result | Pass/Fail | Comments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Precondition | Project is locked (`isLocked == true`) | Project details page is in view. | | | |
| **2** | B1: Action | Open AI Chat Panel | The chat input box is disabled/hidden, or it displays: `"This project is locked. AI chat is read-only."` | | | |
| **3** | B7: UI Check | Apply changes | No comparison card or "Apply Changes" button can be rendered or clicked. | | | |
