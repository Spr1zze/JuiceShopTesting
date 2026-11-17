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

## Roller (kan kombineres)
- Softwaretester: testplan, funktionstest, unit + integrationstest
- Automatisering: scriptede tests, CI/CD, performance
- Sikkerhed: login, hashing, HTTPS, SQLi/XSS, ZAP
- Koordinator: plan, rapport, præsentation

## Tidsplan
- Onsdag: opstart, roller, testplan, funktionstest, unit/integration, start på automatisering
- Torsdag morgen: CI/CD, performance, UX, sikkerhed
- Torsdag før 14: rapport færdig + aflever

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
