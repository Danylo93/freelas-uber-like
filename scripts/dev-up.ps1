# dev-up.ps1 - Inicia ambiente de desenvolvimento com Docker, ngrok e atualiza .env dos apps mobile

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "=== Dev Up ===" -ForegroundColor Cyan
Write-Host ""

# 1) Docker Compose
Write-Host "[1/4] Subindo containers (docker compose up -d --build)..." -ForegroundColor Yellow
Set-Location $ProjectRoot
docker compose up -d --build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao subir Docker Compose." -ForegroundColor Red
    exit 1
}
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# 2) Obter URL do ngrok (usar existente ou iniciar novo)
Write-Host "[2/4] Verificando ngrok..." -ForegroundColor Yellow
$tunnelUrl = $null

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -Method Get -ErrorAction SilentlyContinue
    if ($response.tunnels -and $response.tunnels.Count -gt 0) {
        $httpsTunnel = $response.tunnels | Where-Object { $_.public_url -like "https://*" } | Select-Object -First 1
        if ($httpsTunnel) {
            $tunnelUrl = $httpsTunnel.public_url.TrimEnd("/")
        } else {
            $tunnelUrl = $response.tunnels[0].public_url.TrimEnd("/")
        }
    }
} catch { }

if ($tunnelUrl) {
    Write-Host "Ngrok ja disponivel: $tunnelUrl" -ForegroundColor Green
} else {
    Write-Host "Iniciando ngrok em localhost:5000..." -ForegroundColor Yellow
    $ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http", "5000" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 5

    $maxRetries = 10
    for ($i = 0; $i -lt $maxRetries; $i++) {
        try {
            $response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -Method Get -ErrorAction SilentlyContinue
            if ($response.tunnels -and $response.tunnels.Count -gt 0) {
                $httpsTunnel = $response.tunnels | Where-Object { $_.public_url -like "https://*" } | Select-Object -First 1
                if ($httpsTunnel) {
                    $tunnelUrl = $httpsTunnel.public_url.TrimEnd("/")
                    break
                }
                $tunnelUrl = $response.tunnels[0].public_url.TrimEnd("/")
                break
            }
        } catch { }
        Start-Sleep -Seconds 2
    }

    if (-not $tunnelUrl) {
        Write-Host "Falha ao obter URL do ngrok. Verifique se o ngrok esta instalado." -ForegroundColor Red
        if ($ngrokProcess) { $ngrokProcess | Stop-Process -Force -ErrorAction SilentlyContinue }
        exit 1
    }
    Write-Host "OK: $tunnelUrl" -ForegroundColor Green
}
Write-Host ""

# 3) Gravar EXPO_PUBLIC_API_BASE_URL nos .env
Write-Host "[3/4] Atualizando .env dos apps mobile..." -ForegroundColor Yellow
$envContent = "EXPO_PUBLIC_API_BASE_URL=$tunnelUrl"
$customerEnv = Join-Path $ProjectRoot "mobile-customer\.env"
$providerEnv = Join-Path $ProjectRoot "mobile-provider\.env"

Set-Content -Path $customerEnv -Value $envContent -Encoding UTF8
Set-Content -Path $providerEnv -Value $envContent -Encoding UTF8
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# 4) Mostrar URL final
Write-Host "[4/4] URL final:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  EXPO_PUBLIC_API_BASE_URL = $tunnelUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Arquivos atualizados:" -ForegroundColor Gray
Write-Host "  - mobile-customer/.env" -ForegroundColor Gray
Write-Host "  - mobile-provider/.env" -ForegroundColor Gray
Write-Host ""
Write-Host "Pronto! Rode 'npx expo start' nos apps mobile para usar a nova URL." -ForegroundColor Green
