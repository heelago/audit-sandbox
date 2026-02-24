param(
  [switch]$DebugMode,
  [switch]$Force,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
if ($PSVersionTable.PSVersion.Major -ge 7) {
  $PSNativeCommandUseErrorActionPreference = $false
}

function Test-DeployRelevantFile {
  param([string]$Path)

  $normalized = $Path.Replace('\', '/')
  $relevantPatterns = @(
    '^src/',
    '^prisma/',
    '^public/',
    '^package\.json$',
    '^pnpm-lock\.yaml$',
    '^next\.config\.(mjs|js|ts)$',
    '^middleware\.ts$',
    '^tsconfig\.json$',
    '^tsconfig\..+\.json$',
    '^apphosting\.yaml$',
    '^firebase\.json$',
    '^\.firebaseignore$',
    '^\.firebaserc$',
    '^scripts/deploy/firebase-deploy-apphosting\.ps1$'
  )

  foreach ($pattern in $relevantPatterns) {
    if ($normalized -match $pattern) {
      return $true
    }
  }

  return $false
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
Set-Location $repoRoot

if (-not (Get-Command firebase.cmd -ErrorAction SilentlyContinue)) {
  throw "firebase.cmd is not installed or not on PATH."
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Warning "git not found; falling back to normal deploy."
  if (-not $DryRun) {
    if ($DebugMode) {
      & powershell -ExecutionPolicy Bypass -File (Join-Path $scriptDir "firebase-deploy-apphosting.ps1") -DebugMode
    } else {
      & powershell -ExecutionPolicy Bypass -File (Join-Path $scriptDir "firebase-deploy-apphosting.ps1")
    }
  }
  exit 0
}

$backendId = "auditsandbox"
if (Test-Path "firebase.json") {
  try {
    $firebaseConfig = Get-Content "firebase.json" -Raw | ConvertFrom-Json
    if ($firebaseConfig.apphosting.backendId) {
      $backendId = [string]$firebaseConfig.apphosting.backendId
    }
  } catch {
    Write-Warning "Could not parse firebase.json; using backendId '$backendId'."
  }
}

$headCommit = (& git rev-parse --verify HEAD 2>$null).Trim()
if (-not $headCommit) {
  throw "Could not resolve HEAD commit."
}

$stateDir = Join-Path ".firebase" "deploy-state"
$stateFile = Join-Path $stateDir "$backendId.last_deployed_commit.txt"
$lastDeployedCommit = $null
if (Test-Path $stateFile) {
  $lastDeployedCommit = (Get-Content $stateFile -Raw).Trim()
}

$changedFiles = @()
if ($lastDeployedCommit) {
  $changedFiles = @(& git diff --name-only "$lastDeployedCommit..$headCommit" 2>$null)
} else {
  $changedFiles = @(& git show --pretty="" --name-only $headCommit 2>$null)
}

$changedFiles = $changedFiles |
  Where-Object { $_ -and $_.Trim().Length -gt 0 } |
  ForEach-Object { $_.Trim() } |
  Sort-Object -Unique

$relevantChanges = @($changedFiles | Where-Object { Test-DeployRelevantFile $_ })
$shouldDeploy = $true
$skipReason = $null

if (-not $Force) {
  if ($lastDeployedCommit -and $lastDeployedCommit -eq $headCommit) {
    $shouldDeploy = $false
    $skipReason = "HEAD commit already recorded as deployed."
  } elseif ($changedFiles.Count -eq 0) {
    $shouldDeploy = $false
    $skipReason = "No changes detected since last deployed commit."
  } elseif ($relevantChanges.Count -eq 0) {
    $shouldDeploy = $false
    $skipReason = "Only non-runtime/doc/deploy-irrelevant files changed."
  }
}

if (-not $shouldDeploy) {
  Write-Host "Skipping App Hosting deploy: $skipReason"
  if ($changedFiles.Count -gt 0) {
    Write-Host "Changed files:"
    $changedFiles | ForEach-Object { Write-Host "  - $_" }
  }
  Write-Host "Use -Force to override."
  exit 0
}

Write-Host "Smart deploy check passed for backend '$backendId'."
if ($lastDeployedCommit) {
  Write-Host "Last deployed commit: $lastDeployedCommit"
} else {
  Write-Host "Last deployed commit: (not recorded yet)"
}
Write-Host "Deploying commit: $headCommit"
if ($relevantChanges.Count -gt 0) {
  Write-Host "Relevant changed files:"
  $relevantChanges | ForEach-Object { Write-Host "  - $_" }
}

if ($DryRun) {
  Write-Host "Dry run only. No deploy executed."
  exit 0
}

if ($DebugMode) {
  & powershell -ExecutionPolicy Bypass -File (Join-Path $scriptDir "firebase-deploy-apphosting.ps1") -DebugMode
} else {
  & powershell -ExecutionPolicy Bypass -File (Join-Path $scriptDir "firebase-deploy-apphosting.ps1")
}

if (-not (Test-Path $stateDir)) {
  New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
}
Set-Content -Path $stateFile -Value $headCommit -Encoding utf8
Write-Host "Recorded deployed commit for '$backendId': $headCommit"
