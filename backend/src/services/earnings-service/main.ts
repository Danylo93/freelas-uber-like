import { logger } from '../../shared/shared-logger/src/index';
import { earningsApp } from './presentation';

const PORT = process.env.PORT || 3008;

earningsApp.listen(PORT, () => {
  logger.info(`earnings-service listening on port ${PORT}`);
});
