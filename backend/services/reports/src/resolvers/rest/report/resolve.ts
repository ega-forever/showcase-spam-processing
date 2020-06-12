import { PubSub } from '@google-cloud/pubsub';
import { Request, Response } from 'express';
import { Container } from 'typedi';
import * as TypeORM from 'typeorm';
import config from '../../../config';
import { DI } from '../../../constants/DI';
import ReportState from '../../../constants/ReportState';
import Responses from '../../../constants/Responses';
import { Report } from '../../../models/orm/Report';
import PubSubResolvedReportModel from '../../../models/pubsub/ResolvedReport';

export default async (req: Request, res: Response) => {

  const id = parseInt(req.params.reportId, 10);
  const state = parseInt(req.body.state, 10);

  if (isNaN(id) || ![ReportState.BLOCKED, ReportState.RESOLVED].includes(state)) {
    return res.status(400).send({ status: 0 });
  }

  const reportRepository = TypeORM.getConnection().getRepository(Report);
  const report = await reportRepository.findOne({
    where: { id },
    relations: ['payload']
  });

  if (!report) {
    return res.status(400).send(Responses.common.fail);
  }

  report.state = state;
  await reportRepository.save(report);

  const pubsub: PubSub = Container.get(DI.services.google.pubsub);

  const packet: PubSubResolvedReportModel = {
    reportId: report.payload.externalReportId,
    state: report.state
  };

  await pubsub.topic(config.googlePubSub.topics.reportProcessedTopic).publishJSON(packet);

  res.send(Responses.common.success);
};
