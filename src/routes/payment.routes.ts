import { Router } from 'express';
import { createPaymentIntentHandler, stripeWebhookHandler } from '../controllers/payment.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { createPaymentIntentSchema } from '../validators/payment.validator';

const router = Router();

router.post('/create-intent', authenticate, validateRequest(createPaymentIntentSchema), createPaymentIntentHandler);

export default router;
