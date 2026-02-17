# Fix Database Permissions Script
# This script grants all privileges to the postgres user

Write-Host "Fixing database permissions..." -ForegroundColor Yellow
Write-Host ""

$command = @"
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
"@

try {
    $result = psql -U postgres -d nira_db -c $command
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Permissions granted successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now try registering again." -ForegroundColor Cyan
    } else {
        Write-Host "❌ Error granting permissions. Check the error above." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure PostgreSQL is running and you have access." -ForegroundColor Yellow
}
