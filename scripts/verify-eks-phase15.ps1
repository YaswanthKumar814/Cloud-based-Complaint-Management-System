# Phase 15 EKS verification (does NOT delete cluster)
# Usage: .\scripts\verify-eks-phase15.ps1

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EksContext = "complaint-project-user@complaint-eks.ap-south-1.eksctl.io"

Write-Host "=== Phase 15 EKS Verification ===" -ForegroundColor Cyan
Write-Host ""

# --- Context ---
Write-Host "[1] Kubernetes context" -ForegroundColor Yellow
$current = kubectl config current-context 2>&1
Write-Host "  Current: $current"
if ($current -ne $EksContext) {
    Write-Host "  Switching to EKS context..." -ForegroundColor Yellow
    kubectl config use-context $EksContext
}
Write-Host ""

# --- ECR from ecr.env ---
$EnvFile = Join-Path $PSScriptRoot "ecr.env"
if (-not (Test-Path $EnvFile)) {
    Write-Host "  MISSING scripts/ecr.env" -ForegroundColor Red
} else {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            Set-Variable -Name $matches[1].Trim() -Value $matches[2].Trim() -Scope Script
        }
    }
    $Region = if ($script:AWS_REGION) { $script:AWS_REGION } else { "ap-south-1" }
    $AccountId = $script:AWS_ACCOUNT_ID
    $repos = @(
        $script:ECR_REPO,
        $script:NOTIFICATION_ECR_REPO,
        $script:FRONTEND_ECR_REPO
    )
    Write-Host "[2] ECR repositories (account $AccountId, region $Region)" -ForegroundColor Yellow
    foreach ($repo in $repos) {
        if (-not $repo) { continue }
        $uri = "$AccountId.dkr.ecr.$Region.amazonaws.com/${repo}:latest"
        Write-Host "  Expected image: $uri"
        $awsCmd = Get-Command aws -ErrorAction SilentlyContinue
        if ($awsCmd) {
            $images = aws ecr list-images --repository-name $repo --region $Region --query "imageIds[*].imageTag" --output text 2>&1
            if ($LASTEXITCODE -eq 0 -and $images) {
                Write-Host "    ECR tags: $images" -ForegroundColor Green
            } else {
                Write-Host "    WARNING: no images or repo missing — run: .\scripts\push-to-ecr.ps1" -ForegroundColor Red
                if ($repo -ne "complaint-service") {
                    Write-Host "           or: .\scripts\push-to-ecr.ps1 -Service notification|frontend"
                }
            }
        } else {
            Write-Host "    (aws CLI not in PATH — check ECR in AWS Console)" -ForegroundColor Yellow
        }
    }
}
Write-Host ""

# --- Kubernetes resources ---
Write-Host "[3] EKS deployments" -ForegroundColor Yellow
kubectl get deployments -o wide 2>&1
Write-Host ""
Write-Host "[4] EKS services" -ForegroundColor Yellow
kubectl get svc 2>&1
Write-Host ""
Write-Host "[5] EKS pods" -ForegroundColor Yellow
kubectl get pods -o wide 2>&1
Write-Host ""

$deployments = @("complaint-service", "notification-service", "complaint-frontend")
Write-Host "[6] Deployment check" -ForegroundColor Yellow
foreach ($d in $deployments) {
    $exists = kubectl get deployment $d 2>&1
    if ($LASTEXITCODE -eq 0) {
        $ready = kubectl get deployment $d -o jsonpath="{.status.readyReplicas}/{.spec.replicas}" 2>&1
        $image = kubectl get deployment $d -o jsonpath="{.spec.template.spec.containers[0].image}" 2>&1
        Write-Host "  $d : ready=$ready image=$image" -ForegroundColor Green
    } else {
        Write-Host "  $d : NOT DEPLOYED — run .\scripts\apply-eks.ps1" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "[7] Next steps (manual)" -ForegroundColor Yellow
Write-Host "  Terminal A: kubectl port-forward svc/complaint-service 5000:5000"
Write-Host "  Terminal B: kubectl port-forward svc/complaint-frontend 5173:80"
Write-Host "  Terminal C: curl.exe http://localhost:5000/api/complaints"
Write-Host "  Browser:    http://localhost:5173"
Write-Host ""
Write-Host "Full guide: docs/EKS_PHASE15_VERIFY.md" -ForegroundColor Cyan
