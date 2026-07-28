import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';
import { rateLimiter } from '../middlewares/rate-limiter.middleware';

const router = Router();
const controller = new AuthController();

router.post('/login', rateLimiter, controller.login);
router.post('/register', authenticate, adminOnly, controller.register); // Only Admin can register other accounts
router.get('/me', authenticate, controller.me);

export default router;
