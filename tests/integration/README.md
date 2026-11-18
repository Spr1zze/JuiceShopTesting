# Integrationstests (API + database)

Hører til opgaven *Unit testing og integrationstest* (del: **integrationstests**).
Testene kører mod en **kørende OWASP Juice Shop** og rammer den rigtige Express-API og den rigtige SQLite-database – der bruges ingen mocks.

- **Framework:** [Jest](https://jestjs.io/) 29 + [Supertest](https://github.com/ladjs/supertest) (HTTP-kald)
- **Antal:** 3 integrationstests (IT-1, IT-2, IT-3) med i alt 17 testcases, plus 6 dokumenterede fejl (`04-kendte-fejl.test.js`)
- **Seneste resultat:** 4 suites, **23/23 bestået** (se `results/testresultat.txt`)

## Sådan kører du dem

```bash
# 1. Start Juice Shop (en af delene)
docker run -d -p 3000:3000 bkimminich/juice-shop
#   eller fra kildekoden i denne repo:  cd juice-shop && npm install && npm run build && npm start

# 2. Kør testene
cd tests/integration
npm install
npm test                     # standard: http://localhost:3000
BASE_URL=http://localhost:3001 npm test   # hvis appen kører et andet sted
```

Testene opretter selv nye brugere med unikke e-mails (`helpers.js`), så de kan køres igen og igen uden at nulstille databasen.
**Kun lokalt** – kør aldrig mod den offentlige Heroku-side.

## De tre integrationstests

| ID | Fil | Komponenter i samspil | Gyldige data | Ugyldige data / grænseværdier |
|----|-----|-----------------------|--------------|-------------------------------|
| **IT-1** | `01-registrering-login.test.js` | `POST /api/Users` → Sequelize → SQLite (Users) → `POST /rest/user/login` → JWT | Registrering giver 201, id fra DB, rolle `customer`, intet klartekst-password; login giver JWT + kurv-id | Dublet-e-mail → 400 (unik-constraint); forkert password → 401; ukendt bruger / tom body → 401 |
| **IT-2** | `02-produktsoegning.test.js` | `GET /rest/products/search` → SQL `LIKE` i Products-tabellen → JSON | "apple" giver kun matchende produkter; korrekt format, pris > 0, sorteret; ikke case-sensitiv | Ingen match → 200 + `[]`; tom søgning → hele kataloget; `'` og `<script>` → ingen fejl, ingen falske match; `%` er LIKE-wildcard |
| **IT-3** | `03-kurv.test.js` | JWT-login → `POST /api/BasketItems` (lagercheck) → BasketItems → `GET /rest/basket/:id` (join Baskets + BasketItems + Products) | Vare lægges i kurv, aflæses med korrekt navn/antal/pris, total = 2 × 1,99 | Antal over grænse → 400 og intet gemt; fremmed BasketId → 401; uden token → 401; ikke-eksisterende produkt → fejl, intet gemt |

Hver test tjekker både **statuskode**, **svarets indhold** og at **data faktisk er gemt/hentet i databasen** (fx at en vare der blev afvist ikke dukker op i kurven).

## Fejl fundet via ugyldige data (`04-kendte-fejl.test.js`)

Testene beskriver den **ønskede** opførsel. Fordi Juice Shop i dag opfører sig forkert, er de markeret `test.failing`: de tæller som bestået, så længe fejlen findes, og går **røde den dag fejlen rettes** – så skal `.failing` fjernes, og testen er en almindelig regressionstest (jf. guiden: "rød før fix, grøn efter").

| ID | Fejl | Observeret | Forventet | Alvor |
|----|------|------------|-----------|-------|
| FEJL-1 | Ugyldig e-mail (`ikke-en-email`) ved registrering | 201 – bruger oprettet | 400 | Middel |
| FEJL-2 | `passwordRepeat` ≠ `password` | 201 – bruger oprettet | 400 | Middel |
| FEJL-3 | Registrering uden password | 201 – bruger oprettet | 400 | Høj |
| FEJL-4 | Antal `-1` i kurven | 200 – gemmes med antal -1 | 400 | Middel |
| FEJL-5 | Antal `0` i kurven | 200 – gemmes med antal 0 | 400 | Middel |
| FEJL-6 | Læse en andens kurv (`/rest/basket/1`) | 200 – kurven returneres | 401/403 | Høj |

Årsag til FEJL-1 til 3: valideringen sker kun i frontend, ikke i API'et. FEJL-4/5 stemmer med testcase TC5 i funktionstesten.
Derudover ses at ikke-eksisterende `ProductId` giver HTTP 500 med stacktrace i stedet for en pæn 4xx-fejl.

## Forskellen på unit testing og integrationstest

| | **Unit test** | **Integrationstest** |
|---|---|---|
| Hvad testes | Én enkelt funktion/klasse **isoleret** | **Flere komponenter sammen** (API ↔ logik ↔ database ↔ auth) |
| Afhængigheder | Erstattes af mocks/stubs | Er rigtige (her: rigtig Express + SQLite) |
| Hastighed | Meget hurtig (millisekunder), ingen server | Langsommere, kræver kørende app/database |
| Finder | Logikfejl i den enkelte funktion (fx forkert beregning, manglende validering) | Fejl i **samspillet**: forkert dataformat mellem lag, fejl i SQL/join, autentificering der ikke passer til API'et |
| Fejlsøgning | Let – fejlen sidder i netop den funktion | Sværere – fejlen kan ligge i flere lag |
| Eksempel her | (se `tests/unit/`) validering af e-mail eller beregning af kurv-total | IT-3: login → læg i kurv → aflæs kurv fra databasen |

Kort sagt: en unit test svarer på *"virker denne ene del korrekt?"*, en integrationstest på *"virker delene korrekt **sammen**?"*. Et eksempel fra Juice Shop: en unit test af en kurv-funktion kan være grøn, mens integrationstesten alligevel finder, at API'et lader en bruger læse en andens kurv (FEJL-6) – det er et samspilsproblem mellem login, API og database.
