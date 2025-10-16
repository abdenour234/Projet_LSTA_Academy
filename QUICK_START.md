# Quick Start Commands

## Initial Setup

```powershell
# 1. Navigate to project directory
cd c:\Users\tufai\Documents\app\insight-bloom-ed-06780-42905-49682-99516

# 2. Start all Docker containers
docker-compose up -d

# 3. Check container status
docker-compose ps
```

## Expected Output

You should see 3 running containers:
- `school-management-db` (postgres:16)
- `school-management-backend` (custom build)
- `school-management-frontend` (custom build)

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Database**: localhost:5432

## Useful Commands

### View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services
```powershell
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop Services
```powershell
# Stop (preserves data)
docker-compose down

# Stop and remove volumes (deletes database)
docker-compose down -v
```

### Rebuild After Changes
```powershell
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

### Database Access
```powershell
# Connect to PostgreSQL
docker-compose exec postgres psql -U admin -d school_management

# List tables
docker-compose exec postgres psql -U admin -d school_management -c "\dt"

# View schools data
docker-compose exec postgres psql -U admin -d school_management -c "SELECT * FROM schools;"
```

## Troubleshooting

### Backend won't start
```powershell
# Check if database is ready
docker-compose logs postgres

# Restart backend after database is healthy
docker-compose restart backend
```

### Port conflicts
```powershell
# Check what's using the port
netstat -ano | findstr :5432
netstat -ano | findstr :8080
netstat -ano | findstr :5173

# Kill the process or change ports in docker-compose.yml
```

### Fresh start
```powershell
# Complete reset
docker-compose down -v
docker-compose up -d
```

## Verification Tests

### Test PostgreSQL
```powershell
docker-compose exec postgres psql -U admin -d school_management -c "SELECT COUNT(*) FROM schools;"
# Expected: 6 schools
```

### Test Backend (once running)
```powershell
# Health check (if implemented)
curl http://localhost:8080/actuator/health

# Or check logs
docker-compose logs backend | Select-String "Started SchoolManagementApplication"
```

### Test Frontend
```powershell
# Should see Vite dev server in logs
docker-compose logs frontend | Select-String "Local:"
```

## Development Workflow

1. **Make code changes** in `backend/` or `frontend-docker/`
2. **Rebuild** the affected service: `docker-compose build [service]`
3. **Restart** the service: `docker-compose up -d [service]`
4. **Check logs**: `docker-compose logs -f [service]`

## Cleanup

```powershell
# Stop everything
docker-compose down

# Stop and remove all data
docker-compose down -v

# Remove all Docker resources (careful!)
docker system prune -a --volumes
```
