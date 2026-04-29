import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

const FiltersSidebar = ({
  filters,
  sortOptions,
  dealTypes,
  availableTags,
  loadingTags,
  priceRange,
  discountRange,
  priceMinInput,
  priceMaxInput,
  discountMinInput,
  discountMaxInput,
  textSearchInput,
  handleDealTypeChange,
  handleSortChange,
  handlePriceInputChange,
  handlePriceInputBlur,
  handleDiscountInputChange,
  handleDiscountInputBlur,
  handleClearFilters,
  setTextSearchInput,
  setPriceRange,
  setDiscountRange,
  setPriceMinInput,
  setPriceMaxInput,
  setDiscountMinInput,
  setDiscountMaxInput,
  setFilters,
  t
}) => {
  const [localText, setLocalText] = useState(textSearchInput || '');

  useEffect(() => {
    setLocalText(textSearchInput || '');
  }, [textSearchInput]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setTextSearchInput(localText);
    }, 500);
    return () => clearTimeout(handler);
  }, [localText, setTextSearchInput]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 h-fit lg:sticky lg:top-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-gray-900">{t("deals.filters", "Filters")}</h2>
        </div>
        <button
          onClick={handleClearFilters}
          className="text-xs text-primary hover:text-primary-600 font-medium"
        >
          {t("common.clear")}
        </button>
      </div>

      <div className="space-y-6 lg:max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
        {/* Sort By */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t("deals.sortBy")}
          </label>
          <div className="space-y-2">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                    filters.sort_by === option.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Deal Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t("deals.dealType")}
          </label>
          <div className="space-y-2">
            {dealTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => handleDealTypeChange(type.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                    filters.deal_type === type.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Search */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t("deals.search")}
          </label>
          <input
            type="text"
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            placeholder={t("deals.searchPlaceholder")}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
        </div>

        {/* Price Range */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-700">
              {t("deals.priceRange")}
            </label>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              RM {priceRange[0]} - RM {priceRange[1]}
            </span>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <input
                type="number"
                value={priceMinInput}
                onChange={(e) => handlePriceInputChange('min', e.target.value)}
                onBlur={handlePriceInputBlur}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <input
                type="number"
                value={priceMaxInput}
                onChange={(e) => handlePriceInputChange('max', e.target.value)}
                onBlur={handlePriceInputBlur}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="1000"
                min="0"
              />
            </div>
          </div>

          {/* Range Slider */}
          <div className="relative">
            <div className="relative h-6 flex items-center w-[90%] mx-auto">
              {/* Track */}
              <div className="absolute w-full h-2 bg-gray-200 rounded-lg"></div>

              {/* Active Range */}
              <div
                className="absolute h-2 bg-primary rounded-lg"
                style={{
                  left: `${(priceRange[0] / Math.max(500, priceMaxInput + 100)) * 100}%`,
                  width: `${((priceRange[1] - priceRange[0]) / Math.max(500, priceMaxInput + 100)) * 100}%`
                }}
              ></div>

              {/* Min Handle - Visual indicator only */}
              <div
                className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg z-30 pointer-events-none"
                style={{
                  left: `calc(${(priceRange[0] / Math.max(500, priceMaxInput + 100)) * 100}% - 8px)`,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              ></div>

              {/* Max Handle - Visual indicator only */}
              <div
                className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg z-30 pointer-events-none"
                style={{
                  left: `calc(${(priceRange[1] / Math.max(500, priceMaxInput + 100)) * 100}% - 8px)`,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Discount Range */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-700">
              {t("deals.discountRange")}
            </label>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              {discountRange[0]}% - {discountRange[1]}%
            </span>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <input
                type="number"
                value={discountMinInput}
                onChange={(e) => handleDiscountInputChange('min', e.target.value)}
                onBlur={handleDiscountInputBlur}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
            <div>
              <input
                type="number"
                value={discountMaxInput}
                onChange={(e) => handleDiscountInputChange('max', e.target.value)}
                onBlur={handleDiscountInputBlur}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="100"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Range Slider */}
          <div className="relative">
            <div className="relative h-6 flex items-center w-[90%] mx-auto">
              {/* Track */}
              <div className="absolute w-full h-2 bg-gray-200 rounded-lg"></div>

              {/* Active Range */}
              <div
                className="absolute h-2 bg-primary rounded-lg"
                style={{
                  left: `${discountRange[0]}%`,
                  width: `${discountRange[1] - discountRange[0]}%`
                }}
              ></div>

              {/* Min Handle - Visual indicator only, input fields handle changes */}
              <div
                className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg z-30 pointer-events-none"
                style={{
                  left: `calc(${discountRange[0]}% - 8px)`,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              ></div>

              {/* Max Handle - Visual indicator only, input fields handle changes */}
              <div
                className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg z-30 pointer-events-none"
                style={{
                  left: `calc(${discountRange[1]}% - 8px)`,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tags/Special Offers */}
        {availableTags && availableTags.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {t("deals.specialOffers", "Special Offers")}
            </label>
            {loadingTags ? (
              <div className="flex items-center gap-2 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-xs text-gray-500">{t("deals.loadingTags")}</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = filters.tags && filters.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        const currentTags = filters.tags || [];
                        if (isSelected) {
                          setFilters(prev => ({
                            ...prev,
                            tags: currentTags.filter(t => t !== tag),
                            page: 1
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            tags: [...currentTags, tag],
                            page: 1
                          }));
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FiltersSidebar;

