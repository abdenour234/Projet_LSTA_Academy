# PowerShell script to check backend logs for teacher pending activities debug output
Write-Host "=== Watching backend logs for TEACHER PENDING ACTIVITIES DEBUG ===" -ForegroundColor Cyan
Write-Host "Please perform these steps:" -ForegroundColor Yellow
Write-Host "1. Create a new activity (choose class SSS, Arabic subject)" -ForegroundColor Yellow
Write-Host "2. Login as the teacher who teaches Arabic" -ForegroundColor Yellow
Write-Host "3. Go to 'Approbation d'activités' page" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop watching logs" -ForegroundColor Gray
Write-Host ""

docker-compose logs -f backend | Select-String -Pattern "TEACHER PENDING|Teacher ID|Subject ID|Total pending|Activity ID|Filtered activities"
