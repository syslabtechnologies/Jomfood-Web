import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  cancelText,
  confirmButtonClass = 'bg-red-500 hover:bg-red-600',
  loading = false
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackgroundClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {title || t('common.confirm', 'Confirm')}
              </h2>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Message */}
        <p className="text-gray-600 text-sm mb-6">
          {message || t('common.confirmMessage', 'Are you sure you want to proceed?')}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText || t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 ${confirmButtonClass} text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('common.processing', 'Processing...')}
              </>
            ) : (
              confirmText || t('common.confirm', 'Confirm')
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;

