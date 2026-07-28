import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticate, staffOnly } from '../middlewares/auth.middleware';

const router = Router();
const controller = new AppointmentController();

router.use(authenticate);
router.use(staffOnly);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

router.patch('/:id/assign', controller.assignDoctor);
router.patch('/:id/status', controller.updateStatus);

export default router;
