import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const formatRM = (val) => `RM${Number(val || 0).toFixed(2)}`;
const formatDate = (val, opts) => {
  if (!val) return '-';
  const d = new Date(val);
  const o = opts || { month: 'short', day: '2-digit', year: 'numeric' };
  return d.toLocaleDateString(undefined, o);
};
const formatDateTime = (val) => {
  if (!val) return '-';
  const d = new Date(val);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const MyClaimModal = ({ claim, onClose, onOpenDeal }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  if (!claim) return null;

  const title =
    claim?.deal_name ??
    claim?.deal_details?.deal_name ??
    (typeof claim?.deal_id === 'object' ? claim?.deal_id?.deal_name : '');

  const subtitle =
    claim?.business_id?.company_name ||
    claim?.group_id?.name ||
    '';

  const qrSrc =
    claim?.qr_code_public_url ||
    claim?.qr_code_image ||
    '';

  const price =
    claim?.deal_total ??
    claim?.deal_details?.deal_total ??
    (typeof claim?.deal_id === 'object' ? claim?.deal_id?.deal_total : 0);

  const address = claim?.business_id?.address || '';

  const status = claim?.status || '';
  const isActive = status === 'active';
  const isRedeemed = status === 'redeemed';

  const goToDetails = () => {
    const dealId =
      (typeof claim?.deal_id === 'string' ? claim?.deal_id : claim?.deal_details?._id) ||
      claim?.deal_details?._id;
    if (dealId) {
      if (onOpenDeal) {
        onOpenDeal(dealId);
      } else {
        navigate(`/deals?dealId=${dealId}&autoOpen=true`);
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex-shrink-0 border-b px-5 py-4 relative">
          <div className="pr-8">
            <div className="text-lg font-semibold text-gray-900">{title}</div>
            <div className="text-sm text-gray-600">{subtitle}</div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-center justify-center">
            {qrSrc ? (
              <img src={qrSrc} alt={t('myDeals.qrAlt', 'QR Code')} className="w-56 h-56 border rounded-md" />
            ) : (
              <div className="text-sm text-gray-500">{t('myDeals.qrNotAvailable', 'QR not available')}</div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">{t('myDeals.price', 'Price')}</div>
              <div className="text-base font-semibold text-primary">{formatRM(price)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500">{t('myDeals.claimedAt', 'Claimed At')}</div>
              <div className="text-sm font-medium">{formatDateTime(claim?.claimed_at)}</div>
            </div>
            {isActive && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500">{t('myDeals.expiresAt', 'Expires At')}</div>
                <div className="text-sm font-medium">{formatDate(claim?.expires_at)}</div>
                <div className="text-xs text-red-600 mt-1">{t('myDeals.useBeforeExpiry', 'Use before expiry')}</div>
              </div>
            )}
            {isRedeemed && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500">{t('myDeals.redeemedAt', 'Redeemed At')}</div>
                <div className="text-sm font-medium">{formatDateTime(claim?.redeemed_at)}</div>
              </div>
            )}
            {address && (
              <div className="sm:col-span-2 bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500">{t('myDeals.address', 'Address')}</div>
                <div className="text-sm font-medium">{address}</div>
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 border-t bg-white px-5 py-4">
          <div className="flex gap-3">
            <button onClick={goToDetails} className="flex-1 bg-primary hover:bg-primary-600 text-white py-3 rounded-lg text-sm font-medium">
              {t('myDeals.viewDealDetails', 'View Deal Details')}
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg text-sm font-medium">
              {t('myDeals.close', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MyClaimModal;
