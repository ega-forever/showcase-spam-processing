import { Message } from '@google-cloud/pubsub';
import Logger = require('bunyan');
import { Inject } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { DI } from '../../constants/DI';
import ReportState from '../../constants/ReportState';
import ISubscriptionResolver from '../../interfaces/ISubscriptionResolver';
import { Report } from '../../models/orm/Report';
import { ReportMetaData } from '../../models/orm/ReportMetaData';
import PubSubReportModel from '../../models/pubsub/Report';

export default class NewReportResolver implements ISubscriptionResolver {

  @InjectRepository(Report)
  private readonly reportRepository: Repository<Report>;

  @InjectRepository(ReportMetaData)
  private readonly reportMetaDataRepository: Repository<ReportMetaData>;

  @Inject(DI.logger)
  private readonly logger: Logger;

  public async emit(message: Message): Promise<void> {

    const packet: PubSubReportModel = JSON.parse(message.data.toString());
    this.logger.info(`received new issue ${ message.data.toString() }`);

    const reportMeta = await this.reportMetaDataRepository.createQueryBuilder('rm')
      .leftJoin('rm.report', 'report')
      .addSelect(['report.id', 'rm.externalReportId'])
      .where('rm.externalReportId = :externalReportId', { externalReportId: packet.reportId })
      .getOne();

    if (reportMeta) {
      await this.reportRepository.update({ id: reportMeta.report.id }, { state: ReportState.OPEN, date: Date.now() });
      await message.ack();
      return;
    }

    const issue = this.reportRepository.create({
      payload: {
        sourceType: packet.source,
        reportType: packet.reportType,
        message: packet.message,
        externalReportId: packet.reportId,
        referenceResourceId: packet.referenceResourceId,
        referenceResourceType: packet.referenceResourceType
      },
      state: ReportState.OPEN,
      date: Date.now()
    });

    await this.reportRepository.save(issue);

    await message.ack();
  }

}
