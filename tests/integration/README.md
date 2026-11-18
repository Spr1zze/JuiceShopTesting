# Integrationstests (API + database)

Hører til opgaven *Unit testing og integrationstest* (del: **integrationstests**).
Testene kører mod en **kørende OWASP Juice Shop** og rammer den rigtige Express-API og den rigtige SQLite-database – der bruges ingen mocks.

- **Framework:** [Jest](https://jestjs.io/) 29 + [Supertest](https://github.com/ladjs/supertest) (HTTP-kald)
- **Antal:** 2 integrationstests (IT-1, IT-2), hver med 1 gyldigt og 1 ugyldigt testcase = 4 testcases
- **Seneste resultat:** 2 suites, **4/4 bestået** (se `results/testresultat.txt` og `results/testresultat.png`)

## Sådan kører du dem

```bash
# 1. Start Juice Shop (en af delene)
docker run -d -p 3000:3000 bkimminich/juice-shop
#   eller fra kildekoden i denne repo:  cd juice-shop && npm install && npm run build && npm start

# 2. Kør testene
cd tests/integration
npm install
npm test                                  # standard: http://localhost:3000
BASE_URL=http://localhost:3001 npm test   # hvis appen kører et andet sted
```

Testene opretter selv nye brugere med unikke e-mails (`helpers.js`), så de kan køres igen uden at nulstille databasen.
**Kun lokalt** – kør aldrig mod den offentlige Heroku-side.

## De to integrationstests

| ID | Fil | Komponenter i samspil | Gyldigt testcase | Ugyldigt testcase |
|----|-----|-----------------------|------------------|-------------------|
| **IT-1** | `01-registrering-login.test.js` | `POST /api/Users` → Sequelize → SQLite (Users) → `POST /rest/user/login` → JWT | Bruger registreres (201, id fra databasen) og kan logge ind (200 + JWT-token) | Forkert password → 401, intet token |
| **IT-2** | `02-indkoebskurv.test.js` | JWT-login → `POST /api/BasketItems` (lagercheck) → BasketItems → `GET /rest/basket/:id` (join Baskets + BasketItems + Products) | Vare lægges i kurv og aflæses igen med korrekt navn, antal 2 og total 2 × 1,99 | Antal 99999 → 400 "only up to 5 items", og intet er gemt i kurven |

Hver test tjekker både **statuskode**, **svarets indhold** og at **databasen er som forventet** bagefter (fx at en afvist vare ikke dukker op i kurven).

## Forskellen på unit testing og integrationstest

| | **Unit test** | **Integrationstest** |
|---|---|---|
| Hvad testes | Én enkelt funktion/klasse **isoleret** | **Flere komponenter sammen** (API ↔ logik ↔ database ↔ auth) |
| Afhængigheder | Erstattes af mocks/stubs | Er rigtige (her: rigtig Express + SQLite) |
| Hastighed | Meget hurtig, ingen server nødvendig | Langsommere, kræver kørende app/database |
| Finder | Logikfejl i den enkelte funktion | Fejl i **samspillet**: forkert dataformat mellem lag, fejl i SQL/join, auth der ikke passer til API'et |
| Fejlsøgning | Let – fejlen sidder i netop den funktion | Sværere – fejlen kan ligge i flere lag |

Kort sagt: en unit test svarer på *"virker denne ene del korrekt?"*, en integrationstest på *"virker delene korrekt **sammen**?"*.
