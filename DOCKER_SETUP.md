# School Management System - Docker Setup

This guide provides instructions for running the School Management System using Docker containers with PostgreSQL, Spring Boot backend, and React frontend.

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/schoolmanagement/
│   │       │   └── SchoolManagementApplication.java
│   │       └── resources/
│   │           └── application.properties
│   ├── pom.xml
│   └── Dockerfile
├── frontend-docker/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── migrations/
│   └── init.sql
├── docker-compose.yml
└── DOCKER_SETUP.md (this file)
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.9 or higher
- At least 4GB RAM available for Docker

### Step 1: Start All Services

From the project root directory, run:

```bash
docker-compose up -d
```

This command will:
1. Pull the PostgreSQL 16 image
2. Build the Spring Boot backend
3. Build the React frontend
4. Initialize the database with the schema from `migrations/init.sql`
5. Start all three services

### Step 2: Verify Services

Check that all containers are running:

```bash
docker-compose ps
```

You should see three services:
- `school-management-db` (PostgreSQL)
- `school-management-backend` (Spring Boot)
- `school-management-frontend` (React/Vite)

### Step 3: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432

## 🔧 Configuration

### Database Credentials

Default credentials (defined in `docker-compose.yml`):
- **Database**: `school_management`
- **Username**: `admin`
- **Password**: `securepassword123`
- **Port**: `5432`

### Environment Variables

Backend environment variables (in `docker-compose.yml`):
```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/school_management
SPRING_DATASOURCE_USERNAME: admin
SPRING_DATASOURCE_PASSWORD: securepassword123
```

Frontend environment variables:
```yaml
VITE_API_URL: http://localhost:8080
```

## 📊 Database Schema

The database is automatically initialized with:
- ✅ All tables (schools, profiles, classes, teaching_sessions, etc.)
- ✅ Functions and triggers
- ✅ Sample school data for testing

View the complete schema in `migrations/init.sql`.

## 🛠️ Development Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services

```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove All Data

```bash
docker-compose down -v
```

⚠️ **Warning**: This will delete the PostgreSQL data volume!

### Rebuild Containers

After code changes:

```bash
# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Rebuild and restart
docker-compose up -d --build
```

## 🐛 Troubleshooting

### Backend Won't Start

1. Check if PostgreSQL is healthy:
   ```bash
   docker-compose ps
   ```

2. Check backend logs:
   ```bash
   docker-compose logs backend
   ```

3. Verify database connection:
   ```bash
   docker-compose exec postgres psql -U admin -d school_management -c "\dt"
   ```

### Frontend Won't Load

1. Check if backend is running:
   ```bash
   curl http://localhost:8080/actuator/health
   ```

2. Check frontend logs:
   ```bash
   docker-compose logs frontend
   ```

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   docker-compose exec postgres pg_isready -U admin
   ```

2. Check database exists:
   ```bash
   docker-compose exec postgres psql -U admin -l
   ```

### Port Already in Use

If you get a "port already in use" error, change the ports in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Change 5432 to 5433
```

## 🔄 Database Management

### Connect to PostgreSQL

```bash
docker-compose exec postgres psql -U admin -d school_management
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U admin school_management > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker-compose exec -T postgres psql -U admin school_management
```

### Reset Database

```bash
docker-compose down -v
docker-compose up -d
```

## 📝 Next Steps

1. **Implement Backend APIs**: Add REST controllers in `backend/src/main/java/com/schoolmanagement/`
2. **Configure Frontend API Client**: Update API calls to use `http://localhost:8080`
3. **Add Authentication**: Implement JWT or OAuth2 in Spring Boot
4. **Set Up CI/CD**: Configure GitHub Actions for automated builds

## 🔐 Security Notes

⚠️ **For Production**:
- Change default database credentials
- Use environment files (`.env`) for secrets
- Enable HTTPS/SSL
- Configure proper CORS policies
- Implement rate limiting
- Use PostgreSQL with persistent volume backups

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🤝 Support

For issues or questions, please check the logs first:
```bash
docker-compose logs -f
```

---

**Last Updated**: October 16, 2025
