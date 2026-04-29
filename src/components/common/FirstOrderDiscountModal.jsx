import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Gift, X } from 'lucide-react';
import { api } from '../../utils/api';

const DEFAULT_CONFIG = {
  is_enabled: true,
  registration_window_value: 30,
  registration_window_unit: 'days',
  minimum_order_amount: 20,
  currency: 'MYR',
  discountType: {
    type: 'fixed',
    value: 10,
  },
};

const formatDiscount = (config) => {
  const type = config?.discountType?.type || 'fixed';
  const value = Number(config?.discountType?.value || 0);
  const currency = config?.currency || 'MYR';

  if (type === 'percentage') return `${value}%`;
  return `${currency} ${value.toFixed(2)}`;
};

const FirstOrderDiscountModal = ({ isOpen, onClose }) => {
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    if (!isOpen) return;

    const loadConfig = async () => {
      setLoadingConfig(true);
      try {
        const response = await api.get('/coupon/first-time-config');
        if (response && typeof response === 'object') {
          setConfig({
            ...DEFAULT_CONFIG,
            ...response,
            discountType: {
              ...DEFAULT_CONFIG.discountType,
              ...(response.discountType || {}),
            },
          });
        }
      } catch (error) {
        console.warn('Failed to fetch first-time coupon config, using defaults:', error);
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, [isOpen]);

  if (!isOpen) return null;

  const discountText = formatDiscount(config);
  const windowValue = Number(config?.registration_window_value || 30);
  const windowUnit = config?.registration_window_unit || 'days';
  const minimumOrder = Number(config?.minimum_order_amount || 0).toFixed(2);
  const currency = config?.currency || 'MYR';
  const isEnabled = Boolean(config?.is_enabled);

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Close discount modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-7">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Gift className="h-7 w-7 text-green-600" />
          </div>

          <h2 className="mb-2 text-2xl font-bold text-gray-900">Congratulations!</h2>
          <p className="mb-4 text-sm text-gray-600">
            Your account is ready. Place your first order and enjoy a special discount.
          </p>

          {isEnabled ? (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-gray-700">
              <p className="font-semibold text-green-800">{discountText} OFF on your first order</p>
              <p className="mt-1">
                Valid for {windowValue} {windowUnit} from registration.
              </p>
              <p className="mt-1">
                Minimum order: {currency} {minimumOrder}
              </p>
            </div>
          ) : (
            <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              Your first-order discount campaign is currently not active.
            </div>
          )}

          <p className="mb-6 text-sm text-gray-600">
            Order before it expires to claim your first-order reward.
          </p>

          <button
            type="button"
            onClick={onClose}
            disabled={loadingConfig}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loadingConfig ? 'Loading offer...' : 'Start Ordering'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FirstOrderDiscountModal;
