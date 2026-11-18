# JuiceShopTesting

Vores PoC til faget **Softwaretest og IT-sikkerhed** (Caseopgave – Servinova / OWASP Juice Shop).
Dette repo holder vores **tests, scripts og testplatform**. Selve rapporten skrives i Google Docs.

> Test **kun** mod Juice Shop lokalt – aldrig mod den offentlige herokuapp-side.

## Hvad ligger hvor
| Sti | Indhold |
|---|---|
| `caseopgave-guide.md` | Opgaveguiden: fordeling, tidsplan og hvad hver del skal indeholde. Start her. |
| `juice-shop/` | Kildekoden til Juice Shop. Bruges til white-box test (fx `routes/login.ts`) og SQLi-fixet. |
| `tests/funktionstest/` | Testscripts TC5–TC7 (se nedenfor). |

Mapper der kommer til (hver arbejder i sin egen = ingen merge-konflikter):

| Mappe | Ejer |
|---|---|
| `tests/unit/`, `tests/ui-test/` | A – Test |
| `tests/integration/`, `tests/api/`, `load/`, `.github/workflows/` | B – Automatisering |
| `security/` (bcrypt-demo, ZAP-rapport, login.ts før/efter) | C – Sikkerhed |

## Kør Juice Shop lokalt
Nemmest med det færdige Docker-image:
```
docker run -d -p 3000:3000 bkimminich/juice-shop
```
Åbn så **http://localhost:3000** (vent 10–30 sek. på at den starter).

## Kør vores tests
Mens Juice Shop kører:
```
pwsh tests/funktionstest/tc5-antal.ps1
pwsh tests/funktionstest/tc6-password-laengde.ps1
pwsh tests/funktionstest/tc7-login-injection.ps1
```

| Test | Hvad den tester | Forventet i en sikker webshop |
|---|---|---|
| TC5 | Antal i kurv: 1, 0, -1 (grænseværdi) | 0 og -1 afvises |
| TC6 | Password-længde ved registrering: 4, 5, 40, 41 tegn | 4 og 41 afvises (UI'et kræver 5–40) |
| TC7 | Login med `' OR 1=1--` i email (white-box, SQL injection) | Login afvises |

Hvert script printer resultatet i terminalen (`GODTAGET` / `AFVIST`). Juice Shop er sårbar med vilje, så flere af dem *skal* finde fejl.

## Sådan bruger vi repoet
- `git pull` før du starter, commit + push ofte.
- Test-resultaterne herfra skrives ind i rapporten (Google Docs).
- `git add .` er sikkert: junk er allerede ignoreret via `.gitignore`.
