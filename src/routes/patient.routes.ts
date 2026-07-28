import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authenticate, staffOnly } from '../middlewares/auth.middleware';

const router = Router();
const controller = new PatientController();

router.use(authenticate); // Require authentication for all patient routes
router.use(staffOnly);    // Admin or Receptionist only

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
