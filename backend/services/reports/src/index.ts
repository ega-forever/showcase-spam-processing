import { PubSub } from '@google-cloud/pubsub';
import * as bodyParser from 'body-parser';
import * as bunyan from 'bunyan';
import * as cors from 'cors';
import * as express from 'express';
import * as path from 'path';
import 'reflect-metadata';
import { Container } from 'typedi';
import * as TypeORM from 'typeorm';
import * as projectConfig from '../package.json';
import config from './config';
import { DI } from './constants/DI';
import Responses from './constants/Responses';
import SubscriptionCtrl from './controllers/SubscriptionCtrl';
import { entities } from './models/orm';
import NewReportResolver from './resolvers/pubsub/NewReportResolver';
import routes from './resolvers/rest';

const logger = bunyan.createLogger({ name: 'reports.services.backend', level: config.logLevel });

TypeORM.useContainer(Container);

const bootstrap = async () => {
  const app = express();
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(cors());

  app.get('/info', (req, res) => {
    res.send({ uptime: process.uptime(), version: projectConfig.version });
  });

  app.get('/', (req, res) => res.send(Responses.common.success));

  const options: TypeORM.ConnectionOptions = {
    entities,
    ...config.db as any,
    synchronize: false,
    migrations: [path.join(__dirname, 'migrations/*')]
  };

  await TypeORM.createConnection(options);
  await TypeORM.getConnection(options.name).runMigrations();
  await TypeORM.getConnection(options.name).synchronize();

  const pubsub = new PubSub({
    projectId: config.googlePubSub.projectId,
    keyFilename: config.googlePubSub.credentials
  });

  Container.set({ id: DI.services.google.pubsub, factory: () => pubsub });
  Container.set({ id: DI.logger, factory: () => logger });

  if (config.googlePubSub.createMissedTopics) {
    for (const topic of Object.values(config.googlePubSub.topics)) {
      const [isTopicExists] = await pubsub.topic(topic).exists();

      if (!isTopicExists) {
        await pubsub.createTopic(topic, {});
      }
    }
  }

  const subscriptionCtrl = Container.get(SubscriptionCtrl);

  const subscriptionNewIssue = `${ config.googlePubSub.subscriptionPrefix }${ config.googlePubSub.topics.newReportTopic }`;
  const subscriptionNewIssuePath = `projects/${ config.googlePubSub.projectId }/subscriptions/${ subscriptionNewIssue }`;
  await subscriptionCtrl.registerTarget(subscriptionNewIssue, subscriptionNewIssuePath, config.googlePubSub.topics.newReportTopic, Container.get(NewReportResolver));

  routes(app);

  app.listen(config.rest.port, () => {
    logger.info(`Server ready on port ${ config.rest.port }`);
  });
};

bootstrap().catch((err) => {
  logger.error(err);
  process.exit(0);
});
