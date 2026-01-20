import { logger } from '../../shared/shared-logger/src/index';
import { requestApp } from './presentation';

const PORT = process.env.PORT || 3004;

requestApp.listen(PORT, () => {
  logger.info(`request-service listening on port ${PORT}`);
});
