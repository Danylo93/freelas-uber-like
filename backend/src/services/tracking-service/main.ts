import { logger } from '../../shared/shared-logger/src/index';
import { trackingApp } from './presentation';

const PORT = process.env.PORT || 3006;

trackingApp.listen(PORT, () => {
  logger.info(`tracking-service listening on port ${PORT}`);
});
