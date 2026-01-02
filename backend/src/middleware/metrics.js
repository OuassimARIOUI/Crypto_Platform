import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'crypto-platform-backend'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics

// HTTP request counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

// Active connections gauge
const activeConnections = new client.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register]
});

// Database query counter
const dbQueriesTotal = new client.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'model'],
  registers: [register]
});

// Database query duration
const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register]
});

// Redis operations counter
const redisOperationsTotal = new client.Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status'],
  registers: [register]
});

// Crypto price updates counter
const cryptoPriceUpdates = new client.Counter({
  name: 'crypto_price_updates_total',
  help: 'Total number of crypto price updates',
  labelNames: ['crypto'],
  registers: [register]
});

// Active users gauge
const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Number of active users',
  registers: [register]
});

// Portfolio value gauge (for monitoring)
const portfolioValueTotal = new client.Gauge({
  name: 'portfolio_value_total_usd',
  help: 'Total portfolio value across all users in USD',
  registers: [register]
});

// Alerts triggered counter
const alertsTriggered = new client.Counter({
  name: 'alerts_triggered_total',
  help: 'Total number of alerts triggered',
  labelNames: ['type', 'crypto'],
  registers: [register]
});

// API rate limit hits
const rateLimitHits = new client.Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint'],
  registers: [register]
});

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
  // Skip metrics endpoint itself
  if (req.path === '/metrics') {
    return next();
  }

  activeConnections.inc();
  const start = Date.now();

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const status = res.statusCode;

    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status: status
    });

    httpRequestDuration.observe({
      method: req.method,
      route: route,
      status: status
    }, duration);

    activeConnections.dec();

    return originalEnd.apply(this, args);
  };

  next();
};

// Endpoint handler for /metrics
const metricsHandler = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
};

// Health check with metrics
const healthHandler = (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
};

export {
  register,
  metricsMiddleware,
  metricsHandler,
  healthHandler,
  // Export individual metrics for use in other parts of the app
  httpRequestsTotal,
  httpRequestDuration,
  dbQueriesTotal,
  dbQueryDuration,
  redisOperationsTotal,
  cryptoPriceUpdates,
  activeUsers,
  portfolioValueTotal,
  alertsTriggered,
  rateLimitHits
};

export default {
  register,
  metricsMiddleware,
  metricsHandler,
  healthHandler
};
