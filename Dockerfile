FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["npm","start"]