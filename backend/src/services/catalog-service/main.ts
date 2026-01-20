import { logger } from '../../shared/shared-logger/src/index';
import { catalogApp } from './presentation';

const PORT = process.env.PORT || 3003;

catalogApp.listen(PORT, () => {
  logger.info(`catalog-service listening on port ${PORT}`);
});
