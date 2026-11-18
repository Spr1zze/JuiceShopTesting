# JuiceShopTesting

Vores PoC til faget **Softwaretest og IT-sikkerhed** (Caseopgave – Servinova / OWASP Juice Shop).
Dette repo holder vores **tests og testplatform**. Selve rapporten skrives i Google Docs.

## Hvad ligger hvor
| Mappe | Indhold |
|---|---|
| `juice-shop/` | Den sårbare webshop vi tester (OWASP Juice Shop). Køres lokalt. |
| `tests/funktionstest/` | Vores testscripts (TC5–TC7: antal-grænseværdi, password-længde, SQL injection). |
| `lokalt/` | Kun lokalt – noter, kladder osv. Ignoreres af git, kommer ikke på GitHub. |

## Kør Juice Shop lokalt
Nemmest med det færdige image:
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
Hvert script printer resultatet i terminalen (fx om en fejl/sårbarhed blev fundet).

## Sådan bruger vi repoet
- Test-resultaterne herfra skrives ind i rapporten (Google Docs).
- Smid alt lokalt (noter, screenshots) i `lokalt/` – så ryger det ikke med på GitHub.
- `git add .` er sikkert: junk er allerede ignoreret via `.gitignore`.
