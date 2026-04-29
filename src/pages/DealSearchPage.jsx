import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dealsAPI, categoriesAPI } from '../utils/api';
import { toast } from '../utils/toast';
import Header from '../components/layout/Header';
import DealCard from '../components/deals/DealCard';
import QRCodeModal from '../components/deals/QRCodeModal';
import { ArrowLeft, Tag, DollarSign, Percent, Sparkles, TrendingUp, TrendingDown, Clock, Star, Navigation as NavigationIcon } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import Pagination from '../components/deals/Pagination';

const DealSearchPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryId = searchParams.get('category_id');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null);
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
    category_id: categoryId || '',
    page: 1,
    limit: 12
  });

  const [showQRModal, setShowQRModal] = useState(false);
  const [claimData, setClaimData] = useState(null);
  const { location: userLocation, fetchLocation } = useGeolocation(false);

  // Fetch location on component mount
  useEffect(() => {
    fetchLocation().catch(err => {
      console.log('Location not available:', err.message);
    });
  }, [fetchLocation]);

  // Update filters when categoryId changes from URL
  useEffect(() => {
    if (categoryId) {
      setFilters(prev => ({
        ...prev,
        category_id: categoryId,
        page: 1
      }));
    }
  }, [categoryId]);

  // Load category details
  useEffect(() => {
    const loadCategory = async () => {
      if (!categoryId) {
        setCategory(null);
        return;
      }
      
      try {
        const response = await categoriesAPI.getCategories({
          limit: 999999,
          is_active: true
        });
        
        let allCategories = [];
        if (Array.isArray(response)) {
          allCategories = response;
        } else if (response?.data && Array.isArray(response.data)) {
          allCategories = response.data;
        } else if (response?.success && response?.data && Array.isArray(response.data)) {
          allCategories = response.data;
        }
        
        const foundCategory = allCategories.find(cat => cat._id === categoryId);
        if (foundCategory) {
          setCategory(foundCategory);
        } else {
          setCategory(null);
        }
      } catch (err) {
        console.error('Error loading category:', err);
        setCategory(null);
      }
    };

    loadCategory();
  }, [categoryId]);

  // Load deals
  const loadDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      
      // Add category_id if present
      if (categoryId) {
        queryParams.append('category_id', categoryId);
      }
      
      queryParams.append('page', filters.page);
      queryParams.append('limit', filters.limit);
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'category_id' || key === 'page' || key === 'limit') return;
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
  }, [categoryId, filters, userLocation]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

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

  const dealTypes = [
    { value: "", label: t("deals.allDeals"), icon: Tag },
    { value: "combo", label: t("deals.combo"), icon: Tag },
    { value: "percentage", label: t("deals.discount"), icon: Percent },
    { value: "fixed_amount", label: t("deals.discount"), icon: DollarSign }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('common.back', 'Back')}</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {category ? category.name : t('deals.deals', 'Deals')}
              </h1>
              {pagination.total_deals > 0 && (
                <p className="text-gray-600">
                  {t('deals.showingDeals', { count: pagination.total_deals })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Deal Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{t('deals.dealType')}:</span>
              <div className="flex gap-2">
                {dealTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleDealTypeChange(type.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.deal_type === type.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-gray-700">{t('deals.sortBy')}:</span>
              <select
                value={filters.sort_by}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-4">{t('deals.loadingDeals')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadDeals}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
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
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && claimData && (
        <QRCodeModal
          claimData={claimData}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
};

export default DealSearchPage;

