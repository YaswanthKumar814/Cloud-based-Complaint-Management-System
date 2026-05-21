# Push Docker image to Amazon ECR (Windows PowerShell 5.1+)
# Usage:
#   .\scripts\push-to-ecr.ps1
#   .\scripts\push-to-ecr.ps1 -Service notification

param(
    [ValidateSet('complaint', 'notification')]
    [string]$Service = 'complaint'
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$EnvFile = Join-Path $PSScriptRoot "ecr.env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

if (-not $env:AWS_REGION) { $env:AWS_REGION = "ap-south-1" }
if (-not $env:AWS_ACCOUNT_ID) {
    Write-Host "ERROR: Set AWS_ACCOUNT_ID in scripts/ecr.env" -ForegroundColor Red
    exit 1
}

$Region = $env:AWS_REGION
$AccountId = $env:AWS_ACCOUNT_ID

if ($Service -eq 'notification') {
    $Repo = $env:NOTIFICATION_ECR_REPO
    if (-not $Repo) { $Repo = "notification-service" }
    $LocalImage = "notification-service:latest"
    $BuildContext = Join-Path $ProjectRoot "services\notification-service"
} else {
    $Repo = $env:ECR_REPO
    if (-not $Repo) { $Repo = "complaint-service" }
    $LocalImage = $env:LOCAL_IMAGE
    if (-not $LocalImage) { $LocalImage = "complaint-service:latest" }
    $BuildContext = $ProjectRoot
}

$Registry = "$AccountId.dkr.ecr.$Region.amazonaws.com"
$ImageUri = "$Registry/${Repo}:latest"

Write-Host "Building: $LocalImage (context: $BuildContext)"
docker build -t $LocalImage $BuildContext

Write-Host "Logging in to ECR: $Registry"
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $Registry

Write-Host "Tagging: $ImageUri"
docker tag $LocalImage $ImageUri

Write-Host "Pushing..."
docker push $ImageUri

Write-Host ""
Write-Host "Done. Image URI:" -ForegroundColor Green
Write-Host $ImageUri
