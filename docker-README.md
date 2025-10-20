# DevPulse Docker Setup

## Prerequisites

- Docker Desktop installed
- Docker Compose installed (included with Docker Desktop)
- GitHub Personal Access Token

## Quick Start

1. **Set GitHub Token**

```bash
   export GITHUB_TOKEN=ghp_your_token_here
```

2. **Start all services**

```bash
   docker-compose up -d
```

3. **Check status**

```bash
   docker-compose ps
```

4. **View logs**

```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f api
```

5. **Access services**
   - API: http://localhost:3000
   - Prometheus: http://localhost:9090
   - Database: localhost:5432

## Useful Commands

### Start services

```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up

# Rebuild and start
docker-compose up -d --build
```

### Stop services

```bash
# Stop containers (data persists)
docker-compose stop

# Stop and remove containers (data persists in volumes)
docker-compose down

# Stop and remove everything including volumes (⚠️ deletes data)
docker-compose down -v
```

### Database management

```bash
# Run database setup
docker-compose exec api node backend/database/setup.js

# Access PostgreSQL shell
docker-compose exec postgres psql -U devpulse_user -d devpulse

# View tables
docker-compose exec postgres psql -U devpulse_user -d devpulse -c "\dt"
```

### Debugging

```bash
# View API logs
docker-compose logs -f api

# Enter container shell
docker-compose exec api sh

# Restart specific service
docker-compose restart api

# Check container health
docker-compose ps
```

### Prometheus queries

Visit http://localhost:9090 and try:

```promql
# Request rate
rate(devpulse_http_requests_total[5m])

# Cache hit rate
rate(devpulse_cache_operations_total{operation="hit"}[5m]) / rate(devpulse_cache_operations_total[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(devpulse_http_request_duration_seconds_bucket[5m]))

# Error rate
rate(devpulse_errors_total[5m])

# GitHub rate limit
devpulse_github_rate_limit_remaining
```

## Troubleshooting

### API won't start

```bash
# Check logs
docker-compose logs api

# Check if database is ready
docker-compose exec postgres pg_isready

# Restart with fresh build
docker-compose down
docker-compose up -d --build
```

### Database connection errors

```bash
# Verify DATABASE_URL in docker-compose.yml
# Ensure postgres service is healthy
docker-compose ps postgres
```

### Prometheus not scraping

```bash
# Check Prometheus targets
# Visit: http://localhost:9090/targets

# Check API metrics endpoint works
curl http://localhost:3000/metrics
```

## Production Considerations

Before deploying to production:

1. **Change secrets** in docker-compose.yml

   - DATABASE_PASSWORD
   - JWT_SECRET

2. **Use environment file**

```bash
   docker-compose --env-file .env.production up -d
```

3. **Enable HTTPS** (add nginx/caddy reverse proxy)

4. **Set resource limits**

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 512M
```

5. **Configure backups** for volumes

6. **Set up log aggregation** (ELK, Loki, etc.)
