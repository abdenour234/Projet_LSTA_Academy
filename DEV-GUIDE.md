# 🔥 Hot Reload Development Guide

This project is configured for **hot-reload development** - code changes are automatically reflected without rebuilding containers!

## 🚀 Quick Start

### First Time Setup
```bash
# Build development containers (only needed once)
docker-compose up -d --build
```

### Daily Development Workflow
```bash
# Start containers (no rebuild needed!)
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop containers
docker-compose down
```

## 📝 How It Works

### Frontend (React + Vite)
- **Vite HMR (Hot Module Replacement)** is enabled
- Changes to `.tsx`, `.ts`, `.css` files reload **instantly** in browser
- Source code is mounted as volume: `./frontend/src` → `/app/src`
- No rebuild needed, just save your file!

**Test it:**
1. Edit `frontend/src/pages/Index.tsx`
2. Save the file
3. Browser auto-refreshes in ~100ms ⚡

### Backend (Spring Boot)
- **Spring DevTools** auto-restart on code changes
- Changes to `.java` files trigger auto-recompilation
- Source code is mounted as volume: `./backend/src` → `/app/src`
- Restart takes ~3-5 seconds (much faster than full rebuild!)

**Test it:**
1. Edit `backend/src/main/java/com/schoolmanagement/controller/HealthController.java`
2. Save the file
3. Backend restarts automatically in ~5s 🔄

## 🔧 What's Mounted

### Frontend Volumes
```yaml
- ./frontend/src:/app/src                    # All source code
- ./frontend/public:/app/public              # Static assets
- ./frontend/index.html:/app/index.html      # HTML entry
- ./frontend/vite.config.ts:/app/vite.config.ts
- ./frontend/tsconfig.json:/app/tsconfig.json
- ./frontend/tailwind.config.ts:/app/tailwind.config.ts
```

### Backend Volumes
```yaml
- ./backend/src:/app/src          # All Java source code
- ./backend/pom.xml:/app/pom.xml  # Maven dependencies
```

## 🐛 Debug Ports

### Backend Remote Debugging (Java)
- **Port:** 5005
- **IDE:** IntelliJ IDEA / VS Code
- Connect your debugger to `localhost:5005`

### Frontend Dev Server
- **Port:** 5173
- **HMR:** WebSocket on same port
- Open: http://localhost:5173

## ⚠️ When DO You Need to Rebuild?

### Backend Rebuild Required:
- ❌ Changed `.java` files → **NO rebuild** (auto-restart)
- ✅ Added/removed Maven dependencies in `pom.xml` → **YES rebuild**
- ✅ Changed Dockerfile or docker-compose.yml → **YES rebuild**

```bash
# Rebuild backend only
docker-compose up -d --build backend
```

### Frontend Rebuild Required:
- ❌ Changed `.tsx`, `.ts`, `.css` files → **NO rebuild** (HMR)
- ✅ Added/removed npm packages in `package.json` → **YES rebuild**
- ✅ Changed Dockerfile or docker-compose.yml → **YES rebuild**

```bash
# Rebuild frontend only
docker-compose up -d --build frontend
```

## 📊 Performance Comparison

| Action | Before (No Hot Reload) | After (With Hot Reload) |
|--------|------------------------|-------------------------|
| Frontend CSS change | ~20s rebuild | ~100ms instant |
| Frontend component change | ~20s rebuild | ~300ms instant |
| Backend controller change | ~3min rebuild | ~5s auto-restart |
| Backend service change | ~3min rebuild | ~5s auto-restart |
| Add npm package | ~20s rebuild | ~20s rebuild ⚠️ |
| Add Maven dependency | ~3min rebuild | ~3min rebuild ⚠️ |

## 🎯 Best Practices

### 1. Keep Containers Running
```bash
# Don't stop containers during development
docker-compose up -d

# Just edit and save - changes apply automatically!
```

### 2. Watch Logs for Errors
```bash
# Terminal 1: Backend logs
docker-compose logs -f backend

# Terminal 2: Frontend logs
docker-compose logs -f frontend
```

### 3. Restart Individual Services
```bash
# If hot-reload fails, restart the service
docker-compose restart backend
docker-compose restart frontend

# Still much faster than rebuild!
```

### 4. Check Container Health
```bash
# See all containers status
docker-compose ps

# Expected output:
# backend   Up    (healthy)
# frontend  Up
# postgres  Up    (healthy)
# minio     Up    (healthy)
```

## 🔍 Troubleshooting

### Frontend changes not reflecting?
```bash
# Check Vite server is running
docker-compose logs frontend

# Look for: "VITE v5.x.x ready in Xms"
# And: "➜  Local:   http://localhost:5173/"

# Hard refresh browser: Ctrl + Shift + R
```

### Backend not auto-restarting?
```bash
# Check Spring DevTools is active
docker-compose logs backend | grep -i devtools

# Should see: "LiveReload server is running on port 35729"

# Manual restart if needed:
docker-compose restart backend
```

### "Maven dependency not found" error?
```bash
# You changed pom.xml - need to rebuild
docker-compose up -d --build backend
```

### File changes not detected (Windows)?
```bash
# Docker may need WSL2 for better file watching
# Or increase polling interval in vite.config.ts:
# watch: { usePolling: true, interval: 1000 }
```

## 🎉 Production Build

When ready to deploy, use production Dockerfiles:

```bash
# Build production images (optimized, no dev tools)
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📚 Additional Resources

- [Spring Boot DevTools Docs](https://docs.spring.io/spring-boot/docs/current/reference/html/using.html#using.devtools)
- [Vite HMR API](https://vitejs.dev/guide/api-hmr.html)
- [Docker Volume Best Practices](https://docs.docker.com/storage/volumes/)

---

**Happy Coding! 🚀** Your changes now apply instantly!
