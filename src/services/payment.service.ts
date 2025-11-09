import Stripe from 'stripe';
import { stripeConfig } from '../config/env';
import { ProductModel, ProductDocument } from '../models/product.model';
import { createOrder, updateOrderStatusByPaymentIntent } from './order.service';
import { clearCartIfExists } from './cart.service';
import logger from '../utils/logger';

const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2024-04-10'
});

interface PaymentItemInput {
  productId: string;
  quantity: number;
}

export const createPaymentIntent = async (userId: string, items: PaymentItemInput[]) => {
  const productIds = items.map(item => item.productId);
  const products = await ProductModel.find({ _id: { $in: productIds }, isActive: true });

  if (products.length !== productIds.length) {
    throw new Error('One or more products are unavailable');
  }

  const orderItems = products.map((product: ProductDocument) => {
    const matchedItem = items.find(item => item.productId === product.id);
    if (!matchedItem) {
      throw new Error('Product selection mismatch');
    }
    const quantity = matchedItem.quantity;
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      quantity
    };
  });

  const totalAmount = orderItems.reduce(
    (sum: number, item: (typeof orderItems)[number]) => sum + item.price * item.quantity,
    0
  );

  if (totalAmount <= 0) {
    throw new Error('Total amount must be greater than zero');
  }

  const order = await createOrder({
    userId,
    items: orderItems,
    totalAmount,
    currency: orderItems[0]?.currency ?? 'USD'
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100),
    currency: order.currency,
    metadata: {
      orderId: order.id,
      userId
    },
    automatic_payment_methods: {
      enabled: true
    }
  });

  order.paymentIntentId = paymentIntent.id;
  order.status = 'processing';
  await order.save();

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    orderId: order.id
  };
};

export const constructStripeEvent = (payload: Buffer, signature: string): Stripe.Event => {
  return stripe.webhooks.constructEvent(payload, signature, stripeConfig.webhookSecret);
};

export const handleStripeEvent = async (event: Stripe.Event): Promise<void> => {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.metadata?.orderId) {
        await updateOrderStatusByPaymentIntent(paymentIntent.id, 'paid');
        logger.info({ paymentIntentId: paymentIntent.id }, 'Order marked as paid');
        if (paymentIntent.metadata.userId) {
          await clearCartIfExists(paymentIntent.metadata.userId);
        }
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.metadata?.orderId) {
        await updateOrderStatusByPaymentIntent(paymentIntent.id, 'cancelled');
        logger.warn({ paymentIntentId: paymentIntent.id }, 'Payment failed');
      }
      break;
    }
    default:
      logger.debug({ eventType: event.type }, 'Unhandled Stripe event type');
  }
};
