# Usability volgens ISO 9241-11

ISO 9241-11:2018 definieert usability als *de mate waarin een systeem door specifieke gebruikers gebruikt kan worden om specifieke doelen te bereiken met doeltreffendheid (effectiveness), efficiëntie (efficiency) en tevredenheid (satisfaction), in een specifieke gebruikscontext*.

Dit document legt die vier onderdelen vast voor IBScalm: de gebruikscontext, de meetbare doelen en hoe elk doel wordt gecontroleerd. De ontwerpprincipes uit ISO 9241-110 (interactieprincipes) en WCAG 2.2 AA dienen als ondersteunende richtlijnen.

---

## 1. Gebruikscontext (context of use)

| Onderdeel | Beschrijving |
|---|---|
| **Gebruikers** | Volwassenen met (vermoedelijk) prikkelbare darm syndroom. Wisselende digitale vaardigheid, geen medische voorkennis nodig. Een deel heeft op het moment van invoeren klachten (pijn, onrust) en dus minder aandacht en geduld. Ook mensen met kleurenblindheid, slechtziendheid of motorische beperkingen. |
| **Doelen** | (1) Snel vastleggen wat er gebeurt: eten, klacht, stress, slaap. (2) Na enkele weken begrijpen waar klachten mee samenhangen. (3) Gegevens delen met huisarts of diëtist. (4) Erop vertrouwen dat gegevens privé blijven. |
| **Taken** | T1 maaltijd vastleggen · T2 klacht vastleggen · T3 stressmoment vastleggen · T4 slaap/dag invullen · T5 een eerdere dag bekijken · T6 inzichten lezen · T7 back-up maken / exporteren · T8 alles wissen |
| **Middelen** | Smartphone (primair, 360–430 px breed), ook tablet en desktop. Moderne browser. Geen account. Werkt offline. |
| **Omgeving** | Onderweg, op het werk, thuis, op het toilet; vaak éénhandig en kort. Wisselende verbinding. Gevoelig onderwerp, dus privacy en een rustige toon zijn belangrijk. |

## 2. Meetbare usability-doelen

### Doeltreffendheid (effectiveness): kan de gebruiker het doel bereiken?

| # | Criterium | Doel | Hoe gecontroleerd |
|---|---|---|---|
| E1 | Kerntaken T1–T8 zijn foutloos uit te voeren | 100% in geautomatiseerde tests | `tests/e2e/flows.spec.ts` |
| E2 | Onvolledige invoer wordt niet stil genegeerd, maar uitgelegd | Melding + `aria-invalid` | `usability.spec.ts` › "explains what is missing" |
| E3 | Annuleren slaat niets op | 0 onbedoelde records | `usability.spec.ts` › "cancelling saves nothing" |
| E4 | Verwijderen is herstelbaar | Bevestiging + "Ongedaan maken" | `flows.spec.ts` › "deletes with undo" |
| E5 | Gegevens zijn veilig mee te nemen | Export → wissen → import herstelt alles | `flows.spec.ts` › "exports … re-imports" |
| E6 | Inzichten kloppen met de data | Analyse vindt het ingebouwde patroon in de seed-data terug | `tests/unit/analysis.test.ts` (48 unit tests) |

### Efficiëntie (efficiency): hoeveel moeite kost het?

| # | Taak | Doel | Hoe gecontroleerd |
|---|---|---|---|
| F1 | Stress vastleggen (standaardwaarden) | ≤ 2 handelingen, < 10 s | `usability.spec.ts` |
| F2 | Recente maaltijd herhalen | ≤ 3 handelingen | `usability.spec.ts` |
| F3 | Klacht met type en ernst | ≤ 4 handelingen, < 15 s | `usability.spec.ts` |
| F4 | Nieuwe maaltijd met omschrijving en tag | < 15 s | `flows.spec.ts` |
| F5 | Tijdstip invullen | 0 handelingen (standaard "nu", achteraf aanpasbaar) | ontwerp |

Ontwerpkeuzes die efficiëntie ondersteunen: de drie hoofdacties staan altijd onderin binnen duimbereik, er zijn verstandige standaardwaarden (tijd = nu, ernst = 5, portie = normaal), recente maaltijden kun je met één tik invullen, favoriete tags staan bovenaan en een notitie is optioneel en ingeklapt.

### Tevredenheid (satisfaction): hoe ervaart de gebruiker het?

Tevredenheid is alleen met echte gebruikers te meten. Daarom staan hier het doel en de meetmethode:

| # | Criterium | Doel | Methode |
|---|---|---|---|
| S1 | System Usability Scale (SUS) | gemiddeld ≥ 75 ("goed") | SUS-vragenlijst na een gebruikerstest met 5–8 deelnemers uit de doelgroep |
| S2 | Vertrouwen in privacy | ≥ 80% (eens/zeer eens) met "Ik vertrouw erop dat mijn gegevens privé blijven" | vraag na de test |
| S3 | Toon en taal | geen deelnemer ervaart teksten als betuttelend of alarmerend | hardop-denken-sessie |

Ontwerpkeuzes die tevredenheid ondersteunen: een rustige, professionele uitstraling, voorzichtige formuleringen ("lijkt samen te hangen met"), duidelijke privacyuitleg, geen account en geen reclame.

## 3. Ondersteunende ergonomische eisen (ISO 9241-110 en WCAG 2.2 AA)

| Principe (ISO 9241-110) | Toepassing in IBScalm | Controle |
|---|---|---|
| Geschiktheid voor de taak | Alleen de velden die nodig zijn; extra's (notitie, Bristol, wearable) zijn optioneel | ontwerp |
| Zelfbeschrijvendheid | Elke knop heeft een tekstlabel; schaalwoorden bij ernst ("matig", "flink") | review |
| Conform verwachtingen | Vaste navigatie onderin; terug- en sluitknoppen op vaste plekken | review |
| Fouttolerantie | Validatie met uitleg, bevestiging en "ongedaan maken" bij verwijderen, typbevestiging bij alles wissen | E2–E4 |
| Beheersbaarheid | Onboarding is overslaanbaar; tijd en datum zijn achteraf aanpasbaar; alles is te bewerken | e2e |
| Leerbaarheid | Korte onboarding van 5 schermen; voorbeelden in invoervelden | review |
| Individualiseerbaar | Taal, licht/donker thema, favoriete tags en analysedrempels | instellingen |

| Eis | Doel | Controle |
|---|---|---|
| Aanraakdoelen | ≥ 44 × 44 px (hoofdacties 64 px) | `usability.spec.ts` |
| Leesbaarheid | lopende tekst ≥ 16 px (basis 17 px), contrast AA | `usability.spec.ts`, Lighthouse |
| Toetsenbord | Alle taken uit te voeren zonder muis/touch | `usability.spec.ts` › "keyboard only" |
| Kleur | Nooit de enige drager van informatie (vormen, labels, tabellen) | review grafieken |
| Beweging | `prefers-reduced-motion` wordt gerespecteerd | CSS + MotionConfig |
| Toegankelijkheid totaal | Lighthouse accessibility 100 | Lighthouse |

## 4. Evaluatieplan

1. **Automatisch (elke wijziging):** `npm test` en `npm run test:e2e` controleren E1–E6, F1–F4 en de ergonomische eisen.
2. **Expert-review (per release):** controle van de ISO 9241-110-tabel en WCAG 2.2 AA.
3. **Gebruikerstest (vóór publieke lancering):** 5–8 deelnemers met PDS voeren T1–T7 uit op hun eigen telefoon. Meet slagingspercentage (doel 100%), tijd per taak (doelen F1–F4) en daarna de SUS (doel ≥ 75). Bevindingen worden hier opgenomen.
