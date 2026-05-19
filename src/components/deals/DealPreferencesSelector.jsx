import React, { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import { Truck, UtensilsCrossed, ShoppingBag, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SERVICE_TYPE_MAP = {
  delivery: 'delivery',
  'dine-in': 'dine_in',
  self_pickup: 'pickup',
};

const DealPreferencesSelector = ({
  availableServiceTypes = [],
  readOnly = false,
  preferredServiceType,
  onPreferredServiceTypeChange,
  preferredDateTime,
  onPreferredDateTimeChange,
  dateTimeError = false,
}) => {
  const { t } = useTranslation();
  const [isDateTimeOpen, setIsDateTimeOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [pickerDirection, setPickerDirection] = useState('bottom');
  const dateFieldRef = useRef(null);
  const timeItemClickRef = useRef(false);

  const types = useMemo(() => {
    if (!availableServiceTypes?.length) return [];
    return availableServiceTypes;
  }, [availableServiceTypes]);

  useEffect(() => {
    if (readOnly || !types.length) return;
    if (!types.includes(preferredServiceType)) {
      onPreferredServiceTypeChange?.(types[0]);
    }
  }, [types, preferredServiceType, readOnly, onPreferredServiceTypeChange]);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 417);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isDateTimeOpen) return;
    const updatePickerDirection = () => {
      if (!dateFieldRef.current) return;
      const rect = dateFieldRef.current.getBoundingClientRect();
      const estimatedPickerHeight = 300;
      const spaceBelow = window.innerHeight - rect.bottom;
      setPickerDirection(spaceBelow < estimatedPickerHeight ? 'top' : 'bottom');
    };
    updatePickerDirection();
    window.addEventListener('resize', updatePickerDirection);
    return () => window.removeEventListener('resize', updatePickerDirection);
  }, [isDateTimeOpen]);

  const getTypeLabel = (type) => {
    if (type === 'delivery') return t('dealCard.delivery', 'Delivery');
    if (type === 'dine-in') return t('dealCard.dineIn', 'Dine-in');
    return t('dealCard.selfPickup', 'Pickup');
  };

  const getTypeIcon = (type) => {
    if (type === 'delivery') return Truck;
    if (type === 'dine-in') return UtensilsCrossed;
    return ShoppingBag;
  };

  const renderTypeButton = (type) => {
    const Icon = getTypeIcon(type);
    const label = getTypeLabel(type);
    const isSelected = preferredServiceType === type;
    return (
      <button
        key={type}
        type="button"
        onClick={() => onPreferredServiceTypeChange?.(type)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${
          isSelected
            ? 'border-orange-500 bg-orange-50 text-orange-600'
            : 'border-gray-200 text-gray-700 hover:border-gray-300'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    );
  };

  const readOnlyChipClass = {
    delivery: 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-medium',
    'dine-in': 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-200 text-xs font-medium',
    self_pickup: 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-xs font-medium',
  };

  const renderReadOnlyChip = (type) => {
    const Icon = getTypeIcon(type);
    const label = getTypeLabel(type);
    return (
      <span key={type} className={readOnlyChipClass[type] || readOnlyChipClass.delivery}>
        <Icon className="w-3.5 h-3.5" aria-hidden />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {types.length > 0 && readOnly && (
        <div className="flex flex-wrap gap-2">
          {types.map(renderReadOnlyChip)}
        </div>
      )}

      {types.length > 0 && !readOnly && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            {t('cart.selectServiceType', 'Select service type')}
          </p>
          <div className="flex flex-wrap gap-2">
            {types.map(renderTypeButton)}
          </div>
        </div>
      )}

      {!readOnly && preferredServiceType === 'delivery' && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
          {t('cart.deliverySchedulingNote', 'Contact the restaurant for delivery charges and details.')}
        </div>
      )}

      {!readOnly && preferredServiceType && preferredServiceType !== 'delivery' && (
        <div ref={dateFieldRef} className="relative text-sm font-medium text-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4" />
            {t('dealModal.preferredDateTime', 'Preferred Date & Time')}
          </div>
          <button
            type="button"
            onClick={() => {
              onPreferredDateTimeChange?.(preferredDateTime, { clearError: true });
              setIsDateTimeOpen((prev) => !prev);
            }}
            className={`w-full text-left px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
              dateTimeError
                ? 'border-red-500 text-red-700 focus:ring-red-200'
                : 'border-gray-300 focus:ring-orange-500'
            }`}
          >
            {preferredDateTime
              ? preferredDateTime.toLocaleString('sv-SE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).replace(',', '')
              : t('dealModal.preferredDateTime', 'Preferred Date & Time')}
          </button>
          {isDateTimeOpen && !isSmallScreen && (
            <div
              className={`absolute left-0 z-30 w-full ${pickerDirection === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
            >
              <DatePicker
                selected={preferredDateTime}
                onChange={(date) => {
                  onPreferredDateTimeChange?.(date);
                  if (timeItemClickRef.current) {
                    setIsDateTimeOpen(false);
                    timeItemClickRef.current = false;
                  }
                }}
                minDate={new Date()}
                showTimeSelect
                timeIntervals={15}
                timeCaption={t('common.time', 'Time')}
                inline
                shouldCloseOnSelect={false}
                calendarClassName="cart-datetime-inline"
              />
            </div>
          )}
          {dateTimeError && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {t('cart.selectDateTimeInline', 'Please select a date and time.')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export { SERVICE_TYPE_MAP };
export default DealPreferencesSelector;
