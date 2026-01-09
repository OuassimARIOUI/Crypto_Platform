import { sleep } from 'k6';
import { hitPublicEndpoints } from './helpers.js';

export const options = {
  scenarios: {
    api_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: Number(__ENV.MAX_VUS || 10) },
        { duration: '40s', target: Number(__ENV.MAX_VUS || 10) },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
  },
};

/**
 * Test de Charge (Load Test) : montée progressive des utilisateurs virtuels.
 * Simule une augmentation réaliste du trafic pour évaluer la scalabilité.
 * Rampe jusqu'à MAX_VUS utilisateurs, maintient la charge, puis redescend.
 */
export default function () {
  hitPublicEndpoints();

  // Small think-time to avoid an unrealistic tight loop
  sleep(0.2);
}
