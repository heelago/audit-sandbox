param(
  [switch]$DebugMode
)

$ErrorActionPreference = "Stop"
if ($PSVersionTable.PSVersion.Major -ge 7) {
  $PSNativeCommandUseErrorActionPreference = $false
}

$projectId = "h2eapps-unified"
$onlyTarget = "apphosting"
$configFile = "firebase.demo.json"
$defaultYaml = "apphosting.yaml"
$demoYaml = "apphosting.demo.yaml"
$backupYaml = "apphosting.yaml.codex-backup"

if (-not (Get-Command firebase.cmd -ErrorAction SilentlyContinue)) {
  throw "firebase.cmd is not installed or not on PATH."
}

if (-not (Test-Path $defaultYaml)) {
  throw "$defaultYaml is missing in repo root."
}

if (-not (Test-Path $demoYaml)) {
  throw "$demoYaml is missing in repo root."
}

if (-not (Test-Path $configFile)) {
  throw "$configFile is missing in repo root."
}

$env:NO_UPDATE_NOTIFIER = "1"
$env:NEXT_TELEMETRY_DISABLED = "1"

$args = @(
  "deploy",
  "--only", $onlyTarget,
  "--project", $projectId,
  "--config", $configFile
)

if ($DebugMode) {
  $args += "--debug"
}

Write-Host "Deploying '$onlyTarget' (demo backend) to project '$projectId'..."
Copy-Item -Path $defaultYaml -Destination $backupYaml -Force
Copy-Item -Path $demoYaml -Destination $defaultYaml -Force

try {
  $nativePreference = $ErrorActionPreference
  try {
    # Firebase emits progress on stderr; do not treat that stream as terminating.
    $ErrorActionPreference = "Continue"
    $deployOutput = & firebase.cmd @args 2>&1
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $nativePreference
  }

  if ($deployOutput) {
    $deployOutput | ForEach-Object { Write-Host $_ }
  }

  if ($exitCode -ne 0) {
    $outputText = ($deployOutput | Out-String)
    $rolloutComplete = $outputText -match 'Rollout for backend .* complete!'
    $deployComplete = $outputText -match 'Deploy complete!'
    if ($rolloutComplete -and $deployComplete) {
      Write-Warning "Firebase CLI exited with code $exitCode after a successful rollout (likely local update-check/configstore issue). Continuing."
    } else {
      throw "Firebase App Hosting demo deploy failed with exit code $exitCode."
    }
  }
} finally {
  if (Test-Path $backupYaml) {
    Move-Item -Path $backupYaml -Destination $defaultYaml -Force
  }
}

Write-Host "App Hosting demo deploy completed."
