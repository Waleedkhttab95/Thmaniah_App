# Content Platform

A scalable microservices-based content management and discovery platform built with NestJS.

## Architecture

The platform consists of the following microservices:

- API Gateway (Port: 3000)
- Auth Service (Port: 3001)
- Content Service (Port: 3002)
- Discovery Service (Port: 3003)
- MongoDB (Port: 27017)
- Elasticsearch (Port: 9200)

## Prerequisites

- Node.js v18 or higher
- Docker and Docker Compose
- npm or yarn

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>

```

2. Install dependencies for each service:
```bash
cd services/api-gateway && npm install
cd ../auth-service && npm install
cd ../content-service && npm install
cd ../discovery-service && npm install
```

3. Start the services using Docker Compose:
```bash
docker-compose up --build
```

4. Access the API documentation:
- API Gateway Swagger UI: http://localhost:3000/api

## Development

To run a specific service in development mode:

```bash
cd services/<service-name>
npm run start:dev
```



## Environment Variables

Create a `.env` file in each service directory with the following variables:

### Auth Service
```
MONGODB_URI=mongodb://mongodb:27017/auth
JWT_SECRET=your-secret-key
```

### Content Service
```
MONGODB_URI=mongodb://mongodb:27017/content
ELASTICSEARCH_URI=http://elasticsearch:9200
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Discovery Service
```
MONGODB_URI=mongodb://mongodb:27017/discovery
ELASTICSEARCH_URI=http://elasticsearch:9200
```


