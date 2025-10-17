# Repository Migration Guide

## Project: LSTA Academy (formerly Insight Bloom)

**New Repository:** https://github.com/abdenour234/Projet_LSTA_Academy.git  
**Migration Date:** October 17, 2025  
**Branch:** feat/containerize-stack

---

## What Was Migrated

This project has been successfully migrated from Supabase to a fully containerized Spring Boot + React application.

### ✅ Completed Work

1. **Core Infrastructure**
   - Spring Boot backend (Java 17)
   - React + Vite frontend (TypeScript)
   - PostgreSQL 16 database
   - MinIO object storage
   - Docker Compose orchestration
   - Nginx reverse proxy

2. **Frontend Migration (Supabase → Spring Boot)**
   - Created comprehensive REST API client (`frontend/src/lib/api.ts`)
   - JWT authentication with localStorage
   - File upload utilities for Spring Boot storage
   - Migrated key pages: SchoolLogin, Index, SchoolFormDialog

3. **Backend Configuration**
   - JPA entities and repositories
   - Spring Security with JWT
   - PostgreSQL integration
   - MinIO storage service
   - CORS configuration

4. **Container Setup**
   - Multi-stage Docker builds
   - Health checks for all services
   - Persistent volumes for data
   - Production-ready nginx config

---

## Repository Contents

### Key Directories

```
├── backend/                    # Spring Boot application
│   ├── src/
│   │   └── main/
│   │       ├── java/com/schoolmanagement/
│   │       └── resources/application.yml
│   ├── Dockerfile             # Multi-stage Maven build
│   └── pom.xml                # Dependencies and build config
│
├── frontend/                  # React + Vite application
│   ├── src/
│   │   ├── lib/api.ts        # Spring Boot API client ⭐
│   │   ├── lib/uploadToStorage.ts
│   │   ├── pages/            # React pages
│   │   └── components/       # React components
│   ├── Dockerfile            # Multi-stage npm build
│   ├── nginx.conf            # Production nginx config
│   ├── package.json
│   └── .env                  # API URL configuration
│
├── supabase/                  # Database migrations
│   └── migrations/           # SQL migration files
│
├── docker-compose.yml        # Orchestration config
├── MIGRATION_GUIDE.md        # Detailed migration patterns
├── MIGRATION_SUMMARY.md      # Migration status report
└── README.md                 # Project documentation
```

### Important Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Defines all 4 services (postgres, minio, backend, frontend) |
| `frontend/src/lib/api.ts` | **NEW** - Spring Boot REST API client with JWT auth |
| `frontend/.env` | **NEW** - Frontend environment variables |
| `frontend/nginx.conf` | **NEW** - Production nginx configuration |
| `backend/pom.xml` | Maven dependencies and build configuration |
| `backend/Dockerfile` | Multi-stage backend build |
| `frontend/Dockerfile` | Multi-stage frontend build |
| `MIGRATION_GUIDE.md` | Code migration patterns and examples |
| `MIGRATION_SUMMARY.md` | Current migration status |

---

## How to Use This Repository

### Prerequisites

- Docker Desktop installed and running
- Git installed
- (Optional) Node.js 18+ for local frontend development
- (Optional) Java 17+ and Maven for local backend development

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/abdenour234/Projet_LSTA_Academy.git
   cd Projet_LSTA_Academy
   ```

2. **Start all containers**
   ```bash
   docker-compose up -d --build
   ```

3. **Wait for services to be healthy** (~30 seconds)
   ```bash
   docker-compose ps
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8080/api
   - MinIO Console: http://localhost:9001

### Verify Setup

```bash
# Check all containers are running
docker-compose ps

# Check backend logs
docker-compose logs backend --tail=50

# Check frontend logs
docker-compose logs frontend --tail=20

# Test backend API
curl http://localhost:8080/api/health

# Test frontend
curl http://localhost
```

---

## Environment Configuration

### Frontend (.env)
Located at `frontend/.env`:
```env
VITE_API_URL=http://localhost:8080/api
```

For production, update to your actual backend URL.

### Backend (application.yml)
Located at `backend/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/schoolmanagement
    username: postgres
    password: postgres
  
  jpa:
    hibernate:
      ddl-auto: update
```

**⚠️ Important:** Change default passwords for production!

---

## Database Setup

### Initial Migration

The database schema is automatically created by Hibernate on first run (JPA with `ddl-auto: update`).

### Manual Migrations

SQL migration files are in `supabase/migrations/`:
```bash
# Run migrations manually if needed
docker exec -i school-management-db psql -U postgres -d schoolmanagement < supabase/migrations/init.sql
```

### Create Sample Data

You'll need to manually insert test users and schools into the database for testing.

---

## Development Workflow

### Working with Docker Compose

```bash
# Start all services
docker-compose up -d

# Rebuild after code changes
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Local Development (without Docker)

**Backend:**
```bash
cd backend
mvn spring-boot:run
# Runs on http://localhost:8080
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Migration Status

### ✅ Completed

- Core API client with JWT authentication
- File upload utilities
- SchoolLogin page
- Schools Index page
- SchoolFormDialog component
- Docker containerization
- All containers build and run successfully

### ⚠️ Pending

The following pages still need migration from Supabase to Spring Boot:

1. AdminDashboard.tsx
2. TeacherDashboard.tsx
3. ActivityView.tsx
4. ActivityEditor.tsx
5. ActivityBuilder.tsx
6. VideoViewer.tsx
7. PDFViewer.tsx
8. AdminStatsCards.tsx

**See `MIGRATION_GUIDE.md` for migration patterns.**

---

## Deployment to Production

### Docker Compose (Simple)

1. Update environment variables in `docker-compose.yml`
2. Change database passwords
3. Update `VITE_API_URL` in frontend/.env
4. Deploy to server with Docker installed
5. Run `docker-compose up -d --build`

### Kubernetes (Advanced)

1. Convert docker-compose to K8s manifests
2. Set up ConfigMaps and Secrets
3. Configure Ingress for routing
4. Set up persistent volumes
5. Deploy with `kubectl apply -f k8s/`

### Separate Hosting

**Frontend (Static Hosting):**
- Build: `cd frontend && npm run build`
- Deploy `frontend/dist/` to Netlify/Vercel/AWS S3
- Update CORS in backend to allow frontend domain

**Backend (Container):**
- Deploy Docker image to AWS ECS/Azure Container Apps/Google Cloud Run
- Configure environment variables
- Set up managed PostgreSQL database
- Set up S3/Azure Blob/GCS for file storage

---

## Troubleshooting

### White Screen on Frontend

**Cause:** Supabase code not migrated yet  
**Solution:** Check browser console for errors, ensure all imports use Spring Boot API

### Backend Won't Start

**Cause:** Database connection failed  
**Solution:** 
```bash
docker-compose down -v  # Remove old volumes
docker-compose up -d    # Restart fresh
```

### Authentication Fails

**Cause:** JWT token issues or no users in database  
**Solution:** Create test users in database, check JWT secret configuration

### File Upload Fails

**Cause:** MinIO not accessible  
**Solution:** Check MinIO container is running, verify bucket exists

### Port Already in Use

**Cause:** Another service using ports 80, 8080, 5432, 9000, or 9001  
**Solution:** Stop conflicting services or change ports in docker-compose.yml

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                    http://localhost                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (Frontend)                          │
│                     Port 80                                  │
│  - Serves React static files                                │
│  - Proxies /api → backend:8080                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Spring Boot Backend                           │
│                     Port 8080                                │
│  - REST API endpoints                                        │
│  - JWT authentication                                        │
│  - Business logic                                            │
└──────────┬────────────────────────┬─────────────────────────┘
           │                        │
           ▼                        ▼
┌──────────────────────┐  ┌──────────────────────┐
│   PostgreSQL 16      │  │   MinIO Storage      │
│     Port 5432        │  │   Ports 9000/9001    │
│  - Application data  │  │  - File storage      │
│  - User accounts     │  │  - Images, PDFs      │
└──────────────────────┘  └──────────────────────┘
```

---

## Security Notes

### ⚠️ Before Production

1. **Change default passwords**
   - PostgreSQL: `postgres/postgres`
   - MinIO: `minioadmin/minioadmin`

2. **Update JWT secret**
   - Located in `backend/src/main/resources/application.yml`
   - Use a strong random string (32+ characters)

3. **Configure CORS**
   - Update allowed origins in SecurityConfig.java
   - Only allow your production frontend domain

4. **Enable HTTPS**
   - Use Let's Encrypt for SSL certificates
   - Configure nginx with SSL
   - Force HTTPS redirects

5. **Environment variables**
   - Don't commit secrets to git
   - Use Docker secrets or K8s ConfigMaps
   - Use `.env` files for local development only

---

## Support and Documentation

- **Migration Guide:** `MIGRATION_GUIDE.md` - Code migration patterns
- **Migration Summary:** `MIGRATION_SUMMARY.md` - Current status
- **API Documentation:** Check backend controllers for endpoints
- **Frontend API Client:** `frontend/src/lib/api.ts` - All available APIs

---

## Contributing

This project is under active migration. When contributing:

1. Create feature branch from `feat/containerize-stack`
2. Follow existing code patterns
3. Update migration docs if needed
4. Test with Docker Compose before committing
5. Use conventional commits (feat:, fix:, docs:, etc.)

---

## License

[Add your license information here]

---

## Contact

- Repository Owner: abdenour234
- Project: Projet_LSTA_Academy
- Original: insight-bloom-ed-06780-42905-49682-99516

---

**Last Updated:** October 17, 2025  
**Status:** Partial migration complete, containerization successful, core features working
