#!/bin/bash
# VPS Debugging Script - Run this on your VPS to diagnose the 502 error

echo "========================================="
echo "CONTAINER STATUS"
echo "========================================="
docker-compose ps

echo ""
echo "========================================="
echo "BACKEND LOGS (Last 50 lines)"
echo "========================================="
docker-compose logs --tail=50 backend

echo ""
echo "========================================="
echo "POSTGRES LOGS (Last 30 lines)"
echo "========================================="
docker-compose logs --tail=30 postgres

echo ""
echo "========================================="
echo "NGINX LOGS (if using nginx container)"
echo "========================================="
docker-compose logs --tail=20 nginx 2>/dev/null || echo "No nginx container found"

echo ""
echo "========================================="
echo "BACKEND HEALTH CHECK"
echo "========================================="
curl -v http://localhost:8080/actuator/health 2>&1 || echo "Backend not responding"

echo ""
echo "========================================="
echo "DATABASE CONNECTION TEST"
echo "========================================="
docker-compose exec -T postgres pg_isready -U postgres

echo ""
echo "========================================="
echo "ACTIVE DATABASE CONNECTIONS"
echo "========================================="
docker-compose exec -T postgres psql -U postgres -c "SELECT count(*) as connections, state FROM pg_stat_activity GROUP BY state;"
