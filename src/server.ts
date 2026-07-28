import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import logger from './config/logger';
import { setSocketIoInstance } from './services/chatbot.service';
import { setAppointmentSocketIoInstance } from './services/appointment.service';
import { setConversationSocketIoInstance } from './services/conversation.service';
import prisma from './config/db';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Bind Socket.IO instance to services to allow real-time updates
setSocketIoInstance(io);
setAppointmentSocketIoInstance(io);
setConversationSocketIoInstance(io);

// Socket.IO event mapping
io.on('connection', (socket) => {
  logger.info(`Socket client connected: ${socket.id}`);

  // Handle client joining specific rooms (e.g. patient-specific support rooms)
  socket.on('join_patient_chat', (patientId: string) => {
    socket.join(patientId);
    logger.debug(`Socket ${socket.id} joined room: ${patientId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket client disconnected: ${socket.id}`);
  });
});

// Graceful Shutdown Handler
const shutdown = async () => {
  logger.info('Gracefully shutting down server...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Prisma database client disconnected.');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error('Force shutting down after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Listen on port
server.listen(PORT, () => {
  logger.info(`===================================================`);
  logger.info(`🚀 Hospital CRM server running on port: ${PORT}      `);
  logger.info(`🚀 Environment: ${process.env.NODE_ENV}            `);
  logger.info(`===================================================`);
});
