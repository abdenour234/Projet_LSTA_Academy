# Database Setup Guide

## Overview

This project uses a PostgreSQL database that is automatically initialized with a complete schema and sample data when you start the Docker containers.

## Initialization

The database is initialized using the `docker/init-db.sql` script which contains:
- Complete database schema (all tables, indexes, constraints)
- Sample schools, users, and roles
- Super admin account

## Default Credentials

### Super Admin Account
- **Email**: `admin@admin.com`
- **Password**: `admin123`
- **Role**: SuperAdmin
- **School ID**: 1

### Other Sample Users

#### School Admin (School: Orient)
- **Email**: `ahmed@pasteur.ma`
- **Password**: Check with team
- **Role**: Admin
- **School ID**: 2

#### School Admin (School: Kali Orient)
- **Email**: `ahmed@kali.ma`
- **Password**: Check with team
- **Role**: Admin
- **School ID**: 3

#### Teacher (School: Kali Orient)
- **Email**: `chenouf.abdenour@3.ma`
- **Password**: Check with team
- **Role**: Teacher
- **School ID**: 3

#### Teacher (School: Kali Orient)
- **Email**: `test@3.ma`
- **Password**: Check with team
- **Role**: Teacher
- **School ID**: 3

## Sample Schools

1. **Pasteur** (ID: 1)
   - Region: L'Oriental
   - City: Oujda
   - Level: Primaire
   - Status: Active

2. **Orient** (ID: 2)
   - Region: L'Oriental
   - City: Oujda
   - Level: Primaire
   - Status: Privé
   - Students: 2500

3. **Kali Orient** (ID: 3)
   - Region: L'Oriental
   - City: Jerada
   - Level: Primaire
   - Status: Privé
   - Students: 1600

## Fresh Database Installation

If you need to start with a fresh database:

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Start fresh containers (database will be initialized automatically)
docker-compose up -d
```

The `init-db.sql` script will automatically:
1. Drop all existing tables (clean slate)
2. Create the complete schema
3. Insert all sample data
4. Set up indexes and constraints

## Database Schema

The database includes the following main tables:

### Core Tables
- **schools** - School information
- **profiles** - User profiles (all types)
- **user_roles** - User role assignments

### Activity Management
- **activities** - Pedagogical activities
- **activity_files** - File metadata (actual files in MinIO)
- **activity_assignments** - Activity assignments to schools

### Academic Management
- **classes** - Class information
- **students** - Student records
- **teaching_sessions** - Teaching session records
- **diagnostic_sessions** - Diagnostic evaluation sessions

### Communication
- **messages** - Internal messaging system

### Resources
- **resources** - Shared educational resources
- **user_activity_logs** - User activity tracking

## For Your Friend

To ensure your friend gets the exact same database:

1. **Pull the latest code**:
   ```bash
   git pull origin develop
   ```

2. **Remove old database volume** (important!):
   ```bash
   docker-compose down -v
   ```

3. **Start fresh**:
   ```bash
   docker-compose up -d
   ```

4. **Wait for initialization** (about 30 seconds):
   ```bash
   docker-compose logs postgres -f
   ```
   
   Look for: "Database initialization completed successfully!"

5. **Verify the database**:
   - Login as Super Admin: `admin@admin.com` / `admin123`
   - Check that you see 3 schools in the system

## MinIO File Storage

The database references files stored in MinIO. For a complete setup, your friend should also have the MinIO data, but the database will work without the actual files (they just won't display).

## Troubleshooting

### Database not initializing?
```bash
# Check logs
docker-compose logs postgres

# Ensure the init script exists
ls -la docker/init-db.sql

# Nuclear option: completely remove everything
docker-compose down -v
docker volume prune -f
docker-compose up -d
```

### Cannot connect to database?
```bash
# Check if PostgreSQL is healthy
docker-compose ps

# Test connection
docker exec school-management-db psql -U postgres -d schoolmanagement -c "SELECT COUNT(*) FROM schools;"
```

Should return: `count: 3`

## Notes

- The `init-db.sql` script only runs when the database volume is empty
- Passwords in the database are hashed with BCrypt (algorithm: $2a$10$...)
- The Super Admin password `admin123` is already hashed in the init script
- Activity files reference MinIO storage keys - files won't display unless MinIO has the actual files

## Updating the Init Script

If you need to update the init script with the latest database state:

```bash
# While containers are running, export current database
docker exec school-management-db pg_dump -U postgres -d schoolmanagement --clean --if-exists > docker/init-db-backup.sql

# Then manually update docker/init-db.sql with any new changes
```
