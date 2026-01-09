import { sleep } from 'k6';
import { hitPublicEndpoints } from './helpers.js';

// Soak test: steady load over a longer period to detect leaks/instability.
export const options = {
  scenarios: {
    soak: {
      executor: 'constant-vus',
      vus: Number(__ENV.SOAK_VUS || 5),
      duration: __ENV.SOAK_DURATION || '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<900', 'p(99)<1800'],
  },
};

/**
 * Test de Stabilité (Soak) : charge stable sur une longue durée.
 * Détecte les fuites mémoire, dégradations progressives et problèmes de stabilité.
 * Maintient SOAK_VUS utilisateurs constants pendant SOAK_DURATION.
 */
export default function () {
  hitPublicEndpoints();
  sleep(0.3);
}
