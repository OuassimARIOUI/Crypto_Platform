FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Copy firebase service account if it exists (created by CI or locally)
# The file is optional - the app will check for it at runtime
COPY firebase-service-account.jso[n] ./

RUN npx prisma generate

EXPOSE 3004

# ATTENTION : on laisse CMD vide car docker-compose contrôle le launch
CMD ["node", "index.js"]
