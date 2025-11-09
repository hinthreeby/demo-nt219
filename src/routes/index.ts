import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import cartRoutes from './cart.routes';
import oauthRoutes from './oauth.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/auth', oauthRoutes); // OAuth routes under /auth prefix
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/cart', cartRoutes);

export default router;
