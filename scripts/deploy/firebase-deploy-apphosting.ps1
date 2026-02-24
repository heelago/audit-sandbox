param(
  [switch]$DebugMode
)

$ErrorActionPreference = "Stop"
if ($PSVersionTable.PSVersion.Major -ge 7) {
  $PSNativeCommandUseErrorActionPreference = $false
}

$projectId = "h2eapps-unified"
$onlyTarget = "apphosting"

if (-not (Get-Command firebase.cmd -ErrorAction SilentlyContinue)) {
  throw "firebase.cmd is not installed or not on PATH."
}

if (-not (Test-Path "apphosting.yaml")) {
  throw "apphosting.yaml is missing in repo root."
}

$env:NO_UPDATE_NOTIFIER = "1"
$env:NEXT_TELEMETRY_DISABLED = "1"

$args = @(
  "deploy",
  "--only", $onlyTarget,
  "--project", $projectId
)

if ($DebugMode) {
  $args += "--debug"
}

Write-Host "Deploying '$onlyTarget' to project '$projectId'..."
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
    throw "Firebase App Hosting deploy failed with exit code $exitCode."
  }
}

Write-Host "App Hosting deploy completed."
