# 🔐 LSTA-005: Security Credentials Implementation Guide

## Overview

This document describes the implementation of **LSTA-005: Change Default Credentials & Strengthen JWT Secret**, which enhances the security of the LSTA Academy application by:

✅ **Generating cryptographically secure 512-bit JWT secret**  
✅ **Creating strong passwords for MinIO**  
✅ **Creating strong passwords for PostgreSQL**  
✅ **Moving all secrets to environment variables**  
✅ **Removing all hardcoded credentials from source code**

---

## 🎯 Security Improvements

### 1. JWT Secret (512-bit)

**Before:**
```yaml
JWT_SECRET: your-very-secure-secret-key-change-this-in-production-minimum-512-bits
```

**After:**
```bash
# Generated using cryptographically secure random number generator
# 512 bits (64 bytes) encoded in Base64
JWT_SECRET=fKVIEvmD+wocwN13/jK1Sbm7Tnr9vfOjNq0VsJK0PXSJP6QGMkwO+D3U7/BCrR56YC4siv/FZ8Bcdy4pciF4uQ==
```

**Generation Method:**
```bash
# On Linux/macOS
openssl rand -base64 64

# On Windows PowerShell
$bytes = New-Object byte[] 64
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

---

### 2. PostgreSQL Credentials (256-bit)

**Before:**
```yaml
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres  # ❌ INSECURE DEFAULT
```

**After:**
```bash
POSTGRES_USER=postgres
# 256-bit cryptographically secure password
POSTGRES_PASSWORD=deCn33JNmLdf/SSrKrGl0FyMtu3tANQshIgBJUvPPcw=
```

**Generation Method:**
```bash
# On Linux/macOS
openssl rand -base64 32

# On Windows PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

---

### 3. MinIO Credentials

**Before:**
```yaml
MINIO_ROOT_USER: minioadmin      # ❌ INSECURE DEFAULT
MINIO_ROOT_PASSWORD: minioadmin  # ❌ INSECURE DEFAULT
```

**After:**
```bash
# 160-bit access key
MINIO_ROOT_USER=amkYzipDAJqt8VjbaZBle3Qm1fo=
# 256-bit secret key
MINIO_ROOT_PASSWORD=ZZsiSO0PPAgqMdZzHpyov8eQIKkl7zfjaMYqdHy+mpo=
```

**Generation Method:**
```bash
# Access Key (20 bytes = 160 bits)
openssl rand -base64 20

# Secret Key (32 bytes = 256 bits)
openssl rand -base64 32
```

---

### 4. pgAdmin Credentials

**Before:**
```yaml
PGADMIN_DEFAULT_EMAIL: admin@admin.com
PGADMIN_DEFAULT_PASSWORD: admin  # ❌ INSECURE DEFAULT
```

**After:**
```bash
PGADMIN_DEFAULT_EMAIL=admin@pedagoria.com
# 256-bit cryptographically secure password
PGADMIN_DEFAULT_PASSWORD=AXNN3Kpap2fYuZsScImOTuHzvQIhPq4budWZKD59+b4=
```

---

## 📁 Files Modified

### Configuration Files Updated:

1. **`.env`** - Updated with cryptographically secure credentials
2. **`.env.example`** - Created template with generation instructions
3. **`.env.vps.example`** - Enhanced with security checklist and instructions
4. **`docker-compose.yml`** - Converted all hardcoded values to environment variables
5. **`backend/src/main/resources/application.properties`** - Removed hardcoded secrets
6. **`backend/src/main/resources/application.yml`** - Already using environment variables ✓

---

## 🚀 Deployment Instructions

### For Development Environment:

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Generate secure credentials:**
   ```bash
   # JWT Secret (512-bit)
   openssl rand -base64 64
   
   # Database Password (256-bit)
   openssl rand -base64 32
   
   # MinIO Access Key (160-bit)
   openssl rand -base64 20
   
   # MinIO Secret Key (256-bit)
   openssl rand -base64 32
   ```

3. **Update `.env` with generated values**

4. **Start the application:**
   ```bash
   docker-compose up -d
   ```

---

### For Production VPS Deployment:

1. **Copy the VPS template:**
   ```bash
   cp .env.vps.example .env
   ```

2. **Generate production credentials:**
   ```bash
   # All credentials MUST be different from development
   openssl rand -base64 64  # JWT Secret
   openssl rand -base64 32  # PostgreSQL Password
   openssl rand -base64 20  # MinIO Access Key
   openssl rand -base64 32  # MinIO Secret Key
   openssl rand -base64 32  # pgAdmin Password
   ```

3. **Update `.env` with production values**

4. **Set restrictive file permissions:**
   ```bash
   chmod 600 .env
   ```

5. **Verify environment variables are loaded:**
   ```bash
   docker-compose config
   ```

6. **Deploy:**
   ```bash
   docker-compose up -d
   ```

---

## 🔒 Security Best Practices

### ✅ DO:

- ✓ Generate unique credentials for each environment (dev, staging, prod)
- ✓ Use cryptographically secure random number generators
- ✓ Store `.env` files with restricted permissions (`chmod 600`)
- ✓ Rotate secrets regularly (quarterly recommended)
- ✓ Use different secrets for different services
- ✓ Keep `.env` files out of version control
- ✓ Use environment-specific `.env` files
- ✓ Document credential rotation procedures
- ✓ Use secrets management tools for production (AWS Secrets Manager, HashiCorp Vault, etc.)

### ❌ DON'T:

- ✗ Never commit `.env` files to Git
- ✗ Never reuse passwords across services
- ✗ Never use default or weak passwords
- ✗ Never share production credentials via email/chat
- ✗ Never hardcode secrets in source code
- ✗ Never use short or predictable secrets
- ✗ Never leave default credentials in production
- ✗ Never store secrets in plaintext without proper permissions

---

## 🔐 .gitignore Configuration

Ensure the following is in your `.gitignore`:

```gitignore
# Environment files with secrets
.env
.env.local
.env.*.local
.env.production
.env.vps

# Keep example files
!.env.example
!.env.vps.example
```

---

## 📋 Security Checklist

Before deploying to production, verify:

- [ ] All passwords changed from defaults
- [ ] JWT_SECRET is 512-bit (64 bytes in base64)
- [ ] PostgreSQL password is at least 256-bit (32 bytes)
- [ ] MinIO access key is at least 160-bit (20 bytes)
- [ ] MinIO secret key is at least 256-bit (32 bytes)
- [ ] All secrets are unique (not reused)
- [ ] `.env` file permissions set to 600
- [ ] `.env` is in `.gitignore`
- [ ] Environment variables verified with `docker-compose config`
- [ ] No hardcoded secrets remain in source code
- [ ] Backup of production secrets stored securely offline
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured (only 22, 80, 443 open)
- [ ] CORS restricted to production domain only
- [ ] Database backups configured and tested

---

## 🔄 Credential Rotation Procedure

### When to Rotate:

- Quarterly (recommended minimum)
- After a security incident
- When an employee with access leaves
- When credentials may have been exposed
- After major system upgrades

### How to Rotate:

1. **Generate new credentials** using the methods above
2. **Update `.env` file** with new values
3. **Recreate containers:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```
4. **Verify application functionality**
5. **Update backup systems** with new credentials
6. **Document rotation** in security log
7. **Securely destroy old credentials**

---

## 🆘 Troubleshooting

### Issue: Application fails to start after updating credentials

**Solution:**
```bash
# Verify environment variables are loaded
docker-compose config

# Check container logs
docker-compose logs backend
docker-compose logs postgres
docker-compose logs minio

# Restart services
docker-compose restart
```

### Issue: Database connection refused

**Solution:**
1. Verify PostgreSQL password matches in all locations:
   - `.env` → `POSTGRES_PASSWORD`
   - `.env` → `SPRING_DATASOURCE_PASSWORD`
2. Recreate database container:
   ```bash
   docker-compose down postgres
   docker volume rm projet_lsta_academy_postgres_data
   docker-compose up -d postgres
   ```

### Issue: MinIO authentication fails

**Solution:**
1. Verify MinIO credentials match:
   - `.env` → `MINIO_ROOT_USER` = `MINIO_ACCESS_KEY`
   - `.env` → `MINIO_ROOT_PASSWORD` = `MINIO_SECRET_KEY`
2. Recreate MinIO container:
   ```bash
   docker-compose down minio
   docker volume rm projet_lsta_academy_minio_data
   docker-compose up -d minio
   ```

### Issue: JWT token validation fails

**Solution:**
1. Verify JWT_SECRET is consistent across all backend instances
2. Clear browser cookies/localStorage
3. Restart backend service:
   ```bash
   docker-compose restart backend
   ```

---

## 📞 Support

For security-related questions or incidents:

1. **DO NOT** share credentials in tickets or messages
2. **DO NOT** commit secrets to Git
3. Contact system administrator through secure channel
4. Rotate credentials immediately if compromise is suspected

---

## 🔖 References

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Docker Secrets Documentation](https://docs.docker.com/engine/swarm/secrets/)
- [Spring Boot External Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-29  
**Author:** LSTA Security Team  
**Ticket:** LSTA-005
