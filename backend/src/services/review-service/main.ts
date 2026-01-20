import { logger } from '../../shared/shared-logger/src/index';
import { reviewApp } from './presentation';

const PORT = process.env.PORT || 3007;

reviewApp.listen(PORT, () => {
  logger.info(`review-service listening on port ${PORT}`);
});
