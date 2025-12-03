#!/bin/bash
# =============================================================================
# Cron job pour vérifier automatiquement la base de données toutes les 5 minutes
# =============================================================================

# Ajouter ce script au crontab du VPS:
# crontab -e
# Ajouter la ligne suivante:
# */5 * * * * /root/LSTA_Academy/Projet_LSTA_Academy/check-database.sh >> /var/log/db-check.log 2>&1

cd /root/LSTA_Academy/Projet_LSTA_Academy || exit 1

echo "=== Database check at $(date) ==="
./check-database.sh

# Nettoyer les anciens logs (garder seulement les 100 dernières lignes)
if [ -f /var/log/db-check.log ]; then
    tail -n 100 /var/log/db-check.log > /var/log/db-check.log.tmp
    mv /var/log/db-check.log.tmp /var/log/db-check.log
fi
