# 💰 Omkostninger, Forbrugsgrænser & Advarsler (Driftshåndbog)

Dette dokument giver et komplet overblik over projektets omkostningsstruktur, hvor de relevante dashboards findes, samt en **præcis differentiering mellem faktiske bremser (hårde lofter) og advarsler (e-mails/notifikationer)**.

---

## 1. Direkte Links til Overblik & Dashboards

Alt forbrug for hele applikationen er 100% konsolideret under projektet **`scape-data-capture`** i Google Cloud Console.

| Område | Formål | Direkte Link i Google Cloud / Firebase |
| :--- | :--- | :--- |
| **Hovedregning & Grafer** | Månedligt forbrug opdelt pr. service (Gemini, Cloud Run, Firestore) | [GCP Billing Reports](https://console.cloud.google.com/billing/01BC40-E2E725-183D0E/reports?project=scape-data-capture) |
| **Omkostningstabel** | Nøjagtig faktura-specifikation ned til øre/cent pr. SKU | [GCP Cost Table](https://console.cloud.google.com/billing/01BC40-E2E725-183D0E/cost-table?project=scape-data-capture) |
| **Budgetter & Alarmer** | Opsætning af e-mailadvarsler ved budgetoverskridelser | [GCP Budgets & Alerts](https://console.cloud.google.com/billing/01BC40-E2E725-183D0E/budgets?project=scape-data-capture) |
| **Gemini AI Forbrug & Kvoter** | Se antal API-kald, tokens pr. minut og sæt hårde lofter | [API & Services ➔ Generative Language API](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas?project=scape-data-capture) |
| **Cloud Run (Server)** | Se antal kørte containere, CPU-tid og request-antal | [Cloud Run ➔ Services ➔ scape-evaluator](https://console.cloud.google.com/run/detail/europe-west3/scape-evaluator/metrics?project=scape-data-capture) |
| **Firestore Database** | Se antal læsninger, skrivninger og sletninger pr. dag | [Firebase Console ➔ Firestore Usage](https://console.firebase.google.com/project/scape-data-capture/firestore/usage) |
| **Brugere & Login** | Se antal aktive månedlige brugere (MAU) | [Firebase Console ➔ Authentication](https://console.firebase.google.com/project/scape-data-capture/authentication/users) |

---

## 2. Hvad koster de enkelte komponenter?

| Komponent | Forbrugstype | Typisk Pris |
| :--- | :--- | :--- |
| **Gemini API** *(blå bjælker)* | **Forbrugsafregnet** | Koster kun noget, når brugere rent faktisk chatter eller beder om *AI Advice* / billedevaluering. (Typisk 10-50 kr./md. ved moderat test). |
| **Duet AI** *(orange bjælker)* | **Fast månedligt abonnement** | **~145-150 kr./md.** (trækker ca. 4,85 kr./dag). Dette er AI-udviklerassistenten i selve GCP-konsollen og kan opsiges for at spare beløbet. |
| **Cloud Run** | **Forbrugsafregnet (med Free Tier)** | Gratis de første 2 mio. requests/md. Koster kun få øre/kroner for serverens CPU-tid (ca. 0-35 kr./md.). |
| **Cloud Firestore** | **Forbrugsafregnet (med Free Tier)** | Gratis for de første 50.000 læsninger og 20.000 skrivninger dagligt. Næsten 0 kr./md. |
| **Firebase Auth** | **Gratis** | Gratis for op til 50.000 aktive brugere/måned. |
| **Artifact Registry / Storage** | **Forbrugsafregnet** | Få øre pr. måned for lagring af Docker-image og uploadede filer. |

---

## 3. Faktiske Bremser vs. Advarsler (Vigtig Skelnen)

Der er en fundamental forskel på, hvad der blot er en **advarsel**, og hvad der er en **hård bremse (stopklods)**:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                    SIKKERHEDSLAG                        │
                  └──────────────────────────┬──────────────────────────────┘
                                             │
               ┌─────────────────────────────┴─────────────────────────────┐
               ▼                                                           ▼
    ┌──────────────────────┐                                    ┌──────────────────────┐
    │  🛑 FAKTISKE BREMSER │                                    │  📢 ADVARSLER / ALARM│
    │     (Hard Caps)      │                                    │    (Soft Warnings)   │
    ├──────────────────────┤                                    ├──────────────────────┤
    │ Stopper fysisk       │                                    │ Sender en e-mail     │
    │ requests/systemet    │                                    │ eller notifikation   │
    │ når grænsen nås.     │                                    │ men LADER APPEN KØRE │
    │ ➔ Regningen KAN      │                                    │ ➔ Regningen kan      │
    │   IKKE stige mere.   │                                    │   fortsætte opad.    │
    └──────────────────────┘                                    └──────────────────────┘
```

---

### Kategori A: 🛑 Faktiske Bremser (Hard Caps)
Disse mekanismer **afviser aktivt yderligere kald/trafik**, så det er umuligt at generere flere udgifter over det valgte niveau:

#### 1. Cloud Run: Max Instances (Server-loft)
* **Hvor er det sat?** I [`deploy.sh`](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/deploy.sh) (`--min-instances=1 --max-instances=2`).
* **Hvad gør det?** Forhindrer serveren i at spinne uendeligt mange containere op (maks 2 containere i drift ad gangen). 2 instanser kan håndtere op til 160 samtidige forespørgsler svarende til ~500-1.000 aktive brugere samtidigt.
* **Er det en hård bremse?** **JA.** Serverudgiften kan aldrig overstige ~40-60 kr./md. uanset belastning.

#### 2. Gemini API Quotas (Google Cloud API-kvoter)
* **Hvor sættes det?** I [GCP API Quotas](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas?project=scape-data-capture).
* **Hvad gør det?** Man kan sætte et absolut maksimum på f.eks. **100 requests pr. minut** eller et dagligt maksimum. Hvis kvoten overskrides, afviser Google API'et øjeblikkeligt med koden `429 Too Many Requests`.
* **Er det en hård bremse?** **JA.** Google stopper med at behandle AI-kald, så der ikke faktureres mere.

#### 3. App-Level Rate Limiting (i koden)
* **Hvor implementeres det?** I [`server.js`](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/server.js) (under planlagt BUNDLE 5).
* **Hvad gør det?** Begrænser hver ekstern bruger til f.eks. maks. 15 *AI Advice* og 50 *AI Chats* pr. dag.
* **Er det en hård bremse?** **JA.** En enkelt bruger kan ikke spamme serveren og bruge AI-kreditter op.

#### 4. Firestore Payload & Security Rules
* **Hvor sættes det?** I [`firestore.rules`](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/firestore.rules).
* **Hvad gør det?** Firestore har en indbygget hård grænse på maks. 1 MB pr. dokument og afviser uautoriserede eller for store operationer.
* **Er det en hård bremse?** **JA.**

---

### Kategori B: 📢 Bløde Advarsler (Soft Alerts & Notifications)
Disse mekanismer giver dig besked, men **afbryder ikke** driften:

#### 1. Google Cloud Billing Budgetter & Alarmer
* **Hvor sættes det?** I [GCP Budgets & Alerts](https://console.cloud.google.com/billing/01BC40-E2E725-183D0E/budgets?project=scape-data-capture).
* **Hvad gør det?** Sender en e-mail til administratoren, når forbruget rammer f.eks. 50%, 90% eller 100% af et defineret beløb (f.eks. 500 DKK eller 5.000 DKK).
* **⚠️ VIGTIGT:** Dette er **KUN en advarsel**. Google Cloud **slukker IKKE** automatisk for dine servere eller API'er som standard ved budgetoverskridelse, fordi Google ikke vil lukke virksomhedskritiske systemer ned uden eksplicit tilladelse.

#### 2. Firebase Usage Alerts
* **Hvor sættes det?** I Firebase Console under *Project Settings ➔ Integrations / Alerts*.
* **Hvad gør det?** Sender en notifikation, hvis databasen eller autentificeringen nærmer sig unormale niveauer.
* **Er det en hård bremse?** **NEJ.** Det er udelukkende en informationsmail.

---

## 4. Handlingsvejledning: Opsig Duet AI-abonnementet

For at fjerne den faste udgift på ~150 kr./md. til Duet AI:

1. Gå til [Google Cloud Console](https://console.cloud.google.com/?project=scape-data-capture).
2. Søg efter **"Gemini for Google Cloud"** i det øverste søgefelt.
3. Vælg **Gemini for Google Cloud** (eller *Duet AI*).
4. Klik på **Administration / Licenser / Subscriptions** i menuen.
5. Vælg din tildelte licens og klik på **Deaktiver / Opsig licens** (*Revoke / Cancel Subscription*).
6. Bekræft handlingen.

> **Resultat:** Den daglige faste udgift på ~4,85 kr. ophører straks. Appens brug af **Gemini API** påvirkes **ikke**, da den kører over almindeligt forbrugs-API.

---

## 5. 🛡️ Konkrete Anbefalinger: Den Optimale Sikringsmodel

For at sikre en balance mellem maksimal oppetid for kunder/messegæster og 100% beskyttelse mod ubehagelige regninger, anbefales følgende 3-lags model:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. SERVER-LAGET (Cloud Run): Hårdt instans-loft                        │
│    Sat til max 2 instanser i deploy.sh ➔ Serverpris: Maks ~40-60 kr/md │
├────────────────────────────────────────────────────────────────────────┤
│ 2. AI-LAGET (Gemini API): Kvoter & Brugergrænser                       │
│    Maks 60 kald/min i Google Cloud + Maks 15 analyser/dag pr. gæst     │
├────────────────────────────────────────────────────────────────────────┤
│ 3. ALARM-LAGET (Google Billing): Budgetadvarsel                        │
│    Opsæt 500 kr. budget med e-mail ved 250 kr., 450 kr. og 500 kr.     │
└────────────────────────────────────────────────────────────────────────┘
```

### De 4 Anbefalede Sikringspunkter:

1. **Server-loft (Gennemført):**
   * Behold `--max-instances=2` i [`deploy.sh`](file:///Users/runeklausenlarsen/Development/scape-bin-picking-evaluator/deploy.sh).
   * **Gevinst:** Serverregningen kan fysisk aldrig overstige ~40–60 kr./md. og kan servicere op til ~1.000 aktive brugere.

2. **AI Quota Loft i Google Cloud Console (Hård bremse):**
   * Gå til [Generative Language API Quotas](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas?project=scape-data-capture) og sæt en grænse på **60 requests pr. minut (RPM)** og **1.000 kald/dag**.
   * **Gevinst:** Google afviser automatisk unormal trafik (HTTP 429), så API-regningen aldrig kan eksplodere ved script-angreb.

3. **App-niveau Rate-Limiting for eksterne gæster (Hård bremse i koden):**
   * Implementer grænser i `server.js` (planlagt under BUNDLE 5):
     * Maks **15 `⚡ AI Advice` analyser** pr. ekstern bruger pr. dag.
     * Maks **50 `AI Chat` beskeder** pr. ekstern bruger pr. dag.
     * Superusers og Evaluators undtages automatisk.
   * **Gevinst:** Enkeltpersoner kan ikke dræne kvoten for andre.

4. **Google Cloud Billing Budget (Blød advarsel):**
   * Opret et månedligt budget på **500 DKK** i [GCP Budgets & Alerts](https://console.cloud.google.com/billing/01BC40-E2E725-183D0E/budgets?project=scape-data-capture) med e-mail notifikationer ved **50% (250 kr.)**, **90% (450 kr.)** og **100% (500 kr.)**.
   * **Gevinst:** Fuld gennemsigtighed og tidlig varsling længe før noget bliver mærkbart.

---

### 📊 Forventet samlet månedlig omkostning med denne model:
* **Efter opsigelse af Duet AI:** 0 kr. (sparer ~150 kr./md.)
* **Cloud Run serverdrift:** 0 – 35 kr./md.
* **Gemini API (aktiv app-brug):** 10 – 60 kr./md.
* **Firestore database:** 0 – 2 kr./md.
* **Samlet forventet månedlig regning:** **~30 – 100 DKK / måned.**

