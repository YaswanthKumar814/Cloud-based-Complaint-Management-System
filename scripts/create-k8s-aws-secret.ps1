# Create Kubernetes secret "aws-credentials" from your PC's aws configure files.
# Needed for Minikube (pods cannot see ~/.aws unless you mount it).
# EKS often uses the node IAM role instead — secret is optional there.
#
# Usage: .\scripts\create-k8s-aws-secret.ps1

$ErrorActionPreference = "Stop"

$CredsFile = Join-Path $env:USERPROFILE ".aws\credentials"
if (-not (Test-Path $CredsFile)) {
    Write-Host "ERROR: Run 'aws configure' first. Missing: $CredsFile" -ForegroundColor Red
    exit 1
}

$accessKey = $null
$secretKey = $null
$section = "default"

foreach ($line in Get-Content $CredsFile) {
    $t = $line.Trim()
    if ($t -match '^\[(.+)\]$') {
        $section = $matches[1].Trim()
        continue
    }
    if ($section -ne "default") { continue }
    if ($t -match '^aws_access_key_id\s*=\s*(.+)$') {
        $accessKey = $matches[1].Trim()
    }
    if ($t -match '^aws_secret_access_key\s*=\s*(.+)$') {
        $secretKey = $matches[1].Trim()
    }
}

if (-not $accessKey -or -not $secretKey) {
    Write-Host "ERROR: Could not read [default] keys from $CredsFile" -ForegroundColor Red
    exit 1
}

Write-Host "Creating secret aws-credentials in cluster: $(kubectl config current-context)" -ForegroundColor Cyan

kubectl create secret generic aws-credentials `
    --from-literal=AWS_ACCESS_KEY_ID=$accessKey `
    --from-literal=AWS_SECRET_ACCESS_KEY=$secretKey `
    --dry-run=client -o yaml | kubectl apply -f -

Write-Host "Done. Restart complaint pods if they were already running:" -ForegroundColor Green
Write-Host "  kubectl rollout restart deployment/complaint-service"
Write-Host "  kubectl rollout restart deployment/notification-service"
