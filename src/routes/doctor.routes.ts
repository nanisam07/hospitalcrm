import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';
import { authenticate, adminOnly, staffOnly } from '../middlewares/auth.middleware';

const router = Router();
const controller = new DoctorController();

router.use(authenticate);

router.get('/', staffOnly, controller.list);
router.get('/:id', staffOnly, controller.getById);

// Write operations restricted to Admin
router.post('/', adminOnly, controller.create);
router.put('/:id', adminOnly, controller.update);
router.delete('/:id', adminOnly, controller.delete);

export default router;
