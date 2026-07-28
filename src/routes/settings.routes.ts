import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate, staffOnly, adminOnly } from '../middlewares/auth.middleware';

const router = Router();
const controller = new SettingsController();

router.use(authenticate);

router.get('/', staffOnly, controller.get);
router.put('/', adminOnly, controller.update); // Only admin can update settings

export default router;
