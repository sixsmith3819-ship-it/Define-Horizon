// app/(dashboard)/inventory/[id]/page.tsx - Product detail and stock management page

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductForm } from '@/components/inventory/product-form';
import { StockMovementsTable } from '@/components/inventory/stock-movements-table';
import { StockAdjustmentForm } from '@/components/inventory/stock-adjustment-form';
import {
  formatCurrency,
  formatPercentage,
  getStatusLabel,
  getStatusBadgeColor,
} from '@/lib/utils/stock-calculations';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorder_level: number;
  buying_price: number;
  selling_price: number;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  profit_margin?: number;
  stock_value?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  reference?: string;
  created_at: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isLoadingMovements, setIsLoadingMovements] = useState(true);
  const [error, setError] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'adjust'>('overview');
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in');

  // Fetch product details
  useEffect(() => {
    fetchProduct();
    fetchMovements();
  }, [productId]);

  async function fetchProduct() {
    try {
      setIsLoadingProduct(true);
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingProduct(false);
    }
  }

  async function fetchMovements() {
    try {
      setIsLoadingMovements(true);
      const response = await fetch(`/api/products/${productId}/stock?limit=50`);

      if (!response.ok) {
        throw new Error('Failed to fetch movements');
      }

      const data = await response.json();
      setMovements(data.data || []);
    } catch (err) {
      console.error('Error fetching movements:', err);
    } finally {
      setIsLoadingMovements(false);
    }
  }

  async function handleProductUpdate(data: any) {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      const result = await response.json();
      setProduct(result);
      setIsEditMode(false);
      alert('Product updated successfully!');
    } catch (error) {
      throw error;
    }
  }

  async function handleStockAdjustment(data: any) {
    try {
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to adjust stock');
      }

      // Refresh product and movements
      await fetchProduct();
      await fetchMovements();
      setActiveTab('movements');
      setAdjustmentType('in'); // Reset adjustment type
    } catch (error) {
      throw error;
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      alert('Product deleted successfully!');
      router.push('/dashboard/inventory');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete product');
    }
  }

  if (isLoadingProduct) {
    return (
      <div className='space-y-6'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        <p className='text-gray-600'>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='space-y-6'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-red-700'>
          Product not found
        </div>
        <Link href='/dashboard/inventory' className='text-blue-600 hover:underline'>
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-start'>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold text-gray-900'>{product.name}</h1>
            {product.stock_status && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadgeColor(
                  product.stock_status
                )}`}
              >
                {getStatusLabel(product.stock_status)}
              </span>
            )}
          </div>
          <p className='text-gray-600 mt-1'>SKU: <strong>{product.sku}</strong></p>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
          >
            {isEditMode ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition'
          >
            Delete
          </button>
        </div>
      </div>

      {/* Low Stock Warning */}
      {product.stock_status === 'low_stock' && (
        <div className='p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg'>
          <h3 className='text-sm font-semibold text-yellow-800'>⚠️ Low Stock Warning</h3>
          <p className='text-sm text-yellow-700 mt-1'>
            Current stock ({product.quantity}) is below reorder level ({product.reorder_level}). Consider placing an order.
          </p>
        </div>
      )}

      {/* Out of Stock Alert */}
      {product.stock_status === 'out_of_stock' && (
        <div className='p-4 bg-red-50 border-l-4 border-red-400 rounded-lg'>
          <h3 className='text-sm font-semibold text-red-800'>🔴 Out of Stock</h3>
          <p className='text-sm text-red-700 mt-1'>
            This product is currently out of stock. Please add inventory to continue sales.
          </p>
        </div>
      )}

      {/* Product Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white rounded-lg shadow p-4'>
          <p className='text-gray-600 text-sm font-medium'>Current Stock</p>
          <p className='mt-2 text-2xl font-bold text-gray-900'>{product.quantity}</p>
          <p className='text-xs text-gray-500 mt-1'>Reorder Level: {product.reorder_level}</p>
        </div>

        <div className='bg-white rounded-lg shadow p-4'>
          <p className='text-gray-600 text-sm font-medium'>Buying Price</p>
          <p className='mt-2 text-2xl font-bold text-gray-900'>{formatCurrency(product.buying_price)}</p>
          <p className='text-xs text-gray-500 mt-1'>Per Unit</p>
        </div>

        <div className='bg-white rounded-lg shadow p-4'>
          <p className='text-gray-600 text-sm font-medium'>Selling Price</p>
          <p className='mt-2 text-2xl font-bold text-gray-900'>{formatCurrency(product.selling_price)}</p>
          <p className='text-xs text-gray-500 mt-1'>Per Unit</p>
        </div>

        <div className='bg-white rounded-lg shadow p-4'>
          <p className='text-gray-600 text-sm font-medium'>Stock Value</p>
          <p className='mt-2 text-2xl font-bold text-gray-900'>
            {product.stock_value !== undefined ? formatCurrency(product.stock_value) : '-'}
          </p>
          <p className='text-xs text-gray-500 mt-1'>
            Profit Margin: {product.profit_margin !== undefined ? formatPercentage(product.profit_margin) : '-'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className='border-b border-gray-200'>
        <div className='flex gap-8'>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Product Details
          </button>
          <button
            onClick={() => setActiveTab('adjust')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'adjust'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Adjust Stock
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'movements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            History ({movements.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Product Details Tab */}
        {activeTab === 'overview' && (
          <div>
            {isEditMode ? (
              <div className='bg-white rounded-lg shadow p-8'>
                <ProductForm
                  onSubmit={handleProductUpdate}
                  isLoading={false}
                  defaultValues={product}
                  mode='edit'
                />
              </div>
            ) : (
              <div className='bg-white rounded-lg shadow p-8 space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                  <div>
                    <h3 className='text-sm font-semibold text-gray-700 uppercase'>Category</h3>
                    <p className='mt-2 text-lg text-gray-900'>{product.category}</p>
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-gray-700 uppercase'>Status</h3>
                    <p className='mt-2 text-lg text-gray-900'>{product.status}</p>
                  </div>
                </div>

                {product.description && (
                  <div>
                    <h3 className='text-sm font-semibold text-gray-700 uppercase'>Description</h3>
                    <p className='mt-2 text-gray-900 whitespace-pre-wrap'>{product.description}</p>
                  </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-200'>
                  <div>
                    <h3 className='text-sm font-semibold text-gray-700 uppercase'>Created</h3>
                    <p className='mt-2 text-gray-900'>
                      {new Date(product.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-gray-700 uppercase'>Last Updated</h3>
                    <p className='mt-2 text-gray-900'>
                      {new Date(product.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Adjust Stock Tab */}
        {activeTab === 'adjust' && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-white rounded-lg shadow p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Add Stock</h3>
              <StockAdjustmentForm
                productId={productId}
                currentQuantity={product.quantity}
                adjustmentType='in'
                onSubmit={handleStockAdjustment}
              />
            </div>

            <div className='bg-white rounded-lg shadow p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Remove Stock</h3>
              <StockAdjustmentForm
                productId={productId}
                currentQuantity={product.quantity}
                adjustmentType='out'
                onSubmit={handleStockAdjustment}
              />
            </div>
          </div>
        )}

        {/* Movements History Tab */}
        {activeTab === 'movements' && (
          <StockMovementsTable movements={movements} isLoading={isLoadingMovements} />
        )}
      </div>
    </div>
  );
}
