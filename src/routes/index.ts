import { Router } from 'express';
import authRoutes from './auth.routes';
import patientRoutes from './patient.routes';
import doctorRoutes from './doctor.routes';
import appointmentRoutes from './appointment.routes';
import conversationRoutes from './conversation.routes';
import dashboardRoutes from './dashboard.routes';
import settingsRoutes from './settings.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

// Mount modules
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/conversations', conversationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);
router.use('/webhook', webhookRoutes);

export default router;
