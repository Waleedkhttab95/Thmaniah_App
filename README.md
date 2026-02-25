# Thmaniah Content Platform

A scalable microservices-based content management and discovery platform built with **NestJS** and **TypeScript**. Designed to manage podcasts and documentaries with full-text search, recommendations, and support for importing content from multiple sources.

## Architecture

The platform follows a microservices architecture with an API Gateway pattern:

| Service | Port | Description |
|---------|------|-------------|
| **API Gateway** | 3000 | HTTP entry point, authentication, rate limiting, Swagger UI |
| **Auth Service** | 3001 | User registration, login, JWT token management |
| **Content Service** | 3002 | Content CRUD, content sources, file uploads, import strategies |
| **Discovery Service** | 3003 | Full-text search, recommendations, trending |
| **MongoDB** | 27017 | Primary database |
| **Elasticsearch** | 9200 | Full-text search engine |
| **Redis** | 6379 | Caching and job queue backend |

## Prerequisites

- Node.js v18+
- Docker and Docker Compose

## Quick Start (Run & Test)

The easiest way to run the entire platform and test it with sample requests:

```bash
./run.sh
```

This single script will:
1. Build and start all services via Docker Compose
2. Wait until everything is ready
3. Run 12 sample API requests automatically (register, login, create content, search, etc.)
4. Print the results for each request

After it finishes, you can explore the API interactively at **http://localhost:3000/api** (Swagger UI).

To stop all services:
```bash
docker-compose down
```

## Getting Started (Manual)

### With Docker

```bash
# Start all services
docker-compose up --build

# Access the API documentation
open http://localhost:3000/api
```

### Local Development

```bash
# Install dependencies for each service
cd services/api-gateway && npm install
cd ../auth-service && npm install
cd ../content-service && npm install
cd ../discovery-service && npm install

# Start individual services in development mode
cd services/<service-name>
npm run start:dev
```

## API Documentation

Interactive Swagger UI is available at **http://localhost:3000/api** when the API Gateway is running.

### Key Endpoints

**Authentication:**
- `POST /auth/register` — Register a new user
- `POST /auth/login` — Login and receive JWT token

**Content Management (CMS):**
- `POST /content` — Create content (requires JWT, admin/editor role)
- `GET /content?page=1&limit=20` — List content (paginated)
- `GET /content/:id` — Get content by ID
- `PUT /content/:id` — Update content (requires JWT)
- `DELETE /content/:id` — Delete content (requires JWT, admin role)

**Content Sources:**
- `POST /content-sources` — Create import source
- `GET /content-sources` — List all sources

**Discovery:**
- `GET /discovery/search?keywords=...` — Full-text search
- `GET /discovery/recommendations?userId=...` — Personalized recommendations
- `GET /discovery/trending` — Trending content
- `GET /discovery/manual-search?title=...&category=...` — Advanced filtered search

## Environment Variables

### Required for all services
```
MONGODB_URI=mongodb://root:password@mongodb:27017/dev?authSource=admin
JWT_SECRET=your-secret-key
```

### Content Service
```
ELASTICSEARCH_URI=http://elasticsearch:9200
REDIS_HOST=redis
REDIS_PORT=6379
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket
```

### Discovery Service
```
ELASTICSEARCH_URI=http://elasticsearch:9200
REDIS_HOST=redis
REDIS_PORT=6379
```

## Technical Documentation

See [SOLUTION.md](./SOLUTION.md) for detailed architectural decisions, scalability strategy, SOLID principles implementation, and trade-off analysis.
