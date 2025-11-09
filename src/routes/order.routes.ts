import { Router } from 'express';
import { listMyOrdersHandler, listAllOrdersHandler } from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/me', authenticate, listMyOrdersHandler);
router.get('/', authenticate, authorize('admin'), listAllOrdersHandler);

export default router;
