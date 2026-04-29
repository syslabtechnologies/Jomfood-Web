import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker';
import { X, Calendar } from 'lucide-react';

const RescheduleModal = ({ isOpen, onClose, onSubmit, deal, currentDate, currentTime }) => {
  const { t } = useTranslation();
  // Initialize with current values if provided
  const getInitialDateTime = () => {
    if (currentDate && typeof currentDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(currentDate)) {
      const [year, month, day] = currentDate.split('-').map(Number);
      let hours = 0;
      let minutes = 0;
      if (currentTime && typeof currentTime === 'string') {
        const match = currentTime.match(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/);
        if (match) {
          hours = Number(match[1]);
          minutes = Number(match[2]);
        }
      }
      return new Date(year, month - 1, day, hours, minutes, 0, 0);
    }
    const parsed = new Date(currentDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  };
  
  const [preferredDateTime, setPreferredDateTime] = useState(getInitialDateTime());
  const [isDateTimeOpen, setIsDateTimeOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Update state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreferredDateTime(getInitialDateTime());
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!preferredDateTime) {
      newErrors.date = t('dealModal.dateTimeRequired', 'Date and time are required');
    } else {
      const selectedDate = new Date(preferredDateTime);
      const today = new Date();
      if (selectedDate <= today) {
        newErrors.date = t('dealModal.datetimeMustBeFuture', 'Date and time must be in the future');
      }
      if (dealStartDate) {
        const startDate = new Date(dealStartDate);
        startDate.setHours(0, 0, 0, 0);
        if (selectedDate < startDate) {
          newErrors.date = t('dealModal.dateWithinValidity', 'Date must be within deal validity period');
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Combine date and time into ISO datetime string in user's timezone
  const combineDateTime = (dateTime) => {
    if (!dateTime) return null;
    return new Date(dateTime).toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      // Combine date and time into preferred_datetime
      const combinedDateTime = combineDateTime(preferredDateTime);
      if (combinedDateTime) {
        await onSubmit(combinedDateTime);
      }
      // Reset form
      setPreferredDateTime(null);
      setErrors({});
    } catch (error) {
      console.error('Error in reschedule modal:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset to current values on close
    setPreferredDateTime(getInitialDateTime());
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
            <h2 className="text-xl font-bold text-gray-900">{t('dealModal.rescheduleDeal', 'Reschedule Deal')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('dealModal.rescheduleDescription', 'Choose a new date and time for your deal')}</p>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('dealModal.preferredDateTime', 'Preferred Date & Time')} <span className="text-red-500">*</span>
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
                  {t('dealModal.rescheduling', 'Rescheduling...')}
                </>
              ) : (
                t('dealModal.reschedule', 'Reschedule')
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

export default RescheduleModal;

