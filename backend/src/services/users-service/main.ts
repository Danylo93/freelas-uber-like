import { logger } from '../../shared/shared-logger/src/index';
import { usersApp } from './presentation';

const PORT = process.env.PORT || 3002;

usersApp.listen(PORT, () => {
  logger.info(`users-service listening on port ${PORT}`);
});
