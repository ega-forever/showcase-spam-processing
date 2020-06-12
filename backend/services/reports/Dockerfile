FROM node:11.3 AS builder

WORKDIR /usr/src/app

COPY package*.json ./

COPY ./src src
COPY tsconfig.json .

RUN npm install && npm run build
###

FROM node:11.3 AS installer

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/build build
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/tsconfig.json .

RUN npm install --production

# ---

# Running code under slim image (production part mostly)
FROM node:11.3-slim

## Clean new directory
WORKDIR /app

## We just need the build and package to execute the command
COPY --from=installer /usr/src/app/build build
COPY --from=installer /usr/src/app/node_modules node_modules

ENTRYPOINT ["node"]
CMD ["build/src/index.js"]