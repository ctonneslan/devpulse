# 🚀 DevPulse - Developer Activity Tracker API

A production-ready REST API that aggregates GitHub developer activity, stores it in PostgreSQL, and exposes comprehensive metrics via Prometheus for monitoring and analytics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18.x-green.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-14-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Monitoring & Metrics](#-monitoring--metrics)
- [Docker Deployment](#-docker-deployment)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [What I Learned](#-what-i-learned)

---

## ✨ Features

### Core Functionality

- 🔍 **GitHub Integration** - Fetch user profiles, repositories, and activity events
- 💾 **Smart Caching** - PostgreSQL-backed cache with configurable staleness detection
- 🔄 **Data Synchronization** - Manual and background sync of GitHub data
- 📊 **Statistics & Analytics** - Aggregated event statistics and trends

### Monitoring & Observability

- 📈 **Prometheus Metrics** - Request rates, cache hit rates, error rates, latency percentiles
- 🏥 **Health Checks** - Application and database health monitoring
- 📉 **Performance Tracking** - Request duration histograms, active request gauges
- 🎯 **Custom Metrics** - GitHub API call tracking, sync operation monitoring

### Production Ready

- 🐳 **Dockerized** - Complete docker-compose setup with API, PostgreSQL, and Prometheus
- 🔐 **Secure** - Environment-based configuration, parameterized SQL queries
- 🛡️ **Error Handling** - Graceful degradation with stale cache fallback
- 🔄 **Graceful Shutdown** - Proper cleanup of resources and connections

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Requests
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                     DevPulse API (Express)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │→ │ Controllers  │→ │  Services    │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
│                                              │              │
│  ┌──────────────────────────────────────────┼─────────┐   │
│  │         Middleware                       │         │   │
│  │  • Metrics    • CORS    • Body Parser   │         │   │
│  └──────────────────────────────────────────┘         │   │
└────────────────────────────────────────────────────────┼───┘
                     │                          │        │
            ┌────────┼──────────────────────────┘        │
            ↓        ↓                                    ↓
    ┌───────────────────┐                    ┌──────────────────┐
    │   PostgreSQL      │                    │  GitHub API      │
    │                   │                    │                  │
    │  • Users          │                    │  • User Profiles │
    │  • Repositories   │                    │  • Events        │
    │  • Events         │                    │  • Repositories  │
    │  • Sync Logs      │                    └──────────────────┘
    └───────────────────┘
            │
            ↓
    ┌───────────────────┐
    │   Prometheus      │
    │                   │
    │  Scrapes /metrics │
    │  every 10s        │
    └───────────────────┘
```

### Request Flow

```
1. Request arrives at Express server
   ↓
2. Metrics middleware tracks request start time
   ↓
3. Route handler delegates to Controller
   ↓
4. Controller checks cache (Database Service)
   ↓
5a. Cache HIT → Return cached data
5b. Cache MISS/STALE → Fetch from GitHub API (GitHub Service)
   ↓
6. Store/Update in database (Database Service)
   ↓
7. Record metrics (cache hit/miss, duration, status)
   ↓
8. Return response to client
```

---

## 🛠️ Tech Stack

### Backend

- **Node.js 18** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL 14** - Relational database
- **axios** - HTTP client for GitHub API

### Monitoring

- **prom-client** - Prometheus metrics collection
- **Prometheus** - Metrics storage and querying

### DevOps

- **Docker** - Containerization
- **docker-compose** - Multi-container orchestration

### Development

- **ES Modules** - Modern JavaScript module system
- **dotenv** - Environment configuration
- **nodemon** - Development auto-reload

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- GitHub Personal Access Token ([create one](https://github.com/settings/tokens))

### Local Development Setup

1. **Clone the repository**

```bash
   git clone https://github.com/ctonneslan/devpulse.git
   cd devpulse
```

2. **Install dependencies**

```bash
   npm install
```

3. **Configure environment**

```bash
   cp .env.example .env
   # Edit .env with your values:
   # - DATABASE_URL: Your PostgreSQL connection string
   # - GITHUB_TOKEN: Your GitHub Personal Access Token
```

4. **Setup database**

```bash
   createdb devpulse
   npm run db:setup
```

5. **Start the server**

```bash
   npm run dev
```

6. **Test it works**

```bash
   curl http://localhost:3000/api/health
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### Health Check

```http
GET /api/health
```

Returns service status and timestamp.

#### GitHub Integration

**Get User Profile**

```http
GET /api/github/user/:username
```

Returns GitHub user profile (cached with smart refresh).

Query Parameters:

- `refresh=true` - Force cache bypass

Response:

```json
{
  "success": true,
  "data": {
    "username": "octocat",
    "name": "The Octocat",
    "avatar_url": "https://...",
    "public_repos": 8,
    "followers": 4000,
    "following": 9
  },
  "cached": true
}
```

**Get User Events**

```http
GET /api/github/events/:username?limit=30
```

Returns recent GitHub activity (commits, PRs, stars, etc.).

**Get User Repositories**

```http
GET /api/github/repos/:username?limit=30
```

Returns user's repositories with metadata.

**Get Event Statistics**

```http
GET /api/github/stats/:username
```

Returns aggregated event counts by type.

**Check GitHub Rate Limit**

```http
GET /api/github/rate-limit
```

Returns GitHub API rate limit status.

#### Data Synchronization

**Sync User Profile**

```http
POST /api/sync/profile/:username
```

Fetches and stores user profile from GitHub.

**Sync Repositories**

```http
POST /api/sync/repos/:username
```

Fetches and stores user's repositories.

**Sync Events**

```http
POST /api/sync/events/:username
```

Fetches and stores user's recent activity.

**Complete Sync**

```http
POST /api/sync/complete/:username
```

Syncs profile, repositories, and events in one operation.

**Database Statistics**

```http
GET /api/sync/stats
```

Returns total counts of cached users, repos, and events.

#### Cache Management

**Get Cache Info**

```http
GET /api/cache/info/:username
```

Returns cache status, age, and sync history for a user.

**List Cached Users**

```http
GET /api/cache/users
```

Returns all cached users with staleness info.

**Refresh Cache**

```http
POST /api/cache/refresh/:username
```

Forces fresh sync of all data for a user.

**Clear Cache**

```http
DELETE /api/cache/user/:username
```

Removes all cached data for a user.

#### Metrics

**Prometheus Metrics**

```http
GET /metrics
```

Returns metrics in Prometheus format.

**Metrics JSON**

```http
GET /metrics/json
```

Returns metrics in human-readable JSON format.

---

## 📊 Monitoring & Metrics

### Available Metrics

#### HTTP Metrics

- `devpulse_http_requests_total` - Total HTTP requests (counter)
- `devpulse_http_request_duration_seconds` - Request duration (histogram)
- `devpulse_active_requests` - Currently processing requests (gauge)

#### Cache Metrics

- `devpulse_cache_operations_total{operation="hit|miss|stale"}` - Cache operations (counter)

#### GitHub API Metrics

- `devpulse_github_api_calls_total` - GitHub API calls (counter)
- `devpulse_github_api_duration_seconds` - API call duration (histogram)
- `devpulse_github_rate_limit_remaining` - API calls remaining (gauge)

#### Database Metrics

- `devpulse_db_queries_total` - Database queries (counter)
- `devpulse_db_query_duration_seconds` - Query duration (histogram)
- `devpulse_cached_users_count` - Cached users in database (gauge)

#### Error Metrics

- `devpulse_errors_total{type}` - Errors by type (counter)

#### Sync Metrics

- `devpulse_sync_duration_seconds` - Sync operation duration (summary)

### Prometheus Queries

**Request Rate**

```promql
rate(devpulse_http_requests_total[5m])
```

**Cache Hit Rate**

```promql
rate(devpulse_cache_operations_total{operation="hit"}[5m]) /
rate(devpulse_cache_operations_total[5m]) * 100
```

**95th Percentile Response Time**

```promql
histogram_quantile(0.95,
  rate(devpulse_http_request_duration_seconds_bucket[5m])
)
```

**Error Rate**

```promql
rate(devpulse_errors_total[5m])
```

**GitHub Rate Limit**

```promql
devpulse_github_rate_limit_remaining
```

### Accessing Prometheus

1. Start services: `docker-compose up -d`
2. Open Prometheus UI: http://localhost:9090
3. Go to **Status → Targets** to verify scraping
4. Go to **Graph** to run queries

---

## 🐳 Docker Deployment

### Quick Start with Docker

1. **Set GitHub Token**

```bash
   export GITHUB_TOKEN=ghp_your_token_here
```

2. **Start all services**

```bash
   docker-compose up -d
```

3. **Verify services are running**

```bash
   docker-compose ps
```

4. **View logs**

```bash
   docker-compose logs -f
```

### Accessing Services

- **API**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Database**: localhost:5432

### Useful Commands

```bash
# Stop services (data persists)
docker-compose stop

# Stop and remove containers (data persists in volumes)
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View API logs
docker-compose logs -f api

# Access database shell
docker-compose exec postgres psql -U devpulse_user -d devpulse

# Run database setup manually
docker-compose exec api node backend/database/setup.js
```

### Docker Services

The docker-compose setup includes:

1. **devpulse-api** - Node.js API server
2. **devpulse-postgres** - PostgreSQL database with persistent storage
3. **devpulse-prometheus** - Prometheus metrics collection

All services have health checks and automatic restart policies.

---

## 📁 Project Structure

```
devpulse/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection pool
│   ├── controllers/
│   │   ├── cacheController.js    # Cache management endpoints
│   │   ├── githubController.js   # GitHub API endpoints
│   │   └── syncController.js     # Data sync endpoints
│   ├── database/
│   │   ├── schema.sql            # Database schema
│   │   ├── setup.js              # Schema initialization script
│   │   └── docker-init.js        # Auto-init for Docker
│   ├── middleware/
│   │   └── metrics.js            # Prometheus metrics middleware
│   ├── routes/
│   │   ├── cache.js              # Cache routes
│   │   ├── github.js             # GitHub routes
│   │   ├── metrics.js            # Metrics routes
│   │   └── sync.js               # Sync routes
│   ├── services/
│   │   ├── databaseService.js    # Database operations
│   │   ├── githubService.js      # GitHub API client
│   │   ├── metricsService.js     # Prometheus metrics
│   │   ├── metricsUpdater.js     # Background metrics updates
│   │   └── syncService.js        # Data synchronization logic
│   ├── app.js                    # Express app configuration
│   └── server.js                 # Server entry point
├── .dockerignore                 # Docker build exclusions
├── .env.example                  # Environment template
├── .gitignore                    # Git exclusions
├── docker-compose.yml            # Multi-container orchestration
├── Dockerfile                    # API container definition
├── package.json                  # Node.js dependencies
├── prometheus.yml                # Prometheus configuration
└── README.md                     # This file
```

### Architecture Layers

**Routes** → **Controllers** → **Services** → **External APIs/Database**

- **Routes**: Define URL patterns and HTTP methods
- **Controllers**: Handle requests, validate input, format responses
- **Services**: Business logic, data processing, external calls
- **Database/APIs**: Data persistence and third-party integrations

This separation ensures:

- ✅ Testability (mock services in tests)
- ✅ Reusability (services used by multiple controllers)
- ✅ Maintainability (clear responsibilities)

---

## 💻 Development

### npm Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm run db:setup   # Initialize database schema
```

### Environment Variables

Create a `.env` file with:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username@localhost:5432/devpulse

# GitHub API
GITHUB_TOKEN=ghp_your_token_here

# Security
JWT_SECRET=your_secret_key
```

### Database Management

```bash
# Create database
createdb devpulse

# Initialize schema
npm run db:setup

# Access PostgreSQL shell
psql devpulse

# View tables
psql devpulse -c "\dt"

# Drop and recreate (⚠️ deletes all data)
dropdb devpulse && createdb devpulse && npm run db:setup
```

### Testing API Endpoints

```bash
# Sync a GitHub user
curl -X POST http://localhost:3000/api/sync/complete/octocat

# Get user profile (will be cached after sync)
curl http://localhost:3000/api/github/user/octocat

# Force refresh cache
curl "http://localhost:3000/api/github/user/octocat?refresh=true"

# View metrics
curl http://localhost:3000/metrics

# Check cache status
curl http://localhost:3000/api/cache/info/octocat
```

---

## 🎓 What I Learned

Building DevPulse taught me production-grade backend development:

### Backend Architecture

- **Layered architecture** (routes → controllers → services)
- **Separation of concerns** for maintainability and testability
- **Service layer pattern** for reusable business logic
- **Error handling** with graceful degradation strategies

### Database Design

- **PostgreSQL schema design** with proper relationships
- **Foreign keys and CASCADE** for referential integrity
- **Connection pooling** for performance
- **Indexing strategies** for query optimization
- **UPSERT pattern** for idempotent operations

### API Development

- **RESTful API design** with clear resource modeling
- **Smart caching** with staleness detection
- **Rate limit management** to respect API quotas
- **Input validation** and error responses
- **HTTP headers** for cache control

### Monitoring & Observability

- **Prometheus metrics** (counters, gauges, histograms, summaries)
- **Instrumentation patterns** throughout the application
- **Performance tracking** (request duration, database query time)
- **Health checks** for service readiness
- **Metrics-driven development** mindset

### DevOps & Docker

- **Docker multi-stage builds** for optimized images
- **docker-compose orchestration** of multiple services
- **Service networking** and discovery
- **Volume management** for data persistence
- **Health checks and dependencies** for reliability
- **Graceful shutdown** handling

### Production Readiness

- **Environment-based configuration** for security
- **Graceful error handling** to prevent cascading failures
- **Background jobs** for periodic tasks
- **Security best practices** (parameterized queries, secrets management)
- **Logging and debugging** strategies

---

## 🔮 Future Enhancements

Potential features to add:

- [ ] **Grafana Dashboards** - Beautiful visualizations of metrics
- [ ] **Background Sync Jobs** - Automatic daily syncing of tracked users
- [ ] **WebSocket Support** - Real-time updates for live dashboards
- [ ] **Frontend Dashboard** - React SPA for visualizing GitHub activity
- [ ] **User Authentication** - Secure multi-user support
- [ ] **API Rate Limiting** - Protect against abuse
- [ ] **Alerting Rules** - Prometheus AlertManager integration
- [ ] **CI/CD Pipeline** - Automated testing and deployment
- [ ] **API Documentation** - OpenAPI/Swagger specification
- [ ] **Unit Tests** - Jest test suite with high coverage

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- [GitHub REST API](https://docs.github.com/en/rest) for developer data
- [Prometheus](https://prometheus.io/) for metrics and monitoring
- [PostgreSQL](https://www.postgresql.org/) for reliable data storage
- [Express.js](https://expressjs.com/) for the web framework

---

## 📧 Contact

**Your Name**

- GitHub: [@ctonneslan](https://github.com/ctonneslan)
- Email: cst0520@gmail.com

---

```

---

## 🎨 Additional Files to Add

### 1. LICENSE

**LICENSE** (MIT License example):
```

MIT License

Copyright (c) 2025 Charlie Tonneslan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
