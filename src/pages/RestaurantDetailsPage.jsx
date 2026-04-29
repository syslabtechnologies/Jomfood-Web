import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { restaurantsAPI, dealsAPI } from '../utils/api';
import DealCard from '../components/deals/DealCard';
import { Store, MapPin, Phone, Mail, Star, Clock, Tag, SlidersHorizontal, X, ArrowLeft, Flame, Percent, DollarSign, Sparkles, TrendingUp, TrendingDown, Navigation as NavigationIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FiltersSidebar from '../components/deals/FiltersSidebar';
import InfiniteScrollSlider from '../components/deals/InfiniteScrollSlider';
import { useDebounce } from '../hooks/useDebounce';
import { useGeolocation } from '../hooks/useGeolocation';
import AutoOpener from '../components/common/AutoOpener';
import DealModal from '../components/deals/DealModal';
import QRCodeModal from '../components/deals/QRCodeModal';
import { toast } from '../utils/toast';
import { useNavigate } from 'react-router-dom';
import CommonLayout from '../components/layout/CommonLayout';

const RestaurantDetailsPage = () => {
    const { id } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { execute: fetchRestaurant, loading: restLoading, error: restError } = useApi();

    // Restaurant State
    const [restaurant, setRestaurant] = useState(null);

    // Deals Counts
    const [hotDealsCount, setHotDealsCount] = useState(null);
    const [regularDealsCount, setRegularDealsCount] = useState(null);

    // Deals & Filters State (Mirrored from DealsPage2)
    const [filters, setFilters] = useState({
        deal_type: '',
        min_price: '',
        max_price: '',
        min_discount: '',
        max_discount: '',
        sort_by: 'discount_desc',
        category_id: '',
        deal_category_id: '',
        company_name: '', // We won't use this, we use business_id instead
        text_search: '',
        tags: [],
        page: 1,
        limit: 12,
        business_id: id // Force business_id
    });

    const [priceRange, setPriceRange] = useState([0, 500]);
    const [discountRange, setDiscountRange] = useState([0, 100]);
    const [priceMinInput, setPriceMinInput] = useState(0);
    const [priceMaxInput, setPriceMaxInput] = useState(500);
    const [discountMinInput, setDiscountMinInput] = useState(0);
    const [discountMaxInput, setDiscountMaxInput] = useState(100);
    const [textSearchInput, setTextSearchInput] = useState('');
    const debouncedTextSearch = useDebounce(textSearchInput, 500);

    const [availableTags, setAvailableTags] = useState([]);
    const [loadingTags, setLoadingTags] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Helpers for URLs
    const getGoogleMapsUrl = () => {
        if (restaurant?.lat && restaurant?.lng) {
            return `https://www.google.com/maps?q=${restaurant.lat},${restaurant.lng}`;
        }
        if (restaurant?.address) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`;
        }
        return null;
    };

    const getWhatsAppUrl = () => {
        if (restaurant?.office_phone) {
            const phoneNumber = restaurant.office_phone.replace(/\D/g, '');
            return `https://wa.me/${phoneNumber}`;
        }
        return null;
    };

    // Claim Modal State
    const [showQRModal, setShowQRModal] = useState(false);
    const [claimData, setClaimData] = useState(null);

    // Location
    const { location: userLocation, fetchLocation } = useGeolocation(false);

    // Fetch Restaurant Details
    useEffect(() => {
        if (id) {
            fetchRestaurant(() => restaurantsAPI.getRestaurant(id))
                .then(response => {
                    const data = response?.data || response;
                    setRestaurant(data);
                })
                .catch(err => console.error("Failed to fetch restaurant details:", err));
        }
    }, [id, fetchRestaurant]);

    // Force business_id in filters if it changes (shouldn't really, but good practice)
    useEffect(() => {
        setFilters(prev => ({ ...prev, business_id: id }));
    }, [id]);

    // Fetch Location
    useEffect(() => {
        fetchLocation().catch(err => console.log('Location not available:', err.message));
    }, [fetchLocation]);

    // Load Tags
    useEffect(() => {
        if (availableTags.length === 0) {
            setLoadingTags(true);
            dealsAPI.getAllTags()
                .then(response => {
                    const tags = response?.success && response?.data ? response.data : (Array.isArray(response) ? response : []);
                    setAvailableTags(tags);
                    setLoadingTags(false);
                })
                .catch(err => {
                    console.error('Error fetching tags:', err);
                    setLoadingTags(false);
                });
        }
    }, [availableTags.length]);

    // Handle Text Search Debounce
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            text_search: debouncedTextSearch.trim(),
            page: 1
        }));
    }, [debouncedTextSearch]);

    // --- Filter Handlers (Copied/Adapted from DealsPage2) ---

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

    const handleDealTypeChange = useCallback((type) => {
        setFilters(prev => ({ ...prev, deal_type: type, page: 1 }));
    }, []);

    const handleSortChange = useCallback((sort) => {
        setFilters(prev => ({ ...prev, sort_by: sort, page: 1 }));
    }, []);

    const handlePriceInputChange = useCallback((type, value) => {
        const numValue = parseInt(value) || 0;
        if (type === 'min') {
            setPriceMinInput(numValue);
            if (numValue <= priceMaxInput) setPriceRange([numValue, priceMaxInput]);
        } else {
            setPriceMaxInput(numValue);
            if (numValue >= priceMinInput) setPriceRange([priceMinInput, numValue]);
        }
    }, [priceMaxInput, priceMinInput]);

    const handlePriceInputBlur = useCallback(() => {
        const min = Math.max(0, priceMinInput);
        const max = Math.max(min, priceMaxInput);
        setPriceRange([min, max]);
        setPriceMinInput(min);
        setPriceMaxInput(max);
        setFilters(prev => ({ ...prev, min_price: min, max_price: max, page: 1 }));
    }, [priceMinInput, priceMaxInput]);

    const handleDiscountInputChange = useCallback((type, value) => {
        const numValue = parseInt(value) || 0;
        if (type === 'min') {
            setDiscountMinInput(numValue);
            if (numValue <= discountMaxInput) setDiscountRange([numValue, discountMaxInput]);
        } else {
            setDiscountMaxInput(numValue);
            if (numValue >= discountMinInput) setDiscountRange([discountMinInput, numValue]);
        }
    }, [discountMinInput, discountMaxInput]);

    const handleDiscountInputBlur = useCallback(() => {
        const min = Math.max(0, discountMinInput);
        const max = Math.max(min, Math.min(100, discountMaxInput));
        setDiscountRange([min, max]);
        setDiscountMinInput(min);
        setDiscountMaxInput(max);
        setFilters(prev => ({ ...prev, min_discount: min, max_discount: max, page: 1 }));
    }, [discountMinInput, discountMaxInput]);

    const handleClearFilters = useCallback(() => {
        setPriceRange([0, 500]);
        setDiscountRange([0, 100]);
        setPriceMinInput(0);
        setPriceMaxInput(500);
        setDiscountMinInput(0);
        setDiscountMaxInput(100);
        setTextSearchInput('');
        setFilters(prev => ({
            ...prev,
            deal_type: '',
            min_price: '',
            max_price: '',
            min_discount: '',
            max_discount: '',
            sort_by: 'discount_desc',
            // category_id: '', // Don't clear category if relevant to restaurant
            // deal_category_id: '',
            text_search: '',
            tags: [],
            page: 1,
            business_id: id // Always keep business id
        }));
    }, [id]);

    const handleDealClaimed = useCallback((data) => {
        setClaimData(data);
        setShowQRModal(true);
    }, []);

    // Load Deals Function for InfiniteScrollSlider
    const loadRestaurantDeals = useCallback(async (additionalFilters, page, location) => {
        const queryParams = new URLSearchParams();

        // Merge filters
        const mergedFilters = {
            ...filters,
            ...additionalFilters,
            page,
            business_id: id, // Ensure ID is always set
            limit: additionalFilters.limit !== undefined ? additionalFilters.limit : filters.limit
        };

        Object.entries(mergedFilters).forEach(([key, value]) => {
            if (value === '' || value === null || value === undefined) return;
            if (key === 'tags' && Array.isArray(value) && value.length > 0) {
                queryParams.append('tags', value.join(','));
                return;
            }
            if (Array.isArray(value) && value.length === 0) return;
            queryParams.append(key, value);
        });

        if (location && location.latitude && location.longitude) {
            queryParams.append('lat', location.latitude.toString());
            queryParams.append('lng', location.longitude.toString());
        }

        return await dealsAPI.getActiveDeals(queryParams.toString());
    }, [filters, id]);

    if (restLoading && !restaurant) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (restError) {
        return (
            <div className="container mx-auto p-4 text-center py-20">
                <h2 className="text-2xl font-bold text-gray-800">Error loading restaurant</h2>
                <p className="text-gray-600 mt-2">{restError}</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary underline">Go Back</button>
            </div>
        );
    }

    if (!restaurant && !restLoading) {
        return (
            <div className="container mx-auto p-4 text-center py-20">
                <h2 className="text-2xl font-bold text-gray-800">Restaurant not found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary underline">Go Back</button>
            </div>
        );
    }

    return (
        <CommonLayout>
            <div className="min-h-screen bg-gray-50 pb-12">
                {/* Restaurant Header Section */}
                <div className="bg-white shadow-sm border-b border-gray-100">
                    <div className="lg:container mx-auto px-6 sm:px-20 py-8">
                        {/* <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">{t('common.back', 'Back')}</span>
                        </button> */}

                        <div className="flex flex-col md:flex-row gap-5 items-start sm:items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center flex-1 w-full">
                                {/* Restaurant Icon Placeholder */}
                                <div className="hidden sm:flex w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl items-center justify-center flex-shrink-0 shadow-inner">
                                    <Store className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500" />
                                </div>

                                {/* Restaurant Info */}
                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight break-words">
                                            {restaurant?.company_name || 'Restaurant Name'}
                                        </h1>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {restaurant?.status || 'Active'}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-2 text-sm text-gray-600">
                                        {restaurant?.address && (
                                            <div className="flex items-start gap-2 max-w-2xl">
                                                <MapPin className="hidden sm:block w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                                <span className="break-words">{restaurant.address}</span>
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-6 gap-y-2">
                                            {restaurant?.office_phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="hidden sm:block w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-gray-600">
                                                        {restaurant.office_phone}
                                                    </span>
                                                </div>
                                            )}

                                            {restaurant?.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="hidden sm:block w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <a href={`mailto:${restaurant.email}`} className="hover:text-primary transition-colors break-all">
                                                        {restaurant.email}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Icons (Right Side) */}
                            <div className="flex items-center gap-2.5 flex-shrink-0 mt-2 sm:mt-4 md:mt-0 self-start sm:self-center">
                                {getGoogleMapsUrl() && (
                                    <a
                                        href={getGoogleMapsUrl()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full shadow-sm hover:scale-110 transition-transform duration-200 border border-gray-100"
                                        title={t('dealModal.openInGoogleMaps', 'Open in Google Maps')}
                                    >
                                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-[#4285F4]" />
                                    </a>
                                )}
                                {getWhatsAppUrl() && (
                                    <a
                                        href={getWhatsAppUrl()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center w-9 h-9 bg-white rounded-full shadow-md hover:scale-110 transition-transform duration-200 border border-gray-100"
                                        title={t('dealModal.contactViaWhatsApp', 'Contact via WhatsApp')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="w-9 h-9" viewBox="0.89 1.31 21 21">
                                            <g>
                                                <title>WhatsApp</title>
                                                <rect id="svg_1" fill="#25D366" rx="4" height="21" width="21" y="1.31486" x="0.88744" />
                                                <path stroke="null" id="svg_2" fill="white" d="m15.1625,12.86935c-0.2049,-0.10071 -1.21282,-0.58603 -1.40047,-0.65362c-0.18834,-0.06692 -0.32494,-0.10004 -0.46222,0.10139c-0.13591,0.20075 -0.52914,0.65294 -0.64849,0.78678c-0.11935,0.13451 -0.23939,0.15073 -0.44429,0.05069c-0.2049,-0.10139 -0.86581,-0.31295 -1.64882,-0.99699c-0.60917,-0.53263 -1.02103,-1.1903 -1.14038,-1.39173c-0.11935,-0.20075 -0.01242,-0.30957 0.08969,-0.40961c0.09244,-0.0899 0.20559,-0.23455 0.30769,-0.35148c0.10279,-0.11761 0.1366,-0.20143 0.20559,-0.33594c0.0683,-0.13383 0.03449,-0.25077 -0.01725,-0.35148c-0.05174,-0.10071 -0.46153,-1.08959 -0.63193,-1.49177c-0.16695,-0.39136 -0.33597,-0.33796 -0.46153,-0.34472c-0.11935,-0.00541 -0.25595,-0.00676 -0.39323,-0.00676c-0.1366,0 -0.35874,0.05002 -0.54639,0.25144c-0.18765,0.20075 -0.71748,0.68674 -0.71748,1.67562c0,0.9882 0.73473,1.94329 0.83683,2.0778c0.10279,0.13383 1.446,2.16296 3.50255,3.03288c0.48913,0.20683 0.87063,0.33053 1.16866,0.42245c0.4912,0.15344 0.93824,0.13181 1.29077,0.07976c0.39392,-0.05745 1.21282,-0.48599 1.38391,-0.95508c0.17109,-0.46909 0.17109,-0.87127 0.11935,-0.95508c-0.05105,-0.08381 -0.18765,-0.13383 -0.39323,-0.23455m-3.73987,5.00388l-0.00276,0a6.80916,6.67139 0 0 1 -3.47081,-0.93143l-0.24905,-0.14465l-2.58086,0.66376l0.68851,-2.46578l-0.16212,-0.2528a6.80226,6.66463 0 0 1 -1.04173,-3.55537c0.00069,-3.68379 3.06033,-6.68085 6.82158,-6.68085c1.8213,0 3.53359,0.6962 4.82092,1.95883a6.77812,6.64097 0 0 1 1.99584,4.72742c-0.00207,3.68379 -3.06102,6.68085 -6.81951,6.68085m5.804,-12.36741a8.15099,7.98606 0 0 0 -5.804,-2.35763c-4.5222,0 -8.20273,3.60606 -8.2048,8.03811c0,1.41674 0.37737,2.79968 1.09554,4.01838l-1.16453,4.16573l4.34972,-1.11798a8.19721,8.03135 0 0 0 3.92062,0.97874l0.00345,0c4.52151,0 8.20273,-3.60606 8.2048,-8.03878a8.15513,7.99012 0 0 0 -2.4008,-5.68656z" />
                                            </g>
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-[1600px] mx-auto px-4 pb-8">
                    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-200px)]">

                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className="lg:hidden fixed bottom-6 right-6 z-30 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                            aria-label="Open Filters"
                        >
                            <SlidersHorizontal className="w-6 h-6" />
                            <span className="font-semibold">{t("deals.filters", "Filters")}</span>
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

                        {/* Filters Sidebar (Desktop) */}
                        <aside className="hidden lg:block w-64 flex-shrink-0 lg:h-[calc(100vh-80px)] overflow-y-auto lg:sticky lg:top-4 z-10">
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

                        {/* Deals Content */}
                        <div className="flex-1 min-w-0 px-0 sm:px-6 py-6">

                            {/* Hot Deals Section */}
                            <InfiniteScrollSlider
                                title={t("deals.hotDealsToday")}
                                titleIcon={Flame}
                                loadDealsFunction={loadRestaurantDeals}
                                initialFilters={{
                                    business_id: id,
                                    is_hot_deal: true,
                                    deal_type: filters.deal_type,
                                    min_price: filters.min_price,
                                    max_price: filters.max_price,
                                    min_discount: filters.min_discount,
                                    max_discount: filters.max_discount,
                                    tags: filters.tags,
                                    text_search: filters.text_search,
                                    sort_by: filters.sort_by,
                                }}
                                userLocation={userLocation}
                                showLoadingInfo={true}
                                initialLimit={10}
                                batchSize={10}
                                onInitialLoad={({ dealsCount }) => setHotDealsCount(dealsCount)}
                            />

                            {/* Regular Deals Section */}
                            <div className="mt-8">
                                <InfiniteScrollSlider
                                    title={t("deals.allDeals", "All Deals")}
                                    titleIcon={null}
                                    loadDealsFunction={loadRestaurantDeals}
                                    initialFilters={{
                                        business_id: id,
                                        is_hot_deal: false,
                                        deal_type: filters.deal_type,
                                        min_price: filters.min_price,
                                        max_price: filters.max_price,
                                        min_discount: filters.min_discount,
                                        max_discount: filters.max_discount,
                                        tags: filters.tags,
                                        text_search: filters.text_search,
                                        sort_by: filters.sort_by,
                                    }}
                                    userLocation={userLocation}
                                    showLoadingInfo={false}
                                    initialLimit={10}
                                    batchSize={10}
                                    onInitialLoad={({ dealsCount }) => setRegularDealsCount(dealsCount)}
                                />
                            </div>

                            {hotDealsCount === 0 && regularDealsCount === 0 && !restLoading && (
                                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-dashed border-gray-200 mt-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                        <Tag className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No active deals</h3>
                                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                                        Check back later for new offers from {restaurant?.company_name}.
                                    </p>
                                </div>
                            )}

                            {/* QR Code Modal for claiming */}
                            {showQRModal && claimData && (
                                <QRCodeModal
                                    claimData={claimData}
                                    onClose={() => setShowQRModal(false)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CommonLayout>
    );
};

export default RestaurantDetailsPage;
