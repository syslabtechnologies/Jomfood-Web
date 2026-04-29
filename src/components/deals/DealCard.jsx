import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Clock, ChevronLeft, ChevronRight, MapPin, Star, Sparkles, Tag, Package, DollarSign, Percent, Share2, X, Copy } from 'lucide-react';
import { toast } from '../../utils/toast';
import DealModal from './DealModal';
import QRCodeModal from './QRCodeModal';

const DealCard = ({ deal, disableHoverEffect = false }) => {
  // console.log('deal', deal?.business_id?.area || "no area");
  const { t, i18n } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [claimData, setClaimData] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const shareLinkInputRef = useRef(null);

  const formatPrice = (price) => `RM ${price.toFixed(2)}`;
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'malay' ? 'ms-MY' : 'en-GB';
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDiscountText = () => {
    if (deal.deal_type === 'percentage') {
      return `${deal.discount_percentage}% ${t('deals.offSuffix', 'OFF')}`;
    }
    if (deal.deal_type === 'fixed_amount') {
      return `RM ${deal.discount_amount.toFixed(2)} ${t('deals.offSuffix', 'OFF')}`;
    }
    if (deal.deal_type === 'combo') {
      return t('dealModal.comboDeal');
    }
    return t('dealModal.deal');
  };

  const getDealTypeIcon = () => {
    if (deal.deal_type === 'percentage') {
      return Percent;
    }
    if (deal.deal_type === 'fixed_amount') {
      return DollarSign;
    }
    if (deal.deal_type === 'combo') {
      return Package;
    }
    return Tag;
  };

  const getSavingsAmount = () => {
    return deal.original_total - deal.deal_total;
  };

  // Prioritize deal_image, then product images
  const productImages = deal.deal_items?.map(item => item.product_image).filter(Boolean) || [];
  const allImages = deal.deal_image
    ? [deal.deal_image, ...productImages]
    : productImages;
  const hasMultipleImages = allImages.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleDealClaimed = (data) => {
    setClaimData(data);
    setShowQRModal(true);
  };

  // Share logic
  const getDealShareUrl = () => {
    const dealId = deal?._id;
    if (!dealId) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/?dealId=${dealId}&autoOpen=true`;
  };

  const getWhatsAppShareText = () => {
    const dealName = deal?.deal_name || t('dealModal.deal', 'Deal');
    const url = getDealShareUrl();
    const restaurantName = deal?.business_id?.company_name || '';
    const parts = [
      t('dealModal.shareMessageTitle', 'Hey! Check out this awesome deal 🤩'),
      t('dealModal.shareMessageIntro', 'I found this great deal for {{dealName}} at {{restaurantName}}!', { dealName, restaurantName }),
      // t('dealModal.shareMessageEnjoy', 'It looks delicious and it\'s a really good price.'),
      t('dealModal.shareMessageViewDeal', 'Check it out here: {{link}}', { link: url }),
      t('dealModal.shareMessageClosing', "Let's go together! 🍽️"),
      t('dealModal.shareMessageSignature', ''),
    ];
    return parts.filter(Boolean).join('\n\n');
  };

  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleShareClick = async (e) => {
    e.stopPropagation();
    const url = getDealShareUrl();
    if (!url) {
      toast.error(t('dealModal.shareError', 'Could not generate share link'));
      return;
    }
    const title = deal?.deal_name || t('dealModal.deal', 'Deal');
    const text = getWhatsAppShareText();

    if (isMobile && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    setShowSharePopover(true);
  };

  const copyLinkToClipboard = async () => {
    const url = getDealShareUrl();
    if (!url) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success(t('dealModal.linkCopied', 'Link copied to clipboard'));
        return;
      }
      const input = shareLinkInputRef.current;
      if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        const ok = document.execCommand('copy');
        if (ok) toast.success(t('dealModal.linkCopied', 'Link copied to clipboard'));
        else toast.error(t('dealModal.copyFailed', 'Could not copy link'));
      }
    } catch {
      toast.error(t('dealModal.copyFailed', 'Could not copy link'));
    }
  };

  const handleNativeShare = async () => {
    const url = getDealShareUrl();
    const title = deal?.deal_name || t('dealModal.deal', 'Deal');
    if (!url || !navigator.share) return;
    try {
      await navigator.share({ title, url, text: title });

      setShowSharePopover(false);
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error(t('dealModal.copyFailed', 'Could not share'));
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Format countdown based on time remaining
  const formatCountdown = (timeRemaining) => {
    if (!timeRemaining) return null;

    const { days, hours, minutes, seconds, totalMs } = timeRemaining;
    const totalMinutes = Math.floor(totalMs / (1000 * 60));

    // Always show segmented timer (Days, Hours, Minutes, Seconds)
    return {
      days,
      hours,
      minutes,
      seconds,
      isUrgent: totalMinutes < 10,
      format: 'segmented'
    };
  };

  // Countdown timer effect - Always show countdown
  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!deal.end_date) return null;

      const now = new Date().getTime();
      const endDate = new Date(deal.end_date).getTime();
      const difference = endDate - now;

      if (difference <= 0) {
        return null; // Deal has expired
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return {
        days,
        hours,
        minutes,
        seconds,
        totalMs: difference
      };
    };

    // Calculate immediately
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Clear interval if deal has expired
      if (!remaining || remaining.totalMs <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deal.end_date]);

  return (
    <>
      <div
        className="group relative bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer w-full h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowModal(true)}
        style={{ minHeight: '100%' }}
      >
        {/* Discount Badge */}
        {/* <div className="absolute top-4 left-4 z-10">
          <div className="bg-gradient-to-r from-primary to-[#FF1744] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            {getDiscountText()}
          </div>
        </div> */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          {/* <div className="bg-gradient-to-r from-primary to-[#FF1744] text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 font-bold text-xs">
            <Sparkles className="w-3 h-3" />
            {getDiscountText()}
          </div> */}
          <button
            onClick={handleShareClick}
            className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full shadow-md transition-all duration-200"
            aria-label={t('dealModal.shareDeal', 'Share deal')}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Deal Type Badge */}
        {/* <div className="absolute top-4 right-4 z-10">
          <div className="bg-white/95 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-full shadow-md text-xs font-semibold uppercase flex items-center gap-1">
            {React.createElement(getDealTypeIcon(), { className: "w-3 h-3" })}
            {deal.deal_type === 'combo' ? 'Combo' : deal.deal_type === 'percentage' ? 'Off' : 'Fixed'}
          </div>
        </div> */}

        {/* Image Carousel */}
        <div className="relative h-40 sm:h-44 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {allImages.length > 0 ? (
            <>
              <img
                src={allImages[currentImageIndex]}
                alt={deal.deal_name}
                className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'
                  }`}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                }}
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

              {/* Image Navigation */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:bg-white transition-all duration-200 z-10"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-gray-800" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:bg-white transition-all duration-200 z-10"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-gray-800" />
                  </button>

                  {/* Image Indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {allImages.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex
                          ? 'w-8 bg-white'
                          : 'w-1.5 bg-white/50'
                          }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col flex-grow">
          {/* Deal Name */}
          <h3 className="text-xs sm:text-base font-bold text-gray-900 mb-0.5 line-clamp-1 group-hover:text-primary transition-colors">
            {deal.deal_name}
          </h3>

          {/* Description */}
          <p className="text-[10px] sm:text-xs text-gray-600 mb-1.5 line-clamp-1">
            {deal.deal_description}
          </p>

          {/* Area & Tags - Show area as first tag if it exists */}
          {(deal.business_id?.area || (deal.tags && deal.tags.length > 0)) && (
            <div className="flex flex-wrap gap-1 mb-2 overflow-hidden">
              {deal.business_id?.area && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-[9px] font-medium bg-primary/10 text-primary flex-shrink-0">
                  {deal.business_id.area}
                </span>
              )}
              {deal.tags && deal.tags.slice(0, 1).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-[9px] font-medium bg-primary/10 text-primary flex-shrink-0"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Restaurant Info */}
          <div className="pb-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
              <p className="text-[9px] sm:text-xs text-gray-700 font-medium line-clamp-1">
                {deal.business_id?.company_name || t('dealCard.restaurantFallback')}
              </p>
            </div>
          </div>

          <div className='flex-grow border-b border-gray-100 mb-2'></div>
          {/* Price and Timer Side by Side */}
          <div className="flex sm:items-center justify-between sm:gap-3 gap-1 flex-row-reverse pt-1">
            {/* Right: Prices in Column */}
            <div className="flex flex-col gap-0.5 flex-shrink-0 items-end">
              {/* Original Price (on top) */}
              <span className="text-[7px] md:text-[8px] text-gray-400 line-through leading-tight">
                {formatPrice(deal.original_total)}
              </span>
              {/* Deal Price */}
              <span className="text-[9px] md:text-xs font-bold text-primary leading-tight">
                {formatPrice(deal.deal_total)}
              </span>
              {/* Savings */}
              <div className="flex flex-col items-end">
                <div className="text-[6px] md:text-[7px] text-gray-500 leading-tight">{t('dealCard.youSave')}</div>
                <div className="text-[7px] md:text-[9px] font-bold text-green-600 leading-tight">
                  {formatPrice(getSavingsAmount())}
                </div>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="h-10 border-l border-gray-200 self-center"></div>

            {/* Left: Countdown Timer */}
            {timeRemaining ? (() => {
              const countdown = formatCountdown(timeRemaining);
              if (!countdown) return null;

              return (
                <div className="flex items-start gap-[1px] sm:gap-0.5 flex-shrink-0">
                  {/* Days */}
                  <div className="flex flex-col items-center">
                    <div className={`rounded md:px-0.5 md:py-0.5 px-[1px] py-[1px] min-w-[1.25rem] text-center border leading-none ${countdown.isUrgent
                      ? 'bg-gray-200 border-gray-300'
                      : 'bg-gray-100 border-gray-200'
                      }`}>
                      <span className="font-bold text-[7px] sm:text-[9px] tabular-nums leading-none text-black">
                        {countdown.days.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-[6px] font-medium mt-0.5 uppercase text-gray-600 leading-tight">Days</span>
                  </div>

                  {/* Separator */}
                  <span className="text-[8px] font-bold text-gray-300 leading-none mt-[6px]">:</span>

                  {/* Hours */}
                  <div className="flex flex-col items-center">
                    <div className={`rounded md:px-0.5 md:py-0.5 px-[1px] py-[1px] min-w-[1.25rem] text-center border leading-none ${countdown.isUrgent
                      ? 'bg-gray-200 border-gray-300'
                      : 'bg-gray-100 border-gray-200'
                      }`}>
                      <span className="font-bold text-[7px] sm:text-[9px] tabular-nums leading-none text-black">
                        {countdown.hours.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-[6px] font-medium mt-0.5 uppercase text-gray-600 leading-tight">Hrs</span>
                  </div>

                  {/* Separator */}
                  <span className="text-[8px] font-bold text-gray-300 leading-none mt-[6px]">:</span>

                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <div className={`rounded md:px-0.5 md:py-0.5 px-[1px] py-[1px] min-w-[1.25rem] text-center border leading-none ${countdown.isUrgent
                      ? 'bg-gray-200 border-gray-300'
                      : 'bg-gray-100 border-gray-200'
                      }`}>
                      <span className="font-bold text-[7px] sm:text-[9px] tabular-nums leading-none text-black">
                        {countdown.minutes.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-[6px] font-medium mt-0.5 uppercase text-gray-600 leading-tight">Min</span>
                  </div>

                  {/* Separator */}
                  <span className="text-[8px] font-bold text-gray-300 leading-none mt-[6px]">:</span>

                  {/* Seconds */}
                  <div className="flex flex-col items-center">
                    <div className={`rounded md:px-0.5 md:py-0.5 px-[1px] py-[1px] min-w-[1.25rem] text-center border leading-none ${countdown.isUrgent
                      ? 'bg-gray-200 border-gray-300'
                      : 'bg-gray-100 border-gray-200'
                      }`}>
                      <span className="font-bold text-[7px] sm:text-[9px] tabular-nums leading-none text-black">
                        {countdown.seconds.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-[6px] font-medium mt-0.5 uppercase text-gray-600 leading-tight">Sec</span>
                  </div>
                </div>
              );
            })() : (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 flex-shrink-0">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{t('dealCard.validUntil', { date: formatDate(deal.end_date) })}</span>
              </div>
            )}
          </div>

          {/* View Details Button */}
          {/* <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
            className="w-full bg-gradient-to-r from-primary to-[#FF1744] hover:from-primary-600 hover:to-[#E01535] text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md transform group-hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {t('deals.viewDealDetails')}
          </button> */}
        </div>
      </div>

      {/* Modals - Rendered as portals */}
      {showModal && createPortal(
        <DealModal
          deal={deal}
          onClose={() => setShowModal(false)}
          onDealClaimed={handleDealClaimed}
        />,
        document.body
      )}

      {showQRModal && claimData && createPortal(
        <QRCodeModal
          claimData={claimData}
          onClose={() => setShowQRModal(false)}
        />,
        document.body
      )}

      {/* Share Popover */}
      {showSharePopover && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowSharePopover(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{t('dealModal.shareDeal', 'Share deal')}</h3>
              <button
                type="button"
                onClick={() => setShowSharePopover(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                aria-label={t('common.close', 'Close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">{t('dealModal.shareLinkLabel', 'Share this link with others')}:</p>
            <div className="flex rounded-lg border border-gray-300 bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
              <input
                ref={shareLinkInputRef}
                type="text"
                readOnly
                value={getDealShareUrl()}
                className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-transparent text-gray-800 focus:outline-none border-0"
              />
              <button
                type="button"
                onClick={copyLinkToClipboard}
                className="flex-shrink-0 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-sm transition-colors border-l border-gray-300"
              >
                {t('dealModal.copyLink', 'Copy')}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-4 mb-2">{t('dealModal.shareVia', 'Share via')}:</p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(getWhatsAppShareText())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white bg-[#25D366] hover:bg-[#20BD5A] transition-colors shadow-sm"
                aria-label="Share on WhatsApp"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.865 9.865 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.414h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  {t('dealModal.moreApps', 'More apps')}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default DealCard;