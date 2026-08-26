# Project To-Do List

This document tracks actionable tasks and fixes derived from recent testing feedback (Rene's email correspondence).

## High Priority Fixes & UI Updates

- [x] **Rename Terminology:**
  - UI element renamed to "Project Information Advice".
  - Ensure references to "Data Capture" in user-facing text are updated to "Scape Bin-Picker Projects" where appropriate.

- [x] **Cycle Time Clarification:**
  - **Løsning:** Opdateret felt `2.05` ("Average Cycle Time Based On") i `questionnaire.ts` med en dropdown, hvor brugeren eksplicit kan vælge mellem *"Average Cycle Time (Across full bin)"*, *"Absolute Maximum Cycle Time (Line sync limit)"*, *"1 shift target"*, m.fl.

- [x] **Placement Requirements (Image Upload):**
  - Add functionality to allow users to upload images for "Short description of place requirements" (field 2.12). It is often easier to provide a photo of the destination fixture/machine than to describe it in words.

- [x] **CAD File Upload UX:**
  - **Drag and Drop:** Fix the drag-and-drop area for CAD files so that dropping a file (e.g., .stp) properly attaches it to the form. *(Husk JS-validering i onDrop)*
  - **File Size/Format Guidance:** Update the UI text around the 200 KB limit to clearly instruct users that if their CAD file is too large, they should instead upload screenshots/images of the CAD model from different angles.
  
- [x] **Image File Upload UX:**
  - **Drag and Drop**: Fix the drag-and-drop area for image files so that dropping a file properly attaches it to the form instead of useing a file browser. *(Husk JS-validering i onDrop)*
- [x] **Delete Image Safeguard:** Add a confirmation modal when deleting any uploaded image (project‑level or part‑level). Require explicit user confirmation (e.g., type “delete” or click a second confirm button) to avoid accidental deletions.

- [x] **Bin Dimensions "Best Guess":**
  - **Løsning:** Tilføjet et "Approximate / Best guess measurement" afkrydsningsfelt ud for kassedimensionerne (`1.04_w`, `1.04_l`, `1.04_h`).

- [x] **Clean Up Hardcoded Whitelists:**
  - **Løsning:** Fjernet de forældede `ALLOWED_EVALUATORS` og `SUPERUSERS` e-mail arrays fra `src/config/evaluators.ts`, da Firestore dynamic config nu styrer tilladelser 100%.

- [x] **Delete Project Safeguard:**
  - Update the delete project confirmation modal to require the user to explicitly type the project name (or a specific confirmation phrase) before the delete action can succeed, to prevent accidental deletions.

- [x] **Project History Spam & Roles:**
  - **Overactive Logging:** The `saveProject` function in `useProjects.ts` currently logs "Status updated to [status]" on *every* auto-save, resulting in massive spam. Change the logic so it only logs a status update if the status actually *changed* from its previous state.
  - **Include User Roles:** Update the `logChange` payload to include the user's role (`profile?.role`). Then update the UI (e.g., `HistoryModal.tsx`) to display the role alongside the name (e.g., "User: Demo 1 (Evaluator)").
  - **Log Actual Changes (Diffing):** Implement logic in `saveProject` to compare the new data against the existing project state and log *what* was actually changed (e.g., "Updated bin dimensions", "Added new part", "Uploaded image").

- [x] **Image Lightbox / Enlarge:**
  - Implement a feature where clicking on any uploaded image (both general cell images and part images) opens it in a larger popup/lightbox overlay, allowing users and evaluators to inspect image details easily.

## Nye Opgaver (Fra Møde / Input)

### Gennemførte Opgaver (Completed)
- [x] **Navneændring:**
  - Omdøb appens navn og alle relevante steder i teksten til: **Scape Bin-Picker Projects**.
- [x] **Terms of Service (ToS) / Onboarding:**
  - Opret en ToS, der vises ved første login og kan genfindes under INFO-teksten.
- [x] **Infrastruktur & Cloud Run Optimering (Eliminer Cold Starts):**
  - Hold mindst 1 instans kørende med CPU throttling aktiveret (hybrid model) i `deploy.sh`.
- [x] **CAD-filformater for felt [2.06]:**
  - Opdater beskrivelsen af felt `2.06` i `src/questionnaire.ts` og fil-validatoren i `src/views/QuestionnaireView.tsx` til kun at tillade STL, STEP/STP og IGS/IGES (ekskluder DWG/DXF).

---

### BUNDLE 1: AI Auto-fill State & Conflict Management (AI Logik & Data)
*Opgaver vedrørende AI-assistentens dataudtrækning, prioritering af manuelle valg fremfor historik, samt fejlfinding af forudindtagede svar og data-degradering.*

- [x] **Konflikthåndtering mellem manuelle input og AI-opdateringer:**
  - **Løsning:** Implementeret i systemInstruction (`DATA DISCREPANCY RULE FOR CHAT HISTORY`), stript af gamle JSON-blokke fra historik, samt visuel advarsels-badge (`⚠️ Overwrites manual value`) med rose-farve ved AI-forslag på manuelle felter.
- [x] **AI-markering af 'kritiske' felter og gen-evaluering:**
  - **Løsning (Option B):** Implementeret i `QuestionnaireView.tsx`. Når brugeren retter et felt med et felt-badge, skifter badget automatisk status fra `🔴 Critical` / `⚠️ Note` til et blåt `✏️ Modified (Re-evaluate)` badge med forklaring om at gen-generere rapporten under *Scape Review* for opdateret vurdering.
- [x] **AI-forsøg på uventet at nulstille felt [2.11] (Bug):**
  - **Løsning:** Løst i `autoFillPrompt.md` (v7) ved at tilføje eksplicitte regler om, at AI'en **kun** må returnere felter, der er omtalt eller opdateret i **seneste tur**, og aldrig må foreslå nulstilling/`null` på uomtalte felter.
- [x] **AI-degradering ved stor mængde information / mange emner (Bug / Undersøgelse):**
  - **Løsning:** Håndteret via single-turn JSON extraction i v7 prompten samt i `AIAssistantTab.tsx` ved automatisk fallback-mapping af emne-opdateringer til den aktive part-fane (`activePartIndex`).
- [x] **Afklaring af AI-forvirring omkring cyklustider [2.04]/[2.05]:**
  - **Løsning:** Felt `2.05` er ombygget til en eksplcit `select` dropdown med valgmuligheder (*Average Cycle Time*, *Absolute Maximum Cycle Time*, *1 Shift*, *1 Bin*) i `questionnaire.ts` og `autoFillPrompt.md`, så numerisk cyklustid (`2.04`) og beregningsgrundlag (`2.05`) er helt adskilt.
- [x] **Automatisk oprettelse af emner ud fra felt [1.02]:**
  - **Løsning:** Implementeret real-time registrering af felt `1.02` samt en Prompt Banner i UI med knappen `+ Add X Parts` til hurtigt at udvide emne-fanerne.
- [x] **Historik og visualisering af AI-bekræftelser:**
  - **Løsning:** Implementeret feltnummerering (`[1.05]`) i FACTS/QUESTIONS i chatten, samt gule forslagskort i `AIAssistantTab.tsx` med direkte felt-sammenligning (Før vs. Efter) og redigerbare felter inden godkendelse.

---

### BUNDLE 2: Split-Screen & AI UI Layout Optimizations (Brugerflade & Chat)
*Opgaver vedrørende layout, synlighed og fleksibilitet, når man arbejder i split-screen AI-visningen.*

- [x] **Justerbar bredde i split-screen visning (UX forbedring):**
  - **Løsning:** Tilføjet et lodret træk-håndtag (drag-handle med `GripVertical` ikon) mellem AI-panelet og skema-panelet i `QuestionnaireView.tsx`, så brugeren frit kan trække og tilpasse panelbredden.
- [x] **Større indtastningsfelt til AI-assistent (UX forbedring):**
  - **Løsning:** Implementeret auto-ekspanderende `textarea` i `AIAssistantTab.tsx` med understøttelse af `Enter` til skiftelinje.
- [x] **Synlighed af aktivt projektnavn i AI-mode (UX forbedring):**
  - **Løsning:** Tilføjet et fremtrædende projektnavn-badge (`📁 Project Name`) øverst i AI Assistant panelet.
- [x] **Ensrettet skift mellem AI-mode og Manuel-mode (UX forbedring):**
  - **Løsning:** Tilføjet automatisk lukning af AI-panelet ved udløserord som "done", "finished", "jeg er færdig", samt fast toggle-knap.
- [x] **Visning af Project Information Advice / AI Review (UX undersøgelse):**
  - **Løsning:** AI-evalueringsrapporten (Advice) kan tilgås og gennemgås direkte via `Scape Review` sektionsvelgeren i spørgeskemaet.
- [ ] **Fejlfinding af app-crash ved oprettelse af +6 emner via AI (Bug):**
  - **Udfordring:** Hjemmesiden crasher/fryser af og til, når man forsøger at oprette mere end 6 emner på én gang via AI-assistenten. Skal undersøges for uendelige render-loops eller Firestore batch-begrænsninger.

---

### BUNDLE 3: Questionnaire UI & Field Label Improvements (Spørgeskema UX)
*Forbedringer af spørgeskemaets felter, infobokse og generelle UI-adfærd.*

- [x] **Vis/skjul og placering af felt-numre (UX forbedring):**
  - **Løsning:** Feltnumre er nu placeret efter label-teksten (f.eks. "Project Name [1.01]"), og der er tilføjet en `Show Field IDs` / `Hide Field IDs` toggle-knap øverst i formularen.
- [x] **Forklarende hjælpe-noter på felter (UX forbedring):**
  - **Løsning:** Oprettet central `src/docs/fieldExplanations.ts` fil med **Kort** og **Lang** teknisk forklaring for alle felter. Tilføjet et cirkulært info-ikon `(i)` ud for **ALLE felter**, som åbner en popup med mulighed for at skifte mellem kort opsummering og dybdegående teknisk vejledning (`Read Detailed Guidance →`).
- [x] **Bedre lukning af "CRITICAL" og "NOTE" popups (UX forbedring):**
  - **Løsning:** Implementeret "click outside"-håndtering, så både infobobler og advarselspopups lukker automatisk ved klik et vilkårligt andet sted på skærmen.
- [x] **Fast placering af Dashboard-knap (UX forbedring):**
  - **Løsning:** Dashboard-knappen har en fast, fremtrædende placering lige ved siden af Scape Info-logoet i Headeren på tværs af alle brugertyper.
- [x] **Cardboard box i dropdown:**
  - **Løsning:** Tilføjet `"Cardboard Box"` som en tilgængelig kassetype under felt `1.03` i `questionnaire.ts` og `autoFillPrompt.md`.
- [x] **Høj-synlig sektions-velger & Horisontal scroll-liste i smal/split-screen tilstand:**
  - **Løsning:** Opgraderet sektions-velgeren i smal/split-screen tilstand med en Indigo Accent Pill, fremskridts-badges (`2/9`) og en 1-tap horisontal scrollbar indeholdende alle sektioner (*Project Info*, *Parts*, *Business Case*, *Additional Opportunities*, *Submit*, *Scape Review*).
- [x] **Nyt design til "+ Add Another Part" knap:**
  - **Løsning:** Omdesignet knappen til at matche `Part #X` sektions-overskrifterne (f.eks. `Part #3: + Add New Part`) med stiplet kasselayout.

---

### BUNDLE 4: Dual-AI System & Technical Support Architecture (Support & Arkitektur)
*Strukturering af kontekstuel hjælpe-AI til app-support og teknisk domæne-viden uden forurensning af Evaluator-prompten.*

- [x] **Dual-AI System (Context-Aware App Support & Technical Guidance):**
  - **Løsning:** Implementeret i `server.js` (`/api/support-chat`), `autoFillPrompt.md` (v8 `suggestedAction: ask_support`), `App.tsx` og `AIAssistantTab.tsx`. Support-AI'en samler dynamisk sin viden fra `appHelpGuide.md` og `fieldExplanations.ts` uden prompt-sprawl. Support-svar vises med et særskilt `💡 App & Technical Support` badge og opretholder en uafhængig `supportChatHistory`.

---

### Øvrige Opgaver

- [ ] **Multi-language app:**
  - Gør applikationen multi-language (understøttelse af flere sprog i UI og prompts).
- [x] **Opsamling af ustruktureret AI-data:**
  - **Løsning:** Implementeret via felt `1.06` (Generel projektinformation) og `2.15` (Ekstra emne-information) i `questionnaire.ts` og `autoFillPrompt.md` (v7), hvor ustrukturerede chat-oplysninger opsamles og gemmes i databasen.
- [ ] **Håndtering af udløbet session (UX fejlbesked):**
  - Ryd error states ved login/logout, og fang udløbne tokens (auth/id-token-expired) for at redirecte pænt med en klar besked ("Session udløbet") i stedet for en rå databasefejl.
- [ ] **Budget & Alarmer:**
  - Sæt et loft på Gemini og Firebase på 5.000 DKK, hvorefter der skal udløses en alarm. *(Dette skal opsættes direkte i Google Cloud Console).*
- [ ] **Udvidede Brugertyper (Roller):**
  - Udvid til 4 roller: Slutbruger, Integrator, Evaluator, Scape Sælger.
- [ ] **Oprydning af Rolletildeling & Brugeradministration (Option B):**
  - Fjern allowedDomains/allowedEmails. Gem roller i `/users/{uid}`. Tilføj en brugeradministrationsside til Super Users.
- [ ] **Notifikationssystem:**
  - Send mails/notifikationer til sælgere ved oprettelse og afsendelse af evalueringer.
- [ ] **Erfarings-referencer for Evaluators:**
  - Tillad evaluators at uploade/linke interne erfaringsdokumenter med begrænset adgangskontrol.
- [ ] **Samarbejde & Projektdeling (Collaboration & Sharing):**
  - Deling af projekter som Viewers, invitationer via e-mail eller link-lobby, og overførsel af ejerskab. (Se [sharing_rules_analysis.md](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/docs/sharing_rules_analysis.md)).
