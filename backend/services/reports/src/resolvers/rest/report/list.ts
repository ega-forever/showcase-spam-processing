import { Request, Response } from 'express';
import * as TypeORM from 'typeorm';
import ReportState from '../../../constants/ReportState';
import { Report } from '../../../models/orm/Report';

export default async (req: Request, res: Response) => {

  let limit = parseInt(req.query.limit as string, 10);
  let offset = parseInt(req.query.offset as string, 10);
  let state = parseInt(req.query.state as string, 10);

  if (isNaN(limit) || limit > 10) {
    limit = 10;
  }

  if (isNaN(offset)) {
    offset = 0;
  }

  if (isNaN(state) || !Object.values(ReportState).includes(state)) {
    state = ReportState.OPEN;
  }

  const reportRepository = TypeORM.getConnection().getRepository(Report);
  const reports = await reportRepository.find({
    where: {
      state
    },
    skip: offset,
    take: limit,
    order: {
      date: 'ASC'
    },
    relations: ['payload']
  });

  const count = await reportRepository.count({
    where: {
      state
    }
  });

  return res.send({
    count,
    items: reports
  });
};
