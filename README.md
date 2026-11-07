# Mild — PDS-dagboek

Een mobile-first web-app voor mensen met prikkelbare darm (PDS). Je houdt eten, klachten, stress en slaap bij, en na een paar weken laat de app zien of je klachten vooral lijken samen te hangen met **eten**, **stress** of **slaap**.

> **Werktitel:** "Mild" is een tijdelijke naam. Wijzigen kan op één plek: `lib/brand.ts` (alle teksten gebruiken `{brand}` en volgen automatisch). Pas daarna nog `public/icon.svg` en de `manifest` aan als dat nodig is.

**Privacy is de kernbelofte:** alle gezondheidsgegevens blijven op het toestel (IndexedDB). Er zijn geen accounts, geen backend en geen trackers. Alleen de publieke landingspagina telt bezoeken, cookieloos via Vercel Web Analytics.

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
3. Optioneel: stel de omgevingsvariabele `NEXT_PUBLIC_SITE_URL` in op je eigen domein (bijv. `https://mild.app`). Zonder deze variabele gebruikt de app automatisch het productiedomein van Vercel voor canonical-links en Open Graph.
4. Zet onder **Analytics** in het Vercel-dashboard *Web Analytics* aan. Dat is cookieloos en wordt alleen op de landingspagina geladen.
5. Deploy. Elke push naar `main` geeft een nieuwe productie-deploy. De service worker ververst zijn cache automatisch per commit.

Via de CLI kan het ook: `npx vercel` (preview) en `npx vercel --prod`.

## Architectuur

```
app/
  [locale]/(marketing)/     landingspagina + privacy (server-rendered, statisch)
  [locale]/(app)/           vandaag, tijdlijn, inzichten, instellingen, welkom (client, noindex)
  [locale]/offline          fallback van de service worker
  [locale]/opengraph-image  OG-afbeelding (gegenereerd)
  icons/[size]              PWA-iconen (gegenereerd)
  serwist/[path]            service worker (Serwist, Turbopack-variant)
  sw.ts                     service worker-bron
lib/
  analysis/                 pure analysefuncties (volledig getest)
  db/                       Dexie-schema, migraties, repository
  export/                   JSON/CSV-export, import met validatie (zod) en formaat-migraties
  sync/                     alleen het contract voor latere E2E-versleutelde sync
  seed/                     deterministische fictieve data (3 weken)
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

### Design: "Mild"

Risograph-print op warm papier: inktblauw plus vier steunkleuren, één per soort invoer (mint = eten, roze = klacht, geel = stress, lavendel = slaap). Fonts: Bricolage Grotesque (koppen), Geist en Geist Mono (cijfers en tijden). Alle kleuren zijn semantische tokens in `app/globals.css`, met een eigen donkere variant. Grafieken gebruiken nooit alleen kleur: ze hebben ook vormen, inktranden, directe labels en een verborgen tabel voor schermlezers. Animaties respecteren `prefers-reduced-motion`.

## Kwaliteit (gemeten)

- 48 unit tests en 11 Playwright-tests slagen.
- Lighthouse (lokaal, mobiel profiel): accessibility 100 op alle pagina's; SEO 100 en best practices 100 op de publieke pagina's; performance 90–95 op de publieke pagina's en 86–91 op de app-schermen. De app-pagina's scoren bewust laag op SEO, omdat ze met `noindex` uit zoekmachines worden gehouden.
- Offline getest: na het eerste bezoek openen alle pagina's (NL en EN) zonder internet, en invoeren werkt ook offline.

## Juridisch

De app laat patronen zien en stelt geen diagnoses. Formuleringen zijn voorzichtig ("lijkt samen te hangen met"). Een disclaimer staat in de onboarding, op de inzichtenpagina en in de instellingen.
