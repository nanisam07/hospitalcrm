import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log request arrival
  logger.http(`--> Incoming ${req.method} ${req.originalUrl} | IP: ${req.ip}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(
      `<-- Outgoing ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${duration}ms`
    );
  });

  next();
};
export default requestLogger;
