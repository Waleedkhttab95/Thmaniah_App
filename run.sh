#!/bin/bash

# ============================================
# Thmaniah Content Platform - Quick Start
# ============================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API="http://localhost:3000"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Thmaniah Content Platform - Setup     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ------------------------------------------
# Step 1: Start all services with Docker
# ------------------------------------------
echo -e "${YELLOW}[1/2] Starting services with Docker Compose...${NC}"
docker-compose up --build -d

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to start Docker services. Make sure Docker is running.${NC}"
  exit 1
fi

echo -e "${GREEN}Services started successfully!${NC}"
echo ""

# ------------------------------------------
# Step 2: Wait for services to be ready
# ------------------------------------------
echo -e "${YELLOW}[2/2] Waiting for services to be ready...${NC}"

MAX_RETRIES=30
RETRY=0
until curl -s "$API" > /dev/null 2>&1 || [ $RETRY -eq $MAX_RETRIES ]; do
  RETRY=$((RETRY + 1))
  echo "  Waiting... ($RETRY/$MAX_RETRIES)"
  sleep 3
done

if [ $RETRY -eq $MAX_RETRIES ]; then
  echo -e "${RED}Services took too long to start. Check logs with: docker-compose logs${NC}"
  exit 1
fi

# Extra wait for microservices to connect
sleep 5

echo -e "${GREEN}All services are ready!${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Running Sample API Requests           ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ------------------------------------------
# 1. Register a user
# ------------------------------------------
echo -e "${YELLOW}1. Register a new user${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Waleed",
    "email": "waleed@thmaniah.com",
    "password": "password123"
  }')
echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# ------------------------------------------
# 2. Login
# ------------------------------------------
echo -e "${YELLOW}2. Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "waleed@thmaniah.com",
    "password": "password123"
  }')
echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Could not get auth token. Continuing without auth...${NC}"
  AUTH_HEADER=""
else
  echo -e "${GREEN}Got auth token!${NC}"
  AUTH_HEADER="Authorization: Bearer $TOKEN"
fi
echo ""

# ------------------------------------------
# 3. Create content - Podcast
# ------------------------------------------
echo -e "${YELLOW}3. Create a podcast${NC}"
PODCAST_RESPONSE=$(curl -s -X POST "$API/content" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "title": "فنجان مع عبدالرحمن أبومالح",
    "description": "بودكاست فنجان، حوارات تمتد لساعات",
    "type": "podcast",
    "category": "حوارات",
    "language": "ar",
    "duration": 5400,
    "contentDetails": {
      "tags": ["فنجان", "بودكاست", "ثمانية"],
      "thumbnail": "https://example.com/finjan.jpg",
      "source": "YouTube"
    }
  }')
echo "$PODCAST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PODCAST_RESPONSE"

PODCAST_ID=$(echo "$PODCAST_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('_id',''))" 2>/dev/null)
echo ""

# ------------------------------------------
# 4. Create content - Documentary
# ------------------------------------------
echo -e "${YELLOW}4. Create a documentary${NC}"
DOC_RESPONSE=$(curl -s -X POST "$API/content" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "title": "خارج الصندوق",
    "description": "فيلم وثائقي من إنتاج ثمانية",
    "type": "documentary",
    "category": "وثائقي",
    "language": "ar",
    "duration": 3600,
    "contentDetails": {
      "tags": ["وثائقي", "ثمانية", "أفلام"],
      "thumbnail": "https://example.com/doc.jpg",
      "source": "YouTube"
    }
  }')
echo "$DOC_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DOC_RESPONSE"
echo ""

# ------------------------------------------
# 5. Get all content (paginated)
# ------------------------------------------
echo -e "${YELLOW}5. List all content (page 1, limit 10)${NC}"
curl -s "$API/content?page=1&limit=10" | python3 -m json.tool 2>/dev/null
echo ""

# ------------------------------------------
# 6. Get content by ID
# ------------------------------------------
if [ -n "$PODCAST_ID" ]; then
  echo -e "${YELLOW}6. Get podcast by ID${NC}"
  curl -s "$API/content/$PODCAST_ID" | python3 -m json.tool 2>/dev/null
  echo ""
fi

# ------------------------------------------
# 7. Update content
# ------------------------------------------
if [ -n "$PODCAST_ID" ]; then
  echo -e "${YELLOW}7. Update podcast title${NC}"
  curl -s -X PUT "$API/content/$PODCAST_ID" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{
      "title": "فنجان - الموسم الخامس"
    }' | python3 -m json.tool 2>/dev/null
  echo ""
fi

# ------------------------------------------
# 8. Create a content source
# ------------------------------------------
echo -e "${YELLOW}8. Create a content source${NC}"
curl -s -X POST "$API/content-sources" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "name": "YouTube - Thmanyah",
    "isActive": true
  }' | python3 -m json.tool 2>/dev/null
echo ""

# ------------------------------------------
# 9. List content sources
# ------------------------------------------
echo -e "${YELLOW}9. List content sources${NC}"
curl -s "$API/content-sources" \
  -H "$AUTH_HEADER" | python3 -m json.tool 2>/dev/null
echo ""

# ------------------------------------------
# 10. Search content
# ------------------------------------------
echo -e "${YELLOW}10. Search for content${NC}"
curl -s "$API/discovery/search?keywords=فنجان" | python3 -m json.tool 2>/dev/null
echo ""

# ------------------------------------------
# 11. Get trending
# ------------------------------------------
echo -e "${YELLOW}11. Get trending content${NC}"
curl -s "$API/discovery/trending" | python3 -m json.tool 2>/dev/null
echo ""

# ------------------------------------------
# 12. Manual search with filters
# ------------------------------------------
echo -e "${YELLOW}12. Manual search (category filter)${NC}"
curl -s "$API/discovery/manual-search?category=حوارات" | python3 -m json.tool 2>/dev/null
echo ""

# ------------------------------------------
# Done
# ------------------------------------------
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  All sample requests completed!        ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Swagger UI:  ${GREEN}http://localhost:3000/api${NC}"
echo -e "Stop all:    ${YELLOW}docker-compose down${NC}"
echo -e "View logs:   ${YELLOW}docker-compose logs -f${NC}"
echo ""
