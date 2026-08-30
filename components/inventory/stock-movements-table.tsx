// components/inventory/stock-movements-table.tsx - Stock movement history table

'use client';

import { format } from 'date-fns';

interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  reference?: string;
  created_at: string;
}

interface StockMovementsTableProps {
  movements: StockMovement[];
  isLoading?: boolean;
}

export function StockMovementsTable({ movements, isLoading = false }: StockMovementsTableProps) {
  if (isLoading) {
    return (
      <div className='bg-white rounded-lg shadow p-8'>
        <div className='flex justify-center items-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-gray-600'>Loading movements...</span>
        </div>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow p-8'>
        <p className='text-center text-gray-500'>No stock movements recorded yet</p>
      </div>
    );
  }

  const getMovementBadge = (type: string) => {
    const badges = {
      in: 'bg-green-100 text-green-800 border-green-300',
      out: 'bg-red-100 text-red-800 border-red-300',
      adjustment: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };
    return badges[type as keyof typeof badges] || badges.in;
  };

  const getMovementLabel = (type: string) => {
    const labels = {
      in: 'Stock In',
      out: 'Stock Out',
      adjustment: 'Adjustment',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className='bg-white rounded-lg shadow overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead className='bg-gray-50 border-b border-gray-200'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>
                Date
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>
                Type
              </th>
              <th className='px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider'>
                Quantity
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>
                Reason
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>
                Reference
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {movements.map((movement) => (
              <tr key={movement.id} className='hover:bg-gray-50 transition'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span className='text-sm text-gray-900'>
                    {format(new Date(movement.created_at), 'MMM dd, yyyy HH:mm')}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getMovementBadge(
                      movement.movement_type
                    )}`}
                  >
                    {getMovementLabel(movement.movement_type)}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-center'>
                  <span
                    className={`text-sm font-semibold ${
                      movement.movement_type === 'in' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span className='text-sm text-gray-600'>{movement.reason || '-'}</span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span className='text-sm text-gray-600'>{movement.reference || '-'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
