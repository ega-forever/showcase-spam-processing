import * as bunyan from 'bunyan';
import * as express from 'express';
import { Container } from 'typedi';
import { DI } from '../../constants/DI';
import list from './report/list';
import resolve from './report/resolve';

export default (app: express.Express) => {

  const logger: bunyan = Container.get(DI.logger);

  const wrapper = async (method, req, res) => {
    try {
      return await method(req, res);
    } catch (e) {
      logger.error(e);
    }
  };
  const router = express.Router();

  router.get('/', wrapper.bind(router, list));
  router.put('/:reportId', wrapper.bind(router, resolve));

  app.use('/reports', router);
};
