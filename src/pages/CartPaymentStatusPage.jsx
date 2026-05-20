import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import CommonLayout from '../components/layout/CommonLayout';
import { cartAPI } from '../utils/api';

const AUTO_REDIRECT_MS = 3000;

const CartPaymentStatusPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const [status, setStatus] = useState('pending');
  const [claimId, setClaimId] = useState(null);
  const [cartPurchaseId, setCartPurchaseId] = useState(null);
  const autoRedirectCancelledRef = useRef(false);
  const redirectTimerRef = useRef(null);
  const [claimPending, setClaimPending] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId;
    const fetchStatus = async () => {
      if (!paymentId) return;
      try {
        const response = await cartAPI.getCartPaymentStatus(paymentId);
        const data = response?.data?.data || response?.data || {};
        const nextStatus = data?.status || 'pending';
        const nextClaimId = data?.claim_id || data?.claim_result?.data?.claim_id || null;
        const pending = Boolean(data?.claim_pending);
        const failedClaim = data?.claim_result?.success === false;

        setStatus(nextStatus);
        setClaimId(nextClaimId);
        setCartPurchaseId(data?.cart_purchase_id || data?.claim_result?.data?.cart_purchase_id || null);
        setClaimPending(pending);
        setClaimError(failedClaim ? (data?.claim_result?.message || 'Deal could not be added to My Deals.') : '');

        if (
          (nextStatus === 'paid' && nextClaimId && !pending) ||
          nextStatus === 'failed' ||
          nextStatus === 'cancelled'
        ) {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Failed to get payment status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 3000);
    return () => clearInterval(intervalId);
  }, [paymentId]);

  const isPaid = status === 'paid';
  const isSuccess = isPaid && claimId && !claimPending;
  const isFailed = status === 'failed' || status === 'cancelled';
  const isPaidButClaimPending = isPaid && (claimPending || !claimId);
  const openClaimId = claimId || cartPurchaseId;
  const viewDealHref = openClaimId ? `/my-deals?openClaim=${openClaimId}` : '/my-deals';

  const cancelAutoRedirect = useCallback(() => {
    autoRedirectCancelledRef.current = true;
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  }, []);

  const goToViewDeal = useCallback(() => {
    cancelAutoRedirect();
    navigate(viewDealHref);
  }, [cancelAutoRedirect, navigate, viewDealHref]);

  useEffect(() => {
    if (!isSuccess) return undefined;

    autoRedirectCancelledRef.current = false;
    redirectTimerRef.current = setTimeout(() => {
      if (!autoRedirectCancelledRef.current) {
        navigate(viewDealHref);
      }
    }, AUTO_REDIRECT_MS);

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [isSuccess, navigate, viewDealHref]);

  return (
    <CommonLayout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          {loading && (
            <>
              <div className="flex items-center justify-center mb-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('cart.paymentProcessing', 'Payment processing')}
              </h2>
              <p className="text-gray-600">
                {t('cart.paymentProcessingHint', "We're confirming your payment. Please wait...")}
              </p>
            </>
          )}

          {!loading && isPaidButClaimPending && (
            <>
              <div className="flex items-center justify-center mb-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('cart.paymentProcessing', 'Payment processing')}
              </h2>
              <p className="text-gray-600 mb-2">
                {t('cart.paymentPaidAddingDeal', 'Payment received. Adding your deal to My Deals...')}
              </p>
              {claimError && (
                <p className="text-sm text-red-600 mb-4">{claimError}</p>
              )}
            </>
          )}

          {!loading && isSuccess && (
            <>
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('cart.paymentSuccess', 'Payment successful')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('cart.paymentSuccessSetPreferences', 'Payment confirmed. Open your deal to set service preferences.')}
              </p>
              <p className="text-sm text-gray-500 mb-2">
                {t('cart.redirectingToMyDeals', 'Opening your deal in My Deals...')}
              </p>
              <div className="w-full max-w-xs mx-auto h-1.5 bg-gray-200 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-primary rounded-full origin-left"
                  style={{
                    animation: `paymentRedirectProgress ${AUTO_REDIRECT_MS}ms linear forwards`,
                    transform: 'scaleX(0)',
                  }}
                />
              </div>
              <style>{`
                @keyframes paymentRedirectProgress {
                  from { transform: scaleX(0); }
                  to { transform: scaleX(1); }
                }
              `}</style>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={goToViewDeal}
                  className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-600"
                >
                  {t('cart.viewDeal', 'View Deal')}
                </button>
                <Link
                  to="/"
                  onClick={cancelAutoRedirect}
                  className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
                >
                  {t('cart.backToDeals', 'Back to Deals')}
                </Link>
              </div>
            </>
          )}

          {!loading && isFailed && (
            <>
              <div className="flex items-center justify-center mb-4">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('cart.paymentFailed', 'Payment failed')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('cart.paymentFailedHint', 'Payment was not completed. Please try again.')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/" className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-600">
                  {t('cart.tryAgain', 'Try Again')}
                </Link>
                <Link to="/" className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">
                  {t('cart.backToDeals', 'Back to Deals')}
                </Link>
              </div>
            </>
          )}

          {!loading && !isSuccess && !isFailed && (
            <>
              <div className="flex items-center justify-center mb-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('cart.paymentProcessing', 'Payment processing')}
              </h2>
              <p className="text-gray-600">
                {t('cart.paymentProcessingHint', "We're confirming your payment. Please wait...")}
              </p>
            </>
          )}
        </div>
      </div>
    </CommonLayout>
  );
};

export default CartPaymentStatusPage;
