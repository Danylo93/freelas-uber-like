import { logger } from '../../shared/shared-logger/src/index';
import { matchingApp } from './presentation';

const PORT = process.env.PORT || 3005;

matchingApp.listen(PORT, () => {
  logger.info(`matching-service listening on port ${PORT}`);
});
