/**
 * Pagination Utilities
 * 
 * Helper functions for paginated queries and responses
 */

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationResponse {
  page: number;
  pageSize: number;
  total_count: number;
  total_pages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = [25, 50, 100, 250];
const MAX_PAGE_SIZE = 250;

/**
 * Validate and normalize pagination parameters
 */
export function normalizePaginationParams(
  page?: number | string,
  pageSize?: number | string
): { page: number; pageSize: number; offset: number } {
  let normalizedPage = DEFAULT_PAGE;
  let normalizedPageSize = DEFAULT_PAGE_SIZE;

  // Parse page
  if (page) {
    const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
    if (!isNaN(parsedPage) && parsedPage > 0) {
      normalizedPage = parsedPage;
    }
  }

  // Parse page size
  if (pageSize) {
    const parsedPageSize = typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;
    if (!isNaN(parsedPageSize) && ALLOWED_PAGE_SIZES.includes(parsedPageSize)) {
      normalizedPageSize = parsedPageSize;
    }
  }

  const offset = (normalizedPage - 1) * normalizedPageSize;

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    offset,
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  pageSize: number,
  total_count: number
): PaginationResponse {
  const total_pages = Math.ceil(total_count / pageSize);

  return {
    page,
    pageSize,
    total_count,
    total_pages,
  };
}

/**
 * Validate sort parameters
 */
export function validateSortParams(
  sortBy?: string,
  sortOrder?: string,
  allowedFields?: string[]
): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const defaultSortBy = 'created_at';
  const defaultSortOrder: 'asc' | 'desc' = 'asc';

  const allowed = allowedFields || ['created_at', 'full_name', 'email', 'last_login_timestamp'];

  let normalizedSortBy = defaultSortBy;
  if (sortBy && allowed.includes(sortBy)) {
    normalizedSortBy = sortBy;
  }

  let normalizedSortOrder: 'asc' | 'desc' = defaultSortOrder;
  if (sortOrder && (sortOrder === 'asc' || sortOrder === 'desc')) {
    normalizedSortOrder = sortOrder;
  }

  return {
    sortBy: normalizedSortBy,
    sortOrder: normalizedSortOrder,
  };
}

/**
 * Build SQL ORDER BY clause
 */
export function buildOrderByClause(
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): string {
  // Sanitize to prevent SQL injection
  const safeField = sortBy.replace(/[^a-zA-Z0-9_]/g, '');
  const safeOrder = sortOrder === 'desc' ? 'DESC' : 'ASC';
  return `${safeField}.${safeOrder}`;
}
