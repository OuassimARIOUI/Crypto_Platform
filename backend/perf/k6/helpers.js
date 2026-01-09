import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:3004';

/**
 * Récupère un symbol de crypto aléatoire depuis l'API /cryptos.
 * Utilisé pour rendre les tests plus réalistes avec des données réelles.
 * Retourne 'btc' par défaut si la base de données est vide.
 */
export function getRandomPublicSymbol() {
  const res = http.get(`${BASE_URL}/cryptos`);
  check(res, { 'cryptos list status 200': (r) => r.status === 200 });

  try {
    const list = res.json();
    if (Array.isArray(list) && list.length > 0) {
      const idx = Math.floor(Math.random() * list.length);
      const sym = (list[idx]?.symbol || '').toString().trim();
      if (sym) return sym;
    }
  } catch (_) {
    // ignore
  }

  return 'btc';
}

/**
 * Effectue des requêtes sur les endpoints publics de l'API :
 * - GET /cryptos : liste des cryptomonnaies
 * - GET /prices : prix actuels
 * - GET /alerts/check : vérification d'alerte avec un symbol aléatoire
 * Retourne le symbol utilisé pour les tests suivants.
 */
export function hitPublicEndpoints() {
  const rCryptos = http.get(`${BASE_URL}/cryptos`);
  check(rCryptos, { 'GET /cryptos 200': (r) => r.status === 200 });

  const rPrices = http.get(`${BASE_URL}/prices`);
  check(rPrices, { 'GET /prices 200': (r) => r.status === 200 });

  const symbol = getRandomPublicSymbol();
  const rAlertCheck = http.get(`${BASE_URL}/alerts/check?symbol=${encodeURIComponent(symbol)}&up=0.000001&down=0.000001`);
  check(rAlertCheck, {
    'GET /alerts/check 200/400': (r) => r.status === 200 || r.status === 400,
  });

  return { symbol };
}
