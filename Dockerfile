FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/

RUN npm install && npm --prefix client install

COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./

RUN npm install --omit=dev --ignore-scripts

COPY server ./server
COPY scripts ./scripts
COPY .env.example ./.env.example
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 5000

CMD ["npm", "start"]
