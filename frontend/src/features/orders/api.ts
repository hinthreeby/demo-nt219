import { apiClient } from '../../api/client';
import type { ApiSuccess, OrderDto } from '../../types/api';

export const fetchMyOrders = async (): Promise<OrderDto[]> => {
  const response = await apiClient.get<ApiSuccess<{ orders: OrderDto[] }>>('/orders/me');
  return response.data.data.orders;
};

export const fetchAllOrders = async (): Promise<OrderDto[]> => {
  const response = await apiClient.get<ApiSuccess<{ orders: OrderDto[] }>>('/orders');
  return response.data.data.orders;
};
