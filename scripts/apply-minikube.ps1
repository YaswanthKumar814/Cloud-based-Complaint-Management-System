# Build and deploy all 3 services to Minikube
# Usage: .\scripts\apply-minikube.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "Building images in Minikube Docker..." -ForegroundColor Cyan
minikube docker-env | Invoke-Expression

docker build -t complaint-service:latest .
docker build -t notification-service:latest ./services/notification-service
& (Join-Path $PSScriptRoot "build-frontend-image.ps1") -Tag complaint-frontend:latest

Write-Host "Applying Kubernetes manifests..." -ForegroundColor Cyan
kubectl apply -f k8s/notification-deployment.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

Write-Host "Creating AWS credentials secret for Minikube..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "create-k8s-aws-secret.ps1")
kubectl rollout restart deployment/complaint-service
kubectl rollout restart deployment/notification-service

Write-Host ""
Write-Host "Wait for pods (4 pods = 2 complaint replicas + notification + frontend):" -ForegroundColor Green
Write-Host "  kubectl get pods"
Write-Host ""
Write-Host "Port-forward (use two terminals):" -ForegroundColor Green
Write-Host "  kubectl port-forward svc/complaint-service 5000:5000"
Write-Host "  kubectl port-forward svc/complaint-frontend 5173:80"
Write-Host ""
Write-Host "Open http://localhost:5173 (API still http://localhost:5000)" -ForegroundColor Green
