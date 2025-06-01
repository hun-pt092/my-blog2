# Start CockroachDB cluster cho development
Write-Host "Starting CockroachDB cluster for development..." -ForegroundColor Green

# Start only database services
docker-compose up -d cockroach1 cockroach2 cockroach3 init redis

# Wait for database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if databases are ready
$ready = $false
$attempts = 0
while (-not $ready -and $attempts -lt 30) {
    try {
        $result = docker exec cockroach1 cockroach sql --insecure --execute="SELECT 1"
        if ($result) {
            $ready = $true
            Write-Host "Database is ready!" -ForegroundColor Green
        }
    }
    catch {
        $attempts++
        Write-Host "Waiting for database... Attempt $attempts/30" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if ($ready) {
    Write-Host "Starting development server..." -ForegroundColor Green
    # Use development environment
    $env:NODE_ENV = "development"
    Copy-Item .env.development .env -Force
    npm run dev
} else {
    Write-Host "Database failed to start!" -ForegroundColor Red
    exit 1
}
