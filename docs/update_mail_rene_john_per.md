# Opdatering på test af Scape Data Capture

**Til:** Rene Dencker Eriksen, John, Per
**Emne:** Opdatering på Scape Data Capture App & Test

Hej alle,

Tak for den indledende test og feedback hen over weekenden. Jeg har arbejdet på at løse de problemer, I stødte på, og jeg vil gerne give en hurtig opdatering på, hvor vi står, og hvordan appen fungerer bag kulisserne.

Rene, tak for den detaljerede feedback! Baseret på dine kommentarer er her en opsummering af, hvordan vi håndterer de vigtigste punkter, samt en præcisering af nogle af appens koncepter:

*   **User vs. Evaluator Mode:** Meget af forvirringen og fejlene stammede fra, at du startede med at dokumentere et projekt, mens du var logget ind som 'Evaluator'. Flowet er designet sådan, at "Users" (brugere) indtaster og indsender projekter, mens "Evaluators" (evaluatorer) gennemgår dem og genererer AI-udkast. Jeg har nu rettet dette, så systemet forhindrer dig i at starte/dokumentere et nyt projekt i Evaluator mode.
*   **Opdatering af terminologi:** Jeg er enig i, at "Data capture" lyder lidt akademisk. Vi omdøber dette til "Bin-Picking Project Information" (og "Bin-Picking Information Advice") for at gøre det helt klart for kunderne, hvad de kigger på.
*   **Håndtering af flere emner (Parts):** Hvis et projekt har flere varianter (f.eks. 8 forskellige emner), så understøtter systemet faktisk dette! Du skal bare bruge knappen "+ add part" til at oprette separate indtastninger for hver variant, i stedet for at presse det hele ind i én emnebeskrivelse. AI'en vil derefter evaluere dem korrekt.
*   **Cyklustider & Tolerancer:** Vi vil opdatere felterne til cyklustid, så brugerne tydeligt kan skelne mellem en "Absolut maksimal cyklustid" (Absolute cycle time) og en "Gennemsnitlig cyklustid" (Average cycle time). Vi vil også gøre det tydeligere, hvor man skal beskrive placeringstolerancer og krav.
*   **CAD-filer vs. Billeder:** Den nuværende grænse på 200 KB for CAD-filer er ganske rigtigt for lille til rigtige CAD-modeller. Indtil videre vil vi basere os på, at brugerne uploader screenshots/billeder af deres CAD-modeller i forskellige positioner, hvilket AI'en er ret god til at analysere.
*   **Fil-uploads & Kamera:** På mobiltelefoner bør et klik på upload-boksen give dig mulighed for at tage et billede direkte med dit kamera eller vælge fra dit galleri. Vi vil også se på at forbedre drag-and-drop funktionen til fil-uploads på computeren, så filerne ikke ved et uheld åbnes i en ny fane.

---

### Oversigt over App-koncepter & Workflows

For at give jer et bedre overblik over, hvordan appen er bygget op, er her kernekoncepterne og de typiske brugerrejser (handlingsflows):

**1. Roller og Adgang**
*   **Users (Kunder/Partnere):** Kan kun se, oprette og indsende deres egne projekter.
*   **Evaluators (Scape-medarbejdere):** Har adgang til Scape Dashboardet for at se alle indsendte projekter, tildele projekter til sig selv og generere interne AI-evalueringer.
*   **Superusers (Admin):** Har fuld synlighed over alle projekter, udkast og systemindstillinger.
*   *Bemærkning om Login:* Appen bruger Google Auth. Selv hvis du logger ind via et alias (`rde@...`), leverer Google din primære e-mail. Vores system mapper sikkert begge dele, så du øjeblikkeligt får din dynamiske rolle fra den sikre database.

**2. Kernekoncepter**
*   **Projects & Parts:** Et enkelt "Project" (projekt) repræsenterer en kundeforespørgsel. Et projekt kan indeholde flere "Parts" (emner), hvis kunden har brug for at plukke forskellige emner i samme kasse eller celle.
*   **AI Data Capture Advice:** Et AI-genereret tjek (sanity check), som er synligt for *User* (brugeren), mens de udfylder formularen. Det hjælper dem med at forstå, om de har overset kritisk information (som f.eks. kassens dimensioner), inden de indsender.
*   **AI Chat Assistent (Sidebjælken):** En interaktiv multimodal chat, hvor brugeren kan beskrive deres projekt i fri tekst eller via tale. AI'en forstår beskrivelsen i realtid og udfylder automatisk de relevante felter i formularen, så man slipper for manuel indtastning.
*   **AI Evaluator Draft:** En omfattende, intern AI-genereret rapport, der kun er synlig for *Evaluators*. Den analyserer de indsendte data, markerer potentielle problemer (Røde/Gule flag) og udarbejder et udkast til et svar til kunden.

**3. Typiske Handlingsflows**

*   **Standard User Flow:**
    1. En User logger ind og starter et nyt Project.
    2. De udfylder generel information og tilføjer 1 eller flere Parts, og uploader billeder til hver.
    3. De klikker "Get Advice" for at lade AI'en tjekke deres arbejde.
    4. De retter eventuelle manglende felter, som AI'en har fremhævet.
    5. De klikker "Submit" for at sende det til Scape.

*   **Standard Evaluator Flow:**
    1. En Evaluator logger ind og ser Dashboardet med nyligt indsendte projekter.
    2. De åbner et projekt og "Claimer" det (tildeler det til sig selv).
    3. De gennemgår brugerens data og billeder.
    4. De genererer et "AI Evaluator Draft", som automatisk udfylder en teknisk evaluering.
    5. Evaluatoren gennemgår AI'ens udkast, justerer domme (verdicts) eller noter hvis det er nødvendigt, og downloader en ren PDF-rapport.
    6. Evaluatoren e-mailer eller ringer til kunden med resultaterne.

*   **Det Iterative (Feedback) Flow:**
    1. Hvis en Evaluator vurderer, at et indsendt projekt mangler kritisk information, kan de klikke på "Release" på dashboardet.
    2. User (brugeren) kan derefter klikke "Unsubmit" på projektet for at tilføje de manglende detaljer (f.eks. uploade flere billeder eller rette en dimension).
    3. User genindsender (resubmits) projektet, så Evaluatoren kan gennemgå det igen.

Lad mig vide, om I er klar til at dykke ned i en dybere test! Jeg har rettet de indledende fejl, I stødte på, så en frisk test (som 'User') burde forløbe meget glattere.

Med venlig hilsen,
Rune
