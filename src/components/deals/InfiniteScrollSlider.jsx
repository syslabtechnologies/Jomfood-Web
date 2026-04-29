import React, { useState, useEffect, useCallback } from 'react';
import DealCard from './DealCard';
import { Loader2 } from 'lucide-react';

const InfiniteScrollSlider = ({ 
  title, 
  titleIcon: TitleIcon,
  loadDealsFunction, // Function that takes (filters, page, limit) and returns API response
  initialFilters = {}, // Filters to pass to loadDealsFunction
  userLocation,
  showLoadingInfo = true,
  className = "",
  initialLimit = 12, // Initial number of deals to show
  batchSize = 12, // Number of deals to load per "Load More" click
  onInitialLoad
}) => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_deals: 0,
    has_next: false,
    has_prev: false
  });

  // Load initial deals with initialLimit
  const loadInitialDeals = useCallback(async () => {
    console.log(`🔍 Loading initial deals for: ${title}, limit: ${initialLimit}`);
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(1);

      // Modify filters to include limit
      const filtersWithLimit = { ...initialFilters, limit: initialLimit };
      const response = await loadDealsFunction(filtersWithLimit, 1, userLocation);

      if (response?.success && response?.data) {
        const loadedDeals = Array.isArray(response.data) 
          ? response.data 
          : (response.data.deals || []);
        
        const loadedPagination = Array.isArray(response.data)
          ? { 
              current_page: 1, 
              has_next: loadedDeals.length >= initialLimit, 
              has_prev: false, 
              total_pages: 1, 
              total_deals: loadedDeals.length 
            }
          : (response.data.pagination || {});

        setDeals(loadedDeals);
        setPagination(loadedPagination);
        if (typeof onInitialLoad === 'function') {
          onInitialLoad({ dealsCount: loadedDeals.length, hasDeals: loadedDeals.length > 0 });
        }
        console.log(`✅ Loaded ${loadedDeals.length} deals for: ${title}`);
      } else {
        setDeals([]);
        if (typeof onInitialLoad === 'function') {
          onInitialLoad({ dealsCount: 0, hasDeals: false });
        }
      }
    } catch (err) {
      console.error(`❌ Error loading deals for ${title}:`, err);
      setError(err.message);
      setDeals([]);
      if (typeof onInitialLoad === 'function') {
        onInitialLoad({ dealsCount: 0, hasDeals: false });
      }
    } finally {
      setLoading(false);
    }
  }, [title, loadDealsFunction, initialFilters, userLocation, initialLimit]);

  // Load more deals
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !pagination.has_next) {
      return;
    }

    console.log(`📥 Loading more deals for ${title}, current page:`, currentPage);
    setLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      // Modify filters to include batchSize limit
      const filtersWithLimit = { ...initialFilters, limit: batchSize };
      const response = await loadDealsFunction(filtersWithLimit, nextPage, userLocation);

      if (response?.success && response?.data) {
        const newDeals = Array.isArray(response.data) 
          ? response.data 
          : (response.data.deals || []);
        
        const newPagination = Array.isArray(response.data)
          ? { 
              current_page: nextPage, 
              has_next: newDeals.length >= batchSize, 
              has_prev: true, 
              total_pages: nextPage, 
              total_deals: deals.length + newDeals.length 
            }
          : (response.data.pagination || {});
        
        // Preserve total_deals from previous pagination if API doesn't provide it
        if (newPagination && !newPagination.total_deals && pagination.total_deals) {
          newPagination.total_deals = pagination.total_deals;
        }

        console.log(`✅ Loaded ${newDeals.length} more deals for ${title}`);

        setDeals(prev => [...prev, ...newDeals]);
        setPagination(newPagination);
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error(`❌ Error loading more deals for ${title}:`, err);
    } finally {
      setLoadingMore(false);
    }
  }, [title, currentPage, loadDealsFunction, initialFilters, userLocation, pagination.has_next, loadingMore, deals.length, batchSize]);

  // Initial load
  useEffect(() => {
    loadInitialDeals();
  }, [loadInitialDeals]);

  // Don't render if loading failed or no deals
  if (loading) {
    return (
      <div className={`mb-8 ${className}`}>
        <div className="mx-auto px-0 sm:px-4">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {[...Array(initialLimit)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !deals || deals.length === 0) {
    return null; // Don't show empty sections
  }

  return (
    <div className={`mb-8 ${className}`}>
      <div className="mx-auto px-0 sm:px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {TitleIcon && <TitleIcon className="w-6 h-6 text-primary" />}
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6">
          {deals.map((deal) => (
            <DealCard key={deal._id} deal={deal} />
          ))}
          
          {/* Loading skeletons when fetching more */}
          {loadingMore && (
            <>
              {[...Array(batchSize)].map((_, i) => (
                <div key={`loading-${i}`} className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
              ))}
            </>
          )}
        </div>

        {/* Load More Button */}
        {pagination.has_next && !loadingMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 bg-primary hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              Load More{pagination.total_deals ? ` (${pagination.total_deals - deals.length})` : ''}
            </button>
          </div>
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more deals...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfiniteScrollSlider;
