# Monitoring and Observability

This document describes the monitoring and observability setup for the Balatrix Telecom Billing Backend.

## Overview

The system uses a comprehensive monitoring stack:
- **Prometheus** - Metrics collection and storage
- **Sentry** - Error tracking and performance monitoring
- **Winston** - Application logging
- **Custom Alerting** - Automated alerts for critical events

## Metrics

### Prometheus Metrics

All metrics are exposed at `/metrics` endpoint in Prometheus format.

#### HTTP Metrics
- `telecom_billing_http_request_duration_seconds` - HTTP request duration (histogram)
- `telecom_billing_http_requests_total` - Total HTTP requests (counter)

#### CDR Processing Metrics
- `telecom_billing_cdr_processed_total` - Total CDRs processed (counter)
  - Labels: `status` (success/failed), `call_type`
- `telecom_billing_cdr_processing_duration_seconds` - CDR processing time (histogram)
  - Labels: `status`

#### Business Metrics
- `telecom_billing_active_subscriptions` - Active subscriptions by plan (gauge)
  - Labels: `plan` (Starter/Professional/Call Center)
- `telecom_billing_revenue_total_inr` - Total revenue generated (counter)
  - Labels: `type` (subscription/usage/addon)
- `telecom_billing_invoices_generated_total` - Invoices generated (counter)
  - Labels: `type` (subscription/postpaid), `status`
- `telecom_billing_customers_total` - Total customers (gauge)
  - Labels: `status` (active/suspended/pending)

#### Payment Metrics
- `telecom_billing_payment_success_total` - Successful payments (counter)
  - Labels: `gateway` (razorpay/stripe)
- `telecom_billing_payment_failure_total` - Failed payments (counter)
  - Labels: `gateway`, `reason`

#### Background Job Metrics
- `telecom_billing_jobs_total` - Background jobs processed (counter)
  - Labels: `queue`, `job_name`, `status`
- `telecom_billing_job_processing_duration_seconds` - Job processing time (histogram)
  - Labels: `queue`, `job_name`, `status`

#### System Metrics
- `telecom_billing_db_connection_pool` - Database connection pool status (gauge)
  - Labels: `status` (idle/active/waiting)
- Default Node.js metrics (memory, CPU, GC, etc.)

### Updating Metrics

Metrics are automatically updated:
- **Real-time**: HTTP requests, CDR processing, payments, job processing
- **Periodic (30s)**: Active subscriptions, customer counts, DB pool
- **Manual**: Use monitoring service functions in your code

Example:
```javascript
const { trackRevenue, trackPaymentSuccess } = require('./services/monitoringService');

// Track revenue
trackRevenue(999, 'subscription');

// Track payment success
trackPaymentSuccess('razorpay');
```

## Health Checks

### Endpoints

#### `/health` - Overall Health
Returns detailed health status of all services:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "redis": "healthy"
  },
  "memory": {...},
  "cpu": {...}
}
```

#### `/health/ready` - Readiness Probe
For Kubernetes readiness checks. Returns 200 if service is ready to accept traffic.

#### `/health/live` - Liveness Probe
For Kubernetes liveness checks. Returns 200 if service is alive.

#### `/metrics/json` - Metrics in JSON
Get all metrics in JSON format (useful for debugging).

## Sentry Integration

### Configuration

Set the following environment variables:
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
APP_VERSION=1.0.0
NODE_ENV=production
```

### Features

- **Error Tracking**: All unhandled errors are automatically captured
- **Performance Monitoring**: HTTP requests and background jobs are traced
- **Profiling**: CPU profiling enabled for performance optimization
- **Breadcrumbs**: Automatic breadcrumbs for debugging
- **Context**: User, request, and custom context attached to events

### Manual Error Reporting

```javascript
const { captureException, captureMessage } = require('./config/sentry');

// Capture exception with context
try {
  // your code
} catch (error) {
  captureException(error, {
    tags: { component: 'payment' },
    extra: { paymentId: payment.id },
    user: { id: user.id, email: user.email }
  });
}

// Capture message
captureMessage('Important event', 'info', {
  tags: { event_type: 'billing' }
});
```

## Alerting

### Automatic Alerts

The system monitors and alerts on:

#### Critical Alerts (Sent to Sentry + Logs)
- Payment failure rate > 10%
- High memory usage > 90%
- Critically overdue invoices (>30 days)
- Stuck background jobs (>5 minutes)

#### Warning Alerts
- Database pool utilization > 80%
- CDR processing failure rate > 5%
- High number of overdue invoices (>50)
- Multiple low balance accounts
- Failed background jobs (>100)

### Alert Channels

Alerts are sent through:
1. **Logs** - Always logged with appropriate level
2. **Sentry** - Critical and warning events
3. **Email** - (TODO: Not yet implemented)
4. **Webhook** - (TODO: Not yet implemented)

### Health Check Schedule

Automated health checks run every 15 minutes via the scheduler:
- Database pool utilization
- Payment failure rate
- CDR processing failure rate
- Overdue invoices
- Low balance accounts
- Memory usage
- Failed background jobs
- Stuck background jobs

### Manual Health Checks

```javascript
const { runAllHealthChecks } = require('./services/alertingService');

// Run all checks
await runAllHealthChecks(sequelize, [
  cdrProcessingQueue,
  billingQueue,
  // ... other queues
]);
```

## Logging

### Winston Configuration

Logs are written to:
- `logs/error.log` - Error level logs
- `logs/combined.log` - All logs
- `logs/application-%DATE%.log` - Daily rotating logs (30-day retention)

### Log Levels
- `error` - Errors and exceptions
- `warn` - Warnings and degraded performance
- `info` - Important events (startup, shutdown, job completion)
- `debug` - Detailed debugging information

### Structured Logging

All logs include:
- Timestamp
- Log level
- Message
- Additional context (as JSON)

Example:
```javascript
const logger = require('./utils/logger');

logger.info('Payment processed', {
  paymentId: payment.id,
  amount: payment.amount,
  gateway: payment.gateway,
  customerId: customer.id
});
```

## Prometheus Setup

### Running Prometheus

1. Create `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'telecom-billing'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

2. Run Prometheus:
```bash
docker run -p 9090:9090 -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

3. Access Prometheus UI: http://localhost:9090

### Useful Queries

#### HTTP Request Rate
```promql
rate(telecom_billing_http_requests_total[5m])
```

#### Average Response Time
```promql
rate(telecom_billing_http_request_duration_seconds_sum[5m]) / 
rate(telecom_billing_http_request_duration_seconds_count[5m])
```

#### Revenue per Hour
```promql
increase(telecom_billing_revenue_total_inr[1h])
```

#### Payment Success Rate
```promql
sum(rate(telecom_billing_payment_success_total[5m])) / 
(sum(rate(telecom_billing_payment_success_total[5m])) + sum(rate(telecom_billing_payment_failure_total[5m])))
```

#### Active Subscriptions by Plan
```promql
telecom_billing_active_subscriptions
```

## Grafana Dashboards

### Recommended Dashboards

1. **API Performance**
   - Request rate
   - Response time percentiles (p50, p95, p99)
   - Error rate
   - Status code distribution

2. **Business Metrics**
   - Revenue trends
   - Active subscriptions
   - New customers
   - Payment success rate

3. **CDR Processing**
   - CDR processing rate
   - Processing latency
   - Failure rate
   - Top destinations

4. **Background Jobs**
   - Job processing rate per queue
   - Job latency
   - Failed jobs
   - Queue depth

5. **System Health**
   - Memory usage
   - CPU usage
   - Database pool utilization
   - Redis connection status

## Best Practices

### 1. Add Metrics to New Features
When adding new features, always add relevant metrics:
```javascript
const startTime = Date.now();
try {
  // your code
  const duration = (Date.now() - startTime) / 1000;
  trackJobProcessing('queue', 'jobName', 'completed', duration);
} catch (error) {
  const duration = (Date.now() - startTime) / 1000;
  trackJobProcessing('queue', 'jobName', 'failed', duration);
  throw error;
}
```

### 2. Use Structured Logging
Always include relevant context:
```javascript
logger.info('Event occurred', {
  userId: user.id,
  action: 'payment',
  amount: payment.amount,
  // ... other relevant data
});
```

### 3. Set Up Alerts
Configure alerts in Prometheus/Grafana for critical metrics:
- High error rates
- Slow response times
- Low success rates
- Resource exhaustion

### 4. Monitor Trends
Look for trends over time:
- Increasing memory usage (memory leaks)
- Degrading response times (performance issues)
- Rising error rates (stability problems)

### 5. Investigate Anomalies
When alerts fire:
1. Check logs for errors
2. Review Sentry for exceptions
3. Check Prometheus metrics for patterns
4. Correlate with recent deployments

## Troubleshooting

### Metrics Not Appearing
1. Check `/metrics` endpoint is accessible
2. Verify Prometheus is scraping the endpoint
3. Check Prometheus logs for errors
4. Ensure metrics are being incremented in code

### Sentry Not Receiving Errors
1. Verify `SENTRY_DSN` is set correctly
2. Check NODE_ENV (test environment doesn't send events)
3. Review Sentry quota limits
4. Check network connectivity

### High Memory Usage
1. Check for memory leaks in code
2. Review heap snapshots
3. Optimize data structures
4. Implement proper cleanup in jobs

### Slow Response Times
1. Identify slow endpoints from metrics
2. Add database query logging
3. Profile slow functions
4. Optimize database queries
5. Add caching where appropriate

## Production Checklist

- [ ] Prometheus configured and running
- [ ] Grafana dashboards created
- [ ] Sentry DSN configured
- [ ] Alert rules configured
- [ ] Log aggregation setup (ELK/Loki)
- [ ] Health check endpoints tested
- [ ] Kubernetes probes configured
- [ ] On-call rotation established
- [ ] Runbooks created for common issues
- [ ] Monitoring documentation updated
