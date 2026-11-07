# IBScalm — PDS-dagboek

Een mobile-first web-app voor mensen met prikkelbare darm (PDS). Je houdt eten, klachten, stress en slaap bij, en na een paar weken laat de app zien of je klachten vooral lijken samen te hangen met **eten**, **stress** of **slaap**.

> **Naam wijzigen:** één regel in `lib/brand.ts`. Alle teksten gebruiken `{brand}` en volgen automatisch.

**Privacy is de kernbelofte:** alle gezondheidsgegevens blijven op het toestel (IndexedDB). Er zijn geen accounts, geen backend en geen trackers. Alleen de publieke pagina's (landingspagina en privacyverklaring) tellen bezoeken, cookieloos via Vercel Web Analytics.

---

## Lokaal draaien

Vereisten: Node 20.9+ (getest met Node 22) en npm.

```bash
npm install
npm run dev            # http://localhost:3000
```

- `/` is de landingspagina, `/vandaag` de app. Engels staat onder `/en/...`.
- **Voorbeelddata:** ga naar *Instellingen → Ontwikkeling → Laad 3 weken voorbeelddata*. Deze knop bestaat alleen in development.
- Wat de analyse van de voorbeelddata maakt, zie je ook in de terminal: `npm run seed:report`.

> De service worker (offline-modus) staat alleen aan in een productiebuild: `npm run build && npm start`.

## Scripts

| Script | Wat het doet |
|---|---|
| `npm run dev` | Development-server (Turbopack) |
| `npm run build` / `npm start` | Productiebuild en -server |
| `npm test` | Unit tests (Vitest): analyse, database, export/import, vertalingen |
| `npm run test:e2e` | Playwright: landing, onboarding, invoer, tijdlijn, inzichten, export/import/wissen. **Draai eerst `npm run build`.** De eerste keer ook `npx playwright install chromium`. |
| `npm run typecheck` | TypeScript (strict) |
| `npm run lint` | ESLint |
| `npm run seed:report` | Print de analyse-uitkomst van de seed-data (`npm run seed:report -- 7 28` = seed 7, 28 dagen) |

## Deployen naar Vercel

1. Push de repository naar GitHub/GitLab.
2. Op [vercel.com](https://vercel.com): **Add New → Project** en importeer de repository. Vercel herkent Next.js automatisch, er is geen extra configuratie nodig.
3. Optioneel: stel de omgevingsvariabele `NEXT_PUBLIC_SITE_URL` in op je eigen domein (bijv. `https://ibscalm.com`). Zonder deze variabele gebruikt de app automatisch het productiedomein van Vercel voor canonical-links en Open Graph.
4. Zet onder **Analytics** in het Vercel-dashboard *Web Analytics* aan. Dat is cookieloos en wordt alleen op de landingspagina en de privacyverklaring geladen, nooit in de app.
5. Deploy. Elke push naar `main` geeft een nieuwe productie-deploy. De service worker ververst zijn cache automatisch per commit.

Via de CLI kan het ook: `npx vercel` (preview) en `npx vercel --prod`.

## Rapport voor je arts (betaald, iDEAL)

Gebruikers kunnen een PDF-rapport maken voor hun huisarts of diëtist: samenvatting, klachten (met grafiek per dag), eten, stress, slaap, laat eten, een dagoverzicht en ruimte voor notities. Eenmalig betalen (standaard € 4,99) ontgrendelt het rapport op dat toestel. De aankoop gaat mee in de back-up.

- **Privacy:** de PDF wordt volledig op het toestel gemaakt (jsPDF, alleen geladen bij het downloaden). Naar de server gaat alleen de taal (`{ locale }`) om een betaling te starten; er gaan nooit gezondheidsgegevens mee. Een e2e-test controleert dat.
- **Betaling:** via [Mollie](https://www.mollie.com) met iDEAL. De serverfuncties staan in `app/api/checkout/`: betaling aanmaken, status controleren (alleen `paid` als bedrag en product kloppen). Het betaal-id wordt vóór het doorsturen lokaal bewaard en na terugkomst gecontroleerd.
- **Instellen:**
  1. Maak een Mollie-account aan en activeer iDEAL.
  2. Zet in Vercel de omgevingsvariabele `MOLLIE_API_KEY` (eerst een `test_`-sleutel, daarna `live_`). Optioneel `NEXT_PUBLIC_REPORT_PRICE_EUR` voor een andere prijs. Zie `.env.example`.
  3. Redeploy. Zonder sleutel geeft de betaalknop in productie een nette foutmelding.
- **Lokaal en in tests:** zonder Mollie-sleutel gebruikt de app een nagebootste betaling (`/betaling-test`) waarmee je "geslaagd" of "mislukt" kiest. Die is op Vercel-productie geblokkeerd.
- **Let op:** ontgrendelen gebeurt op het toestel. Wie technisch handig is, kan dat omzeilen; voor een klein bedrag is dat een bewuste afweging tegenover "geen account en geen server met gebruikersgegevens".

## Architectuur

```
app/
  [locale]/(marketing)/     landingspagina + privacy (server-rendered, statisch)
  [locale]/(app)/           vandaag, tijdlijn, inzichten, instellingen, welkom (client, noindex)
  [locale]/offline          fallback van de service worker
  [locale]/opengraph-image  OG-afbeelding (gegenereerd)
  icons/[size]              PWA-iconen (gegenereerd)
  api/checkout/             iDEAL-betaling voor het rapport (Mollie; ziet nooit gezondheidsdata)
  serwist/[path]            service worker (Serwist, Turbopack-variant)
  sw.ts                     service worker-bron
lib/
  analysis/                 pure analysefuncties (volledig getest)
  db/                       Dexie-schema, migraties, repository
  export/                   JSON/CSV-export, import met validatie (zod) en formaat-migraties
  sync/                     alleen het contract voor latere E2E-versleutelde sync
  seed/                     deterministische fictieve data (3 weken)
  report/                   rapportmodel (puur, getest) en PDF-opmaak
  payments/                 betaalconfiguratie, server (Mollie/mock) en client
  hooks/, store/            live queries (dexie-react-hooks) en UI-state (Zustand)
components/
  ui/                       eigen primitives (Radix voor dialog/switch), iconen, logo
  entry/                    invoerschermen (eten, klacht, stress, dag)
  app/, charts/, marketing/
messages/                   nl.json (standaard), en.json
proxy.ts                    next-intl locale-routing (Next 16 "proxy", voorheen middleware)
```

**Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4 met eigen design tokens, Motion, Dexie (IndexedDB), Zustand, visx, next-intl, Serwist (PWA).

### Datamodel

`Meal`, `Symptom`, `StressEvent`, `DayLog` (één per dag; slaap gaat over de nacht ervóór), `Tag` en `meta` (instellingen). Elk record heeft `createdAt`, `updatedAt` en `deletedAt` (soft delete). Daarmee kan een latere sync samenvoegen volgens de regel "nieuwste wint", dezelfde regel die import nu al gebruikt. Het schema heeft een versie (`SCHEMA_VERSION`) en het exportbestand ook (`EXPORT_FORMAT`). Migraties staan in `lib/db/database.ts` en `lib/export/migrations.ts`.

### Analyse

Alle analyse staat in `lib/analysis/`, als pure functies zonder I/O. Instelbaar zijn de ernstdrempel, de tijdvensters en het uur voor "laat eten".

- **Eten:** per tag het aandeel maaltijden met een klacht (ernst ≥ 4) binnen het venster, vergeleken met maaltijden zónder die tag.
- **Stress:** de kans op een klacht 0–3 uur na een stressmoment, vergeleken met referentiemomenten (elk heel uur 8–22 uur, buiten stressvensters). Anticipatiestress wordt apart berekend. Ook dagen met veel en weinig stress worden vergeleken (inclusief de stressscore van een wearable).
- **Slaap:** gemiddelde hoogste klacht na slechte (≤ 2) en goede (≥ 4) nachten.
- **Laat eten:** klachten de volgende ochtend (5–12 uur) na eten vanaf 21:00.
- **Samenvatting:** "lijkt vooral samen te hangen met …", altijd met het aantal datapunten en een betrouwbaarheidslabel. Kleine aantallen worden afgezwakt (`effect × n/(n+5)`), zodat een tag die 2× voorkwam niet "wint". Onder 14 dagen blijft de status "verzamelen".

**Afwijking van de oorspronkelijke opdracht:** het standaard eet-venster is **2–8 uur** in plaats van 2–24 uur. Bij bijna dagelijkse klachten volgt binnen 24 uur vrijwel altijd wel een klacht (83% van alle maaltijden in de seed-data), waardoor echte triggers wegvallen. Met 2–8 uur komt ui/knoflook in de seed-data duidelijk naar voren (92% tegenover 21%). Gebruikers kunnen het venster in Instellingen tot 24 uur oprekken.

### Design

Rustig en professioneel, voor een gevoelig onderwerp: witte vlakken, donkerblauwe (navy) tekst en blokken, één gele actiekleur voor de belangrijkste knop, en één lettertype (Figtree) met een basisgrootte van 17 px. Elke soort invoer heeft een zachte eigen kleur (groen = eten, roze = klacht, amber = stress, indigo = slaap), maar kleur draagt nooit alleen informatie: er zijn altijd ook iconen, labels en vormen. Alle kleuren zijn semantische tokens in `app/globals.css`, met een eigen donkere variant. Animaties zijn kort en functioneel en respecteren `prefers-reduced-motion`.

### SEO

- Landingspagina met inhoud gericht op zoektermen (PDS-dagboek, buikklachten bijhouden, prikkelbare darm syndroom), één H1 en een logische kopstructuur.
- Structured data (JSON-LD): `WebSite`, `WebApplication` en `FAQPage`.
- `/sitemap.xml` met hreflang (NL/EN), `/robots.txt`, canonical-URL's en Open Graph/Twitter-afbeeldingen per taal.
- App-schermen hebben `noindex`: daar staan persoonlijke gezondheidsgegevens, die horen niet in zoekmachines.

### Usability (ISO 9241-11)

De gebruikscontext, meetbare doelen voor doeltreffendheid, efficiëntie en tevredenheid, en het evaluatieplan staan in [docs/usability.md](docs/usability.md). De doelen voor doeltreffendheid en efficiëntie worden automatisch gecontroleerd in `tests/e2e/usability.spec.ts`: aantal handelingen per taak, tijd, toetsenbordbediening, tikdoelen van minimaal 44 px en tekstgrootte. Tevredenheid (SUS ≥ 75) vraagt om een gebruikerstest met de doelgroep; die staat beschreven als volgende stap.

## Kwaliteit (gemeten)

- 48 unit tests en 19 Playwright-tests (waarvan 8 usability-tests) slagen.
- Lighthouse (lokaal, mobiel profiel):
  - Publieke pagina's: performance 96–97, toegankelijkheid 100, SEO 100. Best practices is 96 op de startpagina, alleen omdat het Vercel Analytics-script lokaal niet bestaat; op Vercel is dat 100.
  - App-schermen: performance 90–92, toegankelijkheid 100. SEO is bewust lager door `noindex`.
- Offline getest: na het eerste bezoek openen alle pagina's (NL en EN) zonder internet, en invoeren werkt ook offline.

## Juridisch

De app laat patronen zien en stelt geen diagnoses. Formuleringen zijn voorzichtig ("lijkt samen te hangen met"). Een disclaimer staat in de onboarding, op de inzichtenpagina en in de instellingen.
