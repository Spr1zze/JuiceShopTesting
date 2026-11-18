# TC6 – Grænseværditest af password-længde ved registrering (kør mod lokal Juice Shop)
# Kør: pwsh tests/funktionstest/tc6-password-laengde.ps1
$base = "http://localhost:3000"

foreach ($len in @(4, 5, 40, 41)) {
  $pw = "a" * $len
  $email = "tc6test$(Get-Random)@test.dk"
  try {
    Invoke-RestMethod -Method Post -Uri "$base/api/Users" -ContentType "application/json" -Body (@{email=$email;password=$pw;passwordRepeat=$pw;securityQuestion=@{id=1};securityAnswer="x"} | ConvertTo-Json) | Out-Null
    "Password $len tegn -> GODTAGET"
  } catch {
    "Password $len tegn -> AFVIST ($($_.Exception.Response.StatusCode.value__))"
  }
}
