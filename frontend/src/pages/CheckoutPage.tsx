import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createPaymentIntent } from '../features/payments/api';
import { useApiErrorToast } from '../hooks/useApiErrorToast';
import { formatCurrency } from '../utils/currency';
import { useCart } from '../features/cart/CartProvider';

interface CheckoutItem {
  productId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

interface CheckoutLocationState {
  items?: CheckoutItem[];
}

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface PaymentFormProps {
  items: CheckoutItem[];
  orderId: string;
  onSuccess: () => Promise<void> | void;
}

const PaymentForm = ({ items, orderId, onSuccess }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  const toastError = useApiErrorToast();
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  const totalDisplay = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const currency = items[0]?.currency ?? 'USD';
    return formatCurrency(total, currency);
  }, [items]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentMessage(null);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders`
        },
        redirect: 'if_required'
      });

      if (error) {
        const message = error.message ?? 'Payment failed';
        toastError(error, message);
        setPaymentMessage(message);
      } else {
        toast({ title: 'Payment succeeded', status: 'success', duration: 4000, position: 'top' });
        setPaymentMessage('Payment confirmed. Your order is being processed.');
        await onSuccess();
      }
    } catch (error) {
      toastError(error, 'Payment failed');
      setPaymentMessage('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Stack spacing={5} as="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <Heading size="md">Order summary</Heading>
        <Text color={textSecondary}>Order ID: {orderId}</Text>
        <Stack spacing={1}>
          {items.map(item => (
            <Text key={item.productId} color={textSecondary}>
              {item.name} x {item.quantity}
            </Text>
          ))}
        </Stack>
        <Text fontWeight="bold">Total due: {totalDisplay}</Text>
      </Stack>

      <Divider />

      <PaymentElement />

      <Button colorScheme="brand" type="submit" size="lg" isLoading={isProcessing} isDisabled={!stripe}>
        Confirm payment
      </Button>

      {paymentMessage && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertDescription>{paymentMessage}</AlertDescription>
        </Alert>
      )}
    </Stack>
  );
};

export const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const toastError = useApiErrorToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { clearCart } = useCart();

  const items = (location.state as CheckoutLocationState | undefined)?.items ?? [];

  useEffect(() => {
    const initializeCheckout = async () => {
      if (!items.length) {
        return;
      }
      setIsInitializing(true);
      try {
        const result = await createPaymentIntent(items.map(item => ({ productId: item.productId, quantity: item.quantity })));
        setClientSecret(result.clientSecret);
        setOrderId(result.orderId);
      } catch (error) {
        toastError(error, 'Failed to initialize checkout');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeCheckout();
  }, [items, toastError]);

  const handleSuccess = async () => {
    try {
      await clearCart();
      toast({ title: 'Order placed successfully', status: 'success', duration: 4000, position: 'top' });
    } catch (error) {
      toastError(error, 'Order placed but failed to refresh cart');
    } finally {
      navigate('/orders');
    }
  };

  if (!items.length) {
    return (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        <AlertDescription>
          Your cart is empty. Please select a product before proceeding to checkout.
        </AlertDescription>
      </Alert>
    );
  }

  if (!stripePromise) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertDescription>Missing Stripe publishable key. Please contact the administrator.</AlertDescription>
      </Alert>
    );
  }

  if (isInitializing || !clientSecret || !orderId) {
    return (
      <Stack align="center" py={16} spacing={4}>
        <Spinner size="lg" />
        <Text>Preparing your secure checkout...</Text>
      </Stack>
    );
  }

  return (
    <Card maxW="2xl" mx="auto" shadow="md" borderRadius="lg">
      <CardHeader>
        <Heading size="lg">Checkout</Heading>
      </CardHeader>
      <CardBody>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm items={items} orderId={orderId} onSuccess={handleSuccess} />
        </Elements>
      </CardBody>
    </Card>
  );
};
