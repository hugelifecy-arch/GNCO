# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN npm install -g serve@14.2.4
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
