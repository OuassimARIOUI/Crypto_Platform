# Building
FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
# runing

EXPOSE 3000
CMD ["node", "src/main.js"]

