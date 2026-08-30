import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/auth/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAuthClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch metrics from database
    const [
      customersRes,
      transactionsRes,
      productsRes,
      branchesRes
    ] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('amount, type', { count: 'exact' }),
      supabase.from('products').select('quantity, low_stock_threshold', { count: 'exact' }),
      supabase.from('branches').select('id', { count: 'exact', head: true })
    ]);

    // Calculate metrics
    const totalCustomers = customersRes.count || 0;
    const totalTransactions = transactionsRes.count || 0;
    
    // Calculate revenue
    const transactions = transactionsRes.data || [];
    const totalRevenue = transactions
      .filter((t: any) => t.type === 'credit' || t.type === 'deposit')
      .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
    
    const serviceCharges = transactions
      .filter((t: any) => t.type === 'service_charge')
      .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

    // Calculate stock metrics
    const products = productsRes.data || [];
    const productsInStock = products.filter((p: any) => p.quantity > 0).length;
    const lowStock = products.filter((p: any) => p.quantity <= (p.low_stock_threshold || 10)).length;

    const totalBranches = branchesRes.count || 0;
    
    const internationalTransactions = transactions
      .filter((t: any) => t.type === 'international_transfer')
      .length;

    const localTransactions = totalTransactions - internationalTransactions;

    return NextResponse.json({
      data: {
        totalCustomers,
        totalTransactions,
        totalRevenue,
        serviceCharges,
        productsInStock,
        lowStock,
        totalBranches,
        localTransactions,
        internationalTransactions,
      },
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
