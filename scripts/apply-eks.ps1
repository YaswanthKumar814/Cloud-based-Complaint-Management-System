# Apply both microservices to EKS (Windows PowerShell 5.1+)
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

$AccountId = $script:AWS_ACCOUNT_ID
$Region = $script:AWS_REGION

if (-not $AccountId) {
    Write-Host "ERROR: AWS_ACCOUNT_ID missing in scripts/ecr.env" -ForegroundColor Red
    exit 1
}

$ComplaintImage = "$AccountId.dkr.ecr.$Region.amazonaws.com/$($script:ECR_REPO):latest"
$NotificationImage = "$AccountId.dkr.ecr.$Region.amazonaws.com/$($script:NOTIFICATION_ECR_REPO):latest"

# Notification service first (complaint service depends on it at runtime)
$NotifDeploy = Join-Path $ProjectRoot "k8s\eks\notification-deployment.yaml"
$NotifContent = (Get-Content $NotifDeploy -Raw) -replace "REPLACE_WITH_NOTIFICATION_ECR_IMAGE", $NotificationImage
$NotifTemp = Join-Path $env:TEMP "notification-eks-deployment.yaml"
Set-Content -Path $NotifTemp -Value $NotifContent -Encoding UTF8

$ComplaintDeploy = Join-Path $ProjectRoot "k8s\eks\deployment.yaml"
$ComplaintContent = (Get-Content $ComplaintDeploy -Raw) -replace "REPLACE_WITH_ECR_IMAGE", $ComplaintImage
$ComplaintTemp = Join-Path $env:TEMP "complaint-eks-deployment.yaml"
Set-Content -Path $ComplaintTemp -Value $ComplaintContent -Encoding UTF8

Write-Host "Applying notification-service: $NotificationImage"
kubectl apply -f $NotifTemp
kubectl apply -f (Join-Path $ProjectRoot "k8s\eks\notification-service.yaml")

Write-Host "Applying complaint-service: $ComplaintImage"
kubectl apply -f $ComplaintTemp
kubectl apply -f (Join-Path $ProjectRoot "k8s\eks\service.yaml")

Write-Host ""
Write-Host "Check pods:" -ForegroundColor Green
Write-Host "  kubectl get pods"
Write-Host "  kubectl port-forward svc/complaint-service 5000:5000"
