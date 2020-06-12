# reports.services.backend

[![Build Status](https://travis-ci.com/ega-forever/showcase-spam-processing.svg?token=HMksZg3K4cbPvAAXtLTy&branch=master)](https://travis-ci.com/ega-forever/showcase-spam-processing)
reports backend service

## Requirements
1) node.js 11+
2) docker (with docker compose)


## Installation

```bash
$ npm install
```

## Description

The service for resolving spam reports received from social media platform.

The service can be started via: ```npm run start```.

Also you can start all necessary services (pubsub and postgres) via command ```docker-compose up```.

### Env

| name | default value | description 
| --- | --- | --- | 
| DB_TYPE | postgres | type of db - don't change, until you know, what you are doing
| DB_HOST | localhost | host of db
| DB_PORT | 5432 | port of db
| DB_USER | ``no default value`` | db username
| DB_PASSWORD | ``no default value`` | db password
| DB_DB | db | db name
| DB_COLUMN_PREFIX | reports_ | column prefix
| DB_LOGGING | false | should log all requests to db
| REST_PORT | 3001 | port of rest service
| LOG_LEVEL | 50 | logging level (according to bunyan)
| GOOGLE_PUBSUB_PROJECT_ID | showcase | GCP project id
| GOOGLE_PUBSUB_CREDENTIALS | creds.json | GCP service account with pub/sub permission
| GOOGLE_PUBSUB_TOPIC_NEW_REPORT | backend_services_new_report | pub/sub topic for subscribing on new report submit
| GOOGLE_PUBSUB_TOPIC_REPORT_PROCESSED | backend_services_report_processed | pub/sub topic for subscribing on new processed report
| GOOGLE_PUBSUB_SUBSCRIPTION_PREFIX | backend_services_reports_ | pub/sub subscription prefix
| CREATE_MISSED_TOPICS | 0 | should service create missed topics