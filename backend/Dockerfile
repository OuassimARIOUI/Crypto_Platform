# Building
FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
# runing

EXPOSE 3000
CMD ["node", "src/main.js"]

