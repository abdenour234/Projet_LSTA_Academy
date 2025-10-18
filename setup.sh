#!/bin/bash

# Script de Setup Automatique - Projet LSTA Academy
# Ce script crée automatiquement le compte SuperAdmin

echo "========================================"
echo "  Setup Projet LSTA Academy"
echo "========================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Vérifier que Docker est en cours d'exécution
echo -e "${YELLOW}[1/4] Vérification de Docker...${NC}"
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Erreur: Docker n'est pas en cours d'exécution!${NC}"
    echo -e "${RED}   Veuillez démarrer Docker et réessayer.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker est en cours d'exécution${NC}"
echo ""

# Vérifier que les conteneurs sont démarrés
echo -e "${YELLOW}[2/4] Vérification des conteneurs...${NC}"
if ! docker-compose ps | grep -q "postgres.*Up"; then
    echo -e "${RED}❌ Erreur: Le conteneur PostgreSQL n'est pas démarré!${NC}"
    echo -e "${YELLOW}   Lancement des conteneurs...${NC}"
    docker-compose up -d
    echo -e "${YELLOW}   Attente du démarrage de la base de données (30 secondes)...${NC}"
    sleep 30
fi
echo -e "${GREEN}✅ Conteneurs démarrés${NC}"
echo ""

# Créer le compte SuperAdmin
echo -e "${YELLOW}[3/4] Création du compte SuperAdmin...${NC}"
if docker exec -i school-management-db psql -U postgres -d schoolmanagement < setup-superadmin.sql &> /dev/null; then
    echo -e "${GREEN}✅ Compte SuperAdmin créé avec succès!${NC}"
else
    echo -e "${YELLOW}⚠️  Le compte existe peut-être déjà ou une erreur s'est produite${NC}"
fi
echo ""

# Afficher les informations de connexion
echo -e "${YELLOW}[4/4] Informations de connexion${NC}"
echo ""
echo "========================================"
echo -e "${GREEN}  🎉 Setup Terminé!${NC}"
echo "========================================"
echo ""
echo -e "${NC}📱 Accédez à l'application:${NC}"
echo -e "${CYAN}   URL: http://localhost${NC}"
echo ""
echo -e "${NC}🔐 Identifiants SuperAdmin:${NC}"
echo -e "${CYAN}   Email: admin@admin.com${NC}"
echo -e "${CYAN}   Mot de passe: admin${NC}"
echo ""
echo -e "${NC}📊 Services disponibles:${NC}"
echo "   - Frontend: http://localhost"
echo "   - Backend: http://localhost:8080"
echo "   - PostgreSQL: localhost:5432"
echo "   - MinIO: http://localhost:9000"
echo ""
echo -e "${NC}💡 Commandes utiles:${NC}"
echo "   - Voir les logs: docker-compose logs -f"
echo "   - Arrêter: docker-compose down"
echo "   - Redémarrer: docker-compose restart"
echo ""
