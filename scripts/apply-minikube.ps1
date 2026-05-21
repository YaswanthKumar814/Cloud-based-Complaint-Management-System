# Build and deploy both microservices to Minikube
# Usage: .\scripts\apply-minikube.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "Building images in Minikube Docker..." -ForegroundColor Cyan
minikube docker-env | Invoke-Expression

docker build -t complaint-service:latest .
docker build -t notification-service:latest ./services/notification-service

Write-Host "Applying Kubernetes manifests..." -ForegroundColor Cyan
kubectl apply -f k8s/notification-deployment.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

Write-Host ""
Write-Host "Wait for pods:" -ForegroundColor Green
Write-Host "  kubectl get pods"
Write-Host ""
Write-Host "Port-forward complaint API:" -ForegroundColor Green
Write-Host "  kubectl port-forward svc/complaint-service 5000:5000"
