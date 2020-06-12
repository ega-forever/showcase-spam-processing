import * as dotenv from 'dotenv';

dotenv.config();

const config = {
  db: {
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DB || 'db',
    entityPrefix: process.env.DB_COLUMN_PREFIX || 'reports_',
    logging: process.env.DB_LOGGING ? !!parseInt(process.env.DB_LOGGING, 10) : false
  },
  rest: {
    port: process.env.REST_PORT ? parseInt(process.env.REST_PORT, 10) : 3001
  },
  logLevel: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL, 10) : 50,
  googlePubSub: {
    projectId: process.env.GOOGLE_PUBSUB_PROJECT_ID || 'showcase',
    credentials: process.env.GOOGLE_PUBSUB_CREDENTIALS || 'creds.json',
    topics: {
      newReportTopic: process.env.GOOGLE_PUBSUB_TOPIC_NEW_REPORT || 'backend_services_new_report',
      reportProcessedTopic: process.env.GOOGLE_PUBSUB_TOPIC_REPORT_PROCESSED || 'backend_services_report_processed'
    },
    subscriptionPrefix: process.env.GOOGLE_PUBSUB_SUBSCRIPTION_PREFIX || 'backend_services_reports_',
    createMissedTopics: process.env.CREATE_MISSED_TOPICS ? parseInt(process.env.CREATE_MISSED_TOPICS, 10) : false
  }
};

export default config;
