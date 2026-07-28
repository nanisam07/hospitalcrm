import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();
const controller = new WebhookController();

// Meta verification endpoint (GET) and incoming message webhook (POST)
router.get('/whatsapp', controller.verify);
router.post('/whatsapp', controller.receive);

export default router;
