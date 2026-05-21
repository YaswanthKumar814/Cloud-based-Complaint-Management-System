# Push complaint-service Docker image to Amazon ECR
# Usage (from project root):
#   1. Copy scripts/ecr.env.example to scripts/ecr.env and edit AWS_ACCOUNT_ID
#   2. .\scripts\push-to-ecr.ps1

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

$Region = $env:AWS_REGION ?? "ap-south-1"
$AccountId = $env:AWS_ACCOUNT_ID
$Repo = $env:ECR_REPO ?? "complaint-service"
$LocalImage = $env:LOCAL_IMAGE ?? "complaint-service:latest"

if (-not $AccountId -or $AccountId -eq "123456789012") {
    Write-Host "ERROR: Set AWS_ACCOUNT_ID in scripts/ecr.env (copy from scripts/ecr.env.example)" -ForegroundColor Red
    exit 1
}

$Registry = "$AccountId.dkr.ecr.$Region.amazonaws.com"
$ImageUri = "$Registry/${Repo}:latest"

Write-Host "Building Docker image: $LocalImage"
docker build -t $LocalImage .

Write-Host "Logging in to ECR: $Registry"
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $Registry

Write-Host "Tagging: $ImageUri"
docker tag $LocalImage $ImageUri

Write-Host "Pushing to ECR..."
docker push $ImageUri

Write-Host ""
Write-Host "Done. Image URI:" -ForegroundColor Green
Write-Host $ImageUri
