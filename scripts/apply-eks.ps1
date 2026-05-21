# Apply all 3 services to EKS (Windows PowerShell 5.1+)
# Usage: .\scripts\apply-eks.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$EnvFile = Join-Path $PSScriptRoot "ecr.env"
if (-not (Test-Path $EnvFile)) {
    Write-Host "ERROR: Create scripts/ecr.env from scripts/ecr.env.example" -ForegroundColor Red
    exit 1
}

Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        Set-Variable -Name $matches[1].Trim() -Value $matches[2].Trim() -Scope Script
    }
}

if (-not $script:AWS_REGION) { $script:AWS_REGION = "ap-south-1" }
if (-not $script:ECR_REPO) { $script:ECR_REPO = "complaint-service" }
if (-not $script:NOTIFICATION_ECR_REPO) { $script:NOTIFICATION_ECR_REPO = "notification-service" }
if (-not $script:FRONTEND_ECR_REPO) { $script:FRONTEND_ECR_REPO = "complaint-frontend" }

$AccountId = $script:AWS_ACCOUNT_ID
$Region = $script:AWS_REGION

if (-not $AccountId) {
    Write-Host "ERROR: AWS_ACCOUNT_ID missing in scripts/ecr.env" -ForegroundColor Red
    exit 1
}

$ComplaintImage = "$AccountId.dkr.ecr.$Region.amazonaws.com/$($script:ECR_REPO):latest"
$NotificationImage = "$AccountId.dkr.ecr.$Region.amazonaws.com/$($script:NOTIFICATION_ECR_REPO):latest"
$FrontendImage = "$AccountId.dkr.ecr.$Region.amazonaws.com/$($script:FRONTEND_ECR_REPO):latest"

function Apply-Deploy($templatePath, $placeholder, $imageUri, $tempName) {
    $content = (Get-Content $templatePath -Raw) -replace $placeholder, $imageUri
    $temp = Join-Path $env:TEMP $tempName
    Set-Content -Path $temp -Value $content -Encoding UTF8
    kubectl apply -f $temp
}

Write-Host "Applying notification-service: $NotificationImage"
Apply-Deploy (Join-Path $ProjectRoot "k8s\eks\notification-deployment.yaml") "REPLACE_WITH_NOTIFICATION_ECR_IMAGE" $NotificationImage "notification-eks-deployment.yaml"
kubectl apply -f (Join-Path $ProjectRoot "k8s\eks\notification-service.yaml")

Write-Host "Applying complaint-service: $ComplaintImage"
Apply-Deploy (Join-Path $ProjectRoot "k8s\eks\deployment.yaml") "REPLACE_WITH_ECR_IMAGE" $ComplaintImage "complaint-eks-deployment.yaml"
kubectl apply -f (Join-Path $ProjectRoot "k8s\eks\service.yaml")

Write-Host "Applying complaint-frontend: $FrontendImage"
Apply-Deploy (Join-Path $ProjectRoot "k8s\eks\frontend-deployment.yaml") "REPLACE_WITH_FRONTEND_ECR_IMAGE" $FrontendImage "frontend-eks-deployment.yaml"
kubectl apply -f (Join-Path $ProjectRoot "k8s\eks\frontend-service.yaml")

Write-Host ""
Write-Host "Check pods (expect 3 Running):" -ForegroundColor Green
Write-Host "  kubectl get pods"
Write-Host ""
Write-Host "Port-forward:" -ForegroundColor Green
Write-Host "  kubectl port-forward svc/complaint-service 5000:5000"
Write-Host "  kubectl port-forward svc/complaint-frontend 5173:80"
