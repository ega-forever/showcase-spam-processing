# frontend.services.reports

Frontend for [reports service](https://travis-ci.com/ega-forever/showcase-mckinsey/backend/services/reports). Built with angular 9.

## Requirements
1) node.js 11+
2) docker with docker compose (in case you want to launch the backend for testing).


## Installation

```bash
$ npm install
```

## Description

The frontend for the service for resolving spam reports received from social media platform.

The service can be started via: ```npm run start```.

Also you can start all necessary services (pubsub, postgres and report backend service) via command ```docker-compose up```.


## How to build

In order to build the app run ```npm run build```. To configure the env. vars edit the files in dir  ```src/environments```.
