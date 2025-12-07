#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting VPS Optimization for Docker & Postgres...${NC}"

# 1. Check and Create Swap File
# Postgres and Java need swap space to prevent OOM (Out Of Memory) kills
if [ $(swapon --show | wc -l) -eq 0 ]; then
    echo "No swap detected. Creating 2GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    echo -e "${GREEN}Swap file created successfully.${NC}"
else
    echo -e "${GREEN}Swap already exists. Skipping.${NC}"
fi

# 2. Optimize Sysctl settings for Docker and Postgres
echo "Optimizing kernel parameters..."
cat <<EOF > /etc/sysctl.d/99-docker-postgres.conf
# Increase max shared memory for Postgres
kernel.shmmax = 1073741824
kernel.shmall = 262144

# Optimize memory management to prefer swap over killing processes
vm.swappiness = 10
vm.overcommit_memory = 1
EOF

sysctl --system

# 3. Docker Log Rotation
# Prevent docker logs from filling up the disk (which can cause DB corruption)
echo "Configuring Docker log rotation..."
cat <<EOF > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Restart Docker to apply log settings (optional, user can do it manually if they want to avoid downtime)
# systemctl restart docker

echo -e "${GREEN}Optimization complete!${NC}"
echo -e "${GREEN}Please restart your containers with: docker compose down && docker compose up -d${NC}"
