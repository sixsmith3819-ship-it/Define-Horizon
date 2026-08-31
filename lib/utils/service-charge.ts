// lib/utils/service-charge.ts - Service charge calculation utilities

interface ServiceChargeRates {
  domestic: number;
  international: number;
}

const DEFAULT_RATES: ServiceChargeRates = {
  domestic: 0.08, // 8%
  international: 0.1, // 10%
};

/**
 * Calculate service charge based on transaction type and amount
 * @param amount Transaction amount
 * @param transactionType Type of transaction: 'domestic' or 'international'
 * @param rates Optional custom rates (defaults to 8% domestic, 10% international)
 * @returns Calculated service charge rounded to 2 decimal places
 */
export function calculateServiceCharge(
  amount: number,
  transactionType: 'domestic' | 'international',
  rates: Partial<ServiceChargeRates> = {}
): number {
  const finalRates = { ...DEFAULT_RATES, ...rates };
  const rate = transactionType === 'domestic' ? finalRates.domestic : finalRates.international;

  const charge = amount * rate;
  return Math.round(charge * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate total amount (transaction amount + service charge)
 * @param amount Transaction amount
 * @param transactionType Type of transaction
 * @param rates Optional custom rates
 * @returns Total amount (amount + service charge)
 */
export function calculateTotalAmount(
  amount: number,
  transactionType: 'domestic' | 'international',
  rates: Partial<ServiceChargeRates> = {}
): number {
  const charge = calculateServiceCharge(amount, transactionType, rates);
  const total = amount + charge;
  return Math.round(total * 100) / 100; // Round to 2 decimal places
}

/**
 * Get the rate percentage for a transaction type
 * @param transactionType Type of transaction
 * @param rates Optional custom rates
 * @returns Rate as a percentage (e.g., 0.08 for 8%)
 */
export function getServiceChargeRate(
  transactionType: 'domestic' | 'international',
  rates: Partial<ServiceChargeRates> = {}
): number {
  const finalRates = { ...DEFAULT_RATES, ...rates };
  return transactionType === 'domestic' ? finalRates.domestic : finalRates.international;
}

/**
 * Format service charge calculation for display
 * @param amount Transaction amount
 * @param serviceCharge Calculated service charge
 * @param total Total amount
 * @param transactionType Type of transaction
 * @returns Formatted string showing calculation breakdown
 */
export function formatServiceChargeCalculation(
  amount: number,
  serviceCharge: number,
  total: number,
  transactionType: 'domestic' | 'international'
): string {
  const percentage = transactionType === 'domestic' ? 8 : 10;
  return `Amount: ${amount.toFixed(2)} + Service Charge (${percentage}%): ${serviceCharge.toFixed(2)} = Total: ${total.toFixed(2)}`;
}

export type { ServiceChargeRates };
