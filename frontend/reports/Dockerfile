FROM node:12.0 AS builder

WORKDIR /usr/src/app

COPY *.json ./

COPY ./src src
COPY tsconfig.json .

RUN npm install && npm run build
###


FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY --from=builder /usr/src/app/dist/reports/ ./
