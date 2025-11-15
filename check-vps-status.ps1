# Script to check VPS deployment status
$VPS_IP = "57.129.110.129"
$VPS_USER = "debian"

Write-Host "=== Checking VPS Deployment Status ===" -ForegroundColor Cyan
Write-Host ""

# Check if we can connect to VPS
Write-Host "Testing VPS connection..." -ForegroundColor Yellow
Test-Connection -ComputerName $VPS_IP -Count 2 -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Running docker ps on VPS..." -ForegroundColor Yellow
Write-Host "Command: ssh ${VPS_USER}@${VPS_IP} 'cd ~/LSTA_Academy/Projet_LSTA_Academy && docker ps'" -ForegroundColor Gray
Write-Host ""
Write-Host "To manually check, run these commands:" -ForegroundColor Cyan
Write-Host "ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
Write-Host "cd ~/LSTA_Academy/Projet_LSTA_Academy" -ForegroundColor White
Write-Host "docker ps" -ForegroundColor White
Write-Host "docker-compose logs frontend --tail=50" -ForegroundColor White
Write-Host "docker-compose logs backend --tail=50" -ForegroundColor White
Write-Host ""
Write-Host "Test URLs:" -ForegroundColor Cyan
Write-Host "Frontend: http://${VPS_IP}:8081" -ForegroundColor White
Write-Host "Backend:  http://${VPS_IP}:8080/api/health" -ForegroundColor White
Write-Host "MinIO:    http://${VPS_IP}:9001" -ForegroundColor White
