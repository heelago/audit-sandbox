param(
  [switch]$DebugMode
)

$ErrorActionPreference = "Stop"

$projectId = "h2eapps-unified"
$hostingTarget = "auditSandbox"

if (-not (Get-Command firebase.cmd -ErrorAction SilentlyContinue)) {
  throw "firebase.cmd is not installed or not on PATH."
}

if (-not (Test-Path "next.config.mjs")) {
  Write-Warning "next.config.mjs not found. Framework detection may fail."
}

$env:NO_UPDATE_NOTIFIER = "1"
$env:NEXT_TELEMETRY_DISABLED = "1"

$args = @(
  "deploy",
  "--only", "hosting:$hostingTarget",
  "--project", $projectId
)

if ($DebugMode) {
  $args += "--debug"
}

Write-Host "Deploying hosting target '$hostingTarget' to project '$projectId'..."
& firebase.cmd @args

if ($LASTEXITCODE -ne 0) {
  throw "Firebase scoped deploy failed with exit code $LASTEXITCODE."
}

Write-Host "Scoped deploy completed."

