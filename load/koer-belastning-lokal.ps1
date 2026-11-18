# Belastningstest UDEN Docker: kører k6 lokalt mod LOKAL Juice Shop med 1 -> 5 -> 10 -> 20 brugere
# og måler CPU/RAM på selve Juice Shop-processen (den der lytter på port 3000) imens.
# Samme test (belastning.js) og samme tabelformat som koer-belastning.ps1 (Docker-versionen).
#
# Kør:  powershell -File load/koer-belastning-lokal.ps1 [-K6 "sti\til\k6.exe"]
# Krav: Juice Shop kører på http://localhost:3000, og k6 er installeret (eller angives med -K6).
param(
  [int[]]$Brugere = @(1, 5, 10, 20),
  [int]$Sekunder = 30,
  [string]$Base = "http://localhost:3000",
  [string]$K6 = ""
)

$mappe = $PSScriptRoot
$out = Join-Path $mappe "resultater\lokal"   # egen mappe, så Docker-versionens resultater ikke overskrives
New-Item -ItemType Directory -Force $out | Out-Null

# Find k6
if (-not $K6) {
  $cmd = Get-Command k6 -ErrorAction SilentlyContinue
  if ($cmd) { $K6 = $cmd.Source } elseif ($env:K6_PATH) { $K6 = $env:K6_PATH }
}
if (-not $K6 -or -not (Test-Path $K6)) { throw "k6 blev ikke fundet. Installer k6 eller angiv sti med -K6 'sti\til\k6.exe'." }

# Find Juice Shop-processen via porten
$port = ([uri]$Base).Port
$lytter = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $lytter) { throw "Ingen proces lytter på port $port. Start Juice Shop først." }
$juicePid = $lytter.OwningProcess
$kerner = [Environment]::ProcessorCount
Write-Host "Juice Shop: PID $juicePid, $kerner logiske kerner. k6: $K6"

$tabel = foreach ($n in $Brugere) {
  Write-Host "Kører med $n brugere i ${Sekunder}s ..."
  $env:VUS = "$n"; $env:DURATION = "${Sekunder}s"; $env:BASE = $Base; $env:OUT = ($out -replace '\\', '/')

  $p = Start-Process -FilePath $K6 -ArgumentList @('run', '--quiet', "`"$(Join-Path $mappe 'belastning.js')`"") -PassThru -NoNewWindow

  # Mål CPU (% af én kerne, som docker stats) og RAM (working set) hvert sekund mens k6 kører
  $cpu = @(); $ram = @()
  $forrigeCpu = (Get-Process -Id $juicePid).TotalProcessorTime.TotalSeconds
  $forrigeTid = Get-Date
  while (-not $p.HasExited) {
    Start-Sleep -Seconds 1
    $proc = Get-Process -Id $juicePid -ErrorAction Stop
    $nu = Get-Date
    $nuCpu = $proc.TotalProcessorTime.TotalSeconds
    $cpu += (($nuCpu - $forrigeCpu) / ($nu - $forrigeTid).TotalSeconds) * 100
    $ram += $proc.WorkingSet64 / 1MB
    $forrigeCpu = $nuCpu; $forrigeTid = $nu
  }

  $fil = Join-Path $out "resultat-$n.json"
  if (-not (Test-Path $fil)) { throw "k6 skrev ikke $fil (exit code $($p.ExitCode))." }
  $r = Get-Content $fil | ConvertFrom-Json

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
$tabel | Export-Csv (Join-Path $out "performancetabel-lokal.csv") -NoTypeInformation -Encoding utf8
Write-Host "Tabel gemt i load/resultater/lokal/performancetabel-lokal.csv (CPU er % af én kerne; 100 % = én fuld kerne)"
