import { sleep } from 'k6';
import { hitPublicEndpoints } from './helpers.js';

// Spike test: jump quickly to SPIKE_VUS, hold briefly, then drop.
export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: __ENV.SPIKE_UP || '5s', target: Number(__ENV.SPIKE_VUS || 30) },
        { duration: __ENV.SPIKE_HOLD || '15s', target: Number(__ENV.SPIKE_VUS || 30) },
        { duration: __ENV.SPIKE_DOWN || '5s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1200', 'p(99)<2500'],
  },
};

export default function () {
  hitPublicEndpoints();
  sleep(0.1);
}
