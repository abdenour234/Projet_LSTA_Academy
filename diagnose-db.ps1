# =============================================================================
# Script de diagnostic pour identifier pourquoi la base de données disparaît
# =============================================================================

Write-Host "=== Database Diagnostic Tool ===" -ForegroundColor Cyan

# 1. Vérifier les volumes Docker
Write-Host "`n1. Checking Docker volumes..." -ForegroundColor Yellow
docker volume ls | Select-String "school_management"

# 2. Vérifier l'état du volume postgres_data
Write-Host "`n2. Inspecting postgres volume..." -ForegroundColor Yellow
docker volume inspect school_management_postgres_data

# 3. Vérifier les logs du conteneur PostgreSQL
Write-Host "`n3. Recent PostgreSQL logs (last 50 lines)..." -ForegroundColor Yellow
docker logs --tail 50 school-management-db

# 4. Vérifier si la base existe
Write-Host "`n4. Checking if database exists..." -ForegroundColor Yellow
docker exec school-management-db psql -U postgres -c "\l"

# 5. Vérifier l'espace disque dans le conteneur
Write-Host "`n5. Checking disk space in container..." -ForegroundColor Yellow
docker exec school-management-db df -h

# 6. Vérifier les connexions à la base
Write-Host "`n6. Checking active connections..." -ForegroundColor Yellow
docker exec school-management-db psql -U postgres -d schoolmanagement -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE datname='schoolmanagement';" 2>$null

# 7. Vérifier l'uptime du conteneur
Write-Host "`n7. Container uptime..." -ForegroundColor Yellow
docker ps --filter "name=school-management-db" --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}"

# 8. Vérifier les redémarrages récents
Write-Host "`n8. Checking container restart history..." -ForegroundColor Yellow
docker inspect school-management-db | ConvertFrom-Json | Select-Object -ExpandProperty State

Write-Host "`n=== Diagnostic Complete ===" -ForegroundColor Green
Write-Host "`nRecommendations:" -ForegroundColor Cyan
Write-Host "- If volume is empty: Data was lost during volume deletion"
Write-Host "- If container restarts frequently: Check memory/disk issues"
Write-Host "- If database exists but app can't connect: Check network/credentials"
