# Vejledning: Lokal Afvikling & Cloud Run Udrulning

Denne vejledning beskriver trin-for-trin, hvordan du kører og tester **Scape Bin-Picking Evaluator** lokalt (både direkte og via Docker) samt hvordan du udruller den sikkert til **Google Cloud Run**.

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
Åbn [http://localhost:8080](http://localhost:8080) i din browser. Appen kører nu på Express-serveren, og alle AI-forespørgsler bliver automatisk sendt gennem din lokale proxy.

---

## 2. Lokal Afvikling med Docker (Valgfrit)

Hvis du vil teste, at Docker-containeren fungerer præcis som den skal i skyen.

### Trin 1: Byg Docker-image
Sørg for, at Docker kører på din maskine. Kør derefter denne kommando i rodmappen:
```bash
docker build -t scape-evaluator .
```

### Trin 2: Kør Docker-containeren
Start containeren og send din API-nøgle ind som en miljøvariabel (`-e`):
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

### Udrulningstrin

### Trin 1: Send containeren til Google Artifact Registry (Cloud Build)
Vi lader Google Cloud bygge container-filen i skyen og gemme den i dit register. Kør denne kommando fra rodmappen:
```bash
gcloud builds submit --tag gcr.io/DIT_PROJEKT_ID/scape-evaluator
```

### Trin 2: Opret en Secret til din API-nøgle (Anbefalet sikkerhed)
For at undgå at skrive din Gemini API-nøgle i klartekst i dine udrulningsfiler, bør du gemme den i **Google Secret Manager**:
1. Gå til Google Cloud Console under **Secret Manager**.
2. Klik **Create Secret**.
3. Navngiv den `GEMINI_API_KEY` og indsæt din API-nøgle som værdien.
4. Gem secret'en.

### Trin 3: Udrul containeren til Cloud Run
Kør denne kommando for at udrulle containeren. Vi henviser til din `GEMINI_API_KEY` secret, som automatisk indsættes sikkert i containerens miljø:
```bash
gcloud run deploy scape-evaluator \
  --image gcr.io/DIT_PROJEKT_ID/scape-evaluator \
  --platform managed \
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
Hvis du ønsker at køre applikationen på et af dine egne domæner (f.eks. `evaluator.scapesolutions.com`):
1. Gå til **Cloud Run** i Google Cloud Console.
2. Klik på **Manage Custom Domains** øverst.
3. Klik **Add Mapping**, vælg din `scape-evaluator` tjeneste og indtast dit domænenavn.
4. Google vil give dig nogle DNS-records (CNAME/TXT), som du skal tilføje hos din domæneudbyder. Google opretter derefter et gratis SSL/TLS-certifikat til dit domæne automatisk.
