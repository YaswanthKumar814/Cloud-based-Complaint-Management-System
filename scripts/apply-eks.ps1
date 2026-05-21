# Apply Kubernetes manifests to EKS (works on Windows PowerShell 5.1+)
# Usage: .\scripts\apply-eks.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$EnvFile = Join-Path $PSScriptRoot "ecr.env"
if (-not (Test-Path $EnvFile)) {
    Write-Host "ERROR: Create scripts/ecr.env from scripts/ecr.env.example" -ForegroundColor Red
    Write-Host "  copy scripts\ecr.env.example scripts\ecr.env" -ForegroundColor Yellow
    Write-Host "  Then set AWS_ACCOUNT_ID=167217327938 (your account)" -ForegroundColor Yellow
    exit 1
}

Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        Set-Variable -Name $matches[1].Trim() -Value $matches[2].Trim() -Scope Script
    }
}

if (-not $script:AWS_REGION) { $script:AWS_REGION = "ap-south-1" }
if (-not $script:ECR_REPO) { $script:ECR_REPO = "complaint-service" }
$AccountId = $script:AWS_ACCOUNT_ID
$Region = $script:AWS_REGION
$Repo = $script:ECR_REPO

if (-not $AccountId) {
    Write-Host "ERROR: AWS_ACCOUNT_ID missing in scripts/ecr.env" -ForegroundColor Red
    exit 1
}

$ImageUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/${Repo}:latest"

$DeployFile = Join-Path $ProjectRoot "k8s\eks\deployment.yaml"
$Content = Get-Content $DeployFile -Raw
$Content = $Content -replace "REPLACE_WITH_ECR_IMAGE", $ImageUri
$TempFile = Join-Path $env:TEMP "complaint-eks-deployment.yaml"
Set-Content -Path $TempFile -Value $Content -Encoding UTF8

Write-Host "Applying EKS manifests with image: $ImageUri"
kubectl apply -f $TempFile
kubectl apply -f (Join-Path $ProjectRoot "k8s\eks\service.yaml")

Write-Host ""
Write-Host "Wait for pods (1-3 min), then run:" -ForegroundColor Green
Write-Host "  kubectl get pods -l app=complaint-service"
Write-Host "  kubectl port-forward svc/complaint-service 5000:5000"
