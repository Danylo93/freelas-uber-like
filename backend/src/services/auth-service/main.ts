import { logger } from '../../shared/shared-logger/src/index';
import { authApp } from './presentation';

const PORT = process.env.PORT || 3001;

authApp.listen(PORT, () => {
  logger.info(`auth-service listening on port ${PORT}`);
});
