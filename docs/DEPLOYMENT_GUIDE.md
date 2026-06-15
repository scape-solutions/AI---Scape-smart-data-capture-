# Vejledning: Lokal Afvikling & Cloud Run Udrulning

Denne vejledning beskriver trin-for-trin, hvordan du kører og tester **Scape Bin-Picking Evaluator** lokalt (både direkte og via Docker) samt hvordan du udruller den sikkert til **Google Cloud Run**.

---

## Hurtigt Udviklingsflow (Lav ændring ➔ Test ➔ Udrul)

Hvis du blot skal bruge en hurtig tjekliste til dit daglige arbejde med at ændre og udrulle kode:

1. **Lav dine ændringer** i kildekoden (f.eks. under `src/` eller i `server.js`).
2. **Test lokalt (hurtigste metode):**
   * **Terminal 1 (Vite frontend):** Kør `npm run dev` (åbner på http://localhost:3000).
   * **Terminal 2 (Express server):** Kør `npm run serve` (starter API-proxy på port 8080).
   * Åbn [http://localhost:3000](http://localhost:3000) i din browser og test ændringerne.
3. **Udrul den nye version til produktion (Cloud Run):**
   * Byg i skyen:
     ```bash
     gcloud builds submit --tag europe-west3-docker.pkg.dev/scape-data-capture/scape-evaluator/scape-evaluator
     ```
   * Udrul til Cloud Run:
     ```bash
     gcloud run deploy scape-evaluator \
       --image europe-west3-docker.pkg.dev/scape-data-capture/scape-evaluator/scape-evaluator:latest \
       --platform managed \
       --region europe-west3 \
       --allow-unauthenticated \
       --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
     ```

*(For detaljerede instruktioner og avancerede valgmuligheder, se de efterfølgende afsnit).*

---

## 1. Lokal Afvikling (Uden Docker)

Dette er den nemmeste måde at teste server-proxyen og den færdige frontend på din egen computer.

### Trin 1: Byg frontend-koden
Først skal vi kompilere React applikationen til statiske filer:
```bash
npm run build
```
Dette opretter mappen `dist/` med de færdige filer.

### Trin 2: Tjek din API-nøgle
Sørg for, at du har en gyldig Gemini API-nøgle i din `.env.local` fil i rodmappen:
```env
GEMINI_API_KEY="AIzaSy..."
```

### Trin 3: Start Node.js-serveren
Vi har oprettet en færdig genvej i `package.json` til at starte serveren og indlæse din API-nøgle:
```bash
npm run serve
```
Du bør se følgende i din terminal:
> `Gemini AI client successfully initialized with server-side API Key.`  
> `Scape Bin-Picking Evaluator Server running on port 8080`

### Trin 4: Test i browseren
Åbn [://localhost:8080http](http://localhost:8080) i din browser. Appen kører nu på Express-serveren, og alle AI-forespørgsler bliver automatisk sendt gennem din lokale proxy.

---

## 2. Lokal Afvikling med Docker (Valgfrit)

Hvis du vil teste, at Docker-containeren fungerer præcis som den skal i skyen.

### Trin 1: Byg Docker-image
Sørg for, at Docker kører på din maskine. Kør derefter denne kommando i rodmappen:
```bash
docker build -t scape-evaluator .
```

### Trin 2: Kør Docker-containeren
Start containeren lokalt. Du kan enten sende din API-nøgle direkte ind med `-e`, eller indlæse den direkte fra din `.env.local` fil:

**Metode A: Indlæs automatisk fra din `.env.local` fil (anbefalet):**
```bash
docker run -p 8080:8080 --env-file .env.local scape-evaluator
```

**Metode B: Angiv API-nøglen direkte i kommandoen:**
```bash
docker run -p 8080:8080 -e GEMINI_API_KEY="DIN_API_NØGLE_HER" scape-evaluator
```

### Trin 3: Test i browseren
Åbn [http://localhost:8080](http://localhost:8080) i din browser.

---

## 3. Udrulning til Google Cloud Run (I Skyen)

Google Cloud Run er en fuldt styret serverless platform. Den kører din container og skalerer automatisk ned til 0, når ingen bruger siden (hvilket betyder, at det næsten er gratis ved lavt forbrug).

### Forudsætninger
1. Installer **Google Cloud CLI** (`gcloud` værktøjet) på din computer.
2. Log ind på din Google Cloud konto via terminalen:
   ```bash
   gcloud auth login
   ```
3. Sæt dit aktive projekt (erstat `DIT_PROJEKT_ID` med f.eks. `scape-data-capture`):
   ```bash
   gcloud config set project DIT_PROJEKT_ID

   ```
## DIT_PROJEKT_ID
scape-data-capture
### Udrulningstrin

### Trin 1: Send containeren til Google Artifact Registry (Cloud Build)
Vi lader Google Cloud bygge container-filen i skyen og gemme den i dit register. Kør denne kommando fra rodmappen:
```bash
gcloud builds submit --tag europe-west3-docker.pkg.dev/DIT_PROJEKT_ID/scape-evaluator/scape-evaluator
```

### Trin 2: Opret en Secret til din API-nøgle (Anbefalet sikkerhed)
For at undgå at skrive din Gemini API-nøgle i klartekst i dine udrulningsfiler, bør du gemme den i **Google Secret Manager**:
1. Gå til Google Cloud Console under **Secret Manager**.
2. Klik **Create Secret**.
3. Navngiv den `GEMINI_API_KEY` og indsæt din API-nøgle som værdien.
4. Gem secret'en.

### Trin 3: Udrul containeren til Cloud Run
Kør denne kommando for at udrulle containeren. Vi henviser to din `GEMINI_API_KEY` secret, som automatisk indsættes sikkert i containerens miljø:
```bash
gcloud run deploy scape-evaluator \
  --image europe-west3-docker.pkg.dev/DIT_PROJEKT_ID/scape-evaluator/scape-evaluator \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```
*(GCP vil spørge dig om region (f.eks. `europe-west3` for Frankfurt). Vælg den tætteste region).*

### Trin 4: Hent din URL
Når udrulningen er færdig, printer terminalen en URL (f.eks. `https://scape-evaluator-xxxx.run.app`). Dette er dit nye offentlige link!

---

## 4. Efter Udrulning (Vigtige detaljer)

### 1. Godkend login-domænet i Firebase (Vigtigt!)
Da din applikation bruger Firebase Authentication (Google Login og e-mail/adgangskode), skal Firebase vide, at dit nye Cloud Run-domæne er godkendt til at logge brugere ind.
1. Åbn **Firebase Console**.
2. Gå til **Authentication > Settings > Authorized Domains**.
3. Klik **Add Domain** og tilføj dit Cloud Run-domæne (f.eks. `scape-evaluator-xxxx.run.app` – udelad `https://`).

### 2. Opsætning af eget domæne (Valgfrit)
1. Gå til **Cloud Run** i Google Cloud Console.
2. Klik på **Manage Custom Domains** øverst.
3. Klik **Add Mapping**, vælg din `scape-evaluator` tjeneste og indtast dit domænenavn.
4. Google vil give dig nogle DNS-records (CNAME/TXT), som du skal tilføje hos din domæneudbyder. Google opretter derefter et gratis SSL/TLS-certifikat til dit domæne automatisk.

## 5. Styring af Adgangsrettigheder & Roller (Firestore)

Applikationen er sikret på app-niveau med **Firebase Authentication**. Når appen er gjort offentlig på Google Cloud (via **Mulighed C** ovenfor), kan du styre adgangen og tildele rettigheder dynamisk via Firestore-databasen **uden** at genstarte eller genudrulle serveren.

### Sådan tilføjer og fjerner du adgang/roller i Firestore:
1. Åbn **Firebase Console** (https://console.firebase.google.com/).
2. Vælg dit projekt (**Scape Data Capture**).
3. Gå til **Firestore Database** i venstre menu.
4. Opret (eller find) samlingen `config` og dokumentet `access`:
   * **Collection ID (Samling):** `config`
   * **Document ID (Dokument):** `access`
5. Dokumentet skal indeholde følgende fire felter af typen **Array** (liste af strenge):
   * **`allowedDomains` (Array):** Domæner, der må logge ind (f.eks. `["scapesolutions.eu", "scapesolutions.com"]`).
   * **`allowedEmails` (Array):** Specifikke eksterne e-mailadresser, der må logge ind (f.eks. `["samarbejdspartner@gmail.com"]`).
   * **`allowedEvaluators` (Array):** E-mailadresser på Scape-medarbejdere, der skal have Evaluator/Admin-rettigheder (f.eks. `["rde@scapesolutions.eu", "jeo@scapesolutions.eu"]`).
   * **`superusers` (Array):** E-mailadresser på super-brugere, der må bruge import/export værktøjer (f.eks. `["rune.k.larsen@scapesolutions.eu"]`).

### Sådan virker det i realtid:
* **Ingen genstart:** Serveren (`server.js`) og klientsiden (`useAuth.ts`) lytter i realtid på dette dokument. Sekundet du tilføjer en mail eller et domæne i Firebase Console, træder ændringen i kraft for alle brugere!
* **Offline Fallbacks:** Hvis dokumentet slettes eller ikke kan læses, bruger koden automatisk de standardværdier, der er indbygget i kildekoden (såsom `@scapesolutions.eu` domæner og din egen e-mail som superuser).

---

## 6. Netværksbaseret Adgang (Alternativ)

Hvis din organisation kræver, at Cloud Run-tjenesten **ikke** må være offentligt tilgængelig på internettet (hvilket forhindrer brug af **Mulighed C**):

### A. Giv adgang til alle i dit firma (Netværksniveau)
For at tillade alle medarbejdere med en `@scapesolutions.eu`-adresse at hente sitet fra Cloud Run:
```bash
gcloud run services add-iam-policy-binding scape-evaluator \
  --region=europe-west3 \
  --member="domain:scapesolutions.eu" \
  --role="roles/run.invoker"
```
Herefter skal alle medarbejdere køre en lokal proxy på deres computer for at tilgå appen:
```bash
gcloud run services proxy scape-evaluator --region=europe-west3
```

### B. Giv adgang til specifikke brugere (Netværksniveau)
```bash
gcloud run services add-iam-policy-binding scape-evaluator \
  --region=europe-west3 \
  --member="user:kollega@scapesolutions.eu" \
  --role="roles/run.invoker"
```
