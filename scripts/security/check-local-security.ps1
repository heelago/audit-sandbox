param()

$ErrorActionPreference = "Stop"

Write-Host "== Local Security Check =="
Write-Host "Project: audit-sandbox"
Write-Host ""

function Run-Rg {
  param(
    [string]$Label,
    [string]$Pattern,
    [string]$Path = ".",
    [string[]]$ExtraArgs = @()
  )

  Write-Host "-- $Label"
  $args = @("-n", "--hidden", "--glob", "!node_modules/**", "--glob", "!.next/**")
  if ($ExtraArgs.Count -gt 0) {
    $args += $ExtraArgs
  }
  $args += @($Pattern, $Path)
  $result = & rg @args 2>$null
  if ([string]::IsNullOrWhiteSpace($result)) {
    Write-Host "OK: no matches"
  } else {
    Write-Host "WARN: matches found"
    Write-Host $result
  }
  Write-Host ""
}

Run-Rg -Label "Client-exposed env names (NEXT_PUBLIC + sensitive words)" -Pattern "NEXT_PUBLIC.*(KEY|SECRET|TOKEN|PASSWORD)" -Path "src"
Run-Rg -Label "Sensitive runtime vars referenced in app/components client surface" -Pattern "(GEMINI_API_KEY|SESSION_SECRET|DATABASE_URL)" -Path "src/app" -ExtraArgs @("--glob", "!src/app/api/**")
Run-Rg -Label "Sensitive runtime vars referenced in shared components" -Pattern "(GEMINI_API_KEY|SESSION_SECRET|DATABASE_URL)" -Path "src/components"
Run-Rg -Label "Potential permissive Firestore rules" -Pattern "allow\\s+read\\s*,\\s*write\\s*:\\s*if\\s+true" -Path "."
Run-Rg -Label "Prompt/internal leakage markers in student routes" -Pattern "(knownPitfalls|referenceMaterial|evaluationCriteria|exemplarNotes)" -Path "src/app/student"

Write-Host "Done."
