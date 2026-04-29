import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker';
import { X, Truck, UtensilsCrossed, ShoppingBag, Calendar } from 'lucide-react';

const ClaimDealModal = ({ isOpen, onClose, onSubmit, deal }) => {
  const { t } = useTranslation();
  const [preferredServiceType, setPreferredServiceType] = useState('');
  const [preferredDateTime, setPreferredDateTime] = useState(null);
  const [isDateTimeOpen, setIsDateTimeOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Get available consumption types from deal
  const availableServiceTypes = deal?.consumptionType || [];
  
  // Map consumption types to API values
  const serviceTypeMap = {
    'delivery': 'delivery',
    'dine-in': 'dine_in',
    'self_pickup': 'pickup'
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get deal validity dates
  const dealStartDate = deal?.start_date ? new Date(deal.start_date) : new Date(getTodayDate());
  const dealEndDate = deal?.end_date ? new Date(deal.end_date) : null;
  const today = new Date(getTodayDate());
  const effectiveMinDate = dealStartDate > today ? dealStartDate : today;

  // Combine date and time into ISO datetime string in user's timezone
  useEffect(() => {
    if (preferredServiceType === 'delivery') {
      setPreferredDateTime(null);
    }
  }, [preferredServiceType]);

  // Validate form
  const validate = () => {
    const newErrors = {};

    // Require service type when options are available
    if (availableServiceTypes.length > 0 && !preferredServiceType) {
      newErrors.serviceType = t('dealModal.serviceTypeRequired', 'Service type is required');
    }

    // Validate service type selection
    if (preferredServiceType && !availableServiceTypes.includes(preferredServiceType)) {
      newErrors.serviceType = t('dealModal.serviceTypeNotAvailable', 'Selected service type is not available for this deal');
    }

    if (preferredServiceType !== 'delivery') {
      if (!preferredDateTime) {
        newErrors.date = t('dealModal.dateTimeRequired', 'Date and time are required');
      } else {
        const selectedDateTime = new Date(preferredDateTime);
        const now = new Date();
        if (selectedDateTime <= now) {
          newErrors.date = t('dealModal.datetimeMustBeFuture', 'Date and time must be in the future');
        }
        if (dealStartDate) {
          const startDate = new Date(dealStartDate);
          startDate.setHours(0, 0, 0, 0);
          if (selectedDateTime < startDate) {
            newErrors.date = t('dealModal.dateWithinValidity', 'Date must be within deal validity period');
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const claimOptions = {};
      
      if (preferredServiceType) {
        claimOptions.preferred_service_type = serviceTypeMap[preferredServiceType];
      }
      
      // Combine date and time into preferred_datetime if both are provided
      if (preferredServiceType !== 'delivery' && preferredDateTime) {
        claimOptions.preferred_datetime = preferredDateTime.toISOString();
      }

      await onSubmit(claimOptions);
      // Reset form
      setPreferredServiceType('');
      setPreferredDateTime(null);
      setErrors({});
    } catch (error) {
      console.error('Error in claim modal:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form on close
    setPreferredServiceType('');
    setPreferredDateTime(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('dealModal.setPreferences', 'Set Your Preferences')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('dealModal.preferencesRequired', 'All fields are required')}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Type */}
          {availableServiceTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  {t('dealModal.preferredServiceType', 'Preferred Service Type')}
                </div>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableServiceTypes.map((type) => {
                  const isSelected = preferredServiceType === type;
                  const Icon = type === 'delivery' ? Truck : type === 'dine-in' ? UtensilsCrossed : ShoppingBag;
                  const label = type === 'delivery' 
                    ? t('dealCard.delivery', 'Delivery')
                    : type === 'dine-in'
                    ? t('dealCard.dineIn', 'Dine-in')
                    : t('dealCard.selfPickup', 'Pickup');

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPreferredServiceType(type)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.serviceType && (
                <p className="text-red-500 text-xs mt-1">{errors.serviceType}</p>
              )}
            </div>
          )}

          {preferredServiceType === 'delivery' ? (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
              {t('dealModal.deliverySchedulingNote', 'Delivery time is arranged by the restaurant. Please contact them after claiming.')}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('dealModal.preferredDateTime', 'Preferred Date & Time')}
                </div>
              </label>
              <DatePicker
                selected={preferredDateTime}
                onChange={(date, event) => {
                  setPreferredDateTime(date);
                  const isTimeClick = event?.target?.closest?.('.react-datepicker__time-list-item');
                  if (isTimeClick) {
                    setIsDateTimeOpen(false);
                  }
                }}
                minDate={effectiveMinDate}
                maxDate={undefined}
                showTimeSelect
                timeIntervals={15}
                timeCaption={t('common.time', 'Time')}
                placeholderText={t('dealModal.preferredDateTime', 'Preferred Date & Time')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                dateFormat="yyyy-MM-dd HH:mm"
                popperPlacement="bottom-start"
                popperModifiers={[
                  { name: 'offset', options: { offset: [0, 8] } }
                ]}
                open={isDateTimeOpen}
                onClickOutside={() => setIsDateTimeOpen(false)}
                onInputClick={() => setIsDateTimeOpen(true)}
                onFocus={() => setIsDateTimeOpen(true)}
                shouldCloseOnSelect={false}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('dealModal.claiming', 'Claiming...')}
                </>
              ) : (
                t('dealModal.claimDeal', 'Claim Deal')
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {t('dealModal.close', 'Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimDealModal;

