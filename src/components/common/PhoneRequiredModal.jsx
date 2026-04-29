import React, { useState, useEffect } from 'react';
import { X, Phone, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '../../utils/toast';
import CountryPhoneInput from './CountryPhoneInput';

const PhoneRequiredModal = ({ isOpen, onClose, onSubmit, userName, required = false }) => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast.error(t('profile.phoneRequired', 'Phone number is required'));
      return;
    }

    setLoading(true);
    try {
      const normalized = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`;
      await onSubmit(normalized);
      toast.success(t('profile.phoneUpdated', 'Phone number updated successfully'));
      onClose();
    } catch (error) {
      toast.error(error.message || t('profile.updateFailed', 'Failed to update phone number'));
    } finally {
      setLoading(false);
    }
  };

  // Reset phone when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhone('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('profile.phoneRequired', 'Phone Number Required')}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Message */}
        <p className="text-gray-600 text-sm mb-6">
          {t('profile.phoneRequiredMessage', 'We need your phone number to send you important updates about your deals.')}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.phoneLabel', 'Phone Number')} <span className="text-red-500">*</span>
            </label>
            <CountryPhoneInput
              value={phone}
              onChange={(value) => setPhone(value)}
              placeholder={t('profile.phonePlaceholder', '+92301123456')}
              id="phone"
              required
              autoFocus
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('common.saving', 'Saving...') : t('profile.savePhone', 'Save Phone Number')}
            </button>
            {!required && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full text-gray-600 py-2 px-6 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('profile.addLater', "I'll add it later")}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhoneRequiredModal;

