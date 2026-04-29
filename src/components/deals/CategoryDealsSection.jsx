import React, { useCallback } from 'react';
import InfiniteScrollSlider from './InfiniteScrollSlider';
import { dealsAPI } from '../../utils/api';

const CategoryDealsSection = ({ category, userLocation, globalFilters = {} }) => {
  // Function to load deals for this category
  const loadCategoryDeals = useCallback(async (filters, page, location) => {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('deal_category_id', category._id);
    queryParams.append('page', page);
    queryParams.append('limit', '10');
    
    // Apply global filters (except page and limit which are specific)
    Object.entries(globalFilters).forEach(([key, value]) => {
      // Skip empty values, arrays, page, and limit
      if (key === 'page' || key === 'limit' || value === '' || value === null || value === undefined) {
        return;
      }
      
      // Handle tags array - join with comma
      if (key === 'tags' && Array.isArray(value) && value.length > 0) {
        queryParams.append('tags', value.join(','));
        return;
      }
      
      // Skip empty arrays
      if (Array.isArray(value) && value.length === 0) {
        return;
      }
      
      // Add other non-empty values
      queryParams.append(key, value);
    });

    // Add user location if available
    if (location && location.latitude && location.longitude) {
      queryParams.append('lat', location.latitude.toString());
      queryParams.append('lng', location.longitude.toString());
    }

    return await dealsAPI.getActiveDeals(queryParams.toString());
  }, [category._id, globalFilters]);

  return (
    <InfiniteScrollSlider
      title={category.name}
      loadDealsFunction={loadCategoryDeals}
      initialFilters={{}}
      userLocation={userLocation}
      showLoadingInfo={false}
    />
  );
};

export default CategoryDealsSection;

