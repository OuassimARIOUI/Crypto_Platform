# Building
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# runing

EXPOSE 3000
CMD ["node", "src/main.js"]

