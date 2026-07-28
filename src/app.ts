import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import routes from './routes';
import { requestLogger } from './middlewares/logging.middleware';
import { errorHandler } from './middlewares/error.middleware';

// Load environment variables
dotenv.config();

const app = express();

// Standard Security & Performance Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // Customize for production admin UI domain
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use(requestLogger);

// API Base Route
app.use('/api', routes);

// Base Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
});

// Global Error Handler
app.use(errorHandler);

export default app;
