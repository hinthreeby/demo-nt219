import { Router } from 'express';
import { registerHandler, loginHandler, refreshHandler, logoutHandler, meHandler } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', authRateLimiter, validateRequest(registerSchema), registerHandler);
router.post('/login', authRateLimiter, validateRequest(loginSchema), loginHandler);
router.post('/refresh', validateRequest(refreshSchema), refreshHandler);
router.post('/logout', authenticate, logoutHandler);
router.get('/me', authenticate, meHandler);

export default router;
