# 🚀 Telecom Billing Backend System

A comprehensive, production-ready Node.js backend system for telecom billing with FreeSWITCH integration, subscription management, real-time CDR processing, and Indian payment gateway integration.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with access and refresh tokens
- TOTP two-factor authentication (MFA)
- Account lockout after failed login attempts
- Device fingerprinting and session management
- Rate limiting and DDoS protection
- Comprehensive security audit logging

### 💰 Subscription Management
- Three-tier subscription plans (Starter, Professional, Call Center)
- Monthly, quarterly, and annual billing cycles
- Automatic subscription renewal
- Usage-based overage charges
- Add-on management (toll-free numbers, extensions)

### 📞 FreeSWITCH Integration
- Real-time call authorization
- Live balance checking before call completion
- Automated CDR generation and processing
- Dynamic call routing and control
- WebSocket support for real-time updates

### 💳 Payment Processing
- Razorpay integration (primary for India)
- Stripe integration (backup/international)
- Automated recurring billing
- Failed payment retry with exponential backoff
- Refund management
- Indian GST compliance (18%)

### 📊 Billing & Invoicing
- Automated invoice generation
- Detailed usage breakdowns
- Tax calculations (GST, CGST, SGST, IGST)
- PDF invoice generation
- Email notifications

### 📈 Monitoring & Analytics
- Prometheus metrics collection
- Grafana dashboards
- Sentry error tracking
- Real-time health checks
- Comprehensive logging with Winston
- Performance monitoring

### 🔄 Background Jobs
- CDR processing queue
- Billing cycle automation
- Invoice generation
- Payment retry logic
- Database cleanup tasks
- Automated backups

## 🛠 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL with Sequelize ORM
- **Cache:** Redis
- **Queue:** Bull (Redis-based)
- **Payment Gateways:** Razorpay, Stripe
- **Telecom Integration:** FreeSWITCH ESL
- **Monitoring:** Prometheus, Grafana, Sentry
- **Real-time:** Socket.IO
- **Testing:** Jest, Supertest
- **Documentation:** Swagger/OpenAPI
- **Containerization:** Docker, Docker Compose

## 📦 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 13
- Redis >= 6
- FreeSWITCH (for telecom integration)
- Docker & Docker Compose (optional, for containerized deployment)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Configuration](#configuration) section).

### 4. Database Setup

Run migrations:

```bash
npm run migrate
```

Seed the database with initial data:

```bash
npm run seed
```

Create admin user:

```bash
npm run setup:admin
```

## ⚙️ Configuration

### Essential Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=telecom_billing
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Razorpay (India)
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=webhook_secret

# FreeSWITCH
FREESWITCH_ESL_HOST=localhost
FREESWITCH_ESL_PORT=8021
FREESWITCH_ESL_PASSWORD=ClueCon

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

## 🎯 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### With Docker

```bash
docker-compose up -d
```

### Background Worker

```bash
npm run worker
```

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/v1/auth/register       - Register new customer
POST   /api/v1/auth/login          - Login with credentials
POST   /api/v1/auth/logout         - Logout and invalidate tokens
POST   /api/v1/auth/refresh        - Refresh access token
POST   /api/v1/auth/setup-mfa      - Setup two-factor authentication
POST   /api/v1/auth/verify-mfa     - Verify MFA token
```

### Subscription Endpoints

```
GET    /api/v1/subscriptions       - List all subscriptions
POST   /api/v1/subscriptions       - Create subscription
GET    /api/v1/subscriptions/:id   - Get subscription details
PUT    /api/v1/subscriptions/:id   - Update subscription
DELETE /api/v1/subscriptions/:id   - Cancel subscription
```

### Payment Endpoints

```
POST   /api/v1/payments/create-subscription  - Create recurring payment
POST   /api/v1/payments/process-onetime     - One-time payment
GET    /api/v1/payments/history             - Payment history
POST   /api/webhooks/razorpay               - Razorpay webhook
POST   /api/webhooks/stripe                 - Stripe webhook
```

### CDR Endpoints

```
POST   /api/v1/cdrs                - Submit CDR
GET    /api/v1/cdrs                - List CDRs
GET    /api/v1/cdrs/:id            - Get CDR details
POST   /api/webhooks/cdr           - FreeSWITCH CDR webhook
```

### Complete API documentation available at:
```
http://localhost:3000/api-docs
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm test -- --coverage
```

## 🐳 Deployment

### Docker Deployment

1. Build the image:
```bash
npm run docker:build
```

2. Start services:
```bash
npm run docker:up
```

### Kubernetes Deployment

```bash
kubectl apply -f k8s/
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure strong JWT secrets
- [ ] Set up SSL/TLS certificates
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure Sentry DSN
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure backup automation
- [ ] Set up log rotation
- [ ] Configure rate limiting
- [ ] Enable CORS with specific origins
- [ ] Set up CDN for static assets

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── jobs/            # Background jobs
│   ├── utils/           # Utilities and helpers
│   ├── validators/      # Input validation
│   └── app.js           # Application entry point
├── tests/               # Test files
├── migrations/          # Database migrations
├── docs/                # Documentation
├── docker/              # Docker configuration
├── k8s/                 # Kubernetes manifests
├── monitoring/          # Monitoring configuration
└── scripts/             # Utility scripts
```

## 📊 Subscription Plans

### Starter Plan
- **Price:** ₹349/month (₹3,348/year with 20% discount)
- **Features:** 1 toll-free number, 100 free minutes, 2 extensions
- **Overage:** ₹1.99/minute

### Professional Plan
- **Price:** ₹999/month (₹9,590/year with 20% discount)
- **Features:** 2 toll-free numbers, 500 free minutes, 10 extensions
- **Overage:** ₹1.60/minute

### Call Center Plan
- **Price:** ₹4,999/month (₹47,990/year with 20% discount)
- **Features:** 5 toll-free numbers, 1500 free minutes, 50 extensions
- **Overage:** ₹1.45/minute

## 🔧 Monitoring

Access monitoring dashboards:

- **Metrics:** http://localhost:9090 (Prometheus)
- **Dashboards:** http://localhost:3001 (Grafana)
- **Health Check:** http://localhost:3000/health
- **API Docs:** http://localhost:3000/api-docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and queries:
- Email: support@telecom-billing.com
- Documentation: http://localhost:3000/api-docs
- Issues: GitHub Issues

## 🙏 Acknowledgments

- FreeSWITCH community
- Razorpay for payment gateway
- All open-source contributors

---

**Built with ❤️ for the telecom industry**
