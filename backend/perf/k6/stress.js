import { sleep } from 'k6';
import { hitPublicEndpoints } from './helpers.js';

// Stress test: ramp up to MAX_VUS and observe latency/errors.
export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: __ENV.RAMP_UP || '30s', target: Number(__ENV.MAX_VUS || 20) },
        { duration: __ENV.HOLD || '30s', target: Number(__ENV.MAX_VUS || 20) },
        { duration: __ENV.RAMP_DOWN || '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<900', 'p(99)<1800'],
  },
};

export default function () {
  hitPublicEndpoints();
  sleep(0.1);
}
