# TC7 - White-box test af login-input (lokal Juice Shop, sikkerhedstraening)
# routes/login.ts bygger SQL-queryen med email-strengen direkte, derfor testes dette input.
# Forventet i en sikker app: login afvises. Juice Shop er bevidst saarbar.
# Koer: pwsh tests/funktionstest/tc7-login-injection.ps1
$base = "http://localhost:3000"
$payload = "' OR 1=1--"

try {
  $r = Invoke-RestMethod -Method Post -Uri "$base/rest/user/login" -ContentType "application/json" -Body (@{email=$payload;password="vilkaarlig"} | ConvertTo-Json)
  "Input: $payload  ->  LOGIN GODTAGET (bruger: $($r.authentication.umail))  = SAARBARHED"
} catch {
  "Input: $payload  ->  LOGIN AFVIST ($($_.Exception.Response.StatusCode.value__))  = sikker"
}
