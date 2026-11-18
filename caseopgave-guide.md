# Guide – Caseopgave Juice Shop (Servinova)

**Deadline: torsdag kl. 14.00** · Fremlæggelse 20 min + 10 min votering · Grupper på 2–3

## Hvad skal afleveres
- Kort proces- og produktrapport (med skærmbilleder + testresultater)
- Kildekode: tests, scripts, CI/CD fil, kodeændringer
- Hvis noget ikke blev lavet: skriv det + kort hvorfor

## Kom i gang (gør det først)
- Kør Juice Shop lokalt: `docker run -d -p 3000:3000 bkimminich/juice-shop` → http://localhost:3000
- Clone kildekoden også: `git clone https://github.com/juice-shop/juice-shop` (til white-box og kodeændring)
- Lav jeres eget GitHub repo til tests, scripts og rapport
- VIGTIGT: ingen scanning/belastning på den offentlige herokuapp-side, kun lokalt

## Samarbejde – hvor ligger hvad
- Rapport: ét Google Doc, delt med alle som Redaktør
- Kode: ét GitHub repo, de andre tilføjet som collaborators
- Skærmbilleder: sæt direkte ind i Google Doc under det rigtige afsnit
- Juice Shop selv: hver kører den lokalt i Docker (skal ikke i repoet)
- Aflevering: Google Doc som PDF + link til GitHub repo

Repo-mapper (hver arbejder i sin egen mappe = ingen konflikter):
- `tests/unit/` + `tests/ui-test/` → A
- `tests/integration/` + `tests/api/` + `load/` + `.github/workflows/` → B
- `security/` (bcrypt demo, ZAP rapport, login.ts før/efter) → C

Git-regel: `git pull` før du starter, commit + push ofte

## Fordeling på 3 personer

### Person A – Test
- Testplan + 6 testcases (funktionstest)
- 4 unit tests
- UX-test med testperson
- HTTPS/TLS demo

### Person B – Automatisering
- 2 integrationstests (API + database)
- Scriptet browser/API-test
- CI/CD pipeline (GitHub Actions)
- Belastningstest + performancetabel

### Person C – Sikkerhed
- Login + adgangskontrol test
- MD5 vs bcrypt + bcrypt demo
- SQLi + XSS test
- ZAP scan + risikotabel
- Fix af SQLi + gentest

### Fælles (alle 3)
- Koordinator går på skift (A onsdag formiddag, B onsdag eftermiddag, C torsdag)
- Hver skriver rapportafsnit om sin egen del
- Go/No-Go og konklusion skrives sammen
- Præsentation: hver præsenterer sin egen del

### Ting der binder delene sammen
- A's testcases → B automatiserer 1–2 af dem
- C's SQLi fix → B laver en test i CI der er rød før fix og grøn efter
- C's fund → A skriver dem ind i testplanen som fejl

### Så alle forstår det hele
- Start onsdag: alle 3 kører Juice Shop, prøver happy path og SQLi login sammen (30 min)
- 2 tjekpunkter (onsdag kl. ~14 + torsdag morgen): hver viser de andre hvad de har lavet (10 min hver)
- Review på kryds: A tjekker C's del, B tjekker A's, C tjekker B's
- Generalprøve: hver skal kunne forklare én af de andres dele, da lærerne kan spørge alle

## Tidsplan
- Onsdag formiddag: alle sammen opsætning + happy path → så hver sin del
- Onsdag eftermiddag: A testplan + unit, B integration + CI, C SQLi/XSS + bcrypt
- Torsdag morgen: A UX + HTTPS, B belastningstest, C ZAP + fix + gentest
- Torsdag 11–13: rapport samles, Go/No-Go sammen, generalprøve
- Torsdag før 14: aflever

---

## 1. Testplan og funktionstest
- Min. 6 testcases i en tabel: ID, funktion, metode, input, forventet, faktisk, bestået/fejl
- Funktioner: login, registrering, søgning, indkøbskurv, checkout, brugerinput
- Black-box: test via UI uden at kigge i koden
- White-box: kig i koden (fx `routes/login.ts`) og test ud fra den
- Grænseværdi: fx antal i kurv 0 / 1 / -1 / meget stort, password-længde, tom søgning
- Ved fejl: beskriv fejlen + hvor alvorlig (lav/middel/høj)

Eksempler på testcases:
- Login med korrekt bruger → logget ind
- Login med forkert password → fejlbesked
- Søg "apple" → viser apple-produkter
- Læg vare i kurv → kurv opdateres
- Antal = -1 i kurv → bør afvises (Juice Shop tillader det = fejl)
- Registrering med ugyldig email → bør afvises

## 2. Unit tests og integrationstests
- Min. 4 unit tests + 2 integrationstests
- Framework: Jest (eller Mocha, som Juice Shop selv bruger)
- Unit: små egne funktioner der bygger på webshoppen (fx beregn kurv-total, valider email, valider antal)
- Test både gyldigt og ugyldigt input
- Integration: kald Juice Shop API mod den kørende app (API + database sammen)
  - fx `POST /rest/user/login` → får token
  - fx `GET /rest/products/search?q=apple` → får produkter tilbage
- Forklar forskellen: unit = én funktion isoleret, integration = flere dele der arbejder sammen

## 3. Automatisering og CI/CD
- Min. 1 scriptet browser- eller API-test (Playwright eller Jest/supertest)
- GitHub Actions workflow (`.github/workflows/test.yml`) der:
  - starter Juice Shop som Docker service
  - kører alle tests ved push
- Tag skærmbillede af en grøn (og evt. en rød) kørsel
- Forklar: fejl fanges automatisk ved hver ny ændring, før det rammer produktion

## 4. Performance / belastningstest
- Værktøj: k6, Artillery eller JMeter (kun lokalt!)
- Øg gradvist: 1 → 5 → 10 → 20 brugere
- Mål: svartid (gns/max), fejlprocent, CPU, RAM (`docker stats` til CPU/RAM)
- Lav en tabel: brugere | svartid | fejl % | CPU | RAM
- Find flaskehalse (fx søgning, SQLite database, én Node-proces)

## 5. UX-test
- Min. 1 testperson (fx en fra anden gruppe)
- Opgaver: find et produkt, læg i kurv, gå til kurv
- Notér: hvor de går i stå, hvor lang tid det tager, hvad de siger
- Skriv 3–5 forbedringsforslag

## 6. Authentication, hashing og HTTPS
- Test login: korrekt, forkert, tomt, SQL injection i email
- Adgangskontrol: kan man se andres kurv ved at ændre id i `/rest/basket/<id>`? kan man åbne `/#/administration`?
- Hashing: Juice Shop bruger MD5 uden salt → hurtig at knække, dårligt
- MD5 vs bcrypt/Argon2id: moderne er langsomme med vilje + salt → svære at brute force
- Demo: lille Node-script med `bcrypt` der hasher og tjekker et password
- HTTPS: lav self-signed certifikat (mkcert eller openssl) + reverse proxy (Caddy/nginx) foran Juice Shop
- Forklar: TLS krypterer trafikken så ingen kan læse passwords/tokens undervejs

## 7. Sårbarhedsanalyse og ZAP
- Brug OWASP Top 10 som tjekliste
- SQL injection: login med email `' OR 1=1--` → logget ind som admin
- XSS: søg på `<iframe src="javascript:alert('xss')">` → popup
- Adgangskontrol: andres kurv / admin-side (se ovenfor)
- Kør OWASP ZAP (automated scan) mod `http://localhost:3000`
- Lav tabel: sårbarhed | OWASP kategori | alvorlighed | anbefaling
- Sikkerhedsforbedring: ret SQL injection i `routes/login.ts` med parameteriseret query
- Gentest: prøv `' OR 1=1--` igen → skal fejle nu (skærmbillede før/efter)

## 8. Releasevurdering (Go/No-Go)
- Svaret er No-Go
- Begrund: SQLi, XSS, MD5, dårlig adgangskontrol osv.
- Husk at skelne: Juice Shop er sårbar MED VILJE, men en rigtig webshop med de fejl må ikke i produktion
- Skriv hvad der skal fixes før det kunne blive Go

---

## Rapport – indhold (tjekliste)
- [ ] Projektbeskrivelse og formål
- [ ] Rollefordeling og arbejdsproces
- [ ] Testplan med min. 6 testcases
- [ ] Unit- og integrationstest resultater
- [ ] Automatiserede tests og CI/CD
- [ ] Performance + UX
- [ ] Sikkerhedsanalyse + værktøjer
- [ ] Fundne fejl og sikkerhedsforbedringer
- [ ] Konklusion + Go/No-Go

## Fremlæggelse (20 min)
- 2 min: intro + roller
- 5 min: testplan, unit, integration
- 4 min: automatisering + CI/CD (vis en kørsel live)
- 5 min: performance, UX, sikkerhed (vis SQLi før/efter fix)
- 4 min: Go/No-Go + konklusion
- Alle skal sige noget, og vis tests der virker i stedet for kun slides
