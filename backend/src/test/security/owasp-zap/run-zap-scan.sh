#!/bin/bash

#  Script OWASP ZAP - Scan de Pénétration Automatisé

set -e

echo "  Démarrage du scan OWASP ZAP..."
echo "=========================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
TARGET_URL="${ZAP_TARGET_URL:-http://localhost:3004}"
REPORT_DIR="./src/test/security/owasp-zap/reports"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="zap-scan-$DATE"

# Créer le dossier de rapports
mkdir -p "$REPORT_DIR"

# Type de scan (baseline, full, api)
SCAN_TYPE="${1:-baseline}"

echo ""
echo "${YELLOW} Cible: $TARGET_URL${NC}"
echo "${YELLOW} Type de scan: $SCAN_TYPE${NC}"
echo ""

# Vérifier que l'application est accessible
echo "${YELLOW} Vérification de l'accessibilité de l'application...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/health" | grep -q "200"; then
  echo "${GREEN} Application accessible${NC}"
else
  echo "${RED} Application non accessible sur $TARGET_URL${NC}"
  echo "${RED}   Démarrez l'application avant de lancer le scan${NC}"
  exit 1
fi

# Fonction pour le scan baseline
run_baseline_scan() {
  echo ""
  echo "${YELLOW}🏃 Exécution du scan baseline (rapide)...${NC}"
  
  docker run --rm \
    --name "$CONTAINER_NAME" \
    --network="host" \
    -v "$(pwd)/$REPORT_DIR:/zap/wrk/:rw" \
    ghcr.io/zaproxy/zaproxy:stable \
    zap-baseline.py \
    -t "$TARGET_URL" \
    -r "zap-baseline-$DATE.html" \
    -J "zap-baseline-$DATE.json" \
    -w "zap-baseline-$DATE.md" \
    -c ./src/test/security/owasp-zap/zap-config.yaml \
    -I \
    -l INFO || {
      echo "${RED}  Vulnérabilités détectées!${NC}"
    }
}

# Fonction pour le scan complet
run_full_scan() {
  echo ""
  echo "${YELLOW} Exécution du scan complet (lent mais détaillé)...${NC}"
  
  docker run --rm \
    --name "$CONTAINER_NAME" \
    --network="host" \
    -v "$(pwd)/$REPORT_DIR:/zap/wrk/:rw" \
    ghcr.io/zaproxy/zaproxy:stable \
    zap-full-scan.py \
    -t "$TARGET_URL" \
    -r "zap-full-$DATE.html" \
    -J "zap-full-$DATE.json" \
    -w "zap-full-$DATE.md" \
    -c ./src/test/security/owasp-zap/zap-config.yaml \
    -I \
    -l INFO || {
      echo "${RED}  Vulnérabilités détectées!${NC}"
    }
}

# Fonction pour le scan API
run_api_scan() {
  echo ""
  echo "${YELLOW} Exécution du scan API...${NC}"
  
  docker run --rm \
    --name "$CONTAINER_NAME" \
    --network="host" \
    -v "$(pwd)/$REPORT_DIR:/zap/wrk/:rw" \
    ghcr.io/zaproxy/zaproxy:stable \
    zap-api-scan.py \
    -t "$TARGET_URL/api/docs/json" \
    -f openapi \
    -r "zap-api-$DATE.html" \
    -J "zap-api-$DATE.json" \
    -w "zap-api-$DATE.md" \
    -I \
    -l INFO || {
      echo "${RED}  Vulnérabilités détectées dans l'API!${NC}"
    }
}

# Exécuter le scan selon le type
case "$SCAN_TYPE" in
  baseline)
    run_baseline_scan
    ;;
  full)
    run_full_scan
    ;;
  api)
    run_api_scan
    ;;
  all)
    run_baseline_scan
    run_api_scan
    ;;
  *)
    echo "${RED} Type de scan invalide: $SCAN_TYPE${NC}"
    echo "   Types valides: baseline, full, api, all"
    exit 1
    ;;
esac

# Résumé
echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN} Scan OWASP ZAP terminé!${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "Rapports générés dans: $REPORT_DIR/"
ls -lh "$REPORT_DIR" | tail -n 5
echo ""
echo " Ouvrez le rapport HTML dans votre navigateur:"
echo "   file://$(pwd)/$REPORT_DIR/$(ls -t $REPORT_DIR/*.html | head -1 | xargs basename)"
echo ""

# Vérifier les vulnérabilités critiques dans le rapport JSON
if [ -f "$REPORT_DIR/zap-${SCAN_TYPE}-$DATE.json" ]; then
  HIGH_COUNT=$(cat "$REPORT_DIR/zap-${SCAN_TYPE}-$DATE.json" | jq -r '.site[].alerts[] | select(.riskcode=="3") | .name' | wc -l 2>/dev/null || echo "0")
  
  if [ "$HIGH_COUNT" -gt 0 ]; then
    echo "${RED} ATTENTION: $HIGH_COUNT vulnérabilité(s) HAUTE SÉVÉRITÉ détectée(s)!${NC}"
    exit 1
  else
    echo "${GREEN} Aucune vulnérabilité haute sévérité détectée${NC}"
  fi
fi
