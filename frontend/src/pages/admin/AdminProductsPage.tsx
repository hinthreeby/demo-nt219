import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  FormHelperText,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Textarea,
  useDisclosure,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, SearchIcon } from '@chakra-ui/icons';
import { FaBoxes } from 'react-icons/fa';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApiErrorToast } from '../../hooks/useApiErrorToast';
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useProductsQuery,
  useUpdateProductMutation,
  useUploadPrototypeImageMutation
} from '../../features/products/queries';
import type { ProductDto } from '../../types/api';
import { formatCurrency } from '../../utils/currency';
import { resolveAssetUrl } from '../../utils/asset';

const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  currency: z.string().length(3),
  stock: z.number().int().min(0),
  isActive: z.boolean()
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  initialValues?: ProductDto;
  isSubmitting: boolean;
  isUploading: boolean;
  uploadProgress: number | null;
  prototypePreviewUrl?: string | null;
  existingPrototypeUrl?: string;
  onSelectPrototype: (file: File | null) => void;
}

const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  isSubmitting,
  isUploading,
  uploadProgress,
  prototypePreviewUrl,
  existingPrototypeUrl,
  onSelectPrototype
}: ProductFormModalProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
  register,
  control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      stock: 0,
      isActive: true
    }
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        name: initialValues.name,
        description: initialValues.description,
        price: initialValues.price,
        currency: initialValues.currency.toUpperCase(),
        stock: initialValues.stock,
        isActive: initialValues.isActive
      });
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        currency: 'USD',
        stock: 0,
        isActive: true
      });
    }
  }, [initialValues, reset, isOpen]);

  const submitHandler = async (values: ProductFormValues) => {
    await onSubmit({
      ...values,
      currency: values.currency.toUpperCase()
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onSelectPrototype(file);
  };

  const handleClearPrototype = () => {
    onSelectPrototype(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const previewToDisplay = prototypePreviewUrl ?? existingPrototypeUrl ?? null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(submitHandler)}>
        <ModalHeader>{initialValues ? 'Update product' : 'Create product'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl isInvalid={Boolean(errors.name)}>
              <FormLabel>Name</FormLabel>
              <Input placeholder="Product name" {...register('name')} />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={Boolean(errors.description)}>
              <FormLabel>Description</FormLabel>
              <Textarea placeholder="Detailed product description" {...register('description')} />
              <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
            </FormControl>

            <HStack spacing={4}>
              <FormControl isInvalid={Boolean(errors.price)}>
                <FormLabel>Price</FormLabel>
                <Input type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
                <FormErrorMessage>{errors.price?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={Boolean(errors.currency)}>
                <FormLabel>Currency</FormLabel>
                <Input maxLength={3} textTransform="uppercase" {...register('currency')} />
                <FormErrorMessage>{errors.currency?.message}</FormErrorMessage>
              </FormControl>
            </HStack>

            <FormControl isInvalid={Boolean(errors.stock)}>
              <FormLabel>Stock</FormLabel>
              <Input type="number" min={0} {...register('stock', { valueAsNumber: true })} />
              <FormErrorMessage>{errors.stock?.message}</FormErrorMessage>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Checkbox isChecked={field.value} onChange={event => field.onChange(event.target.checked)}>
                    Active
                  </Checkbox>
                )}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Production prototype image</FormLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                isDisabled={isUploading}
              />
              <FormHelperText>PNG, JPG, WEBP or GIF files up to 5 MB.</FormHelperText>

              {previewToDisplay && (
                <Stack spacing={2} mt={4}>
                  <Box borderRadius="md" overflow="hidden" maxH="220px">
                    <Image src={previewToDisplay} alt="Prototype preview" objectFit="cover" width="100%" />
                  </Box>
                  <Text fontSize="sm" color="gray.500">
                    {prototypePreviewUrl ? 'New image ready to upload' : 'Current prototype image'}
                  </Text>
                  {prototypePreviewUrl && (
                    <Button
                      size="sm"
                      variant="link"
                      colorScheme="red"
                      onClick={handleClearPrototype}
                      isDisabled={isUploading}
                    >
                      Remove selected image
                    </Button>
                  )}
                </Stack>
              )}

              {typeof uploadProgress === 'number' && (
                <Progress value={uploadProgress} size="sm" colorScheme="brand" mt={3} />
              )}

            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button type="submit" colorScheme="brand" isLoading={isSubmitting}>
            {initialValues ? 'Save changes' : 'Create product'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export const AdminProductsPage = () => {
  const { data: products, isLoading } = useProductsQuery();
  const createProductMutation = useCreateProductMutation();
  const updateProductMutation = useUpdateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();
  const uploadPrototypeMutation = useUploadPrototypeImageMutation();
  const toast = useToast();
  const toastError = useApiErrorToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingProduct, setEditingProduct] = useState<ProductDto | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [prototypeFile, setPrototypeFile] = useState<File | null>(null);
  const [prototypePreviewUrl, setPrototypePreviewUrl] = useState<string | null>(null);
  const [existingPrototypeUrl, setExistingPrototypeUrl] = useState<string | undefined>();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (prototypePreviewUrl && prototypePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(prototypePreviewUrl);
      }
    };
  }, [prototypePreviewUrl]);

  const resetPrototypeState = () => {
    setPrototypeFile(null);
    setUploadProgress(null);
    setExistingPrototypeUrl(undefined);
    setPrototypePreviewUrl(prev => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  };

  const handlePrototypeSelect = (file: File | null) => {
    setPrototypeFile(file);
    setUploadProgress(null);
    setPrototypePreviewUrl(prev => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      if (!file) {
        return null;
      }
      return URL.createObjectURL(file);
    });
  };

  const handleCloseModal = () => {
    resetPrototypeState();
    setEditingProduct(undefined);
    onClose();
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm.trim()) return products;
    const query = searchTerm.toLowerCase();
    return products.filter(product => product.name.toLowerCase().includes(query));
  }, [products, searchTerm]);

  const handleCreate = () => {
    resetPrototypeState();
    setEditingProduct(undefined);
    onOpen();
  };

  const handleEdit = (product: ProductDto) => {
    resetPrototypeState();
    setEditingProduct(product);
    setExistingPrototypeUrl(resolveAssetUrl(product.prototypeImageUrl ?? undefined));
    onOpen();
  };

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      let persistedProduct: ProductDto;

      if (editingProduct) {
        persistedProduct = await updateProductMutation.mutateAsync({ productId: editingProduct._id, payload: values });
      } else {
        persistedProduct = await createProductMutation.mutateAsync(values);
      }

      setEditingProduct(persistedProduct);
      setExistingPrototypeUrl(resolveAssetUrl(persistedProduct.prototypeImageUrl ?? undefined));

      if (prototypeFile) {
        setUploadProgress(0);
        const updatedProduct = await uploadPrototypeMutation.mutateAsync({
          productId: persistedProduct._id,
          file: prototypeFile,
          onUploadProgress: progress => setUploadProgress(progress)
        });
        persistedProduct = updatedProduct;
        setEditingProduct(updatedProduct);
        setExistingPrototypeUrl(resolveAssetUrl(updatedProduct.prototypeImageUrl ?? undefined));
      }

      toast({
        title: editingProduct ? 'Product updated' : 'Product created',
        status: 'success',
        duration: 3000,
        position: 'top'
      });

      handleCloseModal();
    } catch (error) {
      toastError(error, 'Failed to save product');
    }
  };

  const handleDelete = async (product: ProductDto) => {
    const confirmed = window.confirm(`Delete ${product.name}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteProductMutation.mutateAsync(product._id);
      toast({ title: 'Product deleted', status: 'success', duration: 3000, position: 'top' });
    } catch (error) {
      toastError(error, 'Failed to delete product');
    }
  };

  const isSubmitting =
    createProductMutation.isPending || updateProductMutation.isPending || uploadPrototypeMutation.isPending;

  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');

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
          <HStack justify="space-between" align="center" wrap="wrap">
            <HStack spacing={4}>
              <Icon as={FaBoxes} boxSize={8} color="brand.500" />
              <Box>
                <Heading size="xl" bgGradient="linear(to-r, brand.500, brand.600)" bgClip="text">
                  Manage Products
                </Heading>
                <Text color={textSecondary} mt={1}>
                  {filteredProducts.length} products found
                </Text>
              </Box>
            </HStack>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="brand"
              size="lg"
              onClick={handleCreate}
            >
              New Product
            </Button>
          </HStack>
        </Box>

        {/* Search and Table */}
        <Card variant="elevated" bg={cardBg}>
          <CardHeader>
            <InputGroup maxW="md" size="lg">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
              />
            </InputGroup>
          </CardHeader>
        <CardBody>
          {isLoading ? (
            <Stack spacing={3}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} height="48px" />
              ))}
            </Stack>
          ) : filteredProducts.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text color="gray.500">No products match your search.</Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th isNumeric>Price</Th>
                    <Th isNumeric>Stock</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredProducts.map(product => (
                    <Tr key={product._id}>
                      <Td maxW="260px">
                        <Stack spacing={1}>
                          <Text fontWeight="medium">{product.name}</Text>
                          <Text color="gray.500" noOfLines={2}>
                            {product.description}
                          </Text>
                        </Stack>
                      </Td>
                      <Td isNumeric>{formatCurrency(product.price, product.currency)}</Td>
                      <Td isNumeric>{product.stock}</Td>
                      <Td>
                        <Badge
                          colorScheme={product.isActive ? 'green' : 'yellow'}
                          fontSize="sm"
                          px={3}
                          py={1}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>{new Date(product.updatedAt).toLocaleDateString()}</Td>
                      <Td textAlign="right">
                        <HStack justify="flex-end" spacing={2}>
                          <IconButton
                            aria-label="Edit product"
                            icon={<EditIcon />}
                            size="sm"
                            colorScheme="brand"
                            variant="ghost"
                            onClick={() => handleEdit(product)}
                          />
                          <IconButton
                            aria-label="Delete product"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDelete(product)}
                            isLoading={deleteProductMutation.isPending}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      <ProductFormModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialValues={editingProduct}
        isSubmitting={isSubmitting}
        isUploading={uploadPrototypeMutation.isPending}
        uploadProgress={uploadProgress}
        prototypePreviewUrl={prototypePreviewUrl}
        existingPrototypeUrl={existingPrototypeUrl}
        onSelectPrototype={handlePrototypeSelect}
      />
      </Stack>
    </Container>
  );
};
