# Script de Setup Automatique - Projet LSTA Academy
# Ce script crée automatiquement le compte SuperAdmin

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Projet LSTA Academy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker est en cours d'exécution
Write-Host "[1/4] Vérification de Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur: Docker n'est pas en cours d'exécution!" -ForegroundColor Red
    Write-Host "   Veuillez démarrer Docker Desktop et réessayer." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker est en cours d'exécution" -ForegroundColor Green
Write-Host ""

# Vérifier que les conteneurs sont démarrés
Write-Host "[2/4] Vérification des conteneurs..." -ForegroundColor Yellow
$containers = docker-compose ps --services --filter "status=running"
if ($containers -notcontains "postgres") {
    Write-Host "❌ Erreur: Le conteneur PostgreSQL n'est pas démarré!" -ForegroundColor Red
    Write-Host "   Lancement des conteneurs..." -ForegroundColor Yellow
    docker-compose up -d
    Write-Host "   Attente du démarrage de la base de données (30 secondes)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}
Write-Host "✅ Conteneurs démarrés" -ForegroundColor Green
Write-Host ""

# Créer le compte SuperAdmin
Write-Host "[3/4] Création du compte SuperAdmin..." -ForegroundColor Yellow
$result = Get-Content setup-superadmin.sql -Raw | docker exec -i school-management-db psql -U postgres -d schoolmanagement 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Compte SuperAdmin créé avec succès!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Le compte existe peut-être déjà ou une erreur s'est produite" -ForegroundColor Yellow
    Write-Host "   Détails: $result" -ForegroundColor Gray
}
Write-Host ""

# Afficher les informations de connexion
Write-Host "[4/4] Informations de connexion" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎉 Setup Terminé!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Accédez à l'application:" -ForegroundColor White
Write-Host "   URL: http://localhost" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Identifiants SuperAdmin:" -ForegroundColor White
Write-Host "   Email: admin@admin.com" -ForegroundColor Cyan
Write-Host "   Mot de passe: admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Services disponibles:" -ForegroundColor White
Write-Host "   - Frontend: http://localhost" -ForegroundColor Gray
Write-Host "   - Backend: http://localhost:8080" -ForegroundColor Gray
Write-Host "   - PostgreSQL: localhost:5432" -ForegroundColor Gray
Write-Host "   - MinIO: http://localhost:9000" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Commandes utiles:" -ForegroundColor White
Write-Host "   - Voir les logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "   - Arrêter: docker-compose down" -ForegroundColor Gray
Write-Host "   - Redémarrer: docker-compose restart" -ForegroundColor Gray
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
