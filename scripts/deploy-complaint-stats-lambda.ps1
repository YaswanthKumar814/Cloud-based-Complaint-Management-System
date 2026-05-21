# Phase 17 — package and deploy complaint-stats Lambda (Windows PowerShell 5.1+)
# Usage: .\scripts\deploy-complaint-stats-lambda.ps1
# Prereq: AWS CLI configured, region ap-south-1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LambdaDir = Join-Path $ProjectRoot "lambda\complaint-stats"
$Region = "ap-south-1"
$FunctionName = "complaint-stats-lambda"
$RoleName = "complaint-stats-lambda-role"
$ZipPath = Join-Path $env:TEMP "complaint-stats-lambda.zip"

Write-Host "Building Lambda package..." -ForegroundColor Cyan
Set-Location $LambdaDir
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
npm install --omit=dev --no-audit --no-fund 2>&1 | Out-Host

if (Test-Path $ZipPath) { Remove-Item -Force $ZipPath }
Compress-Archive -Path index.mjs, package.json, node_modules -DestinationPath $ZipPath -Force

Set-Location $ProjectRoot

$AccountId = (aws sts get-caller-identity --query Account --output text 2>&1).Trim()
if (-not $AccountId) {
    Write-Host "ERROR: aws sts get-caller-identity failed. Run: aws configure" -ForegroundColor Red
    exit 1
}

$RoleArn = "arn:aws:iam::${AccountId}:role/${RoleName}"

function Wait-LambdaReady {
    param(
        [string]$Name,
        [string]$Region,
        [int]$MaxSeconds = 120
    )
    $elapsed = 0
    while ($elapsed -lt $MaxSeconds) {
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $raw = aws lambda get-function `
            --function-name $Name `
            --region $Region `
            --query "Configuration.{State:State,UpdateStatus:LastUpdateStatus}" `
            --output json 2>$null
        $ErrorActionPreference = $prev
        if ($LASTEXITCODE -eq 0 -and $raw) {
            $info = $raw | ConvertFrom-Json
            $ready = ($info.State -eq "Active") -and (
                $info.UpdateStatus -eq "Successful" -or
                [string]::IsNullOrEmpty($info.UpdateStatus)
            )
            if ($ready) {
                return $true
            }
            Write-Host ("  Waiting... State={0} UpdateStatus={1}" -f $info.State, $info.UpdateStatus) -ForegroundColor DarkGray
        }
        Start-Sleep -Seconds 5
        $elapsed += 5
    }
    return $false
}

Write-Host "Account: $AccountId  Region: $Region  Function: $FunctionName" -ForegroundColor Green

# get-function prints to stderr when function is missing; avoid Stop on that
$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"
aws lambda get-function --function-name $FunctionName --region $Region *> $null
$functionExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevErrorAction

if (-not $functionExists) {
    Write-Host "Function not found yet - will create new." -ForegroundColor Yellow
}

if ($functionExists) {
    Write-Host "Updating existing function code..." -ForegroundColor Cyan
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file "fileb://$ZipPath" `
        --region $Region | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: update-function-code failed." -ForegroundColor Red
        exit 1
    }
    Write-Host "Waiting for code update to finish..." -ForegroundColor Cyan
    if (-not (Wait-LambdaReady -Name $FunctionName -Region $Region)) {
        Write-Host "ERROR: Lambda did not become Active in time." -ForegroundColor Red
        exit 1
    }
    aws lambda update-function-configuration `
        --function-name $FunctionName `
        --environment "Variables={DYNAMODB_TABLE=Complaints}" `
        --timeout 30 `
        --memory-size 128 `
        --region $Region | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: update-function-configuration failed." -ForegroundColor Red
        exit 1
    }
    if (-not (Wait-LambdaReady -Name $FunctionName -Region $Region)) {
        Write-Host "ERROR: Lambda config update did not finish in time." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Creating function (role must exist: $RoleName)..." -ForegroundColor Cyan
    aws lambda create-function `
        --function-name $FunctionName `
        --runtime nodejs20.x `
        --handler index.handler `
        --role $RoleArn `
        --zip-file "fileb://$ZipPath" `
        --timeout 30 `
        --memory-size 128 `
        --environment "Variables={DYNAMODB_TABLE=Complaints}" `
        --region $Region | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: create-function failed. Is IAM role '$RoleName' created?" -ForegroundColor Red
        exit 1
    }
    if (-not (Wait-LambdaReady -Name $FunctionName -Region $Region)) {
        Write-Host "ERROR: Lambda create did not become Active in time." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Done. Set in complaint-service .env / EKS deployment:" -ForegroundColor Green
Write-Host "  LAMBDA_STATS_FUNCTION=$FunctionName"
Write-Host ""
Write-Host "Test invoke:" -ForegroundColor Green
Write-Host ('  aws lambda invoke --function-name ' + $FunctionName + ' --region ' + $Region + ' --cli-binary-format raw-in-base64-out --payload "{}" out.json')
Write-Host '  Get-Content out.json'
