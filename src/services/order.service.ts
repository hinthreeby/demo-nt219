import { Types } from 'mongoose';
import { OrderModel, OrderDocument, IOrderItem, OrderStatus } from '../models/order.model';

export interface CreateOrderInput {
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  currency: string;
  paymentIntentId?: string;
}

export const createOrder = async (input: CreateOrderInput): Promise<OrderDocument> => {
  const order = new OrderModel({
    user: new Types.ObjectId(input.userId),
    items: input.items,
    totalAmount: input.totalAmount,
    currency: input.currency,
    paymentIntentId: input.paymentIntentId,
    status: 'pending'
  });

  return order.save();
};

export const updateOrderStatusByPaymentIntent = async (
  paymentIntentId: string,
  status: OrderStatus
): Promise<OrderDocument | null> => {
  return OrderModel.findOneAndUpdate(
    { paymentIntentId },
    { status },
    { new: true }
  );
};

export const findOrderByPaymentIntent = async (paymentIntentId: string): Promise<OrderDocument | null> => {
  return OrderModel.findOne({ paymentIntentId });
};

export const listOrdersForUser = async (userId: string): Promise<OrderDocument[]> => {
  return OrderModel.find({ user: userId }).sort({ createdAt: -1 });
};

export const listAllOrders = async (): Promise<OrderDocument[]> => {
  return OrderModel.find().sort({ createdAt: -1 });
};
