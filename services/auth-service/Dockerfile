FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Install dependencies and rebuild bcrypt
RUN npm install
RUN npm rebuild bcrypt --build-from-source --update-binary

COPY . .

EXPOSE 3001

CMD ["npm", "start"] 