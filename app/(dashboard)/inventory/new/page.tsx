// app/(dashboard)/inventory/new/page.tsx - Create new product page

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductForm } from '@/components/inventory/product-form';

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: any) {
    try {
      setIsLoading(true);

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }

      const result = await response.json();
      
      // Show success message and redirect
      alert(`Product "${result.name}" created successfully!`);
      router.push(`/dashboard/inventory/${result.id}`);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Add New Product</h1>
        <p className='text-gray-600 mt-1'>Create a new product in your inventory</p>
      </div>

      {/* Breadcrumb */}
      <div className='flex items-center gap-2 text-sm text-gray-600'>
        <Link href='/dashboard/inventory' className='text-blue-600 hover:underline'>
          Inventory
        </Link>
        <span>→</span>
        <span>New Product</span>
      </div>

      {/* Form Card */}
      <div className='bg-white rounded-lg shadow p-8 max-w-2xl'>
        <ProductForm onSubmit={handleSubmit} isLoading={isLoading} mode='create' />
      </div>

      {/* Help Section */}
      <div className='bg-blue-50 rounded-lg p-6 border border-blue-200'>
        <h3 className='font-semibold text-blue-900 mb-3'>💡 Tips for Product Creation</h3>
        <ul className='space-y-2 text-sm text-blue-800'>
          <li>• <strong>SKU</strong> must be unique and easily identifiable</li>
          <li>• <strong>Selling price</strong> should be higher than buying price for profitability</li>
          <li>• <strong>Reorder level</strong> is the threshold for low-stock alerts (default: 5)</li>
          <li>• <strong>Initial quantity</strong> will create an initial stock-in movement</li>
          <li>• You can adjust stock levels anytime from the product detail page</li>
        </ul>
      </div>
    </div>
  );
}
