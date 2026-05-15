import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar } from 'lucide-react';
import CommonLayout from '../components/layout/CommonLayout';
import { useUser } from '../context/UserContext';
import { dealsAPI, favoritesAPI } from '../utils/api';
import { toast } from '../utils/toast';
import MyClaimModal from '../components/mydeals/MyClaimModal';
import DealModal from '../components/deals/DealModal';
import DealCard from '../components/deals/DealCard';
import RescheduleModal from '../components/deals/RescheduleModal';
import ConfirmModal from '../components/common/ConfirmModal';

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const cls =
    status === 'active'
      ? 'bg-green-100 text-green-700'
      : status === 'redeemed'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-gray-100 text-gray-500';
  // const label = t(`myDeals.status.${status}`, status);
  const label = status
  return <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${cls}`}>{label}</span>;
};

const formatRM = (val) => `RM${Number(val || 0).toFixed(2)}`;
const formatDate = (val) => {
  if (!val) return '-';
  const d = new Date(val);
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
};

// Format datetime string (UTC) to show both date and time in user's local timezone
const formatDateTime = (datetimeString) => {
  if (!datetimeString) return '-';
  // datetimeString is in UTC, convert to user's local timezone
  const d = new Date(datetimeString);
  const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${dateStr} ${timeStr}`;
};

const ClaimRow = ({ claim, onOpen, onCancel, onReschedule, cancelling, rescheduling }) => {
  const { t } = useTranslation();
  const cartLineItems = claim?.is_consolidated_cart &&
    Array.isArray(claim?.cart_line_items) &&
    claim.cart_line_items.length > 1
    ? claim.cart_line_items
    : null;
  const dealName = cartLineItems
    ? ''
    : claim?.is_consolidated_cart
      ? (claim?.deal_name ?? '')
      : (
        claim?.deal_name ??
        (claim && claim.deal_details && claim.deal_details.deal_name) ??
        (claim && claim.deal_id && typeof claim.deal_id === 'object' ? claim.deal_id.deal_name : undefined) ??
        ''
      );
  const dealTotal = Number(
    claim?.deal_total_after_coupon ??
    claim?.deal_total ??
    (claim && claim.deal_details && claim.deal_details.deal_total) ??
    (claim && claim.deal_id && typeof claim.deal_id === 'object' ? claim.deal_id.deal_total : undefined) ??
    0
  );
  const businessName = claim?.business_id?.company_name || claim?.group_id?.name || '';
  const status = claim?.status || '';
  const preferredServiceType = claim?.preferred_service_type?.split('_').join(' ') || '';
  // preferred_datetime is the scheduled date/time (gets updated when rescheduled)
  const scheduledDateTime = claim?.preferred_datetime ? formatDateTime(claim.preferred_datetime) : '';
  const scheduledDateTimeDisplay = scheduledDateTime && scheduledDateTime !== '-' ? scheduledDateTime : '';
  const cancelledAt = claim?.cancelled_at ? formatDateTime(claim.cancelled_at) : '';
  const cancelledAtDisplay = cancelledAt && cancelledAt !== '-' ? cancelledAt : '';

  const isActive = status === 'active';
  const canCancelOrReschedule = isActive && !cancelledAtDisplay;

  return (
    <div className="flex flex-col md:flex-row items-start p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition gap-4">
      <div className="flex-1 w-full">
        <h3 className="font-semibold text-lg leading-snug">
          {cartLineItems?.length > 1 ? (
            cartLineItems.map((line, index) => (
              <span key={`${line.deal_id || line.deal_name}-${index}`}>
                {index > 0 ? <span className="font-semibold text-lg"> · </span> : null}
                <span>{line.deal_name}</span>
                <span className="text-sm font-medium text-gray-500"> ×{line.quantity}</span>
              </span>
            ))
          ) : (
            dealName
          )}
        </h3>
        <p className="text-gray-500 text-sm">{businessName || '-'}</p>
        <div className="mt-1 text-xs text-gray-500">
          <span>{t('myDeals.claimedLabel', 'Claimed:')} {formatDate(claim?.claimed_at)}</span>
          {isActive && claim?.expires_at ? <span className="ml-3">{t('myDeals.expiresLabel', 'Expires:')} {formatDate(claim.expires_at)}</span> : null}
        </div>
        <div className="mt-1 text-xs text-gray-500 flex flex-row flex-wrap gap-2">
          {preferredServiceType && <span>{t('myDeals.preferredServiceType', 'Preferred Service Type:')} <b>{preferredServiceType.toUpperCase()}</b></span>}
          {scheduledDateTimeDisplay && (
            <span>
              {t('myDeals.scheduledAt', 'Scheduled At:')} <b>{scheduledDateTimeDisplay}</b>
            </span>
          )}
          {cancelledAtDisplay && <span>{t('myDeals.cancelledAt', 'Cancelled At:')} <b>{cancelledAtDisplay}</b></span>}
        </div>
      </div>
      
      {/* Right side: Price, Status, and all action buttons */}
      <div className="flex flex-col items-end md:items-end gap-3 w-full md:w-auto flex-shrink-0">
        {/* Price and Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <span className="font-bold text-primary text-lg">{formatRM(dealTotal)}</span>
          <StatusBadge status={claim?.status || 'active'} />
        </div>
        
        {/* All action buttons grouped together */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button
            onClick={onOpen}
            className="px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary-600 text-xs font-medium transition-colors whitespace-nowrap"
          >
            {t('myDeals.viewQR', 'View QR')}
          </button>
          {/* {canCancelOrReschedule && (
            <>
              <button
                onClick={() => onReschedule(claim)}
                disabled={rescheduling}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5" />
                {rescheduling ? t('dealModal.rescheduling', 'Rescheduling...') : t('dealModal.reschedule', 'Reschedule')}
              </button>
              <button
                onClick={() => onCancel(claim)}
                disabled={cancelling}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" />
                {cancelling ? t('dealModal.cancelling', 'Cancelling...') : t('dealModal.cancelClaim', 'Cancel Claim')}
              </button>
            </>
          )} */}
        </div>
      </div>
    </div>
  );
};

const MyDealsPage = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('claimed');

  const [claims, setClaims] = useState([]);
  const [claimsPage, setClaimsPage] = useState(1);
  const [claimsHasNext, setClaimsHasNext] = useState(false);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const [favorites, setFavorites] = useState([]);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [favoritesHasNext, setFavoritesHasNext] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealForModal, setDealForModal] = useState(null);
  const [claimForModal, setClaimForModal] = useState(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [claimToReschedule, setClaimToReschedule] = useState(null);
  const [dealForReschedule, setDealForReschedule] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [claimToCancel, setClaimToCancel] = useState(null);

  const customerId = user?.id || user?._id || null;

  const loadClaims = useCallback(async (page = 1) => {
    if (!customerId) return;
    setLoadingClaims(true);
    try {
      const res = await dealsAPI.getClaimHistory(customerId, { page, limit: 10 });
      const list = res?.data?.data?.claims || [];
      const pagination = res?.data?.data?.pagination || {};
      setClaims((prev) => (page === 1 ? list : [...prev, ...list]));
      setClaimsHasNext(Boolean(pagination?.has_next));
      setClaimsPage(pagination?.current_page || page);
    } catch {
      // swallow
    } finally {
      setLoadingClaims(false);
    }
  }, [customerId]);

  const loadFavorites = useCallback(async (page = 1) => {
    setLoadingFavorites(true);
    try {
      const res = await favoritesAPI.getFavoriteDeals({ page, limit: 12 });
      const list = res?.data?.data?.deals || [];
      const pagination = res?.data?.data?.pagination || {};
      setFavorites((prev) => (page === 1 ? list : [...prev, ...list]));
      setFavoritesHasNext(Boolean(pagination?.has_next));
      setFavoritesPage(pagination?.current_page || page);
    } catch {
      // swallow
    } finally {
      setLoadingFavorites(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'claimed') {
      loadClaims(1);
    } else {
      loadFavorites(1);
    }
  }, [activeTab, loadClaims, loadFavorites]);

  // Extract date and time from preferred_datetime for RescheduleModal
  const getPreferredDateFromDatetime = (datetimeString) => {
    if (!datetimeString) return '';
    const date = new Date(datetimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPreferredTimeFromDatetime = (datetimeString) => {
    if (!datetimeString) return '';
    const date = new Date(datetimeString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleCancelClaimClick = (claim) => {
    setClaimToCancel(claim);
    setShowCancelConfirm(true);
  };

  const handleCancelClaim = async () => {
    if (!claimToCancel?._id || !customerId) {
      setShowCancelConfirm(false);
      setClaimToCancel(null);
      return;
    }

    try {
      setCancelling(true);
      const response = await dealsAPI.cancelDealClaim(claimToCancel._id, customerId);
      
      if (response.success) {
        toast.success(t('dealModal.cancelSuccess', 'Deal cancelled successfully'));
        setShowCancelConfirm(false);
        setClaimToCancel(null);
        // Refresh claims list
        await loadClaims(1);
      } else {
        toast.error(response.message || t('dealModal.cancelFailed', 'Failed to cancel deal'));
      }
    } catch (error) {
      console.error('Error cancelling claim:', error);
      toast.error(error.message || t('dealModal.cancelFailed', 'Failed to cancel deal'));
    } finally {
      setCancelling(false);
    }
  };

  const handleRescheduleClick = async (claim) => {
    // Need to fetch the deal details for reschedule modal
    try {
      const dealId = claim?.deal_id?._id || claim?.deal_id;
      if (!dealId) {
        toast.error('Deal information not available');
        return;
      }
      // Fetch deal details
      const dealResponse = await dealsAPI.getDealById(dealId);
      if (dealResponse.success) {
        setDealForReschedule(dealResponse.data);
        setClaimToReschedule(claim);
        setShowRescheduleModal(true);
      } else {
        toast.error('Failed to load deal details');
      }
    } catch (error) {
      console.error('Error loading deal:', error);
      toast.error('Failed to load deal details');
    }
  };

  const handleRescheduleClaim = async (preferredDatetime) => {
    if (!claimToReschedule?._id || !customerId) return;

    try {
      setRescheduling(true);
      const response = await dealsAPI.rescheduleDealClaim(
        claimToReschedule._id,
        customerId,
        preferredDatetime
      );
      
      if (response.success) {
        toast.success(t('dealModal.rescheduleSuccess', 'Deal rescheduled successfully'));
        setShowRescheduleModal(false);
        setClaimToReschedule(null);
        setDealForReschedule(null);
        // Refresh claims list
        await loadClaims(1);
      } else {
        toast.error(response.message || t('dealModal.rescheduleFailed', 'Failed to reschedule deal'));
      }
    } catch (error) {
      console.error('Error rescheduling claim:', error);
      toast.error(error.message || t('dealModal.rescheduleFailed', 'Failed to reschedule deal'));
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <CommonLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">{t('common.myDeals', 'My Deals')}</h1>

        <div className="flex items-center gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'claimed' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('claimed')}
          >
            {t('myDeals.tabLabel', 'My Deals')}
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'favorites' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('favorites')}
          >
            {t('myDeals.favoritesTab', 'Favorites')}
          </button>
        </div>

        {activeTab === 'claimed' ? (
          <div className="space-y-3">
            {claims.length === 0 && !loadingClaims && (
              <div className="text-sm text-gray-500">{t('myDeals.noClaimedDeals', 'No claimed deals yet.')}</div>
            )}
            {claims.map((c) => (
              <ClaimRow 
                key={c._id} 
                claim={c} 
                onOpen={() => setSelectedClaim(c)}
                onCancel={handleCancelClaimClick}
                onReschedule={handleRescheduleClick}
                cancelling={cancelling}
                rescheduling={rescheduling}
              />
            ))}
            <div className="flex justify-center">
              {claimsHasNext && (
                <button
                  disabled={loadingClaims}
                  onClick={() => loadClaims((claimsPage || 1) + 1)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  {loadingClaims ? t('common.loading') : t('myDeals.loadMore', 'Load More')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favorites.length === 0 && !loadingFavorites && (
              <div className="text-sm text-gray-500">{t('myDeals.noFavoritesYet', 'No favorites yet.')}</div>
            )}
            {favorites.map((d) => (
              <DealCard deal={d} />
            ))}
          </div>
        )}

        {activeTab === 'favorites' && favoritesHasNext && (
          <div className="flex justify-center mt-4">
            <button
              disabled={loadingFavorites}
              onClick={() => loadFavorites((favoritesPage || 1) + 1)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            >
              {loadingFavorites ? t('common.loading') : t('myDeals.loadMore', 'Load More')}
            </button>
          </div>
        )}
      </div>
      {selectedClaim && (
        <MyClaimModal 
          claim={selectedClaim} 
          onClose={() => setSelectedClaim(null)} 
          onOpenDeal={(dealId) => {
            setSelectedClaim(null);
            setDealForModal({ _id: dealId });
            setClaimForModal(selectedClaim); // Pass the claim data
            setShowDealModal(true);
            setAlreadyClaimed(true);
          }}
        />
      )}
      {showDealModal && dealForModal && (
        <DealModal 
          deal={dealForModal} 
          onClose={() => {
            setShowDealModal(false);
            setClaimForModal(null);
            setDealForModal(null);
          }} 
          onDealClaimed={() => {}}
          onClaimActionLabel={t('myDeals.claimDealAgain', 'Claim Again')}
          claimData={claimForModal} // Pass claim data to show reschedule/cancel buttons
        />
      )}
      {showRescheduleModal && dealForReschedule && claimToReschedule && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setClaimToReschedule(null);
            setDealForReschedule(null);
          }}
          onSubmit={handleRescheduleClaim}
          deal={dealForReschedule}
          currentDate={claimToReschedule?.preferred_datetime ? getPreferredDateFromDatetime(claimToReschedule.preferred_datetime) : ''}
          currentTime={claimToReschedule?.preferred_datetime ? getPreferredTimeFromDatetime(claimToReschedule.preferred_datetime) : ''}
        />
      )}
      {<ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => {
          setShowCancelConfirm(false);
          setClaimToCancel(null);
        }}
        onConfirm={handleCancelClaim}
        title={t('dealModal.cancelClaim', 'Cancel Deal')}
        message={t('dealModal.confirmCancel', 'Are you sure you want to cancel this deal?')}
        confirmText={t('dealModal.cancelClaim', 'Cancel Deal')}
        cancelText={t('common.cancel', 'Cancel')}
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        loading={cancelling}
      />}
    </CommonLayout>
  );
};

export default MyDealsPage;
