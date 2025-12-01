#!/bin/bash
# =============================================================================
# Script de vérification et réparation automatique de la base de données
# =============================================================================

set -e

DB_CONTAINER="school-management-db"
DB_NAME="schoolmanagement"
DB_USER="postgres"
INIT_SQL="/docker/init.sql"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si le conteneur PostgreSQL est en cours d'exécution
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    log_error "Container ${DB_CONTAINER} is not running!"
    exit 1
fi

log_info "Checking database ${DB_NAME}..."

# Vérifier si la base de données existe
DB_EXISTS=$(docker exec ${DB_CONTAINER} psql -U ${DB_USER} -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    log_warn "Database '${DB_NAME}' does not exist! Recreating..."
    
    # Créer la base de données
    docker exec ${DB_CONTAINER} psql -U ${DB_USER} -c "CREATE DATABASE ${DB_NAME};" || {
        log_error "Failed to create database!"
        exit 1
    }
    log_info "Database created successfully!"
    
    # Initialiser le schéma depuis init.sql
    if [ -f "./docker/init.sql" ]; then
        log_info "Initializing database schema from init.sql..."
        docker exec -i ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} < ./docker/init.sql || {
            log_error "Failed to initialize schema!"
            exit 1
        }
        log_info "Schema initialized successfully!"
    else
        log_warn "init.sql not found, skipping schema initialization"
    fi
    
    # Redémarrer le backend pour reconnecter
    log_info "Restarting backend to reconnect..."
    docker restart school-management-backend || log_warn "Failed to restart backend"
    
    log_info "✅ Database restored successfully!"
else
    log_info "✅ Database exists and is healthy!"
fi

# Vérifier les connexions actives
CONNECTIONS=$(docker exec ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -tAc "SELECT count(*) FROM pg_stat_activity WHERE datname='${DB_NAME}';" 2>/dev/null || echo "0")
log_info "Active connections to ${DB_NAME}: ${CONNECTIONS}"

# Vérifier la taille de la base de données
DB_SIZE=$(docker exec ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -tAc "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));" 2>/dev/null || echo "Unknown")
log_info "Database size: ${DB_SIZE}"

log_info "Database check completed!"
