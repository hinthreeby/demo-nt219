import { useState } from 'react';
import { Badge, Button, Card, CardBody, Heading, Stack, Text, useToast } from '@chakra-ui/react';
import { useAuth } from '../features/auth/AuthProvider';
import { useApiErrorToast } from '../hooks/useApiErrorToast';

export const AccountPage = () => {
  const { user, refreshMe } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();
  const toastError = useApiErrorToast();

  if (!user) {
    return (
      <Stack spacing={4}>
        <Heading size="md">No account information available</Heading>
        <Text>Please sign in again to view your profile.</Text>
      </Stack>
    );
  }

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshMe();
      toast({ title: 'Profile updated', status: 'success', duration: 3000, position: 'top' });
    } catch (error) {
      toastError(error, 'Failed to refresh profile');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card maxW="xl" shadow="md" borderRadius="lg">
      <CardBody>
        <Stack spacing={4}>
          <Heading size="md">Profile</Heading>
          <Stack spacing={1}>
            <Text fontWeight="medium">Email</Text>
            <Text>{user.email}</Text>
          </Stack>
          <Stack spacing={1}>
            <Text fontWeight="medium">Role</Text>
            <Badge colorScheme={user.role === 'admin' ? 'purple' : 'blue'} width="fit-content">
              {user.role}
            </Badge>
          </Stack>
          <Button onClick={handleRefresh} isLoading={isRefreshing} width="fit-content" colorScheme="brand">
            Refresh profile
          </Button>
        </Stack>
      </CardBody>
    </Card>
  );
};
