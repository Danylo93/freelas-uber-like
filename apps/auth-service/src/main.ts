import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { CONFIG } from '@freelas/shared-config';
import { logger } from '@freelas/shared-logger';
import { AppError } from '@freelas/shared-errors';
import authRoutes from './auth.routes';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  // Zod Error
  if ('issues' in err) {
     return res.status(400).json({ message: 'Validation Error', details: (err as any).issues });
  }
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`auth-service listening on port ${PORT}`);
});
