# Script to watch activity creation logs
Write-Host "=== Watching Activity Creation Logs ===" -ForegroundColor Cyan
Write-Host "Create an activity now, and you'll see the logs here" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop watching" -ForegroundColor Gray
Write-Host ""

docker-compose logs -f backend | Select-String -Pattern "CREATE ACTIVITY|Received activity|Title:|SubjectId:|ClassId:|SchoolId:|Activity saved|ApprovalStatus:"
