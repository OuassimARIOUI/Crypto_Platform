import { sleep } from 'k6';
import { BASE_URL, hitPublicEndpoints } from './helpers.js';

export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  // Public endpoints only (no auth)
  hitPublicEndpoints();

  sleep(1);
}
