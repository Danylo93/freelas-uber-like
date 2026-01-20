import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from '../../../shared/shared-logger/src/index';
import { AppError } from '../../../shared/shared-errors/src/index';
import authRoutes from '../auth.routes';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/healthz', (req: Request, res: Response) => {
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

// Export the Express app for integration into unified gateway
export const authApp = app;
