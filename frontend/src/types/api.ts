export type ApiStatus = 'success' | 'error';

export interface ApiSuccess<T> {
  status: 'success';
  data: T;
  message?: string;
}

export interface ApiError {
  status: 'error';
  message: string;
  details?: unknown;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
  };
}

export interface ProductDto {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
  prototypeImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemDto {
  productId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

export interface OrderDto {
  _id: string;
  user: string;
  items: OrderItemDto[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'shipped' | 'cancelled';
  paymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  orderId: string;
}
