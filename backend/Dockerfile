FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY firebase-service-account.json ./firebase-service-account.json

RUN npx prisma generate

EXPOSE 3004

# ATTENTION : on laisse CMD vide car docker-compose contrôle le launch
CMD ["node", "index.js"]
