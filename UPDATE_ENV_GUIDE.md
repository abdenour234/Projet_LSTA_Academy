# 🔑 Quick Guide: Update Your Local .env File

## ⚠️ IMPORTANT: DO THIS NOW

After pulling the LSTA-005 branch, you need to update your local `.env` file with secure credentials.

---

## 🚀 Quick Steps (Windows PowerShell)

### 1. Generate Secure Credentials

Copy and paste these commands one by one in PowerShell:

#### JWT Secret (512-bit):
```powershell
$bytes = New-Object byte[] 64
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
Write-Host "JWT_SECRET=" -NoNewline; [Convert]::ToBase64String($bytes)
```

#### PostgreSQL Password (256-bit):
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
Write-Host "POSTGRES_PASSWORD=" -NoNewline; [Convert]::ToBase64String($bytes)
```

#### MinIO Access Key (160-bit):
```powershell
$bytes = New-Object byte[] 20
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
Write-Host "MINIO_ROOT_USER=" -NoNewline; [Convert]::ToBase64String($bytes)
```

#### MinIO Secret Key (256-bit):
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
Write-Host "MINIO_ROOT_PASSWORD=" -NoNewline; [Convert]::ToBase64String($bytes)
```

#### pgAdmin Password (256-bit):
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
Write-Host "PGADMIN_DEFAULT_PASSWORD=" -NoNewline; [Convert]::ToBase64String($bytes)
```

---

### 2. Update Your .env File

Open `.env` and update these values with the generated credentials:

```env
# PostgreSQL
POSTGRES_PASSWORD=<paste PostgreSQL password here>
SPRING_DATASOURCE_PASSWORD=<paste same PostgreSQL password here>

# MinIO
MINIO_ROOT_USER=<paste MinIO access key here>
MINIO_ROOT_PASSWORD=<paste MinIO secret key here>
MINIO_ACCESS_KEY=<paste same MinIO access key here>
MINIO_SECRET_KEY=<paste same MinIO secret key here>

# JWT
JWT_SECRET=<paste JWT secret here>

# pgAdmin
PGADMIN_DEFAULT_PASSWORD=<paste pgAdmin password here>
```

---

### 3. Restart Docker Containers

```powershell
docker-compose down
docker-compose up -d
```

---

## 🐧 For Linux/macOS Users

Use `openssl` instead:

```bash
# JWT Secret
openssl rand -base64 64

# Passwords (256-bit)
openssl rand -base64 32

# MinIO Access Key (160-bit)
openssl rand -base64 20
```

---

## ✅ Verification

After restarting containers, verify everything works:

```powershell
# Check container status
docker-compose ps

# Check logs for errors
docker-compose logs backend
docker-compose logs postgres
docker-compose logs minio
```

---

## 📖 Full Documentation

For complete details, see: `SECURITY_CREDENTIALS.md`

---

## 🆘 Issues?

If you encounter problems:

1. Check that passwords match in all required locations
2. Verify environment variables: `docker-compose config`
3. Recreate volumes if needed: `docker-compose down -v`
4. Restart containers: `docker-compose up -d`

---

**REMEMBER:** Never commit your `.env` file with real secrets! It's ignored by Git for security.
