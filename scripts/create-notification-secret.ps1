# Create or update AWS Secrets Manager secret for notification-service
# Usage: .\scripts\create-notification-secret.ps1
# Reads SES_FROM_EMAIL and ADMIN_EMAIL from services\notification-service\.env

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot "services\notification-service\.env"
$Region = "ap-south-1"
$SecretName = "complaint-management/notification"

if (-not (Test-Path $EnvFile)) {
    Write-Host "ERROR: Missing $EnvFile — copy from .env.example first" -ForegroundColor Red
    exit 1
}

$ses = ""
$admin = ""
$sns = ""

Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*SES_FROM_EMAIL\s*=\s*(.+)$') { $ses = $matches[1].Trim() }
    if ($_ -match '^\s*ADMIN_EMAIL\s*=\s*(.+)$') { $admin = $matches[1].Trim() }
    if ($_ -match '^\s*SNS_TOPIC_ARN\s*=\s*(.+)$') { $sns = $matches[1].Trim() }
}

if (-not $ses -or -not $admin) {
    Write-Host "ERROR: Set SES_FROM_EMAIL and ADMIN_EMAIL in $EnvFile" -ForegroundColor Red
    exit 1
}

$json = @{
    SES_FROM_EMAIL = $ses
    ADMIN_EMAIL    = $admin
}
if ($sns) { $json.SNS_TOPIC_ARN = $sns }

$jsonText = $json | ConvertTo-Json -Compress
$tempFile = Join-Path $env:TEMP "notification-secret.json"
Set-Content -Path $tempFile -Value $jsonText -Encoding UTF8

Write-Host "Creating/updating secret: $SecretName (region $Region)" -ForegroundColor Cyan

aws secretsmanager create-secret `
    --name $SecretName `
    --description "SES and admin email for complaint notification service" `
    --secret-string "file://$tempFile" `
    --region $Region 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Secret may exist — updating value..." -ForegroundColor Yellow
    aws secretsmanager put-secret-value `
        --secret-id $SecretName `
        --secret-string "file://$tempFile" `
        --region $Region
}

Write-Host "Done. Secret name: $SecretName" -ForegroundColor Green
Write-Host "Set on notification-service: NOTIFICATION_SECRET_NAME=$SecretName" -ForegroundColor Green
