import { Message, PubSub } from '@google-cloud/pubsub';
// tslint:disable-next-line:no-duplicate-imports
import { v1 as PubSubV1 } from '@google-cloud/pubsub';
// tslint:disable-next-line:no-implicit-dependencies
import * as grpc from '@grpc/grpc-js';
import assert = require('assert');
import { ChildProcess, execSync, fork } from 'child_process';
import * as path from 'path';
import * as request from 'request-promise';
import { v4 as uuidv4 } from 'uuid';
import config from '../../../src/config';
import ReportState from '../../../src/constants/ReportState';
import Responses from '../../../src/constants/Responses';
import SourceReferenceType from '../../../src/constants/SourceReferenceType';
import SourceType from '../../../src/constants/SourceType';
import { Report } from '../../../src/models/orm/Report';
import PubSubReportModel from '../../../src/models/pubsub/Report';
import PubSubResolvedReportModel from '../../../src/models/pubsub/ResolvedReport';
import { awaitServerReady } from '../../shared/utils/awaitServerReady';

interface ICtx {
  api: {
    pubsub: {
      port: number;
      client: PubSub
    };
  };
  reports: PubSubReportModel[];
  server: ChildProcess;
}

describe('reports', () => {

  const ctx: ICtx = {
    api: {
      pubsub: {
        port: 8085,
        client: null
      }
    },
    reports: [],
    server: null
  };

  before(async () => {

    const rootDir = path.join(__dirname, '../../../');
    execSync('docker-compose up -d', {
      cwd: rootDir
    });

    ctx.api.pubsub.client = new PubSub({
      projectId: 'showcase'
    });

    ctx.server = fork(path.join(rootDir, 'src/index.ts'), [], {
      execArgv: [path.join(rootDir, 'node_modules/ts-node/dist/bin.js')],
      env: {
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
        DB_TYPE: process.env.DB_TYPE,
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_DB: process.env.DB_DB,
        DB_LOGGING: process.env.DB_LOGGING,
        CREATE_MISSED_TOPICS: '1',
        GOOGLE_PUBSUB_PROJECT_ID: 'showcase',
        GOOGLE_PUBSUB_CREDENTIALS: path.join(__dirname, '../../shared/creds/creds.json'),
        PUBSUB_EMULATOR_HOST: `localhost:${ ctx.api.pubsub.port }`
      }
    });

    await awaitServerReady(`http://localhost:${ config.rest.port }`);
  });

  it('should send new issue via pubsub', async () => {

    for (let i = 0; i < 100; i++) {
      const item: PubSubReportModel = {
        source: SourceType.REPORT,
        reportType: parseInt(String(Math.random() * 3), 10),
        message: `some message ${ Date.now() }`,
        reportId: uuidv4(),
        referenceResourceId: uuidv4(),
        referenceResourceType: SourceReferenceType.POST
      };
      ctx.reports.push(item);
      await ctx.api.pubsub.client.topic(config.googlePubSub.topics.newReportTopic).publishJSON(item);
    }

    await new Promise(res => setTimeout(res, 5000));
  });

  it('should list reports', async () => {

    const obtained: Report[] = [];

    for (let i = 0; i < ctx.reports.length; i += 10) {
      const reply = await request({
        uri: `http://localhost:${ config.rest.port }/reports?limit=10&offset=${ i }`,
        json: true
      });

      obtained.push(...reply.items);
      assert(reply.count === ctx.reports.length);
    }

    for (const report of ctx.reports) {
      const obtainedItem = obtained.find(ob => ob.payload.externalReportId === report.reportId);
      assert(!!obtainedItem);
    }
  });

  it('should resolve report and send the notification via pubsub', async () => {

    const listReply = await request({
      uri: `http://localhost:${ config.rest.port }/reports?limit=10`,
      json: true
    });

    const report: Report = listReply.items[parseInt(String(listReply.items.length * Math.random()), 10)];

    const subscriptionName = `test_${ config.googlePubSub.topics.reportProcessedTopic }`;
    await ctx.api.pubsub.client.topic(config.googlePubSub.topics.reportProcessedTopic).createSubscription(
      subscriptionName,
      { expirationPolicy: null, ackDeadlineSeconds: 30 });

    const subscriptionPath = `projects/${ config.googlePubSub.projectId }/subscriptions/${ subscriptionName }`;
    const subClient = new PubSubV1.SubscriberClient({
      servicePath: 'localhost',
      port: ctx.api.pubsub.port,
      projectId: 'showcase',
      keyFilename: path.join(__dirname, '../../shared/creds/creds.json'),
      sslCreds: grpc.credentials.createInsecure()
    });
    const subscriptionOptionRequest = {
      subscription: subscriptionPath,
      maxMessages: 1
    };

    const reportResolveReply = await request({
      method: 'PUT',
      uri: `http://localhost:${ config.rest.port }/reports/${ report.id }`,
      body: {
        state: ReportState.BLOCKED
      },
      json: true
    });

    const [response] = await subClient.pull(subscriptionOptionRequest);

    assert(response.receivedMessages.length === 1);
    const message = response.receivedMessages[0];

    await subClient.acknowledge({
      subscription: subscriptionPath,
      ackIds: [message.ackId]
    });

    const resolvedPacket: PubSubResolvedReportModel = JSON.parse(Buffer.from(message.message.data.toString('base64'), 'base64').toString());

    assert.deepStrictEqual(reportResolveReply, Responses.common.success);
    assert(resolvedPacket.reportId === report.payload.externalReportId);
    assert(resolvedPacket.state === ReportState.BLOCKED);

    const newListReply = await request({
      uri: `http://localhost:${ config.rest.port }/reports?limit=10&state=${ ReportState.BLOCKED }`,
      json: true
    });

    assert(newListReply.items.length === 1);
    assert(newListReply.items[0].id === report.id);
  });

  after(async () => {
    process.kill(ctx.server.pid);
    await ctx.api.pubsub.client.close();

    const rootDir = path.join(__dirname, '../../../');
    execSync('docker-compose down', {
      cwd: rootDir
    });
  });

});
