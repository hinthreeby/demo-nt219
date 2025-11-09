import {
  Badge,
  Box,
  Card,
  CardBody,
  CardHeader,
  Container,
  Heading,
  HStack,
  Icon,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue
} from '@chakra-ui/react';
import { FaClipboardList } from 'react-icons/fa';
import dayjs from 'dayjs';
import { useAdminOrdersQuery } from '../../features/orders/queries';
import { formatCurrency } from '../../utils/currency';

export const AdminOrdersPage = () => {
  const { data: orders, isLoading, isError } = useAdminOrdersQuery();

  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');

  if (isLoading) {
    return (
      <Stack align="center" py={16} spacing={4}>
        <Spinner size="lg" />
        <Text>Loading recent orders...</Text>
      </Stack>
    );
  }

  if (isError) {
    return (
      <Box textAlign="center" py={16}>
        <Heading size="md" mb={2}>
          Unable to load orders
        </Heading>
        <Text color="gray.500">Please try again shortly.</Text>
      </Box>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Box textAlign="center" py={16}>
        <Heading size="md" mb={2}>
          No orders yet
        </Heading>
        <Text color="gray.500">Orders will appear here once customers start checking out.</Text>
      </Box>
    );
  }

  return (
    <Container maxW="7xl">
      <Stack spacing={8} py={8}>
        {/* Header */}
        <Box
          bg={headerBg}
          px={8}
          py={6}
          borderRadius="2xl"
          border="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <HStack spacing={4}>
            <Icon as={FaClipboardList} boxSize={8} color="brand.500" />
            <Box>
              <Heading size="xl" bgGradient="linear(to-r, brand.500, brand.600)" bgClip="text">
                All Orders
              </Heading>
              <Text color={textSecondary} mt={1}>
                {orders?.length || 0} orders found
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* Orders Table */}
        <Card variant="elevated" bg={cardBg}>
          <CardHeader>
            <Text color={textSecondary} fontSize="lg">
              Track customer orders and payment statuses in real time.
            </Text>
          </CardHeader>
          <CardBody>
            <Box overflowX="auto">
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
                    <Th>Order ID</Th>
                    <Th>User</Th>
                    <Th>Status</Th>
                    <Th isNumeric>Total</Th>
                    <Th>Created</Th>
                    <Th>Payment Intent</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orders?.map(order => (
                    <Tr key={order._id}>
                      <Td fontFamily="mono" fontSize="sm">{order._id}</Td>
                      <Td>{order.user}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            order.status === 'paid' ? 'green' : order.status === 'cancelled' ? 'red' : 'yellow'
                          }
                          fontSize="sm"
                          px={3}
                          py={1}
                        >
                          {order.status}
                        </Badge>
                      </Td>
                      <Td isNumeric fontWeight="semibold">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </Td>
                      <Td>{dayjs(order.createdAt).format('MMM D, YYYY h:mm A')}</Td>
                      <Td fontFamily="mono" fontSize="sm">{order.paymentIntentId ?? 'N/A'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </Stack>
    </Container>
  );
};
