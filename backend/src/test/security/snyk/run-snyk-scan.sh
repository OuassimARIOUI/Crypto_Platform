#!/bin/bash

# 🔍 Script Snyk - Scan Complet des Vulnérabilités

set -e

echo "🔐 Démarrage du scan de sécurité Snyk..."
echo "=========================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Créer le dossier de rapports s'il n'existe pas
REPORT_DIR="./src/test/security/snyk/reports"
mkdir -p "$REPORT_DIR"

# Date pour les noms de fichiers
DATE=$(date +%Y%m%d_%H%M%S)

# 1. Test des dépendances npm
echo ""
echo "${YELLOW}📦 Scan des dépendances npm...${NC}"
snyk test \
  --json \
  --severity-threshold=medium \
  > "$REPORT_DIR/snyk-dependencies-$DATE.json" 2>&1 || {
    echo "${RED}❌ Vulnérabilités détectées dans les dépendances!${NC}"
    cat "$REPORT_DIR/snyk-dependencies-$DATE.json" | jq -r '.vulnerabilities[] | "\(.title) - \(.severity)"'
  }

# 2. Test du code source (SAST)
echo ""
echo "${YELLOW}🔍 Scan du code source...${NC}"
snyk code test \
  --sarif \
  --sarif-file-output="$REPORT_DIR/snyk-code-$DATE.sarif" || {
    echo "${RED}⚠️  Problèmes de sécurité détectés dans le code!${NC}"
  }

# 3. Test de l'image Docker (si elle existe)
echo ""
echo "${YELLOW}🐳 Scan de l'image Docker...${NC}"
if docker images | grep -q "crypto_platform-backend"; then
  snyk container test crypto_platform-backend:latest \
    --json \
    --file=Dockerfile \
    > "$REPORT_DIR/snyk-container-$DATE.json" 2>&1 || {
      echo "${RED}⚠️  Vulnérabilités détectées dans l'image Docker!${NC}"
    }
else
  echo "${YELLOW}⏭️  Image Docker non trouvée, scan ignoré${NC}"
fi

# 4. Générer un rapport HTML consolidé
echo ""
echo "${YELLOW}📊 Génération du rapport HTML...${NC}"
snyk-to-html \
  -i "$REPORT_DIR/snyk-dependencies-$DATE.json" \
  -o "$REPORT_DIR/snyk-full-report-$DATE.html" 2>/dev/null || {
    echo "${YELLOW}⚠️  snyk-to-html non installé. Installez avec: npm install -g snyk-to-html${NC}"
  }

# 5. Afficher le résumé
echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN}✅ Scan Snyk terminé!${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "📁 Rapports générés dans: $REPORT_DIR/"
echo "   - snyk-dependencies-$DATE.json"
echo "   - snyk-code-$DATE.sarif"
echo "   - snyk-container-$DATE.json"
echo "   - snyk-full-report-$DATE.html"
echo ""

# Vérifier s'il y a des vulnérabilités critiques
CRITICAL_COUNT=$(cat "$REPORT_DIR/snyk-dependencies-$DATE.json" | jq -r '[.vulnerabilities[] | select(.severity=="critical")] | length')

if [ "$CRITICAL_COUNT" -gt 0 ]; then
  echo "${RED}🚨 ATTENTION: $CRITICAL_COUNT vulnérabilité(s) CRITIQUE(S) détectée(s)!${NC}"
  echo "${RED}   Action requise immédiate!${NC}"
  exit 1
else
  echo "${GREEN}✅ Aucune vulnérabilité critique détectée${NC}"
  exit 0
fi
