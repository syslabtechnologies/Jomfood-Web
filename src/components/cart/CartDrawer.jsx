import React, { useEffect, useMemo, useState } from 'react';
import { X, ShoppingCart, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { cartAPI } from '../../utils/api';
import { toast } from '../../utils/toast';
import LoginRequiredModal from '../auth/LoginRequiredModal';
import PhoneRequiredModal from '../common/PhoneRequiredModal';
import DealPreferencesSelector from '../deals/DealPreferencesSelector';

const CartDrawer = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { items, removeItem, updateItemQuantity, clearCart, totals, businessName, reload } = useCart();
  const { user, updateProfile } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (isOpen && reload) {
      reload();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  const fetchCouponPreview = async (code = null, showError = false) => {
    if (!user?._id || !items.length) {
      setCouponPreview(null);
      return null;
    }
    try {
      setCouponLoading(true);
      const response = await cartAPI.couponPreview(user._id, code || null);
      const data = response?.data?.data || null;
      setCouponPreview(data);
      if (showError && data?.manual_coupon_error) {
        toast.error(data.manual_coupon_error);
      }
      return data;
    } catch (error) {
      if (showError) {
        toast.error(error?.response?.data?.message || error?.message || t('cart.couponInvalid', 'Invalid coupon'));
      }
      setCouponPreview(null);
      return null;
    } finally {
      setCouponLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !user?._id || !items.length) {
      setCouponPreview(null);
      setCouponCode('');
      return;
    }
    fetchCouponPreview(null);
  }, [isOpen, user?._id, items.length]);

  const availableServiceTypes = useMemo(() => {
    if (!items.length) return [];
    const mapped = items.map((item) => item.consumptionType || []);
    const intersection = mapped.reduce((acc, list) => acc.filter((value) => list.includes(value)));
    if (intersection.length) return intersection;
    return Array.from(new Set(mapped.flat()));
  }, [items]);

  const formatPrice = (value) => `RM ${Number(value || 0).toFixed(2)}`;

  const handleQuantityChange = async (item, nextQty) => {
    const quantity = Math.max(1, Number(nextQty || 1));
    await updateItemQuantity(item.id, quantity);
  };

  const handlePhoneSubmit = async (phone) => {
    if (!user?._id) return;
    await updateProfile({ phone });
  };

  const handleClaimDeals = async () => {
    if (!items.length) return;
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!user.phone || user.phone.trim() === '') {
      setShowPhoneModal(true);
      return;
    }
    try {
      setSubmitting(true);
      const response = await cartAPI.checkoutCart(
        user._id,
        null,
        null,
        couponPreview?.applied_coupon?.source === 'manual'
          ? couponPreview?.applied_coupon?.coupon_code
          : null
      );
      if (response?.data?.success) {
        const paymentUrl = response?.data?.data?.payment_url;
        if (paymentUrl) {
          window.location.href = paymentUrl;
          return;
        }
        toast.error(t('cart.claimFailed', 'Failed to start payment'));
      } else {
        toast.error(response?.data?.message || t('cart.claimFailed', 'Failed to start payment'));
        if (reload) reload();
      }
    } catch (error) {
      toast.error(error?.message || t('cart.claimFailed', 'Failed to claim deals'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('cart.title', 'Your Cart')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">
              {t('cart.empty', 'Your cart is empty.')}
            </div>
          ) : (
            <>
              <div className="mb-4 text-xs text-gray-500">
                {businessName ? t('cart.businessLabel', 'Restaurant:') : ''}
                {businessName ? ` ${businessName}` : ''}
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 border border-gray-200 rounded-lg p-3">
                    <div className="h-16 w-16 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                      {item.deal_image ? (
                        <img src={item.deal_image} alt={item.deal_name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {item.deal_name}
                      </div>
                      <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 border border-gray-200 rounded-md overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, Number(item.quantity || 1) - 1)}
                            disabled={Number(item.quantity || 1) <= 1}
                            className="h-7 w-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:text-gray-300 disabled:bg-gray-50"
                            aria-label={t('common.decrease', 'Decrease')}
                            title={t('common.decrease', 'Decrease')}
                          >
                            -
                          </button>
                          <input
                            type="text"
                            readOnly
                            value={Number(item.quantity || 1)}
                            className="w-8 text-center bg-white text-gray-800 font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, Number(item.quantity || 1) + 1)}
                            className="h-7 w-7 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                            aria-label={t('common.increase', 'Increase')}
                            title={t('common.increase', 'Increase')}
                          >
                            +
                          </button>
                        </div>
                        <span className="font-semibold text-gray-700">
                          {formatPrice(Number(item.deal_total || 0) * Number(item.quantity || 1))}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmRemove(item)}
                      className="p-2 text-gray-400 hover:text-red-500"
                      aria-label={t('cart.remove', 'Remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {availableServiceTypes.length > 0 && (
                <div className="mt-3">
                  <DealPreferencesSelector
                    readOnly
                    availableServiceTypes={availableServiceTypes}
                  />
                </div>
              )}

              <div
                className={`border-t border-gray-200 space-y-4 ${
                  availableServiceTypes.length > 0 ? 'mt-3 pt-3' : 'mt-6 pt-4'
                }`}
              >
                <div className="space-y-3">
                  {couponPreview?.applied_coupon?.source === 'first_time' && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                      {couponPreview?.first_time_message || t('cart.firstTimeCouponApplied', 'Congratulations! First-time discount applied.')}
                    </div>
                  )}
                  {couponPreview?.applied_coupon?.source !== 'first_time' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('cart.couponCode', 'Coupon Code')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder={t('cart.enterCouponCode', 'Enter coupon code')}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => fetchCouponPreview(couponCode, true)}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-3 py-2 rounded-lg border border-orange-200 text-orange-600 text-sm font-medium disabled:opacity-50"
                        >
                          {couponLoading ? t('common.loading', '...') : t('cart.applyCoupon', 'Apply')}
                        </button>
                      </div>
                    </div>
                  )}
                  {couponPreview?.applied_coupon?.source === 'manual' && (
                    <div className="text-xs text-green-600">
                      {t('cart.couponApplied', 'Coupon applied')}: {couponPreview.applied_coupon.coupon_code}
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>{t('cart.subtotal', 'Subtotal')}</span>
              <span className="font-semibold">{formatPrice(couponPreview?.subtotal_amount ?? totals.total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-red-600">
              <span>{t('cart.couponDiscount', 'Coupon Discount')}</span>
              <span className="font-semibold">- {formatPrice(couponPreview?.coupon_discount_amount ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-900">
              <span>{t('cart.total', 'Total')}</span>
              <span className="font-semibold">
                {formatPrice(couponPreview?.total_after_coupon ?? (totals.total - (couponPreview?.coupon_discount_amount || 0)))}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClaimDeals}
              disabled={submitting || items.length === 0}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {submitting ? t('cart.claiming', 'Proceeding to Payment...') : t('cart.claimDeals', 'Proceed to Payment')}
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium"
            >
              {t('cart.clear', 'Clear Cart')}
            </button>
          </div>
        )}
      </div>

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        module="deal"
        itemName={t('cart.title', 'Cart')}
        returnPath="/"
      />
      <PhoneRequiredModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSubmit={handlePhoneSubmit}
        userName={user?.name}
        required={true}
      />

      {confirmRemove && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setConfirmRemove(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-[61] w-[340px] max-w-[90vw]">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {t('cart.removeItemTitle', 'Remove Item')}
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {t('cart.removeItemMessage', 'Are you sure you want to remove "{{name}}" from your cart?', { name: confirmRemove.deal_name })}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => { removeItem(confirmRemove.id); setConfirmRemove(null); }}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
              >
                {t('common.delete', 'Remove')}
              </button>
            </div>
          </div>
        </>
      )}

      {showClearConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowClearConfirm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-[61] w-[340px] max-w-[90vw]">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {t('cart.clearCartTitle', 'Clear Cart')}
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {t('cart.clearCartMessage', 'Are you sure you want to remove all items from your cart?')}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => { clearCart(); setShowClearConfirm(false); }}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
              >
                {t('cart.clear', 'Clear Cart')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CartDrawer;
