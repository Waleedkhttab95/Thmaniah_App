# Solution Document — Thmaniah Content Platform

## Problem Statement

Build a scalable content management and discovery system consisting of two main components:
1. **CMS (Content Management System)** — for editors/admins to manage podcasts and documentaries with metadata
2. **Discovery System** — for public users to search, browse, and discover content

The system must handle up to **10 million users per hour** and follow **SOLID principles** with low coupling.

---

## Architecture Overview

```
                    ┌──────────────────────┐
                    │   Frontend Clients    │
                    └──────────┬───────────┘
                               │ HTTP/REST
                    ┌──────────▼───────────┐
                    │   API Gateway :3000   │
                    │  - Authentication     │
                    │  - Rate Limiting      │
                    │  - Request Routing    │
                    │  - Swagger Docs       │
                    └───┬──────┬────────┬──┘
                   TCP  │      │ TCP    │ TCP
          ┌─────────────┘      │        └─────────────┐
          ▼                    ▼                       ▼
┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐
│ Auth Service     │  │ Content Service   │  │ Discovery Service  │
│ :3001            │  │ :3002             │  │ :3003              │
│                  │  │                   │  │                    │
│ - Registration   │  │ - CRUD Content    │  │ - Full-text Search │
│ - Login/JWT      │  │ - Content Sources │  │ - Recommendations  │
│ - Role Mgmt      │  │ - Import Strategy │  │ - Trending         │
│                  │  │ - File Upload     │  │ - Manual Search    │
└────────┬─────────┘  └──────┬──────┬────┘  └──────┬─────────────┘
         │                   │      │               │
         ▼                   ▼      │               ▼
    ┌─────────┐         ┌─────────┐ │          ┌─────────┐
    │ MongoDB │         │ MongoDB │ │          │ MongoDB │
    │ (auth)  │         │(content)│ │          │(discov.)│
    └─────────┘         └─────────┘ │          └─────────┘
                                    │               │
                               ┌────▼────┐     ┌────▼────┐
                               │  Bull   │     │  Redis  │
                               │ (Redis) │     │ (Cache) │
                               └─────────┘     └─────────┘
                                    │
                               ┌────▼─────────────────┐
                               │   Elasticsearch       │
                               │   (Full-text Index)   │
                               └───────────────────────┘
```

### Why Microservices?

The task requires scalability to 10M users/hour. A microservices architecture allows:

- **Independent scaling**: The Discovery service (high read traffic) can scale horizontally without affecting the CMS (low write traffic)
- **Technology flexibility**: Each service can choose its own data storage strategy
- **Fault isolation**: A failure in the upload pipeline doesn't affect search
- **Team scalability**: Different teams can own different services

### Why NestJS?

- Matches Thmaniah's technology stack
- Built-in support for microservices (TCP, Redis, NATS transports)
- Excellent TypeScript support with decorators
- Modular architecture enforces SOLID principles
- Built-in validation, Swagger, and dependency injection

---

## Key Technical Decisions

### 1. Database: MongoDB

**Why MongoDB over PostgreSQL:**
- Content documents have varying metadata shapes (podcasts vs. documentaries) — schema flexibility is valuable
- Nested objects (contentDetails with tags, thumbnails, upload status) map naturally to MongoDB documents
- Better horizontal scaling with sharding for 10M users/hour
- Text search indexes as a fallback when Elasticsearch is unavailable

**Note:** PostgreSQL would also be a valid choice, especially if relationships between content, categories, and users grow more complex. In a future iteration, a hybrid approach (PostgreSQL for structured data + MongoDB for content) could be considered.

### 2. Search: Elasticsearch

- **Full-text search** with fuzzy matching, relevance scoring, and field boosting (title^3 > description^2)
- **Category/tag filtering** combined with text queries
- **Performance**: Elasticsearch is optimized for read-heavy workloads (search at scale)
- **Fallback**: If Elasticsearch is unavailable, the system falls back to MongoDB text indexes

### 3. Caching: Redis

- **TTL-based caching** (5 minutes) for trending content, recommendations, and search results
- **Key-prefix tracking** for proper cache invalidation when content is created/updated
- **Bull queues** for async video upload processing (backed by Redis)

### 4. Communication: TCP Transport

- Chose NestJS TCP transport for inter-service communication for simplicity and performance
- Event-driven architecture: Content service **emits events** (`content_created`, `content_updated`) that Discovery service **listens to**
- This decouples the services — content service doesn't need to know about discovery internals

---

## SOLID Principles Applied

### Single Responsibility
- **Auth Service**: Only handles authentication and user management
- **Content Service**: Only handles content CRUD and source management
- **Discovery Service**: Only handles search, recommendations, and trending
- **Import strategies**: Each strategy (YouTube, RSS, Manual) handles only its own source

### Open/Closed Principle
- **Import Strategy Pattern**: New content sources can be added by implementing the `ImportStrategy` interface without modifying existing code
- New strategies just need: `validate()`, `import()`, and a `sourceName`

### Liskov Substitution
- All import strategies implement the same `ImportStrategy` interface and are interchangeable
- All services implement consistent error handling patterns

### Interface Segregation
- `ImportStrategy` interface has only the methods needed for importing
- DTOs are separated: `CreateContentDto`, `LoginDto`, `CreateContentSourceDto` — each focused on its use case

### Dependency Inversion
- Services depend on abstractions (interfaces, DI tokens) not concrete implementations
- Elasticsearch, Redis, and MongoDB connections are injected via NestJS DI container
- Configuration is injected via `ConfigService`, not read from `process.env` directly

---

## Scalability Strategy (10M Users/Hour)

### Calculations
- 10M users/hour ≈ **2,778 requests/second**
- Discovery (read-heavy) likely accounts for 90%+ of traffic

### How the Architecture Handles This

| Strategy | Implementation |
|----------|---------------|
| **Horizontal scaling** | Each microservice is stateless and can run multiple instances behind a load balancer |
| **Caching** | Redis caches trending/search results (5min TTL), reducing DB hits by ~80% |
| **Elasticsearch** | Optimized for read-heavy search workloads, handles thousands of queries/second |
| **Database indexing** | Compound indexes on `category+publishDate`, `tags+publishDate`, `status+publishDate` |
| **Pagination** | All list endpoints are paginated (max 100 items/page) to prevent memory issues |
| **Rate limiting** | Throttler guards prevent abuse (100 req/min on discovery endpoints) |
| **Async processing** | File uploads use Bull queues — don't block the request thread |
| **Event-driven updates** | Content changes propagate via events, not synchronous calls |

### Production Recommendations (Beyond Current Scope)
- Deploy behind **AWS ALB** with auto-scaling groups
- Use **Amazon ElastiCache** (managed Redis) for caching
- Use **Amazon OpenSearch** (managed Elasticsearch) for search
- Add **CDN (CloudFront)** for serving thumbnails and video content
- Consider **NATS or Kafka** for inter-service messaging at higher scale

---

## API Documentation

All endpoints are documented via **Swagger/OpenAPI** at `http://localhost:3000/api`.

### Authentication Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register a new user |
| POST | `/auth/login` | No | Login and receive JWT token |

### CMS Endpoints (Content Management)
| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/content` | JWT | admin, editor | Create new content |
| GET | `/content` | No | — | List content (paginated) |
| GET | `/content/:id` | No | — | Get content by ID |
| PUT | `/content/:id` | JWT | admin, editor | Update content |
| DELETE | `/content/:id` | JWT | admin | Delete content |

### Content Sources
| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/content-sources` | JWT | admin, editor | Create source |
| GET | `/content-sources` | JWT | — | List all sources |
| GET | `/content-sources/:id` | JWT | — | Get source by ID |
| PUT | `/content-sources/:id` | JWT | admin, editor | Update source |
| DELETE | `/content-sources/:id` | JWT | admin | Delete source |

### Discovery Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/discovery/search?keywords=...` | No | Full-text search with category/tag filters |
| GET | `/discovery/recommendations?userId=...` | No | Personalized recommendations |
| GET | `/discovery/trending` | No | Trending content |
| GET | `/discovery/manual-search` | No | Advanced search with filters and pagination |




