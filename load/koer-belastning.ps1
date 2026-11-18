# Belastningstest: kører k6 (via Docker) mod LOKAL Juice Shop med 1 -> 5 -> 10 -> 20 brugere
# og måler CPU/RAM på Juice Shop-containeren med docker stats imens.
# Kør: pwsh load/koer-belastning.ps1   (Juice Shop skal køre på localhost:3000)
param(
  [int[]]$Brugere = @(1, 5, 10, 20),
  [string]$Varighed = "30s"
)

$mappe = $PSScriptRoot
$out = Join-Path $mappe "resultater"
New-Item -ItemType Directory -Force $out | Out-Null

$cid = docker ps -q --filter "ancestor=bkimminich/juice-shop" | Select-Object -First 1
if (-not $cid) { throw "Juice Shop-containeren kører ikke. Start den med: docker run -d -p 3000:3000 bkimminich/juice-shop" }

function ConvertTo-MiB([string]$s) {
  if ($s -match '([\d\.]+)\s*(GiB|MiB|KiB|kB|MB|GB)') {
    $v = [double]$matches[1]
    switch ($matches[2]) { 'GiB' { $v * 1024 } 'GB' { $v * 1000 } 'KiB' { $v / 1024 } 'kB' { $v / 1000 } default { $v } }
  } else { 0 }
}

$tabel = foreach ($n in $Brugere) {
  Write-Host "Kører med $n brugere i $Varighed ..."

  # Mål CPU/RAM i baggrunden mens testen kører
  $stats = Start-Job -ArgumentList $cid -ScriptBlock {
    param($cid)
    while ($true) { docker stats --no-stream --format "{{.CPUPerc}};{{.MemUsage}}" $cid }
  }

  docker run --rm -v "${mappe}:/scripts" -v "${out}:/out" `
    -e VUS=$n -e DURATION=$Varighed `
    grafana/k6:1.0.0 run --quiet /scripts/belastning.js | Out-Null

  Stop-Job $stats
  $maalinger = Receive-Job $stats | Where-Object { $_ -match ';' }
  Remove-Job $stats

  $cpu = $maalinger | ForEach-Object { [double](($_ -split ';')[0] -replace '%', '') }
  $ram = $maalinger | ForEach-Object { ConvertTo-MiB (($_ -split ';')[1] -split '/')[0] }
  $r = Get-Content (Join-Path $out "resultat-$n.json") | ConvertFrom-Json

  [pscustomobject]@{
    Brugere       = $n
    Requests      = $r.requests
    'Gns (ms)'    = [math]::Round($r.gns_ms, 1)
    'p95 (ms)'    = [math]::Round($r.p95_ms, 1)
    'Max (ms)'    = [math]::Round($r.max_ms, 1)
    'Fejl %'      = [math]::Round($r.fejl_pct, 2)
    'CPU gns %'   = [math]::Round(($cpu | Measure-Object -Average).Average, 1)
    'CPU max %'   = [math]::Round(($cpu | Measure-Object -Maximum).Maximum, 1)
    'RAM max MiB' = [math]::Round(($ram | Measure-Object -Maximum).Maximum, 0)
  }
}

$tabel | Format-Table -AutoSize
$tabel | Export-Csv (Join-Path $out "performancetabel.csv") -NoTypeInformation -Encoding utf8
Write-Host "Tabel gemt i load/resultater/performancetabel.csv"
