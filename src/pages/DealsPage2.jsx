import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { dealsAPI } from '../utils/api';
import AutoOpener from '../components/common/AutoOpener';
import DealModal from '../components/deals/DealModal';
import QRCodeModal from '../components/deals/QRCodeModal';
import { toast } from '../utils/toast';
import Header from '../components/layout/Header';
import SearchInput from '../components/ui/SearchInput';
import { Flame, SlidersHorizontal, X, Tag, DollarSign, Percent, Sparkles, TrendingUp, TrendingDown, Clock, Plus, Star, Navigation as NavigationIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReservation } from '../hooks/useReservation';
import { categoriesAPI, dealCategoriesAPI } from '../utils/api';
import { useDebounce } from '../hooks/useDebounce';
import { useGeolocation } from '../hooks/useGeolocation';
import InfiniteScrollSlider from '../components/deals/InfiniteScrollSlider';
import DealCard from '../components/deals/DealCard';
import Pagination from '../components/deals/Pagination';
import FiltersSidebar from '../components/deals/FiltersSidebar';
import MobileAppInstallPopup from '../components/common/MobileAppInstallPopup';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
// import Slider from "rc-slider";
// import "rc-slider/assets/index.css";
import appStoreBadge from '../assets/Download_on_the_App_Store_Badge.svg';
import googlePlayBadge from '../assets/google-play-badge.png';
import { APP_STORE_URL, PLAY_STORE_URL } from '../utils/appStoreLinks';

import dealsHeroImage from '../assets/banner2.jpg';

const DealsPage2 = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_deals: 0,
    has_next: false,
    has_prev: false
  });

  const [filters, setFilters] = useState({
    deal_type: '',
    min_price: '',
    max_price: '',
    min_discount: '',
    max_discount: '',
    sort_by: 'discount_desc',
    category_id: '',
    deal_category_id: '',
    company_name: '',
    text_search: '',
    tags: [],
    page: 1,
    limit: 12
  });
  const [priceRange, setPriceRange] = useState([
    filters.min_price || 0,
    filters.max_price || 500
  ]);
  const [discountRange, setDiscountRange] = useState([
    filters.min_discount || 0,
    filters.max_discount || 100
  ]);
  const [priceMinInput, setPriceMinInput] = useState(filters.min_price || 0);
  const [priceMaxInput, setPriceMaxInput] = useState(filters.max_price || 500);
  const [discountMinInput, setDiscountMinInput] = useState(filters.min_discount || 0);
  const [discountMaxInput, setDiscountMaxInput] = useState(filters.max_discount || 100);
  const [showQRModal, setShowQRModal] = useState(false);
  const [claimData, setClaimData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Text search input state (for debouncing)
  const [textSearchInput, setTextSearchInput] = useState(filters.text_search || '');
  const debouncedTextSearch = useDebounce(textSearchInput, 500);

  // Category states
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]); // Store all categories for dropdown
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [totalCategoriesCount, setTotalCategoriesCount] = useState(0);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Tags states
  const [availableTags, setAvailableTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Deal Categories states (for deal category buttons)
  const [dealCategories, setDealCategories] = useState([]);
  const [loadingDealCategories, setLoadingDealCategories] = useState(false);

  // Search mode state - tracks if we're showing search results
  const [searchMode, setSearchMode] = useState({
    active: false,
    categoryId: '',
    dealCategoryId: '',
    title: ''
  });

  // Mobile filter drawer state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Selected category tab state (for category tabs that filter deals)
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');

  // Navigation refs for category tabs slider
  const categoryTabsPrevRef = useRef(null);
  const categoryTabsNextRef = useRef(null);
  const categoryTabsSwiperRef = useRef(null);
  const [showCategoryNav, setShowCategoryNav] = useState(false);
  const [hotDealsCount, setHotDealsCount] = useState(null);
  const [regularDealsCount, setRegularDealsCount] = useState(null);
  const [categoryDealsCounts, setCategoryDealsCounts] = useState({}); // Track counts for each category section

  // Check if category tabs need navigation
  const checkCategoryNavNeeded = useCallback((swiper) => {
    if (!swiper || !swiper.el) return;

    // Check if content overflows the viewport
    const swiperEl = swiper.el;
    const wrapperEl = swiperEl.querySelector('.swiper-wrapper');

    if (!wrapperEl) return;

    // Compare scroll width with client width to determine if scrolling is needed
    const needsNavigation = wrapperEl.scrollWidth > swiperEl.clientWidth;
    setShowCategoryNav(needsNavigation);
  }, []);

  // Re-check navigation when categories change
  useEffect(() => {
    if (categoryTabsSwiperRef.current) {
      // Delay to ensure DOM is updated
      setTimeout(() => {
        checkCategoryNavNeeded(categoryTabsSwiperRef.current);
      }, 100);
    }
  }, [allCategories, checkCategoryNavNeeded]);

  // Update navigation when showCategoryNav changes
  useEffect(() => {
    if (categoryTabsSwiperRef.current && showCategoryNav && categoryTabsPrevRef.current && categoryTabsNextRef.current) {
      // Delay to ensure buttons are in DOM
      setTimeout(() => {
        const swiper = categoryTabsSwiperRef.current;
        if (swiper && categoryTabsPrevRef.current && categoryTabsNextRef.current) {
          swiper.params.navigation.prevEl = categoryTabsPrevRef.current;
          swiper.params.navigation.nextEl = categoryTabsNextRef.current;
          swiper.navigation.init();
          swiper.navigation.update();
        }
      }, 100);
    }
  }, [showCategoryNav]);

  // Debounced values for input changes (currently disabled)
  // const debouncedPriceMin = useDebounce(priceMinInput, 500);
  // const debouncedPriceMax = useDebounce(priceMaxInput, 500);
  // const debouncedDiscountMin = useDebounce(discountMinInput, 500);
  // const debouncedDiscountMax = useDebounce(discountMaxInput, 500);

  // Track if component has mounted to prevent initial debounced updates (currently disabled)
  // const [hasMounted, setHasMounted] = useState(false);

  // Use the generalized reservation hook
  const { autoOpenId, clearAutoOpen } = useReservation('deal', '/deals-2');

  // Get user location for distance-based sorting
  const { location: userLocation, fetchLocation } = useGeolocation(false);

  // Fetch location on component mount
  useEffect(() => {
    fetchLocation().catch(err => {
      console.log('Location not available:', err.message);
    });
  }, [fetchLocation]);

  // Update filters when debounced text search changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      text_search: debouncedTextSearch.trim(),
      page: 1
    }));
  }, [debouncedTextSearch]);

  // Load tags on mount
  useEffect(() => {
    if (availableTags.length === 0) {
      setLoadingTags(true);
      dealsAPI.getAllTags()
        .then(response => {
          if (response?.success && response?.data && Array.isArray(response.data)) {
            setAvailableTags(response.data);
          } else if (Array.isArray(response)) {
            setAvailableTags(response);
          }
          setLoadingTags(false);
        })
        .catch(err => {
          console.error('Error fetching tags:', err);
          setLoadingTags(false);
        });
    }
  }, [availableTags.length]);

  // Load all categories on mount
  useEffect(() => {
    const loadAllCategories = async () => {
      setCategoriesLoading(true);
      try {
        // Load all categories
        const response = await categoriesAPI.getCategories({
          limit: 999999,
          is_active: true
        });

        // Handle different response structures
        let loadedCategories = [];
        if (Array.isArray(response)) {
          loadedCategories = response;
        } else if (response?.data && Array.isArray(response.data)) {
          loadedCategories = response.data;
        } else if (response?.success && response?.data && Array.isArray(response.data)) {
          loadedCategories = response.data;
        }

        console.log('Full API response:', response);
        console.log('Loaded categories for dropdown:', loadedCategories);
        console.log('Categories count:', loadedCategories.length);

        // Set all categories for dropdown - ensure it's an array
        if (Array.isArray(loadedCategories) && loadedCategories.length > 0) {
          setAllCategories(loadedCategories);

          // Show first 6-8 categories as pill buttons
          const initialCategories = loadedCategories.slice(0, 8);
          setCategories(initialCategories);
        } else {
          console.warn('No categories loaded or invalid format:', loadedCategories);
          setAllCategories([]);
          setCategories([]);
        }
        setTotalCategoriesCount(loadedCategories.length);
        setShowAllCategories(true);
      } catch (err) {
        console.error('Error loading categories:', err);
        toast.error('Failed to load categories');
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadAllCategories();
  }, []);

  // Load deal categories for category sections (with show_category: true)
  useEffect(() => {
    const loadDealCategories = async () => {
      setLoadingDealCategories(true);
      try {
        const response = await dealCategoriesAPI.getActiveDealCategories({
          show_category: 'true' // Pass as string to match API expectation
        });
        
        // Handle response structure: { success: true, data: [...] } or direct array
        let loadedCategories = [];
        if (response?.success && response?.data) {
          loadedCategories = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          loadedCategories = response;
        } else if (Array.isArray(response?.data)) {
          loadedCategories = response.data;
        }
        
        // Filter to only show categories with show_category: true (should already be filtered by API, but double-check)
        loadedCategories = loadedCategories.filter(cat => cat.show_category !== false);
        
        // Sort by sort_order if available
        const sortedCategories = loadedCategories.sort((a, b) => {
          const orderA = a.sort_order || 999;
          const orderB = b.sort_order || 999;
          return orderA - orderB;
        });
        setDealCategories(sortedCategories);
      } catch (err) {
        console.error('Error loading deal categories:', err);
        toast.error('Failed to load deal categories');
        setDealCategories([]);
      } finally {
        setLoadingDealCategories(false);
      }
    };

    loadDealCategories();
  }, []);

  // Handle category selection - Show search results on same page
  const handleCategorySelect = (category) => {
    setSearchMode({
      active: true,
      categoryId: category._id,
      dealCategoryId: '',
      title: category.name
    });
    setFilters(prev => ({
      ...prev,
      category_id: category._id,
      deal_category_id: '',
      page: 1
    }));
    // Scroll to top to show search results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle deal category selection - Show search results on same page
  const handleDealCategorySelect = (dealCategory) => {
    setSearchMode({
      active: true,
      categoryId: '',
      dealCategoryId: dealCategory._id,
      title: dealCategory.name
    });
    setFilters(prev => ({
      ...prev,
      deal_category_id: dealCategory._id,
      category_id: '',
      page: 1
    }));
    // Scroll to top to show search results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear search mode and return to default view
  const handleClearSearch = () => {
    setSearchMode({
      active: false,
      categoryId: '',
      dealCategoryId: '',
      title: ''
    });
    setFilters(prev => ({
      ...prev,
      category_id: '',
      deal_category_id: '',
      page: 1
    }));
    setDeals([]);
  };

  // Handle category clear
  const handleCategoryClear = () => {
    setSelectedCategory(null);
    setFilters(prev => ({
      ...prev,
      category_id: '',
      page: 1
    }));
  };

  // Search handler
  const handleSearch = (query) => {
    setSearchQuery(query);
    console.log('Search query:', query);
    // Update filters to trigger API call with search
    setFilters(prev => ({
      ...prev,
      text_search: query.trim(),
      page: 1
    }));
  };


  const dealTypes = [
    { value: "", label: t("deals.allDeals"), icon: Tag },
    { value: "percentage", label: t("deals.percentage"), icon: Percent },
    { value: "fixed_amount", label: t("deals.fixedAmount"), icon: DollarSign },
    { value: "combo", label: t("deals.combo"), icon: Tag }
  ];

  const sortOptions = [
    { value: "discount_desc", label: t("deals.discountHigh"), icon: Sparkles },
    { value: "newest", label: t("deals.newest"), icon: Sparkles },
    { value: "price_asc", label: t("deals.priceLow"), icon: TrendingUp },
    { value: "price_desc", label: t("deals.priceHigh"), icon: TrendingDown },
    { value: "expiry_asc", label: t("deals.expiringSoon"), icon: Clock },
    { value: "recommended", label: t("deals.recommended"), icon: Star },
    { value: "nearest", label: t("deals.nearest"), icon: NavigationIcon }
  ];

  // Load deals for search mode
  const loadSearchDeals = useCallback(async () => {
    if (!searchMode.active) {
      setDeals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();

      // Add category_id if present
      if (filters.category_id) {
        queryParams.append('category_id', filters.category_id);
      }

      // Add deal_category_id if present
      if (filters.deal_category_id) {
        queryParams.append('deal_category_id', filters.deal_category_id);
      }

      queryParams.append('page', filters.page);
      queryParams.append('limit', filters.limit);

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'category_id' || key === 'deal_category_id' || key === 'page' || key === 'limit') return;
        if (value === '' || value === null || value === undefined) return;
        if (key === 'tags' && Array.isArray(value) && value.length > 0) {
          queryParams.append('tags', value.join(','));
          return;
        }
        if (Array.isArray(value) && value.length === 0) return;
        queryParams.append(key, value);
      });

      // Add user location
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        queryParams.append('lat', userLocation.latitude.toString());
        queryParams.append('lng', userLocation.longitude.toString());
      }

      const response = await dealsAPI.getActiveDeals(queryParams.toString());

      if (response?.success && response?.data) {
        if (Array.isArray(response.data)) {
          setDeals(response.data);
          setPagination({
            current_page: 1,
            total_pages: 1,
            total_deals: response.data.length,
            has_next: false,
            has_prev: false
          });
        } else {
          setDeals(response.data.deals || []);
          setPagination(response.data.pagination || {
            current_page: 1,
            total_pages: 1,
            total_deals: 0,
            has_next: false,
            has_prev: false
          });
        }
      } else {
        setDeals([]);
        setPagination({
          current_page: 1,
          total_pages: 1,
          total_deals: 0,
          has_next: false,
          has_prev: false
        });
      }
    } catch (err) {
      const message = err?.message || 'Failed to load deals';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [searchMode.active, filters, userLocation]);

  // Load deals when in search mode
  useEffect(() => {
    loadSearchDeals();
  }, [loadSearchDeals]);

  const handlePageChange = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handleDealClaimed = useCallback((data) => {
    setClaimData(data);
    setShowQRModal(true);
  }, []);

  const handleDealTypeChange = useCallback((type) => {
    setFilters(prev => ({
      ...prev,
      deal_type: type,
      page: 1
    }));
  }, []);

  const handleSortChange = useCallback((sort) => {
    setFilters(prev => ({
      ...prev,
      sort_by: sort,
      page: 1
    }));
  }, []);

  // (Filters UI will render inline under section header)

  // Function to load hot deals for InfiniteScrollSlider
  const loadHotDeals = useCallback(async (additionalFilters, page, location) => {
    console.log('🔍 loadHotDeals called with additionalFilters:', additionalFilters, 'page:', page);

    // Build query parameters
    const queryParams = new URLSearchParams();

    // Merge filters: additionalFilters (from InfiniteScrollSlider) override filters from parent
    // Use limit from additionalFilters if provided, otherwise use filters.limit
    const mergedFilters = {
      ...filters,
      ...additionalFilters,
      page,
      limit: additionalFilters.limit !== undefined ? additionalFilters.limit : filters.limit
    };

    console.log('📦 Merged filters:', mergedFilters);

    Object.entries(mergedFilters).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        return;
      }
      if (key === 'tags' && Array.isArray(value) && value.length > 0) {
        queryParams.append('tags', value.join(','));
        return;
      }
      if (Array.isArray(value) && value.length === 0) {
        return;
      }
      queryParams.append(key, value);
    });

    // Add user location
    if (location && location.latitude && location.longitude) {
      queryParams.append('lat', location.latitude.toString());
      queryParams.append('lng', location.longitude.toString());
    }

    console.log('🌐 Final query params:', queryParams.toString());
    return await dealsAPI.getActiveDeals(queryParams.toString());
  }, [filters]);

  // Function factory to create category deal loaders
  // This creates a stable function for each category that doesn't change on every render
  const createCategoryDealsLoader = useCallback((dealCategoryId) => {
    return async (additionalFilters, page, location) => {
      console.log('🔍 loadCategoryDeals called for category:', dealCategoryId, 'additionalFilters:', additionalFilters, 'page:', page);

      // Build query parameters
      const queryParams = new URLSearchParams();

      // Merge filters: additionalFilters (from InfiniteScrollSlider) override filters from parent
      // Always include deal_category_id for this category
      // Use limit from additionalFilters if provided, otherwise use filters.limit
      const mergedFilters = {
        ...filters,
        ...additionalFilters,
        deal_category_id: dealCategoryId, // Always pass the category ID
        page,
        limit: additionalFilters.limit !== undefined ? additionalFilters.limit : filters.limit
      };

      console.log('📦 Merged filters for category:', mergedFilters);

      Object.entries(mergedFilters).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
          return;
        }
        if (key === 'tags' && Array.isArray(value) && value.length > 0) {
          queryParams.append('tags', value.join(','));
          return;
        }
        if (Array.isArray(value) && value.length === 0) {
          return;
        }
        queryParams.append(key, value);
      });

      // Add user location
      if (location && location.latitude && location.longitude) {
        queryParams.append('lat', location.latitude.toString());
        queryParams.append('lng', location.longitude.toString());
      }

      console.log('🌐 Final query params for category:', queryParams.toString());
      return await dealsAPI.getActiveDeals(queryParams.toString());
    };
  }, [filters]);

  // Memoize category loaders to prevent infinite re-renders
  const categoryLoaders = useMemo(() => {
    const loaders = {};
    dealCategories.forEach((category) => {
      loaders[category._id] = createCategoryDealsLoader(category._id);
    });
    return loaders;
  }, [dealCategories, createCategoryDealsLoader]);

  // Memoize base initial filters to prevent unnecessary re-renders
  const baseInitialFilters = useMemo(() => ({
    category_id: filters.category_id,
    deal_type: filters.deal_type,
    min_price: filters.min_price,
    max_price: filters.max_price,
    min_discount: filters.min_discount,
    max_discount: filters.max_discount,
    tags: filters.tags,
    text_search: filters.text_search,
  }), [
    filters.category_id,
    filters.deal_type,
    filters.min_price,
    filters.max_price,
    filters.min_discount,
    filters.max_discount,
    filters.tags,
    filters.text_search,
  ]);

  // Memoize hot deals initial filters
  const hotDealsInitialFilters = useMemo(() => ({
    is_hot_deal: true,
    take_one_item_from_each_restaurant:true,
    ...baseInitialFilters,
  }), [baseInitialFilters]);

  // Memoize all deals initial filters
  const allDealsInitialFilters = useMemo(() => ({
    is_hot_deal: false,
    ...baseInitialFilters,
  }), [baseInitialFilters]);


  // Set mounted flag after initial load (currently disabled)
  // useEffect(() => {
  //   setHasMounted(true);
  // }, []);

  // Disable debounced input changes for now - use only blur handlers
  // useEffect(() => {
  //   if (!hasMounted) return;

  //   const min = Math.max(0, debouncedPriceMin);
  //   const max = Math.max(min, debouncedPriceMax);

  //   setFilters(prev => ({
  //     ...prev,
  //     min_price: min,
  //     max_price: max,
  //     page: 1
  //   }));
  // }, [debouncedPriceMin, debouncedPriceMax, hasMounted]);

  // useEffect(() => {
  //   if (!hasMounted) return;

  //   const min = Math.max(0, debouncedDiscountMin);
  //   const max = Math.max(min, Math.min(100, debouncedDiscountMax));

  //   setFilters(prev => ({
  //     ...prev,
  //     min_discount: min,
  //     max_discount: max,
  //     page: 1
  //   }));
  // }, [debouncedDiscountMin, debouncedDiscountMax, hasMounted]);

  // Removed old slider handlers - now using HTML range inputs

  const handlePriceInputChange = useCallback((type, value) => {
    console.log('🔍 Price input change (NO FILTER UPDATE):', type, value);
    const numValue = parseInt(value) || 0;
    if (type === 'min') {
      setPriceMinInput(numValue);
      if (numValue <= priceMaxInput) {
        setPriceRange([numValue, priceMaxInput]);
      }
    } else {
      setPriceMaxInput(numValue);
      if (numValue >= priceMinInput) {
        setPriceRange([priceMinInput, numValue]);
      }
    }
    // NO filter update here - only on blur or slider complete
  }, [priceMaxInput, priceMinInput]);

  const handlePriceInputBlur = useCallback(() => {
    console.log('🔍 Price input blur triggered');
    const min = Math.max(0, priceMinInput);
    const max = Math.max(min, priceMaxInput);
    setPriceRange([min, max]);
    setPriceMinInput(min);
    setPriceMaxInput(max);

    // Update filters immediately on blur
    console.log('🔍 Updating price filters:', { min, max });
    setFilters(prev => ({
      ...prev,
      min_price: min,
      max_price: max,
      page: 1
    }));
  }, [priceMinInput, priceMaxInput]);

  // Removed old discount slider handlers - now using HTML range inputs

  const handleDiscountInputChange = useCallback((type, value) => {
    const numValue = parseInt(value) || 0;
    if (type === 'min') {
      setDiscountMinInput(numValue);
      if (numValue <= discountMaxInput) {
        setDiscountRange([numValue, discountMaxInput]);
      }
    } else {
      setDiscountMaxInput(numValue);
      if (numValue >= discountMinInput) {
        setDiscountRange([discountMinInput, numValue]);
      }
    }
    // NO filter update here - only on blur or slider complete
  }, [discountMinInput, discountMaxInput]);

  const handleDiscountInputBlur = useCallback(() => {
    const min = Math.max(0, discountMinInput);
    const max = Math.max(min, Math.min(100, discountMaxInput));
    setDiscountRange([min, max]);
    setDiscountMinInput(min);
    setDiscountMaxInput(max);

    // Update filters immediately on blur
    setFilters(prev => ({
      ...prev,
      min_discount: min,
      max_discount: max,
      page: 1
    }));
  }, [discountMinInput, discountMaxInput]);

  const handleClearFilters = useCallback(() => {
    setPriceRange([0, 500]);
    setDiscountRange([0, 100]);
    setPriceMinInput(0);
    setPriceMaxInput(500);
    setDiscountMinInput(0);
    setDiscountMaxInput(100);
    setSelectedCategory(null);
    setSearchQuery('');
    setTextSearchInput('');
    setFilters(prev => ({
      ...prev,
      deal_type: '',
      min_price: '',
      max_price: '',
      min_discount: '',
      max_discount: '',
      sort_by: 'discount_desc',
      category_id: '',
      deal_category_id: '',
      company_name: '',
      text_search: '',
      tags: [],
      page: 1
    }));
  }, []);



  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        {/* Hero Section */}
        <div
          className="relative text-white py-12 px-4 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${dealsHeroImage})`
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800"></div>

          {/* Content */}
          <div className="relative max-w-6xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              {t("deals.heroTitle")}
            </h1>
            <p className="text-base md:text-lg mb-8 text-primary-100">
              {t("deals.heroSubtitle")}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("deals.unableToLoadDeals")}</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadDeals}
              className="bg-primary hover:bg-primary-600 text-white px-6 py-2 rounded font-medium transition-colors"
            >
              {t("deals.tryAgain")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If in search mode, show search results layout at the top
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Search Results Section - Shows when category is selected */}
      {searchMode.active && (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh)] px-3 max-w-[1600px] mx-auto">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden fixed bottom-6 right-6 z-30 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
            aria-label="Open Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="font-semibold text-sm">{t("deals.filters", "Filters")}</span>
          </button>

          {/* Mobile Filter Drawer */}
          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileFilters(false)}>
              <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-gray-900">{t("deals.filters", "Filters")}</h2>
                  </div>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close Filters"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="p-4">
                  <FiltersSidebar
                    filters={filters}
                    sortOptions={sortOptions}
                    dealTypes={dealTypes}
                    availableTags={availableTags}
                    loadingTags={loadingTags}
                    priceRange={priceRange}
                    discountRange={discountRange}
                    priceMinInput={priceMinInput}
                    priceMaxInput={priceMaxInput}
                    discountMinInput={discountMinInput}
                    discountMaxInput={discountMaxInput}
                    textSearchInput={textSearchInput}
                    handleDealTypeChange={handleDealTypeChange}
                    handleSortChange={handleSortChange}
                    handlePriceInputChange={handlePriceInputChange}
                    handlePriceInputBlur={handlePriceInputBlur}
                    handleDiscountInputChange={handleDiscountInputChange}
                    handleDiscountInputBlur={handleDiscountInputBlur}
                    handleClearFilters={() => {
                      handleClearFilters();
                      setShowMobileFilters(false);
                    }}
                    setTextSearchInput={setTextSearchInput}
                    setPriceRange={setPriceRange}
                    setDiscountRange={setDiscountRange}
                    setPriceMinInput={setPriceMinInput}
                    setPriceMaxInput={setPriceMaxInput}
                    setDiscountMinInput={setDiscountMinInput}
                    setDiscountMaxInput={setDiscountMaxInput}
                    setFilters={setFilters}
                    t={t}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0 lg:h-[calc(100vh-80px)] overflow-y-auto lg:sticky lg:top-16 z-10">
            <FiltersSidebar
              filters={filters}
              sortOptions={sortOptions}
              dealTypes={dealTypes}
              availableTags={availableTags}
              loadingTags={loadingTags}
              priceRange={priceRange}
              discountRange={discountRange}
              priceMinInput={priceMinInput}
              priceMaxInput={priceMaxInput}
              discountMinInput={discountMinInput}
              discountMaxInput={discountMaxInput}
              textSearchInput={textSearchInput}
              handleDealTypeChange={handleDealTypeChange}
              handleSortChange={handleSortChange}
              handlePriceInputChange={handlePriceInputChange}
              handlePriceInputBlur={handlePriceInputBlur}
              handleDiscountInputChange={handleDiscountInputChange}
              handleDiscountInputBlur={handleDiscountInputBlur}
              handleClearFilters={handleClearFilters}
              setTextSearchInput={setTextSearchInput}
              setPriceRange={setPriceRange}
              setDiscountRange={setDiscountRange}
              setPriceMinInput={setPriceMinInput}
              setPriceMaxInput={setPriceMaxInput}
              setDiscountMinInput={setDiscountMinInput}
              setDiscountMaxInput={setDiscountMaxInput}
              setFilters={setFilters}
              t={t}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 px-3 sm:px-4 py-4">
            {/* Page Header */}
            <div className="mb-6">
              <button
                onClick={handleClearSearch}
                className="flex items-center gap-2 text-gray-600 hover:text-primary mb-4 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">{t('common.back', 'Back')}</span>
              </button>

              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {searchMode.title || t('deals.deals', 'Deals')}
                </h1>
                {pagination.total_deals > 0 && (
                  <p className="text-gray-600">
                    {t('deals.showingDeals', { count: pagination.total_deals })}
                  </p>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 mt-4">{t('deals.loadingDeals')}</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadSearchDeals}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {t('common.tryAgain')}
                </button>
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">{t('deals.noDealsFound')}</p>
                <p className="text-gray-500 text-sm">{t('deals.tryAdjustingFilters')}</p>
              </div>
            ) : (
              <>
                {/* Deals Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-8">
                  {deals.map((deal) => (
                    <DealCard key={deal._id} deal={deal} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="flex justify-center">
                    <Pagination
                      currentPage={pagination.current_page}
                      totalPages={pagination.total_pages}
                      hasNext={pagination.has_next}
                      hasPrev={pagination.has_prev}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Default Deals Page Content - Shows when not in search mode */}
      {!searchMode.active && (
        <div className="max-w-[1600px] mx-auto px-3 pt-2">
          {/* Top Section: App Download Buttons (Left) + Hero Section (Right) */}
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 mb-0">
            {/* App Download Buttons - Desktop only */}
            <div className="hidden w-64 flex-shrink-0 flex-row gap-3 px-6 sm:flex-col sm:py-4 lg:flex">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-[140px] sm:w-full"
              >
                <img
                  src={appStoreBadge}
                  alt="Download on the App Store"
                  className="w-full h-auto"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-[140px] sm:w-full"
              >
                <img
                  src={googlePlayBadge}
                  alt="GET IT ON Google Play"
                  className="w-full h-auto"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </a>
            </div>

            {/* Hero Section - Right Side */}
            <div
              className="flex-1 relative text-white py-8 px-4 bg-cover bg-center bg-no-repeat rounded-lg"
              style={{
                backgroundImage: `url(${dealsHeroImage})`
              }}
            >
              {/* Gradient Overlay - Original Primary Colors */}
              <div className="absolute inset-0 bg-black/25 rounded-lg"></div>
              {/* <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 to-primary-900/90 rounded-lg"></div> */}


              {/* Content */}
              <div className="relative text-center">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-0">
                  {t("deals.heroTitle")}
                </h1>
                <p className="text-base md:text-lg mb-2 text-white/95">
                  {t("deals.heroSubtitle")}
                </p>

                {/* Search Input */}
                <div className="flex justify-center">
                  <SearchInput
                    placeholder={t('common.searchPlaceholderGeneral', 'Search restaurants or cuisine...')}
                    onSearch={handleSearch}
                    className="max-w-2xl w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout: Sidebar + Content */}
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh)]">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden fixed bottom-6 right-6 z-30 bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
              aria-label="Open Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="font-semibold text-sm">{t("deals.filters", "Filters")}</span>
            </button>

            {/* Mobile Filter Drawer */}
            {showMobileFilters && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileFilters(false)}>
                <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-bold text-gray-900">{t("deals.filters", "Filters")}</h2>
                    </div>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Close Filters"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="p-4">
                    <FiltersSidebar
                      filters={filters}
                      sortOptions={sortOptions}
                      dealTypes={dealTypes}
                      availableTags={availableTags}
                      loadingTags={loadingTags}
                      priceRange={priceRange}
                      discountRange={discountRange}
                      priceMinInput={priceMinInput}
                      priceMaxInput={priceMaxInput}
                      discountMinInput={discountMinInput}
                      discountMaxInput={discountMaxInput}
                      textSearchInput={textSearchInput}
                      handleDealTypeChange={handleDealTypeChange}
                      handleSortChange={handleSortChange}
                      handlePriceInputChange={handlePriceInputChange}
                      handlePriceInputBlur={handlePriceInputBlur}
                      handleDiscountInputChange={handleDiscountInputChange}
                      handleDiscountInputBlur={handleDiscountInputBlur}
                      handleClearFilters={() => {
                        handleClearFilters();
                        setShowMobileFilters(false);
                      }}
                      setTextSearchInput={setTextSearchInput}
                      setPriceRange={setPriceRange}
                      setDiscountRange={setDiscountRange}
                      setPriceMinInput={setPriceMinInput}
                      setPriceMaxInput={setPriceMaxInput}
                      setDiscountMinInput={setDiscountMinInput}
                      setDiscountMaxInput={setDiscountMaxInput}
                      setFilters={setFilters}
                      t={t}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Filters Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0 lg:h-[calc(100vh-80px)] overflow-y-auto lg:sticky lg:top-16 z-10">
              <FiltersSidebar
                filters={filters}
                sortOptions={sortOptions}
                dealTypes={dealTypes}
                availableTags={availableTags}
                loadingTags={loadingTags}
                priceRange={priceRange}
                discountRange={discountRange}
                priceMinInput={priceMinInput}
                priceMaxInput={priceMaxInput}
                discountMinInput={discountMinInput}
                discountMaxInput={discountMaxInput}
                textSearchInput={textSearchInput}
                handleDealTypeChange={handleDealTypeChange}
                handleSortChange={handleSortChange}
                handlePriceInputChange={handlePriceInputChange}
                handlePriceInputBlur={handlePriceInputBlur}
                handleDiscountInputChange={handleDiscountInputChange}
                handleDiscountInputBlur={handleDiscountInputBlur}
                handleClearFilters={handleClearFilters}
                setTextSearchInput={setTextSearchInput}
                setPriceRange={setPriceRange}
                setDiscountRange={setDiscountRange}
                setPriceMinInput={setPriceMinInput}
                setPriceMaxInput={setPriceMaxInput}
                setDiscountMinInput={setDiscountMinInput}
                setDiscountMaxInput={setDiscountMaxInput}
                setFilters={setFilters}
                t={t}
              />
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 px-0 sm:px-4 py-4">
              {/* Category Tabs */}
              <div className="mb-6">
                <div className={`bg-white rounded-lg pb-1 border border-gray-200 relative ${showCategoryNav ? 'pl-9 pr-9' : 'px-3'}`}>
                  <Swiper
                    onSwiper={(swiper) => {
                      categoryTabsSwiperRef.current = swiper;
                    }}
                    modules={[Navigation, Autoplay]}
                    spaceBetween={32}
                    slidesPerView="auto"
                    freeMode={true}
                    autoplay={{
                      delay: 5000,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: true,
                    }}
                    navigation={{
                      prevEl: categoryTabsPrevRef.current,
                      nextEl: categoryTabsNextRef.current,
                    }}
                    onBeforeInit={(swiper) => {
                      swiper.params.navigation.prevEl = categoryTabsPrevRef.current;
                      swiper.params.navigation.nextEl = categoryTabsNextRef.current;
                    }}
                    onInit={(swiper) => {
                      // Delay to ensure DOM is fully rendered
                      setTimeout(() => {
                        checkCategoryNavNeeded(swiper);
                        // Update navigation after checking if it's needed
                        if (categoryTabsPrevRef.current && categoryTabsNextRef.current) {
                          swiper.params.navigation.prevEl = categoryTabsPrevRef.current;
                          swiper.params.navigation.nextEl = categoryTabsNextRef.current;
                          swiper.navigation.init();
                          swiper.navigation.update();
                        }
                      }, 150);
                    }}
                    onResize={(swiper) => {
                      checkCategoryNavNeeded(swiper);
                    }}
                    className="category-tabs-swiper"
                  >
                    {/* All Button */}
                    <SwiperSlide style={{ width: 'auto', paddingLeft: showCategoryNav ? '8px' : '8px' }}>
                      <button
                        onClick={() => {
                          setSelectedCategoryTab('all');
                          setFilters(prev => ({ ...prev, category_id: '', page: 1 }));
                        }}
                        className={`relative flex items-center gap-2 px-2 py-3 text-sm font-medium whitespace-nowrap transition-colors ${selectedCategoryTab === 'all'
                          ? 'text-primary'
                          : 'text-gray-700 hover:text-gray-900'
                          }`}
                      >
                        <span className=''>All</span>
                        {selectedCategoryTab === 'all' && (
                          <span className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary rounded-full -mx-2"></span>
                        )}
                      </button>
                    </SwiperSlide>

                    {/* Category Buttons */}
                    {allCategories.map((category, categoryIndex) => {
                      const isLastCategory = categoryIndex === allCategories.length - 1;
                      return (
                        <>
                          <SwiperSlide key={category._id} style={{ width: 'auto', paddingLeft: (showCategoryNav && categoryIndex === 0) ? '8px' : '0' }}>
                            <button
                              onClick={() => {
                                setSelectedCategoryTab(category._id);
                                setFilters(prev => ({ ...prev, category_id: category._id, page: 1 }));
                              }}
                              className={`relative flex items-center gap-2 px-0 py-3 text-sm font-medium whitespace-nowrap transition-colors ${selectedCategoryTab === category._id
                                ? 'text-primary'
                                : 'text-gray-700 hover:text-gray-900'
                                }`}
                            >
                              <span>{category.name}</span>
                              {selectedCategoryTab === category._id && (
                                <span className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary rounded-full -mx-2"></span>
                              )}
                            </button>
                          </SwiperSlide>
                        </>
                      );
                    })}
                  </Swiper>

                  {/* Custom Navigation Buttons - Only show if scrolling is needed */}
                  {showCategoryNav && allCategories.length > 0 && (
                    <>
                      <button
                        ref={categoryTabsPrevRef}
                        className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors hidden md:flex items-center justify-center"
                        aria-label="Previous categories"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        ref={categoryTabsNextRef}
                        className="absolute -right-1 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors hidden md:flex items-center justify-center"
                        aria-label="Next categories"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                      </button>
                    </>
                  )}
                </div>
              </div>


              {/* Hot Deals Today Section - Using InfiniteScrollSlider */}
              <InfiniteScrollSlider
                title={t("deals.hotDealsToday")}
                titleIcon={Flame}
                loadDealsFunction={loadHotDeals}
                initialFilters={hotDealsInitialFilters}
                userLocation={userLocation}
                showLoadingInfo={true}
                initialLimit={8}
                batchSize={8}
                onInitialLoad={({ dealsCount }) => setHotDealsCount(dealsCount)}
              />

              {/* Category-based Deal Sections - Only show when "All" is selected (no restaurant category filter) */}
              {selectedCategoryTab === 'all' && !filters.category_id && dealCategories.map((category) => {
                const categoryLoader = categoryLoaders[category._id];
                if (!categoryLoader) return null; // Skip if loader not ready
                
                return (
                  <InfiniteScrollSlider
                    key={category._id}
                    title={category.name}
                    titleIcon={null}
                    loadDealsFunction={categoryLoader}
                    initialFilters={baseInitialFilters}
                    userLocation={userLocation}
                    showLoadingInfo={true}
                    initialLimit={8}
                    batchSize={8}
                    onInitialLoad={({ dealsCount }) => {
                      setCategoryDealsCounts(prev => ({
                        ...prev,
                        [category._id]: dealsCount
                      }));
                    }}
                  />
                );
              })}

              {/* Regular Deals Section - Using InfiniteScrollSlider */}
              <InfiniteScrollSlider
                title={t("deals.allDeals", "All Deals")}
                titleIcon={null}
                loadDealsFunction={loadHotDeals}
                initialFilters={allDealsInitialFilters}
                userLocation={userLocation}
                showLoadingInfo={false}
                initialLimit={12}
                batchSize={12}
                onInitialLoad={({ dealsCount }) => setRegularDealsCount(dealsCount)}
              />
              {hotDealsCount === 0 && regularDealsCount === 0 && (
                <div className="text-center py-12">
                  <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">{t('deals.noDealsFound')}</p>
                  <p className="text-gray-500 text-sm">{t('deals.tryAdjustingFilters')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auto-open deal modal */}
      <AutoOpener
        items={deals}
        itemId={autoOpenId}
        onClose={clearAutoOpen}
        ModalComponent={DealModal}
        itemKey="_id"
        itemPropName="deal"
        additionalProps={{ onDealClaimed: handleDealClaimed }}
        fetchItemById={async (dealId) => {
          try {
            const response = await dealsAPI.getDealById(dealId);
            return response?.success ? response.data : null;
          } catch (error) {
            console.error('Error fetching deal by ID:', error);
            return null;
          }
        }}
      />

      {/* QR Code Modal */}
      {showQRModal && claimData && (
        <QRCodeModal
          claimData={claimData}
          onClose={() => setShowQRModal(false)}
        />
      )}
      <MobileAppInstallPopup />
    </div>
  );
};

export default DealsPage2;
