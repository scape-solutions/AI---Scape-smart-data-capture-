# Scape Bin-Picking Evaluator - Kodebase Oversigt

Dette dokument fungerer som et permanent "landkort" over projektet. Det er skrevet med særligt henblik på at bygge bro fra traditionel datalogi (C, PHP, etc.) til moderne React og TypeScript.

## 1. Mappestruktur & Arkitektur (Separation of Concerns)

Projektet er brudt ned i logiske moduler. Før lå det hele i `App.tsx`, men nu har hver fil sit eget ansvarsområde:

### `src/types/index.ts` (Datastrukturer)
Her definerer vi vores **Interfaces**. I TypeScript svarer en `interface` meget til en `struct` i C eller en data-model. Den fortæller præcis hvilke felter et objekt *skal* have, f.eks. at et projekt altid har et `id` og en `status`. Det fjerner rigtig mange potentielle run-time fejl, fordi kompilatoren klager, hvis man staver forkert.

### `src/hooks/` (Forretningslogik)
React "Hooks" (starter altid med `use...`) er funktioner, der håndterer state (tilstand) og asynkrone operationer.
* **`useAuth.ts`**: Styrer login-systemet, sessioner, og kommunikerer med Firebase Authentication.
* **`useProjects.ts`**: Styrer alt database-arbejde (Firestore). Det er herfra vi kører vores CRUD operationer (Create, Read, Update, Delete) for projekter.

### `src/components/` (Genbrugelige UI-byggeklodser)
Disse filer svarer lidt til partials eller includes. De tager "Props" (parametre) ind og returnerer HTML (JSX).
* **`Header.tsx`**: Den øverste bjælke.
* **`ProjectCard.tsx`**: De enkelte "firkanter" på oversigts-siden, der repræsenterer ét projekt.

### `src/views/` (Skærmbilleder / Sider)
Dette er de primære "sider" i vores single-page-applikation.
* **`DashboardView.tsx`**: Siden der viser listen over projekter med søgning og sortering.
* **`QuestionnaireView.tsx`**: Den store fil, der bygger selve spørgeskemaet dynamisk baseret på vores JSON-lignende data i `questionnaire.ts`.
* **`AuthView.tsx`** & **`ProfileSetupView.tsx`**: Skærme relateret til oprettelse og login.

### `src/App.tsx` (Hjertet og Routeren)
App-filen binder det hele sammen. Den trækker data fra vores `hooks`, og baseret på en tilstands-variabel (`view`) vælger den hvilket `View` der skal tegnes på skærmen (ligesom en meget simpel router).

---

## 2. Centrale Koncepter i Moderne React & TypeScript

Når du læser i koden, vil du støde på følgende principper:

### A. State er "Immutable" (Uforanderlig)
I ældre sprog ændrer man tit en variabel direkte (`projekt.navn = "Nyt"`). I React må du **aldrig** ændre et state-objekt direkte. Du skal bruge den tilhørende `set`-funktion, og du skal sende en *kopi* af det gamle objekt.
* **Spread-operatoren (`...`)**: Bruges til at kopiere arrays eller objekter.
  Eksempel: `setProfile({ ...profile, name: "Nyt Navn" })` kopierer alt fra det gamle `profile`, og overskriver derefter feltet `name`.

### B. Functional Components
UI bygges udelukkende med funktioner der returnerer HTML. De tager én parameter (`props`), som er en samling af variabler og funktioner, som parent-komponenten (f.eks. `App.tsx`) har givet dem.

### C. Deklarativ Rendering og Arrays
I React undgår vi typisk klassiske `for`-loops i selve HTML'en. Vi bruger JavaScript Array-metoder:
* **`.map()`**: Tager en liste (f.eks. projekter) og omdanner hvert element til et stykke HTML (`<ProjectCard>`).
* **`.filter()`**: Løber en liste igennem og returnerer en ny liste, der kun indeholder de elementer, der overholder en bestemt betingelse (f.eks. søgefunktionen i Dashboardet).

### D. Betinget Rendering (If-statements i HTML)
Du vil ofte se strukturer som:
`{isLocked && <p>Låst!</p>}`
Dette er et inline if-statement. Det betyder: Hvis `isLocked` er "sand", så vis paragraf-tagget.

Du vil også se "Ternary operators":
`{isAdmin ? "Du er admin" : "Du er gæst"}`
Dette betyder: Betingelse `?` (hvis sand) `:` (ellers).

### E. Tailwind CSS (Utility classes)
I stedet for separate `.css` filer, styler vi ved at sætte klasser direkte på HTML-elementerne:
`className="flex flex-col bg-white p-4 rounded"`
* `flex` = CSS Flexbox
* `p-4` = Padding (indvendig afstand)
* `rounded` = Runde hjørner

---

## 3. Pædagogiske Kommentarer
Alle filerne nævnt i Sektion 1 indeholder nu omfattende kommentarer på dansk, der forklarer præcis, hvad hver linje eller blok af kode gør ud fra ovenstående principper. Brug disse kommentarer som opslagsværk.
