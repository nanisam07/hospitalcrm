import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authenticate, staffOnly } from '../middlewares/auth.middleware';

const router = Router();
const controller = new ConversationController();

router.use(authenticate);
router.use(staffOnly);

router.get('/inbox', controller.getInbox);
router.get('/history/:patientId', controller.getHistory);
router.post('/send', controller.sendMessage);

export default router;
