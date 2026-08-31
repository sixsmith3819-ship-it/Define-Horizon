// components/transactions/service-charge-calculator.tsx

'use client';

import React from 'react';
import { TransactionType } from '@/lib/validations/transaction';
import { formatServiceChargeCalculation } from '@/lib/utils/service-charge';

interface ServiceChargeCalculatorProps {
  amount: number;
  transactionType: TransactionType;
  serviceCharge: number;
  totalAmount: number;
}

export function ServiceChargeCalculator({
  amount,
  transactionType,
  serviceCharge,
  totalAmount,
}: ServiceChargeCalculatorProps) {
  const percentage = transactionType === 'domestic' ? 8 : 10;
  const calculationText = formatServiceChargeCalculation(
    amount,
    serviceCharge,
    totalAmount,
    transactionType
  );

  return (
    <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Calculation Breakdown</h3>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="text-sm font-medium text-gray-900">{amount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Service Charge ({percentage}%):</span>
          <span className="text-sm font-medium text-blue-600">+{serviceCharge.toFixed(2)}</span>
        </div>

        <div className="border-t border-blue-200 pt-2 mt-2" />

        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-900">Total Amount:</span>
          <span className="text-lg font-bold text-blue-600">{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 italic">{calculationText}</p>
    </div>
  );
}
