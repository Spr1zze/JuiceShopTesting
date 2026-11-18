# TC5 – Grænseværditest af antal i indkøbskurv (kør mod lokal Juice Shop)
# Kør: pwsh tests/funktionstest/tc5-antal.ps1
$base = "http://localhost:3000"
$email = "tc5test$(Get-Random)@test.dk"
$pw = "Test12345"

# Opret bruger og log ind
Invoke-RestMethod -Method Post -Uri "$base/api/Users" -ContentType "application/json" -Body (@{email=$email;password=$pw;passwordRepeat=$pw;securityQuestion=@{id=1};securityAnswer="x"} | ConvertTo-Json) | Out-Null
$login = Invoke-RestMethod -Method Post -Uri "$base/rest/user/login" -ContentType "application/json" -Body (@{email=$email;password=$pw} | ConvertTo-Json)
$h = @{Authorization="Bearer $($login.authentication.token)"}
$bid = $login.authentication.bid

# Læg produkt 1 i kurven
$item = Invoke-RestMethod -Method Post -Uri "$base/api/BasketItems" -Headers $h -ContentType "application/json" -Body (@{ProductId=1;BasketId="$bid";quantity=1} | ConvertTo-Json)
$id = $item.data.id

# Test grænseværdierne
foreach ($q in @(1, 0, -1)) {
  try {
    $r = Invoke-RestMethod -Method Put -Uri "$base/api/BasketItems/$id" -Headers $h -ContentType "application/json" -Body (@{quantity=$q} | ConvertTo-Json)
    "Antal $q -> GODTAGET (gemt antal: $($r.data.quantity))"
  } catch {
    "Antal $q -> AFVIST ($($_.Exception.Response.StatusCode.value__))"
  }
}

# Vis kurven
$p = (Invoke-RestMethod -Uri "$base/rest/basket/$bid" -Headers $h).data.Products[0]
"Kurv: $($p.name), pris $($p.price), antal $($p.BasketItem.quantity), total = $($p.price * $p.BasketItem.quantity)"
