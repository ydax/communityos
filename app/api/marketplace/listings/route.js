import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase/admin.js';
import { listAllActiveListings } from '../../../../lib/dbServices/listingsService.js';

/**
 * GET /api/marketplace/listings
 * List all active listings across all sites for marketplace feed
 * 
 * Query Parameters:
 * - type: Filter by service/good
 * - category: Filter by category
 * - search: Search term for title/description/business name
 * - limit: Maximum number of results (default 50)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const filters = {
      type: searchParams.get('type') || undefined,
      category: searchParams.get('category') || undefined,
      searchTerm: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
    };

    // Validate type if provided
    if (filters.type && !['service', 'good'].includes(filters.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "service" or "good"' },
        { status: 400 }
      );
    }

    // Validate limit
    if (filters.limit < 1 || filters.limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Fetch listings
    const listings = await listAllActiveListings(adminDb, filters);

    return NextResponse.json({
      success: true,
      listings,
      total: listings.length,
      filters: {
        type: filters.type || 'all',
        category: filters.category || 'all',
        search: filters.searchTerm || null,
      },
    });
  } catch (error) {
    console.error('[MarketplaceAPI] Error fetching listings:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch marketplace listings',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
