# =========================================================================
# DOCKERFILE - SCAPE BIN-PICKING EVALUATOR
# =========================================================================
# En Dockerfile er en "opskrift", som Docker bruger til at bygge et 
# komplet, uafhængigt system (en container) til din applikation.
#
# Dette er et "Multi-Stage Build" (flertrins-byggeproces). 
# Hvorfor bruger vi to trin (Stage 1 og Stage 2)?
# - I trin 1 (builder) installerer vi ALLE værktøjer (TypeScript, bundlers osv.) 
#   for at kompilere koden. Det fylder rigtig meget (typisk 1+ GB).
# - I trin 2 (runner) tager vi kun de færdige, kompilerede filer og smider 
#   resten væk. Det gør den endelige container meget mindre, hurtigere at 
#   starte og mere sikker (da kildekode og udviklingsværktøjer er væk).
# =========================================================================

# =========================================================================
# TRIN 1 (STAGE 1): Byg React Applikationen (Kompilering)
# =========================================================================
# FROM fortæller Docker, hvilket fundament (base image) vi vil starte med.
# Vi bruger en officiel Node.js version 22 installeret på "Alpine Linux"
# (en ultra-letvægts Linux-distribution).
# Vi kalder dette trin for "builder", så vi kan referere til det senere.
FROM node:22-alpine AS builder

# WORKDIR (Working Directory) svarer til at køre "cd /app" inde i containeren.
# Alle efterfølgende kommandoer køres i denne mappe.
WORKDIR /app

# Vi kopierer package.json og package-lock.json fra din computer ind i containeren.
# Vi gør dette FØRST, fordi Docker gemmer trinnet i cache. Hvis dine afhængigheder 
# ikke har ændret sig, kan Docker springe "npm install" over næste gang du bygger.
COPY package*.json ./

# RUN udfører en terminal-kommando under selve byggeprocessen.
# "npm ci" (Clean Install) installerer de præcise versioner defineret i package-lock.json.
# Det installerer både udviklingsværktøjer (dev) og almindelige pakker.
RUN npm ci

# Nu kopierer vi resten af projektets filer (kildekoden, prompts osv.) ind i containeren.
# Filer angivet i .dockerignore (såsom node_modules) kopieres IKKE.
COPY . .

# Vi compilerer React applikationen til statiske HTML, JS og CSS filer.
# Outputtet lander i en ny mappe kaldet "/app/dist".
RUN npm run build


# =========================================================================
# TRIN 2 (STAGE 2): Kør den færdige server i produktion
# =========================================================================
# Vi starter forfra med et helt rent Node-image.
# Dette trin kalder vi "runner". Alt fra Trin 1 ( builder ) smides væk,
# MEDMINDRE vi eksplicit kopierer det over (via COPY --from=builder).
FROM node:22-alpine AS runner

# Vi sætter arbejdsmappen til /app igen (i det nye, rene image).
WORKDIR /app

# ENV sætter miljøvariabler (environment variables) inde i containeren.
# Vi fortæller Node.js, at den skal køre i "production" tilstand for at optimere ydeevnen.
ENV NODE_ENV=production

# Vi kopierer package.json filer igen for at installere pakker i det nye image.
COPY package*.json ./

# Vi installerer KUN produktions-pakker (f.eks. Express og Gemini SDK).
# Alle udviklingsværktøjer (TypeScript, Vite osv.) udelades. Det sparer enormt meget plads!
RUN npm ci --only=production

# COPY --from=builder gør det muligt at hente filer ud fra Trin 1 (builder).
# 1. Vi kopierer den færdige, kompilerede React-hjemmeside (dist) til vores server.
COPY --from=builder /app/dist ./dist

# 2. Vi kopierer server-filen (server.js) der styrer routing og API-proxy.
COPY --from=builder /app/server.js ./server.js

# 3. Vi kopierer prompt-filerne (som nu ligger sikkert på serveren).
COPY --from=builder /app/src/docs ./docs

# EXPOSE er dokumentation der fortæller Docker, hvilken port containeren lytter på.
# Cloud Run vil overskrive denne port automatisk via en 'PORT' variabel, men 8080 er standarden.
EXPOSE 8080

# CMD (Command) angiver den kommando, der køres, når containeren STARTER i skyen.
# Det er her, vi starter vores Node.js/Express server.
# (Der må kun være én CMD kommando i en Dockerfile).
CMD ["node", "server.js"]
