param(
  [switch]$Restart
)

$ErrorActionPreference = "Stop"

function Import-DotEnv {
  param(
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  foreach ($rawLine in Get-Content -LiteralPath $Path) {
    $line = $rawLine.Trim()
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
      continue
    }

    $separatorIndex = $line.IndexOf("=")
    if ($separatorIndex -lt 1) {
      continue
    }

    $name = $line.Substring(0, $separatorIndex).Trim()
    $value = $line.Substring($separatorIndex + 1)

    if ($value.Length -ge 2) {
      if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
    }

    if (-not [string]::IsNullOrWhiteSpace($name)) {
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
}

function Get-ListeningPid {
  param(
    [int]$Port
  )

  $match = netstat -ano | Select-String ":$Port"
  foreach ($entry in $match) {
    $text = $entry.ToString().Trim()
    if ($text -match "LISTENING\s+(\d+)$") {
      return [int]$Matches[1]
    }
  }

  return $null
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$hermesScriptsDir = "C:\Users\Damian\AppData\Local\hermes\hermes-agent\venv\Scripts"
$paperclipEnvPath = "C:\Users\Damian\.paperclip\instances\default\.env"
$hermesEnvPath = "C:\Users\Damian\AppData\Local\hermes\.env"

Import-DotEnv -Path $hermesEnvPath
Import-DotEnv -Path $paperclipEnvPath
Import-DotEnv -Path (Join-Path $repoRoot ".env")

$pathSegments = @(
  $PSScriptRoot,
  $hermesScriptsDir,
  $env:PATH
) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

$env:PATH = ($pathSegments -join ";")

if ($Restart) {
  $existingPid = Get-ListeningPid -Port 3100
  if ($existingPid) {
    try {
      Stop-Process -Id $existingPid -Force
      Start-Sleep -Seconds 2
    } catch {
      Write-Warning "Could not stop existing Paperclip process on port 3100 (PID $existingPid): $($_.Exception.Message)"
    }
  }
}

$paperclipCmd = Get-ChildItem -Path "$env:LOCALAPPDATA\npm-cache\_npx" -Filter "paperclipai.cmd" -Recurse -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $paperclipCmd) {
  throw "Could not find cached paperclipai.cmd under $env:LOCALAPPDATA\npm-cache\_npx. Run npx paperclipai onboard --yes once first."
}

Write-Host "Using Paperclip CLI: $paperclipCmd"
Write-Host "Using Hermes Python: $hermesScriptsDir\python.exe"

& $paperclipCmd run
