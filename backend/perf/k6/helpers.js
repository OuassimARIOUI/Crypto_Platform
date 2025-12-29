import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:3004';

export function getRandomPublicSymbol() {
  // Try to pick a real symbol from /cryptos to make /alerts/check more realistic.
  // If the DB is empty, fall back to a common symbol.
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
