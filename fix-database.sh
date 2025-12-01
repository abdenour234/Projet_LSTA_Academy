#!/bin/bash
# Script pour recréer la base de données schoolmanagement et réinitialiser les données

echo "🔧 Fixing database issue..."

# Vérifier si la base existe
DB_EXISTS=$(docker exec school-management-db psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='schoolmanagement'")

if [ "$DB_EXISTS" != "1" ]; then
    echo "❌ Database 'schoolmanagement' does not exist. Creating it..."
    docker exec school-management-db psql -U postgres -c "CREATE DATABASE schoolmanagement;"
    echo "✅ Database created successfully!"
    
    echo "📋 Initializing database schema..."
    docker exec -i school-management-db psql -U postgres -d schoolmanagement < docker/init.sql
    echo "✅ Schema initialized successfully!"
else
    echo "✅ Database 'schoolmanagement' already exists."
fi

echo "🔄 Restarting backend to reconnect..."
docker restart school-management-backend

echo "✅ Done! Check your application now."
