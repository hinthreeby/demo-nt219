import { FilterQuery } from 'mongoose';
import { ProductModel, ProductDocument, IProduct } from '../models/product.model';

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  isActive?: boolean;
  prototypeImageUrl?: string;
}

export const createProduct = async (input: CreateProductInput): Promise<ProductDocument> => {
  const product = new ProductModel({
    ...input,
    isActive: input.isActive ?? true,
    prototypeImageUrl: input.prototypeImageUrl
  });
  return product.save();
};

export const listProducts = async (filter: FilterQuery<IProduct> = {}): Promise<IProduct[]> => {
  return ProductModel.find(filter).lean();
};

export const getProductById = async (productId: string): Promise<ProductDocument | null> => {
  return ProductModel.findById(productId);
};

export const updateProduct = async (productId: string, updates: Partial<CreateProductInput>): Promise<ProductDocument | null> => {
  return ProductModel.findByIdAndUpdate(productId, updates, { new: true, runValidators: true });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await ProductModel.findByIdAndDelete(productId);
};
