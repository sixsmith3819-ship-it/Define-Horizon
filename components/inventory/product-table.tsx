// components/inventory/product-table.tsx - Product list table component

'use client';

import { useRouter } from 'next/navigation';
import {
  getStatusBadgeColor,
  getStatusLabel,
  formatCurrency,
  formatPercentage,
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
  status: string;
  profit_margin?: number;
  stock_value?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
}

export function ProductTable({ products, isLoading = false, onEdit }: ProductTableProps) {
  const router = useRouter();

  const handleRowClick = (id: string) => {
    router.push(`/dashboard/inventory/${id}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No products found</p>
          <button
            onClick={() => router.push('/dashboard/inventory/new')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add First Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Profit Margin
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Stock Value
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 cursor-pointer transition"
                onClick={() => handleRowClick(product.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-900">{product.sku}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{product.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{product.category}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (product.quantity / Math.max(product.reorder_level * 2, 1)) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{product.quantity}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {product.stock_status && (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(
                        product.stock_status
                      )}`}
                    >
                      {getStatusLabel(product.stock_status)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {product.profit_margin !== undefined
                      ? formatPercentage(product.profit_margin)
                      : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {product.stock_value !== undefined ? formatCurrency(product.stock_value) : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(product.id);
                    }}
                    className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
