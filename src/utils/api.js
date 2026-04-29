// API Configuration and Utilities
import http from './http';
import i18n from '../i18n/config';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5055/api';

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message = typeof data === 'object' && data !== null ? (data.message || JSON.stringify(data)) : String(data || `HTTP ${response.status}`);
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API Methods
export const api = {
  // GET request
  get: (endpoint, options = {}) =>
    apiRequest(endpoint, { method: 'GET', ...options }),

  // POST request
  post: (endpoint, data, options = {}) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    }),

  // PUT request
  put: (endpoint, data, options = {}) =>
    apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    }),

  // DELETE request
  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, { method: 'DELETE', ...options }),
};

// Restaurant API endpoints
export const restaurantAPI = {
  // Get all restaurants
  getRestaurants: (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return api.get(`/restaurants?${queryParams}`);
  },

  // Get single restaurant
  getRestaurant: (id) => api.get(`/restaurants/${id}`),

  // Search restaurants
  searchRestaurants: (searchParams) => {
    const queryParams = new URLSearchParams(searchParams);
    return api.get(`/restaurants/search?${queryParams}`);
  },

  // Get restaurant menu
  getRestaurantMenu: (id) => api.get(`/restaurants/${id}/menu`),

  // Toggle restaurant favorite
  toggleFavorite: (id) => api.post(`/restaurants/${id}/favorite`),
};

// Categories API endpoints
export const categoriesAPI = {
  // Get all categories
  getCategories: (params = {}) => {
    // Get current language from i18n (malay or en)
    const currentLang = i18n.language || 'en';
    const langParam = currentLang === 'malay' ? 'malay' : 'en';

    // Build query parameters
    const queryParams = new URLSearchParams(params);

    // Add language parameter
    queryParams.set('lang', langParam);

    return api.get(`/jomfood-categories?${queryParams.toString()}`);
  },

  // Get single category
  getCategory: (id) => api.get(`/jomfood-categories/${id}`),

  // Get categories for dropdown
  getCategoriesDropdown: () => api.get('/jomfood-categories/dropdown'),
};

// Restaurants API endpoints
export const restaurantsAPI = {
  // Get restaurants by category
  getRestaurantsByCategory: (categoryId, params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('category_id', categoryId);

    // Add pagination params
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    // Add location params for distance-based sorting
    if (params.user_lat) queryParams.append('user_lat', params.user_lat);
    if (params.user_lng) queryParams.append('user_lng', params.user_lng);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);

    return api.get(`/jomfood-settings/businesses?${queryParams}`);
  },

  // Get all restaurants
  getRestaurants: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add pagination params
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    // Add location params for distance-based sorting
    if (params.user_lat) queryParams.append('user_lat', params.user_lat);
    if (params.user_lng) queryParams.append('user_lng', params.user_lng);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);

    return api.get(`/jomfood-settings/businesses?${queryParams}`);
  },

  // Get single restaurant
  getRestaurant: (id) => api.get(`/business/${id}`),
};

// Filter API endpoints
export const filterAPI = {
  // Get filter options
  getFilterOptions: () => api.get('/filters/options'),

  // Get dietary options
  getDietaryOptions: () => api.get('/filters/dietary'),

  // Get cuisine types
  getCuisineTypes: () => api.get('/filters/cuisines'),

  // Get delivery areas
  getDeliveryAreas: () => api.get('/filters/areas'),
};

// User API endpoints (if needed)
export const userAPI = {
  // Get user favorites
  getFavorites: () => api.get('/user/favorites'),

  // Get user orders
  getOrders: () => api.get('/user/orders'),

  // Get user profile
  getProfile: () => api.get('/user/profile'),

  // Update user profile (using http for auth interceptors)
  updateProfile: (data) => http.put('/auth/customer/profile', data),
};

// Deals API endpoints
export const dealsAPI = {
  // Get active deals (public, no auth required)
  getActiveDeals: (queryString = '') => {
    // Get current language from i18n (malay or en)
    const currentLang = i18n.language || 'en';
    const langParam = currentLang === 'malay' ? 'malay' : 'en';

    // Build query parameters
    const queryParams = new URLSearchParams();

    // Add language parameter
    queryParams.append('lang', langParam);

    // If queryString is provided, parse and merge it
    if (queryString) {
      const existingParams = new URLSearchParams(queryString);
      // Add all existing params (lang will be overwritten if it exists, which is fine)
      existingParams.forEach((value, key) => {
        queryParams.set(key, value);
      });
    }

    // Ensure lang is always set (in case it was removed by existing params)
    queryParams.set('lang', langParam);

    return api.get(`/jomfood-deals/active?${queryParams.toString()}`);
  },

  // Get deal by ID (public, no auth required)
  getDealById: (id) => api.get(`/jomfood-deals/detail/${id}`),

  // Claim deal (requires customer_id, optional preferred_service_type, preferred_datetime)
  claimDeal: (dealId, customerId, options = {}) => {
    const body = {
      customer_id: customerId
    };
    
    // Add optional fields if provided
    if (options.preferred_service_type) {
      body.preferred_service_type = options.preferred_service_type;
    }
    if (options.preferred_datetime) {
      body.preferred_datetime = options.preferred_datetime;
    }
    
    return api.post(`/jomfood-deals/${dealId}/claim`, body);
  },

  // Claim multiple deals (requires customer_id and deals array)
  claimDeals: (payload) => {
    return api.post('/jomfood-deals/claims/bulk', payload);
  },

  // Cancel deal claim
  cancelDealClaim: (claimId, customerId) => {
    return api.post(`/jomfood-deals/claims/${claimId}/cancel`, {
      customer_id: customerId
    });
  },

  // Reschedule deal claim
  rescheduleDealClaim: (claimId, customerId, preferredDatetime) => {
    return api.post(`/jomfood-deals/claims/${claimId}/reschedule`, {
      customer_id: customerId,
      preferred_datetime: preferredDatetime
    });
  },

  // Get claimed deal history (requires customer_id; uses auth http client)
  getClaimHistory: (customerId, params = {}) => {
    const currentLang = i18n.language || 'en';
    const langParam = currentLang === 'malay' ? 'malay' : 'en';
    const queryParams = new URLSearchParams();
    if (customerId) queryParams.append('customer_id', customerId);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.lang) {
      queryParams.set('lang', params.lang);
    } else {
      queryParams.set('lang', langParam);
    }
    return http.get(`/jomfood-deals/claims/history?${queryParams.toString()}`);
  },

  // Get all available tags
  getAllTags: () => {
    // Get current language from i18n (malay or en)
    const currentLang = i18n.language || 'en';
    const langParam = currentLang === 'malay' ? 'malay' : 'en';

    return api.get(`/jomfood-deals/tags?lang=${langParam}`);
  },
};

// Deals cart API (customer)
export const cartAPI = {
  getCart: (customerId) => {
    const queryParams = new URLSearchParams();
    if (customerId) queryParams.append('customer_id', customerId);
    return http.get(`/jomfood-deals/cart?${queryParams.toString()}`);
  },
  addToCart: (customerId, dealId) => {
    return http.post('/jomfood-deals/cart/add', { customer_id: customerId, deal_id: dealId });
  },
  removeFromCart: (customerId, dealId) => {
    return http.post('/jomfood-deals/cart/remove', { customer_id: customerId, deal_id: dealId });
  },
  updateQuantity: (customerId, dealId, quantity) => {
    return http.post('/jomfood-deals/cart/update-quantity', {
      customer_id: customerId,
      deal_id: dealId,
      quantity
    });
  },
  clearCart: (customerId) => {
    return http.post('/jomfood-deals/cart/clear', { customer_id: customerId });
  },
  claimCart: (customerId, preferredServiceType, preferredDatetime) => {
    return http.post('/jomfood-deals/cart/claim', {
      customer_id: customerId,
      preferred_service_type: preferredServiceType,
      preferred_datetime: preferredDatetime
    });
  },
  couponPreview: (customerId, couponCode = null) => {
    return http.post('/jomfood-deals/cart/coupon-preview', {
      customer_id: customerId,
      coupon_code: couponCode
    });
  },
  checkoutCart: (customerId, preferredServiceType, preferredDatetime, couponCode = null) => {
    return http.post('/jomfood-deals/cart/checkout', {
      customer_id: customerId,
      preferred_service_type: preferredServiceType,
      preferred_datetime: preferredDatetime,
      coupon_code: couponCode
    });
  },
  getCartPaymentStatus: (paymentId) => {
    const queryParams = new URLSearchParams();
    if (paymentId) queryParams.append('payment_id', paymentId);
    return http.get(`/jomfood-deals/cart/payment-status?${queryParams.toString()}`);
  }
};

// Favorites API endpoints (auth)
export const favoritesAPI = {
  // Get favorite deals for current user (uses auth http client)
  getFavoriteDeals: (params = {}) => {
    const currentLang = i18n.language || 'en';
    const langParam = currentLang === 'malay' ? 'malay' : 'en';
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.deal_type) queryParams.append('deal_type', params.deal_type);
    queryParams.set('lang', langParam);
    return http.get(`/jomfood-deals/favorites?${queryParams.toString()}`);
  },
  toggleFavorite: (dealId, params = {}) => {
    const currentLang = i18n.language || 'en';
    const langParam = currentLang === 'malay' ? 'malay' : 'en';
    const queryParams = new URLSearchParams(params);
    queryParams.set('lang', langParam);
    return http.post(`/jomfood-deals/favorites/${dealId}/toggle?${queryParams.toString()}`);
  },
  checkFavoriteStatus: async (dealId) => {
    if (!dealId || typeof dealId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(dealId)) {
      const error = new Error('Invalid deal ID format');
      error.code = 'INVALID_DEAL_ID';
      error.dealId = dealId;
      throw error;
    }
    const currentLang = i18n.language || 'en';
    const langParam = currentLang === 'malay' ? 'malay' : 'en';
    const response = await http.get(`/jomfood-deals/favorites/${dealId}/status?lang=${langParam}`);
    const result = response?.data?.data || { is_favorite: false, favorited_at: null };
    return result;
  },
};

// Deal Categories API endpoints
export const dealCategoriesAPI = {
  // Get active deal categories
  getActiveDealCategories: (params = {}) => {
    // Get current language from i18n (malay or en)
    const currentLang = i18n.language || 'en';
    const langParam = currentLang === 'malay' ? 'malay' : 'en';

    // Build query parameters
    const queryParams = new URLSearchParams(params);

    // Add language parameter
    queryParams.set('lang', langParam);

    return api.get(`/jomfood-deal-categories/active?${queryParams.toString()}`);
  },
};

// Google OAuth API endpoints
export const googleOAuthAPI = {
  // Google OAuth authentication
  authenticate: (userInfo) => {
    return api.post('/auth/customer/google', {
      idToken: userInfo.idToken,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name
    });
  },
};

// Apple OAuth API endpoints
export const appleOAuthAPI = {
  authenticate: (userInfo) => {
    return api.post('/auth/customer/apple', {
      identityToken: userInfo.identityToken,
      authorizationCode: userInfo.authorizationCode,
      email: userInfo.email,
      name: userInfo.name,
    });
  },
};

// Customer forgot password API (public)
export const forgotPasswordAPI = {
  sendOTP: (email) => api.post('/auth/customer/forgot-password/send-otp', { email }),
  verifyOTP: (email, otp) => api.post('/auth/customer/forgot-password/verify-otp', { email, otp }),
  resetPassword: (email, otp, password) =>
    api.post('/auth/customer/forgot-password/reset', { email, otp, password }),
};

// Set password API (authenticated, uses http with auth interceptors)
export const setPasswordAPI = {
  setPassword: (password) => {
    return http.put('/auth/customer/set-password', { password });
  },
};

// Notifications API endpoints (using http for auth interceptors)
export const notificationsAPI = {
  // Get customer notifications
  getNotifications: (customerId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    return http.get(`/jomfood/notifications/customer/${customerId}${queryString ? `?${queryString}` : ''}`);
  },

  // Mark notification as read
  markAsRead: (notificationId, customerId) => {
    return http.patch(`/jomfood/notifications/customer/${notificationId}/read`, {
      customerId
    });
  },

  // Mark all notifications as read
  markAllAsRead: (customerId) => {
    return http.patch(`/jomfood/notifications/customer/${customerId}/read-all`);
  },

  // Get unread count
  getUnreadCount: (customerId) => {
    return http.get(`/jomfood/notifications/customer/${customerId}/unread-count`);
  },
};

// Business Request API endpoints (public endpoint, no auth required)
export const businessRequestAPI = {
  // Submit restaurant information request (public, no auth required)
  submitRequest: (data) => {
    return api.post('/business-request', data);
  },
};

// Bank names API endpoints (public)
export const banksAPI = {
  getActiveBanks: () => api.get('/bank-names?isActive=true'),
};

export default api;
