import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, staffOnly, adminOnly } from '../middlewares/auth.middleware';

const router = Router();
const controller = new DashboardController();

router.use(authenticate);

router.get('/stats', staffOnly, controller.getStats);
router.get('/reports', staffOnly, controller.getReports);
router.get('/audit-logs', adminOnly, controller.getAuditLogs); // Restricted to Admin role

export default router;
