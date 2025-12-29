import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getRandomPublicSymbol } from './helpers.js';

// Authenticated perf scenario (portfolio + alerts) using a PERF-ONLY auth bypass.
// Requires backend started with PERF_TEST=true (see docs).

function authHeaders() {
  const token = __ENV.PERF_TEST_TOKEN || 'perf_test_token';
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

export const options = {
  scenarios: {
    auth_flow: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 2),
      duration: __ENV.DURATION || '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1200', 'p(99)<2500'],
  },
};

export default function () {
  const h = authHeaders();

  const me = http.get(`${BASE_URL}/portfolio/me`, h);
  check(me, { 'GET /portfolio/me 200': (r) => r.status === 200 });

  const addFunds = http.post(
    `${BASE_URL}/portfolio/add-funds`,
    JSON.stringify({ amount: 1 }),
    h
  );
  check(addFunds, { 'POST /portfolio/add-funds 200': (r) => r.status === 200 });

  // Optional: alerts CRUD (creates + deletes to keep DB small)
  const symbol = getRandomPublicSymbol();
  const create = http.post(
    `${BASE_URL}/alerts`,
    JSON.stringify({ symbol, type: 'PRICE_ABOVE', threshold: 999999 }),
    h
  );

  if (check(create, { 'POST /alerts 201/200': (r) => r.status === 201 || r.status === 200 })) {
    try {
      const id = create.json()?.alert?.id;
      if (id) {
        const del = http.del(`${BASE_URL}/alerts/${id}`, null, h);
        check(del, { 'DELETE /alerts/:id 200': (r) => r.status === 200 });
      }
    } catch (_) {
      // ignore JSON parse issues
    }
  }

  sleep(0.2);
}
