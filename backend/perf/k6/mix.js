import { sleep } from 'k6';
import { hitPublicEndpoints, BASE_URL } from './helpers.js';
import http from 'k6/http';
import { check } from 'k6';

// "Pro" traffic mix using arrival-rate (RPS-like) instead of pure VUs.
// Goal: evaluate latency + error rate under a realistic read-heavy mix.

export const options = {
  scenarios: {
    read_mix: {
      executor: 'ramping-arrival-rate',
      startRate: Number(__ENV.START_RPS || 5),
      timeUnit: '1s',
      preAllocatedVUs: Number(__ENV.PRE_VUS || 20),
      maxVUs: Number(__ENV.MAX_VUS || 100),
      stages: [
        { duration: __ENV.RAMP1 || '20s', target: Number(__ENV.RPS1 || 10) },
        { duration: __ENV.HOLD1 || '40s', target: Number(__ENV.RPS1 || 10) },
        { duration: __ENV.RAMP2 || '20s', target: Number(__ENV.RPS2 || 20) },
        { duration: __ENV.HOLD2 || '40s', target: Number(__ENV.RPS2 || 20) },
        { duration: __ENV.RAMP_DOWN || '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<900', 'p(99)<1800'],
  },
};

export default function () {
  // 80%: /prices, 20%: broader public mix
  const roll = Math.random();
  if (roll < 0.8) {
    const r = http.get(`${BASE_URL}/prices`);
    check(r, { 'GET /prices 200': (x) => x.status === 200 });
  } else {
    hitPublicEndpoints();
  }

  sleep(0.05);
}
