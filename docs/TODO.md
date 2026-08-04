# Project To-Do List

This document tracks actionable tasks and fixes derived from recent testing feedback (Rene's email correspondence).

## High Priority Fixes & UI Updates

- [x] **Rename Terminology:**
  - UI element renamed to "Project Information Advice".
  - Ensure references to "Data Capture" in user-facing text are updated to "Scape Bin-Picker Projects" where appropriate.

- [ ] **Cycle Time Clarification:**
  - Update the "Average Cycle Time Based On" field (2.05) or add a selector to allow the user to explicitly define if their requirement is an "Absolute maximum cycle time" or an "Average cycle time".

- [x] **Placement Requirements (Image Upload):**
  - Add functionality to allow users to upload images for "Short description of place requirements" (field 2.12). It is often easier to provide a photo of the destination fixture/machine than to describe it in words.

- [x] **CAD File Upload UX:**
  - **Drag and Drop:** Fix the drag-and-drop area for CAD files so that dropping a file (e.g., .stp) properly attaches it to the form. *(Husk JS-validering i onDrop)*
  - **File Size/Format Guidance:** Update the UI text around the 200 KB limit to clearly instruct users that if their CAD file is too large, they should instead upload screenshots/images of the CAD model from different angles.
  
- [x] **Image File Upload UX:**
  - **Drag and Drop**: Fix the drag-and-drop area for image files so that dropping a file properly attaches it to the form instead of useing a file browser. *(Husk JS-validering i onDrop)*
- [x] **Delete Image Safeguard:** Add a confirmation modal when deleting any uploaded image (project‑level or part‑level). Require explicit user confirmation (e.g., type “delete” or click a second confirm button) to avoid accidental deletions.

- [ ] **Bin Dimensions "Best Guess":**
  - Add a "Best guess" or "Approximate" checkbox next to the bin dimension fields for cases where the customer does not have exact measurements.

- [ ] **Clean Up Hardcoded Whitelists:**
  - Remove the hardcoded fallback arrays (`ALLOWED_EVALUATORS` and `SUPERUSERS`) in `src/config/evaluators.ts`. Now that Firestore dynamic configuration is fully functional, these local fallbacks pose a minor privacy leak and are obsolete.

- [x] **Delete Project Safeguard:**
  - Update the delete project confirmation modal to require the user to explicitly type the project name (or a specific confirmation phrase) before the delete action can succeed, to prevent accidental deletions.

- [x] **Project History Spam & Roles:**
  - **Overactive Logging:** The `saveProject` function in `useProjects.ts` currently logs "Status updated to [status]" on *every* auto-save, resulting in massive spam. Change the logic so it only logs a status update if the status actually *changed* from its previous state.
  - **Include User Roles:** Update the `logChange` payload to include the user's role (`profile?.role`). Then update the UI (e.g., `HistoryModal.tsx`) to display the role alongside the name (e.g., "User: Demo 1 (Evaluator)").
  - **Log Actual Changes (Diffing):** Implement logic in `saveProject` to compare the new data against the existing project state and log *what* was actually changed (e.g., "Updated bin dimensions", "Added new part", "Uploaded image").

- [x] **Image Lightbox / Enlarge:**
  - Implement a feature where clicking on any uploaded image (both general cell images and part images) opens it in a larger popup/lightbox overlay, allowing users and evaluators to inspect image details easily.

## Future / Architecture Ideas

- [ ] **Dual-AI System (Context-Aware App Support)**
  - **Concept:** Create a two-agent architecture to handle both Bin-Picking evaluation and App Support without polluting the main prompt.
  - **Implementation Strategy:**
    1. Keep the main AI ("The Evaluator") focused entirely on bin-picking.
    2. Add a system prompt rule to The Evaluator: *"If the user asks a technical question about the app interface (e.g. 'how do I print', 'where is the submit button'), output the JSON action: `{"suggestedAction": "ask_support", "query": "..."}`"*.
    3. When the React frontend intercepts this JSON action, it suppresses the message and instead forwards the `query` to a *second* Gemini endpoint ("The Support AI").
    4. The Support AI is equipped with a large, detailed user manual containing all app documentation, troubleshooting steps, and UI explanations.
    5. The response from the Support AI is displayed in the chat interface.
  - **Benefits:** Prevents role-confusion (hallucination) in the main evaluator AI, keeps the core evaluator fast and cheap, and allows unlimited documentation scaling for app support.

## Nye Opgaver (Fra Møde / Input)

- [x] **Navneændring:**
  - Omdøb appens navn og alle relevante steder i teksten til: **Scape Bin-Picker Projects**.

- [ ] **Cardboard box i dropdown:**
  - Tilføj "Cardboard box" som en valgmulighed i "Bin type" dropdown-menuen.

- [ ] **Multi-language app:**
  - Gør applikationen multi-language (understøttelse af flere sprog i UI og prompts).

- [ ] **Budget & Alarmer:**
  - Sæt et loft på Gemini og Firebase på 5.000 DKK, hvorefter der skal udløses en alarm. *(Dette skal opsættes direkte i Google Cloud Console).*

- [x] **Terms of Service (ToS) / Onboarding:**
  - Opret en ToS, der vises ved første login og kan genfindes under INFO-teksten.
  - **Indhold:**
    - Data bruges udelukkende af parterne (end-user, integrator og Scape Solutions).
    - Data bruges til træning, men anonymiseres, så det aldrig kan spores tilbage til et specifikt projekt.
    - Giv kun den lovpligtige information, som gør kunderne trygge.
    - Appen stilles til rådighed uden forpligtelser fra Scape Solutions' side.
    - Ansvarsfraskrivelse (Disclaimer) ift. AI "run aways" (at AI'en kan love noget forkert). Det skal stå soleklart, at AI'en *kun* bruges til dataindsamling. Feasibility-svar og løfter gives *altid* af en Scape Solutions-medarbejder.

- [ ] **Udvidede Brugertyper (Roller):**
  - Udvid systemet til at håndtere 4 distinkte roller:
    1. Slutbruger (End-user)
    2. Integrator
    3. Evaluator
    4. Scape Sælger (Sales)

- [ ] **Oprydning af Rolletildeling & Brugeradministration (Option B):**
  - **Mål:** Fjern domæne-baseret og e-mail-baseret automatisk tildeling (`allowedDomains` og `allowedEmails`). Gør alle brugere til standard-kunder (`user`) ved oprettelse, og lad en Super User administrere roller direkte i appen.
  - **Ændringer i Datamodel & Firestore:**
    * Brugerens rolle gemmes som `requestedRole: 'user' | 'evaluator' | 'superuser'` (og eventuelt `'sales'`) i `/users/{uid}`.
    * Rollen gemmes synkront i `config/access` (i `allowedEvaluators` og `superusers` arrays), så man altid kan nød-redigere eller genskabe adgang manuelt i Firestore Console (GCP).
    * Sikkerhed: Opdater `firestore.rules`, så almindelige brugere ikke selv kan rette i deres `requestedRole` eller `isAdmin` felter på `/users/{uid}`. Kun Super Users må opdatere andres roller.
  - **Sikkerhedsregler (Firestore Rules):**
    * Opdater `isScape()` og `isAdmin()` i reglerne til at slå rollen op på brugerens profildokument `/users/{userId}` i stedet for at tjekke `@scapesolutions.eu` e-mail-domænet.
  - **Brugerflade (UI) - Brugeradministration:**
    * Tilføj et nyt **"Brugeradministration" (User Management)** skærmbillede under Super User Tools.
    * Panelet skal hente og vise en liste (tabel) over alle registrerede brugere fra `/users` med:
      - Navn og E-mail.
      - Nuværende rolle.
      - En dropdown/select til at skifte brugerens rolle.
      - Knap til at gemme ændringerne (skriver til `/users/{uid}` og opdaterer `config/access` synkront).
    * Sikkerhed i UI: Forhindr at den aktive Super User kan nedgradere sin egen rolle (knappen deaktiveres for ens egen bruger) for at undgå lockout.

- [ ] **Notifikationssystem:**
  - Opsæt et regelsæt/liste over, hvem der får notifikationer ved bestemte hændelser.
  - Sælgere (bestemte eller alle) skal have besked, når et nyt projekt submittes.
  - Sælgere skal have besked, når der sendes et svar/evaluering tilbage til integratoren (så evaluator og sælger kan tale sammen inden afsendelse).

- [ ] **Erfarings-referencer for Evaluators:**
  - Giv Evaluator mulighed for at linke til (eller uploade filer) med tidligere erfaringer, der understøtter evalueringsresultatet.
  - Implementér adgangskontrol, så det er tydeligt og styret, *hvem* der må se denne interne reference-information.

- [ ] **Samarbejde & Projektdeling (Collaboration & Sharing):**
  - **Reference:** Se detaljeret arkitektur og test-eksempler i [sharing_rules_analysis.md](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/docs/sharing_rules_analysis.md).
  - **Mål:** Tillad at dele et projekt med andre brugere som "Viewers" (læseadgang) via Option B (separat `/joinRequests` samling for at holde sikkerhedsreglerne simple og fejlsikre). Ejeren har skriveadgang og kan overføre ejerskab.
  - **Datamodel (Firestore):**
    - Projekt-dokument:
      * `sharedViewers: string[]` (liste over UIDs med godkendt læseadgang).
      * `shareToken: string` (unik token til link-deling).
    - Ny rod-samling `/joinRequests/{requestId}` (hvor ID f.eks. er `projectId_userId`):
      * `projectId: string` (projektets ID).
      * `userId: string` (UID på anmoderen).
      * `userEmail: string` (anmoderens e-mail).
      * `userName: string` (anmoderens navn).
      * `status: string` (`'pending'`).
  - **Invitationer & Adgangskontrol (Metode A & B):**
    - **Metode A (E-mail):** Ejeren indtaster en e-mail. Hvis kontoen findes, tilføjes brugerens UID med det samme til `sharedViewers`.
    - **Metode B (Link med godkendelses-lobby):** Ejeren kan generere et unikt delingslink (f.eks. `/join-project/123?token=abc`). Når en anden bruger klikker på linket og logger ind, opretter de et dokument i `/joinRequests` samlingen. Brugeren får først adgang, når ejeren godkender anmodningen.
  - **Overførsel af ejerskab (Transfer):**
    - Ejeren kan overføre sit ejerskab (`userId` ændres til den nye ejers UID) til en af de godkendte Viewers.
    - Den gamle ejer flyttes automatisk over i `sharedViewers`-listen, så de bevarer deres læseadgang.
    - Hver overførsel registreres og logges automatisk i projektets historik (`changelog`), så evaluatoren altid kan se det.
  - **Sikkerhedsregler (Firestore Rules):**
    - Projekt-regler: Læseadgang tillades for ejeren og brugere i `sharedViewers`. Skriveadgang tillades *kun* for ejeren (`userId == request.auth.uid`).
    - JoinRequests-regler: Oprettelse tillades for den loggede bruger selv. Læsning og sletning tillades for anmoderen selv samt ejeren af det tilknyttede projekt.
  - **Brugerflade (UI):**
    - Tilføj en "Share Project" knap på projektkortet/dashboardet, der åbner dele-modalen.
    - Modalen skal:
      * Liste nuværende Viewers (med mulighed for at fjerne dem).
      * Vise anmodninger fra `/joinRequests` (hvor `projectId == currentProject.id`), så ejeren kan Godkende (tilføjer UID til `sharedViewers` og sletter anmodnings-dokumentet) eller Afvise (sletter anmodnings-dokumentet).
      * Generere/kopiere delingslinket.
      * Have en "Make Owner" (Transfer) knap ud for hver Viewer.
    - Delte projekter skal vises på dashboardet for Viewers med en tydelig "Shared" status eller i en separat fane, og åbnes i en tvungen read-only tilstand.

- [x] **Infrastruktur & Cloud Run Optimering (Eliminer Cold Starts) - *Gennemført via Model C (Hybrid)*:**
  - **Udfordring:** Cloud Run skalerer pt. ned til 0 instanser ved inaktivitet, hvilket medfører 5-10 sekunders ventetid ("cold start") ved det første besøg efter noget tid.
  - **Valg:** Model C (Hybrid) med `--min-instances=1` og CPU throttling aktiveret. Dette fjerner cold starts helt for den første bruger, men CPU sættes i dvale ved inaktivitet, hvilket koster under 45 DKK/måned for 1 GB RAM i stedet for ~400 DKK/måned.
  - **Løsning:**
    * Opdateret `deploy.sh` til at holde mindst 1 instans kørende:
      ```bash
      gcloud run deploy scape-evaluator \
        --image europe-west3-docker.pkg.dev/scape-data-capture/scape-evaluator/scape-evaluator:latest \
        --platform managed \
        --region europe-west3 \
        --allow-unauthenticated \
        --min-instances=1 \
        --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest,GOOGLE_OAUTH_CLIENT_SECRET=GOOGLE_OAUTH_CLIENT_SECRET:latest"
      ```
