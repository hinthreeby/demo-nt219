import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { AccountPage } from './pages/AccountPage';
import { OrdersPage } from './pages/OrdersPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CartPage } from './pages/CartPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<ProductsPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/auth/callback" element={<OAuthCallbackPage />} />
    <Route path="/products/:productId" element={<ProductDetailsPage />} />
    <Route path="/cart" element={<CartPage />} />

    <Route
      path="/account"
      element={
        <ProtectedRoute>
          <AccountPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/orders"
      element={
        <ProtectedRoute>
          <OrdersPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/checkout"
      element={
        <ProtectedRoute>
          <CheckoutPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/admin/products"
      element={
        <AdminRoute>
          <AdminProductsPage />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/orders"
      element={
        <AdminRoute>
          <AdminOrdersPage />
        </AdminRoute>
      }
    />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
