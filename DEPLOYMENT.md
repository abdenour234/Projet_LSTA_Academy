# 🚀 VPS Deployment Configuration

## VPS Information

**Host:** 57.129.110.129  
**Username:** debian  
**Password:** UM3vmHNPMUde  
**Port:** 22 (SSH)

---

## 🔐 GitHub Secrets Setup

### **IMPORTANT: Store these credentials as GitHub Secrets**

Go to your GitHub repository:
1. Navigate to: `Settings` → `Secrets and variables` → `Actions`
2. Click `New repository secret`
3. Add the following secrets:

| Secret Name | Value |
|------------|-------|
| `VPS_HOST` | `57.129.110.129` |
| `VPS_USERNAME` | `debian` |
| `VPS_PASSWORD` | `UM3vmHNPMUde` |

---

## 📋 VPS Initial Setup

Before the CD pipeline works, you need to set up the VPS **once**:

### 1. SSH into your VPS

```bash
ssh debian@57.129.110.129
# Password: UM3vmHNPMUde
```

### 2. Install Required Tools

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker debian

# Install Docker Compose
sudo apt install docker-compose -y

# Install Git
sudo apt install git -y

# Logout and login again for docker group to take effect
exit
```

### 3. Clone Repository on VPS

```bash
# SSH back in
ssh debian@57.129.110.129

# Clone repository
cd /home/debian
git clone https://github.com/abdenour234/Projet_LSTA_Academy.git
cd Projet_LSTA_Academy

# Checkout test_prod branch
git checkout test_prod

# Create .env files if needed
# (Copy your environment variables here)
```

### 4. Configure Git Credentials

```bash
# Option 1: Use HTTPS with Personal Access Token (Recommended)
git config --global credential.helper store
git pull  # Enter your GitHub username and Personal Access Token

# Option 2: Use SSH keys
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub  # Add this to GitHub SSH keys
```

### 5. Test Docker Setup

```bash
cd /home/debian/Projet_LSTA_Academy
docker-compose build
docker-compose up -d
docker-compose ps  # Check if containers are running
```

---

## 🔄 How CD Pipeline Works

Once set up, the deployment process is automatic:

1. **Developer pushes to `test_prod` branch**
   ```bash
   git push origin test_prod
   ```

2. **GitHub Actions triggers** (`.github/workflows/deploy-to-vps.yml`)

3. **Pipeline executes on VPS:**
   - SSH into VPS
   - Navigate to project directory
   - Pull latest code from `test_prod`
   - Stop running containers
   - Build new Docker images
   - Start containers with new code
   - Clean up old images
   - Display container status

4. **Deployment complete!** ✅

---

## 📊 Pipeline Stages

```
┌─────────────────────────────────────┐
│  Push to test_prod                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  GitHub Actions Triggered           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  SSH into VPS (57.129.110.129)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Git pull origin/test_prod          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  docker-compose down                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  docker-compose build --no-cache    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  docker-compose up -d               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Cleanup + Show Status              │
└──────────────┬──────────────────────┘
               │
               ▼
        ✅ Deployed!
```

---

## 🔍 Monitoring Deployments

### View GitHub Actions Logs
1. Go to: `Actions` tab in GitHub
2. Click on latest `Deploy to VPS` workflow
3. View logs in real-time

### Check VPS Status
```bash
ssh debian@57.129.110.129
cd /home/debian/Projet_LSTA_Academy
docker-compose ps
docker-compose logs -f --tail=100
```

---

## 🛠️ Troubleshooting

### Pipeline fails with "Permission denied"
```bash
# On VPS, fix permissions
sudo chown -R debian:debian /home/debian/Projet_LSTA_Academy
```

### Pipeline fails with "Git authentication failed"
```bash
# On VPS, configure Git credentials
cd /home/debian/Projet_LSTA_Academy
git config credential.helper store
git pull  # Enter credentials once
```

### Containers won't start
```bash
# Check logs on VPS
ssh debian@57.129.110.129
cd /home/debian/Projet_LSTA_Academy
docker-compose logs
```

### Port conflicts
```bash
# Check what's using ports
sudo netstat -tulpn | grep -E ':(80|8080|3000|5432|9000)'

# Stop conflicting services
sudo systemctl stop <service-name>
```

---

## 🔐 Security Best Practices

1. ✅ **Use SSH keys instead of password** (more secure)
2. ✅ **Store credentials in GitHub Secrets** (never commit)
3. ✅ **Use firewall rules** to restrict access
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```
4. ✅ **Regular updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## 📝 Manual Deployment (if needed)

If you need to deploy manually without the pipeline:

```bash
# SSH into VPS
ssh debian@57.129.110.129

# Navigate to project
cd /home/debian/Projet_LSTA_Academy

# Pull latest changes
git pull origin test_prod

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

---

## 🎯 Next Steps

1. ✅ Set up GitHub Secrets (VPS_HOST, VPS_USERNAME, VPS_PASSWORD)
2. ✅ Complete VPS initial setup (install Docker, clone repo)
3. ✅ Test first deployment by pushing to test_prod
4. ✅ Monitor logs in GitHub Actions
5. ✅ Verify application is running on VPS

---

## 📞 Support

If deployment fails:
1. Check GitHub Actions logs
2. SSH into VPS and check `docker-compose logs`
3. Verify all secrets are set correctly
4. Ensure VPS has internet connection and ports are open
