// app/api/products/route.ts - Product management API endpoints

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createProductSchema, productFiltersSchema } from '@/lib/validations/product';
import {
  calculateProfitMargin,
  calculateStockValue,
  getStockStatus,
} from '@/lib/utils/stock-calculations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to decode JWT token
function decodeJWT(token: string): { sub?: string; [key: string]: unknown } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch {
    return null;
  }
}

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return null;
  }

  const tokenPayload = decodeJWT(token);
  if (!tokenPayload?.sub) {
    return null;
  }

  const userId = tokenPayload.sub;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, branch_id, role_id, is_active')
    .eq('id', userId)
    .single();

  if (error || !profile || !profile.is_active) {
    return null;
  }

  return profile;
}

/**
 * GET /api/products - Fetch all products with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate filters
    const filters = {
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      stock_status: searchParams.get('stock_status') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
    };

    const validatedFilters = productFiltersSchema.parse(filters);

    let query = supabase.from('products').select('*').order('name', { ascending: true });

    // Apply category filter
    if (validatedFilters.category) {
      query = query.eq('category', validatedFilters.category);
    }

    // Apply status filter
    if (validatedFilters.status) {
      query = query.eq('status', validatedFilters.status);
    }

    // Apply search filter (search by name or SKU)
    if (validatedFilters.search) {
      query = query.or(
        `name.ilike.%${validatedFilters.search}%,sku.ilike.%${validatedFilters.search}%`
      );
    }

    // Get data with pagination
    const from = (validatedFilters.page - 1) * validatedFilters.limit;
    const to = from + validatedFilters.limit - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    // Calculate metrics for each product
    const productsWithMetrics = (data || []).map((product: any) => ({
      ...product,
      profit_margin: calculateProfitMargin(product.buying_price, product.selling_price),
      stock_value: calculateStockValue(product.quantity, product.buying_price),
      stock_status: getStockStatus(product.quantity, product.reorder_level),
    }));

    // Apply stock status filter after calculating status
    let filteredProducts = productsWithMetrics;
    if (validatedFilters.stock_status) {
      filteredProducts = productsWithMetrics.filter(
        (p: any) => p.stock_status === validatedFilters.stock_status
      );
    }

    return NextResponse.json({
      data: filteredProducts,
      pagination: {
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        total: count || 0,
        pages: count ? Math.ceil(count / validatedFilters.limit) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

/**
 * POST /api/products - Create new product
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }
    const body = await request.json();

    // Validate input
    const validatedData = createProductSchema.parse(body);

    // Check if SKU is unique
    const { data: existingSku } = await supabase
      .from('products')
      .select('id')
      .eq('sku', validatedData.sku)
      .single();

    if (existingSku) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    }

    // Create product
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          sku: validatedData.sku,
          name: validatedData.name,
          category: validatedData.category,
          buying_price: validatedData.buying_price,
          unit_cost: validatedData.buying_price, // Map to unit_cost for database
          selling_price: validatedData.selling_price,
          unit_price: validatedData.selling_price, // Map to unit_price for database
          quantity: validatedData.quantity,
          reorder_level: validatedData.reorder_level,
          reorder_point: validatedData.reorder_level, // Map to reorder_point for database
          description: validatedData.description,
          status: validatedData.status,
          branch_id: user.branch_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Create initial stock movement if quantity > 0
    if (validatedData.quantity > 0 && data) {
      await supabase.from('stock_movements').insert([
        {
          product_id: data.id,
          movement_type: 'in',
          quantity: validatedData.quantity,
          reason: 'Initial stock',
          created_at: new Date().toISOString(),
        },
      ]);
    }

    // Calculate metrics
    const productWithMetrics = {
      ...data,
      profit_margin: calculateProfitMargin(data.buying_price, data.selling_price),
      stock_value: calculateStockValue(data.quantity, data.buying_price),
      stock_status: getStockStatus(data.quantity, data.reorder_level),
    };

    return NextResponse.json(productWithMetrics, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
