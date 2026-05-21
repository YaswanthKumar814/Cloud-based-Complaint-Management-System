# Build complaint-frontend Docker image with Vite env from frontend/.env
# Usage: .\scripts\build-frontend-image.ps1 [-Tag complaint-frontend:latest]

param(
    [string]$Tag = "complaint-frontend:latest"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $ProjectRoot "frontend"
$EnvFile = Join-Path $FrontendDir ".env"

function Get-EnvValue($name, $default) {
    if (-not (Test-Path $EnvFile)) { return $default }
    foreach ($line in Get-Content $EnvFile) {
        if ($line -match "^\s*$name\s*=\s*(.+)$") {
            return $matches[1].Trim()
        }
    }
    return $default
}

$apiUrl = Get-EnvValue "VITE_API_URL" "http://localhost:5000"
$appUrl = Get-EnvValue "VITE_APP_URL" "http://localhost:5173"
$region = Get-EnvValue "VITE_AWS_REGION" "ap-south-1"
$poolId = Get-EnvValue "VITE_COGNITO_USER_POOL_ID" ""
$clientId = Get-EnvValue "VITE_COGNITO_CLIENT_ID" ""
$cognitoDomain = Get-EnvValue "VITE_COGNITO_DOMAIN" ""
$adminEmail = Get-EnvValue "VITE_ADMIN_EMAIL" ""

if (-not $poolId -or -not $clientId -or -not $cognitoDomain) {
    Write-Host "ERROR: Set Cognito vars in frontend\.env (copy from frontend\.env.example)" -ForegroundColor Red
    exit 1
}

Write-Host "Building frontend image: $Tag" -ForegroundColor Cyan
Write-Host "  VITE_API_URL=$apiUrl"
Write-Host "  VITE_APP_URL=$appUrl"

docker build -t $Tag `
    --build-arg "VITE_API_URL=$apiUrl" `
    --build-arg "VITE_APP_URL=$appUrl" `
    --build-arg "VITE_AWS_REGION=$region" `
    --build-arg "VITE_COGNITO_USER_POOL_ID=$poolId" `
    --build-arg "VITE_COGNITO_CLIENT_ID=$clientId" `
    --build-arg "VITE_COGNITO_DOMAIN=$cognitoDomain" `
    --build-arg "VITE_ADMIN_EMAIL=$adminEmail" `
    $FrontendDir

Write-Host "Done: $Tag" -ForegroundColor Green
