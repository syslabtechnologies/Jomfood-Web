import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Clock, Tag, MapPin, Phone, Star, ChevronLeft, ChevronRight, Truck, UtensilsCrossed, ShoppingBag, Store, Heart, Calendar, Share2, Copy, ShoppingCart } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { dealsAPI, favoritesAPI } from '../../utils/api';
import { toast } from '../../utils/toast';
import { useUser } from '../../context/UserContext';
import { useCart } from '../../context/CartContext';
import { cartAPI } from '../../utils/api';
import LoginRequiredModal from '../auth/LoginRequiredModal';
import PhoneRequiredModal from '../common/PhoneRequiredModal';
import ConfirmModal from '../common/ConfirmModal';
import ClaimDealModal from './ClaimDealModal';
import RescheduleModal from './RescheduleModal';
import DealRedeemInstructionsPanel from './DealRedeemInstructionsPanel';
import noImage from '../../assets/default_product_deal_image.jpg';
import { Link } from "react-router-dom"

// Add a custom hook for screen width (for responsive design)
function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
}

const DealModal = ({ deal, onClose, onDealClaimed, onClaimActionLabel, claimData }) => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useUser();
  const { addItem, clearCart, items, reload, openCart } = useCart();
  const [fullDeal, setFullDeal] = useState(deal);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const navigationPrevRef = useRef(null);
  const navigationNextRef = useRef(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const shareLinkInputRef = useRef(null);
  const [redeemInstructions, setRedeemInstructions] = useState(null);

  // Get claim info from claimData prop or fullDeal
  const currentClaim = claimData || fullDeal?.claim;
  const isClaimed = !!currentClaim;
  const claimStatus = currentClaim?.status;
  const isActiveClaim = claimStatus === 'active' && !currentClaim?.cancelled_at;
  const canCancelOrReschedule = isActiveClaim && !currentClaim?.redeemed_at;

  // Responsive: get window width
  const windowWidth = useWindowWidth();
  const isXS = windowWidth < 380;

  useEffect(() => {
    dealsAPI.getRedeemInstructions()
      .then((response) => {
        if (response?.success && response?.data) {
          setRedeemInstructions(response.data);
        }
      })
      .catch(() => {
        setRedeemInstructions(null);
      });
  }, []);

  useEffect(() => {
    // Try to fetch full deal details if we have the deal ID
    if (deal._id) {
      setLoading(true);
      dealsAPI.getDealById(deal._id)
        .then(response => {
          if (response?.success && response?.data) {
            setFullDeal(response.data);
          }
        })
        .catch(error => {
          console.log('Could not fetch full deal details, using card data:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [deal._id]);

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
      if (!fullDeal.end_date) return null;

      const now = new Date().getTime();
      const endDate = new Date(fullDeal.end_date).getTime();
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
  }, [fullDeal.end_date]);

  const formatPrice = (price) => `RM ${Number(price || 0).toFixed(2)}`;
  const getLocale = () => (i18n.language === 'malay' ? 'ms-MY' : 'en-GB');
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(getLocale(), {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString(getLocale(), {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString(getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return t('dealModal.dateAtTime', { date: dateStr, time: timeStr });
  };

  const getDiscountText = () => {
    if (fullDeal.deal_type === 'percentage') {
      return `${fullDeal.discount_percentage}% OFF`;
    }
    if (fullDeal.deal_type === 'fixed_amount') {
      return `RM ${fullDeal.discount_amount.toFixed(2)} OFF`;
    }
    if (fullDeal.deal_type === 'combo') {
      return 'COMBO DEAL';
    }
    return 'DEAL';
  };

  const getUsageLimitText = () => {
    if (!fullDeal.max_quantity) return null;

    if (fullDeal.max_quantity === 1) {
      return t('deals.oneTimeUse');
    } else if (fullDeal.max_quantity === 2) {
      return t('deals.canBeUsedTwice');
    } else {
      return t('deals.canBeUsedUpTo', { count: fullDeal.max_quantity });
    }
  };

  // Get location and contact info
  const location = fullDeal?.business_id?.address || '';
  const officePhone = fullDeal?.business_id?.office_phone || '';
  const latitude = fullDeal?.business_id?.lat || '';
  const longitude = fullDeal?.business_id?.lng || '';
  const restaurantName = fullDeal?.business_id?.company_name || t('dealCard.restaurantFallback');

  // Generate Google Maps URL
  const getGoogleMapsUrl = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
    }
    if (location) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    }
    return null;
  };

  // WhatsApp contact message with deal info
  const getWhatsAppContactText = () => {
    const dealName = fullDeal?.deal_name || deal?.deal_name || t('dealModal.deal', 'Deal');
    const url = getDealShareUrl();
    return t(
      'dealModal.contactMessage',
      'Hi, I am interested in the deal {{dealName}}.\nLink: {{link}}',
      { dealName, link: url }
    );
  };

  // Generate WhatsApp URL
  const getWhatsAppUrl = () => {
    if (officePhone) {
      // Remove all non-numeric characters (spaces, hyphens, parentheses, dots, plus signs, etc.)
      // Keep the country code as-is - phone numbers should already have country code
      const phoneNumber = officePhone.replace(/\D/g, '');
      const text = getWhatsAppContactText();
      return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    }
    return null;
  };

  // Share: show popover with link and options (copy + optional native share)
  const getDealShareUrl = () => {
    const dealId = fullDeal?._id || deal?._id;
    if (!dealId) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/?dealId=${dealId}&autoOpen=true`;
  };

  // Formatted WhatsApp message: follows the special-treat template (deal name, link, restaurant)
  const getWhatsAppShareText = () => {
    const dealName = fullDeal?.deal_name || deal?.deal_name || t('dealModal.deal', 'Deal');
    const url = getDealShareUrl();
    const restaurantName = fullDeal?.business_id?.company_name || deal?.business_id?.company_name || '';
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

  // Mobile: use native share sheet (WhatsApp, Instagram, Facebook, Snapchat, recents, More apps). Desktop: show our popover.
  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleShareClick = async () => {
    const url = getDealShareUrl();
    if (!url) {
      toast.error(t('dealModal.shareError', 'Could not generate share link'));
      return;
    }
    const title = fullDeal?.deal_name || deal?.deal_name || t('dealModal.deal', 'Deal');
    const text = getWhatsAppShareText();

    // On mobile: open native share sheet (shows WhatsApp, Instagram, Facebook, Snapchat, recents, More apps)
    if (isMobile && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // User cancelled
        // Fall through to popover on error
      }
    }

    // Desktop (or mobile without share / user cancelled): show popover with link + Copy + WhatsApp + More apps
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
      // Fallback: select input and execCommand (e.g. older browsers or non-HTTPS)
      const input = shareLinkInputRef.current;
      if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        const ok = document.execCommand('copy');
        if (ok) toast.success(t('dealModal.linkCopied', 'Link copied to clipboard'));
        else toast.error(t('dealModal.copyFailed', 'Could not copy link'));
      }
    } catch {
      const input = shareLinkInputRef.current;
      if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        try {
          document.execCommand('copy');
          toast.success(t('dealModal.linkCopied', 'Link copied to clipboard'));
        } catch {
          toast.error(t('dealModal.copyFailed', 'Could not copy link'));
        }
      } else {
        toast.error(t('dealModal.copyFailed', 'Could not copy link'));
      }
    }
  };

  const handleNativeShare = async () => {
    const url = getDealShareUrl();
    const title = fullDeal?.deal_name || t('dealModal.deal', 'Deal');
    if (!url || !navigator.share) return;
    try {
      await navigator.share({ title, url, text: title });
      setShowSharePopover(false);
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error(t('dealModal.copyFailed', 'Could not share'));
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleToggleFavorite = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      setFavoriteLoading(true);
      const dealId = fullDeal?._id || deal?._id;
      const response = await favoritesAPI.toggleFavorite(dealId);
      const nextFav = Boolean(response?.data?.data?.is_favorite);
      setIsFavorite(nextFav);
      setFullDeal(prev => ({ ...prev, is_fav: nextFav, is_favorite: nextFav }));
      const message = response?.data?.data?.message || (nextFav ? 'Deal added to favorites' : 'Deal removed from favorites');
      toast.success(message);
    } catch (error) {
      toast.error(error.message || 'Unable to toggle favorite');
    } finally {
      setFavoriteLoading(false);
    }
  };

  useEffect(() => {
    const dealId = (fullDeal && fullDeal._id) || (deal && deal._id);
    if (dealId && user?._id) {
      favoritesAPI.checkFavoriteStatus(dealId)
        .then((result) => {
          setIsFavorite(result.is_favorite === true);
        })
        .catch(() => {
          setIsFavorite(false);
        });
    } else {
      setIsFavorite(false);
    }
  }, [fullDeal?._id, user?._id]);


  // Collect all images for the slider: deal image + product images
  const allImages = useMemo(() => {
    const images = [];

    // Add deal image if it exists
    if (fullDeal.deal_image) {
      images.push({
        src: fullDeal.deal_image,
        alt: fullDeal.deal_name || 'Deal Image'
      });
    }

    // Add product images from deal items
    if (fullDeal.deal_items && fullDeal.deal_items.length > 0) {
      fullDeal.deal_items.forEach((item) => {
        if (item.product_image) {
          images.push({
            src: item.product_image,
            alt: item.product_name || 'Product Image'
          });
        }
      });
    }

    // Ensure we always show a hero image so the header actions stay visible
    if (images.length === 0) {
      images.push({
        src: noImage,
        alt: fullDeal.deal_name || 'Deal Image'
      });
    }

    return images;
  }, [fullDeal.deal_image, fullDeal.deal_items, fullDeal.deal_name]);


  const handleClaimDeal = async () => {
    // Check if user is logged in
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Check if user has a phone number
    if (!user.phone || user.phone.trim() === '') {
      setShowPhoneModal(true);
      return;
    }

    // Show claim modal to set preferences
    setShowClaimModal(true);
  };

  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [pendingAddDeal, setPendingAddDeal] = useState(null);

  const handleAddToCart = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const result = await addItem(fullDeal);
    if (result?.reason === 'different_restaurant') {
      setPendingAddDeal(fullDeal);
      setShowReplaceConfirm(true);
      return;
    }
    if (result?.ok) {
      toast.success(t('cart.added', 'Added to cart'));
      onClose();
    }
  };

  const proceedWithClaimDeal = async (claimOptions = {}) => {
    try {
      setClaiming(true);

      console.log('Claiming deal:', {
        dealId: fullDeal._id,
        customerId: user._id,
        dealName: fullDeal.deal_name,
        options: claimOptions
      });

      const response = await dealsAPI.claimDeal(fullDeal._id, user._id, claimOptions);

      console.log('Claim response:', response);

      if (response.success) {
        toast.success(t('dealModal.claimSuccess', 'Deal claimed successfully!'));
        // Close the claim modal
        setShowClaimModal(false);
        // Close the deal modal first
        onClose();
        // Then show QR modal after a short delay
        setTimeout(() => {
          onDealClaimed(response.data);
        }, 200);
      } else {
        toast.error(response.message || t('dealModal.claimFailed', 'Failed to claim deal'));
      }
    } catch (error) {
      console.error('Error claiming deal:', error);
      toast.error(error.message || t('dealModal.claimFailed', 'Failed to claim deal'));
    } finally {
      setClaiming(false);
    }
  };

  const handleCancelClaimClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelClaim = async () => {
    if (!currentClaim?._id || !user?._id) {
      setShowCancelConfirm(false);
      return;
    }

    try {
      setCancelling(true);
      const response = await dealsAPI.cancelDealClaim(currentClaim._id, user._id);

      if (response.success) {
        toast.success(t('dealModal.cancelSuccess', 'Deal cancelled successfully'));
        setShowCancelConfirm(false);
        onClose();
        // Optionally refresh the page or update state
        window.location.reload();
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

  const handleRescheduleClaim = async (preferredDatetime) => {
    if (!currentClaim?._id || !user?._id) return;

    try {
      setRescheduling(true);
      const response = await dealsAPI.rescheduleDealClaim(
        currentClaim._id,
        user._id,
        preferredDatetime
      );

      if (response.success) {
        toast.success(t('dealModal.rescheduleSuccess', 'Deal rescheduled successfully'));
        setShowRescheduleModal(false);
        // Update claim data
        if (currentClaim) {
          currentClaim.preferred_datetime = preferredDatetime;
        }
        // Optionally refresh or update state
        window.location.reload();
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

  // Parse preferred_datetime from UTC and format for display
  const formatPreferredDate = (datetimeString) => {
    if (!datetimeString) return null;
    // datetimeString is in UTC, convert to user's local timezone for display
    const date = new Date(datetimeString);
    return date.toLocaleDateString(getLocale(), {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPreferredTime = (datetimeString) => {
    if (!datetimeString) return null;
    // datetimeString is in UTC, convert to user's local timezone for display
    const date = new Date(datetimeString);
    return date.toLocaleTimeString(getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Extract date and time from preferred_datetime for RescheduleModal
  const getPreferredDateFromDatetime = (datetimeString) => {
    if (!datetimeString) return '';
    // datetimeString is in UTC, convert to user's local timezone
    const date = new Date(datetimeString);
    // Return in YYYY-MM-DD format for date input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPreferredTimeFromDatetime = (datetimeString) => {
    if (!datetimeString) return '';
    // datetimeString is in UTC, convert to user's local timezone
    const date = new Date(datetimeString);
    // Return in HH:mm format for time input
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Map API service type to display type
  const getServiceTypeLabel = (serviceType) => {
    if (!serviceType) return null;
    const typeMap = {
      'delivery': t('dealCard.delivery', 'Delivery'),
      'pickup': t('dealCard.selfPickup', 'Pickup'),
      'dine_in': t('dealCard.dineIn', 'Dine-in')
    };
    return typeMap[serviceType] || serviceType;
  };

  const handlePhoneSubmit = async (phone) => {
    try {
      await updateProfile({ phone });
      setShowPhoneModal(false);
      // After phone is saved, show claim modal
      setShowClaimModal(true);
    } catch (error) {
      throw error;
    }
  };

  // Responsive spacing classes - px, py, gaps, image heights
  const px = isXS ? "px-2" : "px-6";
  const ptDealName = isXS ? "pt-1.5" : "pt-3";
  const pb2 = isXS ? "pb-1" : "pb-2";
  const pb4 = isXS ? "pb-2" : "pb-4";
  const sectionGap = isXS ? "gap-2" : "gap-4";
  const imgWrapper = isXS ? "w-12 h-12" : "w-16 h-16";
  const buttonPy = isXS ? "py-2" : "py-3";
  const buttonPx = isXS ? "px-2" : "px-4";
  const bottomBar = isXS ? "px-2 py-2" : "px-6 py-4";
  const textH2 = isXS ? "text-base" : "text-lg sm:text-2xl";
  const priceFont = isXS ? "text-base" : "text-base sm:text-lg";
  const lineClampH4 = isXS ? "text-xs" : "text-sm";
  const productFont = isXS ? "text-xs" : "text-xs";
  const timerTopGap = isXS ? "pt-0.5 pb-1" : "pt-1 pb-2";
  const bigImagesAspect = isXS ? "aspect-[3/2]" : "aspect-[16/9]";
  const imgMaxWidth = isXS ? "max-w-[92vw]" : "";
  const closeBtnTop = isXS ? "top-2 right-2" : "top-4 right-4";
  const favBtnTop = isXS ? "top-10 right-2" : "top-14 right-4";
  const shareBtnTop = isXS ? "top-[4.5rem] right-2" : "top-24 right-4";
  const badgeTopLeft = isXS ? "top-2 left-2" : "top-4 left-4";
  const badgePadding = isXS ? "px-2 py-[2.5px] text-xs" : "px-3 py-1 text-sm";
  const itemGap = isXS ? "gap-1" : "gap-2";
  const itemPadding = isXS ? "p-1.5" : "p-2";
  const claimButtonText = isXS ? "text-sm" : "text-base";
  const timerNum = isXS ? "text-[9px]" : "text-[10px]";
  const timerUnit = isXS ? "text-[6px]" : "text-[7px]";
  const iconSize = isXS ? "w-4 h-4" : "w-5 h-5";
  const infoIconWidth = isXS ? "w-5 h-5" : "w-5 h-5";
  const socialIconSize = isXS ? "w-6 h-6" : "w-7 h-7";
  const titleFont = isXS ? "text-sm" : "text-base";
  const smallFont = isXS ? "text-[12px]" : "text-xs";
  // Same fixed size for deal description + redeem instructions (Quill defaults are larger).
  const dealBodyFont = "text-[12px] leading-[1.4] font-normal text-gray-600";
  const infoMb = isXS ? "mb-1.5" : "mb-3";

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className={`text-center ${isXS ? "py-3" : "py-8"}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-2">{t('dealModal.loadingDetails')}</p>
            </div>
          ) : (
            <>
              {/* Image Slider - First Section */}
              {allImages.length > 0 && (
                <div className={`w-full relative group ${imgMaxWidth}`}>
                  {/* Close Button - Overlay on Image */}
                  <button
                    onClick={onClose}
                    className={`absolute ${closeBtnTop} z-20 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors`}
                  >
                    <X className={`${iconSize} text-gray-700`} />
                  </button>
                  <button
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    className={`absolute ${favBtnTop} z-20 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors`}
                    aria-label="Toggle favorite"
                  >
                    <Heart
                      className={`${iconSize} ${isFavorite ? 'text-red-600' : 'text-gray-700'}`}
                      fill={isFavorite ? 'currentColor' : 'none'}
                    />
                  </button>
                  <button
                    onClick={handleShareClick}
                    className={`absolute ${shareBtnTop} z-20 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors`}
                    aria-label={t('dealModal.shareDeal', 'Share deal')}
                  >
                    <Share2 className={`${iconSize} text-gray-700`} />
                  </button>

                  {/* Discount Badge - Overlay on Image */}
                  {/* <div className={`absolute ${badgeTopLeft} z-20`}>
                    <div className={`bg-green-600 text-white ${badgePadding} rounded font-bold shadow-lg`}>
                      {getDiscountText()}
                    </div>
                  </div> */}

                  <Swiper
                    modules={[Navigation, Pagination]}
                    navigation={{
                      prevEl: navigationPrevRef.current,
                      nextEl: navigationNextRef.current,
                    }}
                    onBeforeInit={(swiper) => {
                      swiper.params.navigation.prevEl = navigationPrevRef.current;
                      swiper.params.navigation.nextEl = navigationNextRef.current;
                    }}
                    pagination={{
                      clickable: true,
                      dynamicBullets: true,
                    }}
                    spaceBetween={0}
                    slidesPerView={1}
                    className="deal-images-swiper"
                  >
                    {allImages.map((image, index) => (
                      <SwiperSlide key={index}>
                        {/* image should be 3:2 or 16:9 ratio */}
                        <div className={`w-full ${bigImagesAspect} bg-gray-100 flex items-center justify-center`}>
                          <img
                            src={image.src}
                            alt={image.alt}
                            className={`w-full h-full object-cover`}
                            onError={(e) => {
                              e.target.src = noImage;
                            }}
                            style={isXS ? { borderRadius: 8 } : {}}
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                  {allImages.length > 1 && (
                    <>
                      <button
                        ref={navigationPrevRef}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100`}
                        aria-label="Previous image"
                        style={isXS ? { width: 28, height: 28 } : undefined}
                      >
                        <ChevronLeft className={iconSize + " text-gray-700"} />
                      </button>
                      <button
                        ref={navigationNextRef}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100`}
                        aria-label="Next image"
                        style={isXS ? { width: 28, height: 28 } : undefined}
                      >
                        <ChevronRight className={iconSize + " text-gray-700"} />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Deal Name Section */}
              <div className={`${px} ${ptDealName}`}>
                <h2 className={`${textH2} font-bold text-gray-900`}>{fullDeal.deal_name}</h2>
              </div>

              {/* Description */}
              {fullDeal.deal_description && (
                <div className={`${px} my-1`}>
                  <p className={dealBodyFont}>{fullDeal.deal_description}</p>
                </div>
              )}

              {/* Price and Timer Side-by-Side */}
              <div className={`${px} flex items-start justify-between ${sectionGap} ${timerTopGap}`}>
                {/* Price Section - Left */}
                <div className={`flex items-center ${sectionGap}`}>
                  <span className={`${priceFont} font-bold text-green-600`}>
                    {formatPrice(fullDeal.deal_total)}
                  </span>
                  {fullDeal.original_total > fullDeal.deal_total && (
                    <span className="text-sm sm:text-base text-gray-400 line-through">
                      {formatPrice(fullDeal.original_total)}
                    </span>
                  )}
                </div>

                <div className="relative">

                  {/* Timer Section - Right */}
                  {timeRemaining && (() => {
                    const countdown = formatCountdown(timeRemaining);
                    if (!countdown) return null;

                    return (
                      <div className="flex items-start gap-1 flex-shrink-0 absolute top-0 right-0">
                        {/* Days */}
                        <div className="flex flex-col items-center">
                          <div className={`rounded px-1.5 py-0.5 min-w-[1.25rem] text-center border ${countdown.isUrgent
                            ? 'bg-gray-200 border-gray-300'
                            : 'bg-gray-100 border-gray-200'
                            }`}>
                            <span className={`font-bold ${timerNum} tabular-nums text-black`}>
                              {countdown.days.toString().padStart(2, '0')}
                            </span>
                          </div>
                          <span className={`${timerUnit} font-medium mt-0.5 uppercase text-gray-500`}>{t('dealModal.days', 'Days')}</span>
                        </div>

                        <span className={`${timerNum} font-bold text-gray-300 leading-none mt-[6px]`}>:</span>

                        {/* Hours */}
                        <div className="flex flex-col items-center">
                          <div className={`rounded px-1.5 py-0.5 min-w-[1.25rem] text-center border ${countdown.isUrgent
                            ? 'bg-gray-200 border-gray-300'
                            : 'bg-gray-100 border-gray-200'
                            }`}>
                            <span className={`font-bold ${timerNum} tabular-nums text-black`}>
                              {countdown.hours.toString().padStart(2, '0')}
                            </span>
                          </div>
                          <span className={`${timerUnit} font-medium mt-0.5 uppercase text-gray-500`}>{t('dealModal.hours', 'Hrs')}</span>
                        </div>

                        <span className={`${timerNum} font-bold text-gray-300 leading-none mt-[6px]`}>:</span>

                        {/* Minutes */}
                        <div className="flex flex-col items-center">
                          <div className={`rounded px-1.5 py-0.5 min-w-[1.25rem] text-center border ${countdown.isUrgent
                            ? 'bg-gray-200 border-gray-300'
                            : 'bg-gray-100 border-gray-200'
                            }`}>
                            <span className={`font-bold ${timerNum} tabular-nums text-black`}>
                              {countdown.minutes.toString().padStart(2, '0')}
                            </span>
                          </div>
                          <span className={`${timerUnit} font-medium mt-0.5 uppercase text-gray-500`}>{t('dealModal.minutes', 'Min')}</span>
                        </div>

                        <span className={`${timerNum} font-bold text-gray-300 leading-none mt-[6px]`}>:</span>

                        {/* Seconds */}
                        <div className="flex flex-col items-center">
                          <div className={`rounded px-1.5 py-0.5 min-w-[1.25rem] text-center border ${countdown.isUrgent
                            ? 'bg-gray-200 border-gray-300'
                            : 'bg-gray-100 border-gray-200'
                            }`}>
                            <span className={`font-bold ${timerNum} tabular-nums text-black`}>
                              {countdown.seconds.toString().padStart(2, '0')}
                            </span>
                          </div>
                          <span className={`${timerUnit} font-medium mt-0.5 uppercase text-gray-500`}>{t('dealModal.seconds', 'Sec')}</span>
                        </div>

                        {countdown.isUrgent && (
                          <span className="text-sm animate-bounce ml-1">⚠️</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Service types + expandable how to redeem */}
              {fullDeal.consumptionType && fullDeal.consumptionType.length > 0 && (
                <div className={`${px} pb-1 mt-3 sm:mt-0`}>
                  <DealRedeemInstructionsPanel
                    consumptionTypes={fullDeal.consumptionType}
                    redeemInstructions={redeemInstructions}
                    productFont={productFont}
                    descriptionClassName={dealBodyFont}
                    descriptionStyle={{ fontSize: '12px' }}
                  />
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Restaurant Information Section */}
              <div className={`${px} pt-2 ${pb2}`}>
                <div className="space-y-2">
                  <div className={`flex items-start justify-between gap-3 ${infoMb}`}>
                    <div className="flex-1 flex items-center gap-2">
                      <Store className={`${infoIconWidth} text-gray-400 flex-shrink-0`} />
                      <Link
                        className="group"
                        to={`/restaurants/${fullDeal.business_id?._id}`}
                      >
                        <div className="flex flex-col">
                          <h4 className={`font-bold ${titleFont} group-hover:text-primary group-hover:underline`}>
                            {restaurantName}
                          </h4>
                          <span className="text-xs text-primary/80 group-hover:text-primary">
                            {t('dealModal.viewMoreFromRestaurant', 'View more from {{restaurant}}', {
                              restaurant: restaurantName,
                            })}
                          </span>
                        </div>
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute top-0 right-0 flex items-center gap-2 flex-shrink-0">
                        {getGoogleMapsUrl() && (
                          <a
                            href={getGoogleMapsUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center justify-center ${socialIconSize} hover:scale-110 transition-transform duration-200`}
                            title={t('dealModal.openInGoogleMaps', 'Open in Google Maps')}
                            aria-label={t('dealModal.openInGoogleMaps', 'Open in Google Maps')}
                          >
                            <MapPin className="w-full h-full text-[#4285F4]" strokeWidth={2.5} />
                          </a>
                        )}
                        {getWhatsAppUrl() && (
                          <a
                            href={getWhatsAppUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center justify-center ${socialIconSize} hover:scale-110 transition-transform duration-200`}
                            title={t('dealModal.contactViaWhatsApp', 'Contact via WhatsApp')}
                            aria-label={t('dealModal.contactViaWhatsApp', 'Contact via WhatsApp')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" className={socialIconSize} viewBox="0.89 1.31 21 21">
                              <g>
                                <title>Layer 1</title>
                                <rect id="svg_1" fill="#25D366" rx="4" height="21" width="21" y="1.31486" x="0.88744" />
                                <path stroke="null" id="svg_2" fill="white" d="m15.1625,12.86935c-0.2049,-0.10071 -1.21282,-0.58603 -1.40047,-0.65362c-0.18834,-0.06692 -0.32494,-0.10004 -0.46222,0.10139c-0.13591,0.20075 -0.52914,0.65294 -0.64849,0.78678c-0.11935,0.13451 -0.23939,0.15073 -0.44429,0.05069c-0.2049,-0.10139 -0.86581,-0.31295 -1.64882,-0.99699c-0.60917,-0.53263 -1.02103,-1.1903 -1.14038,-1.39173c-0.11935,-0.20075 -0.01242,-0.30957 0.08969,-0.40961c0.09244,-0.0899 0.20559,-0.23455 0.30769,-0.35148c0.10279,-0.11761 0.1366,-0.20143 0.20559,-0.33594c0.0683,-0.13383 0.03449,-0.25077 -0.01725,-0.35148c-0.05174,-0.10071 -0.46153,-1.08959 -0.63193,-1.49177c-0.16695,-0.39136 -0.33597,-0.33796 -0.46153,-0.34472c-0.11935,-0.00541 -0.25595,-0.00676 -0.39323,-0.00676c-0.1366,0 -0.35874,0.05002 -0.54639,0.25144c-0.18765,0.20075 -0.71748,0.68674 -0.71748,1.67562c0,0.9882 0.73473,1.94329 0.83683,2.0778c0.10279,0.13383 1.446,2.16296 3.50255,3.03288c0.48913,0.20683 0.87063,0.33053 1.16866,0.42245c0.4912,0.15344 0.93824,0.13181 1.29077,0.07976c0.39392,-0.05745 1.21282,-0.48599 1.38391,-0.95508c0.17109,-0.46909 0.17109,-0.87127 0.11935,-0.95508c-0.05105,-0.08381 -0.18765,-0.13383 -0.39323,-0.23455m-3.73987,5.00388l-0.00276,0a6.80916,6.67139 0 0 1 -3.47081,-0.93143l-0.24905,-0.14465l-2.58086,0.66376l0.68851,-2.46578l-0.16212,-0.2528a6.80226,6.66463 0 0 1 -1.04173,-3.55537c0.00069,-3.68379 3.06033,-6.68085 6.82158,-6.68085c1.8213,0 3.53359,0.6962 4.82092,1.95883a6.77812,6.64097 0 0 1 1.99584,4.72742c-0.00207,3.68379 -3.06102,6.68085 -6.81951,6.68085m5.804,-12.36741a8.15099,7.98606 0 0 0 -5.804,-2.35763c-4.5222,0 -8.20273,3.60606 -8.2048,8.03811c0,1.41674 0.37737,2.79968 1.09554,4.01838l-1.16453,4.16573l4.34972,-1.11798a8.19721,8.03135 0 0 0 3.92062,0.97874l0.00345,0c4.52151,0 8.20273,-3.60606 8.2048,-8.03878a8.15513,7.99012 0 0 0 -2.4008,-5.68656z" />
                              </g>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  {fullDeal.business_id?.office_phone && (
                    <div className={`${smallFont} text-gray-600`}>
                      {fullDeal.business_id.office_phone}
                    </div>
                  )}

                  {/* Address */}
                  {fullDeal.business_id?.address && (
                    <div className={`${smallFont} text-gray-600`}>
                      {fullDeal.business_id.address}
                    </div>
                  )}
                </div>
              </div>

              {/* What's Included Section */}
              <div className={`${px} ${pb2}`}>
                <h3 className={`${titleFont} font-semibold text-gray-900 mb-2`}>
                  {fullDeal.deal_items?.length > 0
                    && t('dealModal.dealItemsWithCount', "What's Included ({{count}} items)", { count: fullDeal.deal_items.length })
                  }
                </h3>
                {fullDeal.deal_items && fullDeal.deal_items.length > 0 ? (
                  <div className="space-y-2">
                    {fullDeal.deal_items.map((item, index) => {
                      // Find the corresponding image from allImages array
                      // Skip deal_image (index 0) and match product images
                      // Product images start from index 1 in allImages (after deal_image)
                      const imageIndex = fullDeal.deal_image ? index + 1 : index;
                      const productImage = allImages[imageIndex]?.src || item.product_image || noImage;

                      return (
                        <div
                          key={index}
                          className={`bg-white border border-gray-200 rounded-lg ${itemPadding} flex items-start ${itemGap}`}
                        >
                          {/* Item Image */}
                          <div className={`relative flex-shrink-0 ${imgWrapper}`}>
                            <img
                              src={productImage}
                              alt={item.product_name}
                              className={`${imgWrapper} rounded-lg object-cover`}
                              onError={(e) => {
                                e.target.src = noImage;
                              }}
                            />
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-gray-900 mb-0.5 line-clamp-2 ${lineClampH4}`}>{item.product_name}</h4>
                            <div className={`flex items-center gap-1 mt-1`}>
                              <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium">
                                {t('dealModal.quantity', 'Qty')}: {item.quantity}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatPrice(item.product_price)} {t('dealModal.each', 'each')}
                              </span>
                            </div>
                          </div>

                          {/* Total Price */}
                          <div className="flex-shrink-0">
                            <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                              {formatPrice(item.product_price * (item.quantity || 1))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <></>
                )}
              </div>

              {/* Deal Summary Section */}
              <div className={`${px} ${pb2}`}>
                <h3 className={`${titleFont} font-semibold text-gray-900 mb-2`}>{t('dealModal.dealSummary', 'Deal Summary')}</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('dealModal.regularPrice', 'Regular Price')}:</span>
                    <span className="text-gray-500">{formatPrice(fullDeal.original_total)}</span>
                  </div>

                  {/* Show discount only if there's actual savings */}
                  {fullDeal.original_total > fullDeal.deal_total && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('dealModal.youSaveLabel', 'You Save')}:</span>
                      <span className="text-green-600 font-medium">
                        -{formatPrice(fullDeal.original_total - fullDeal.deal_total)}
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  {fullDeal.original_total > fullDeal.deal_total && (
                    <div className="border-t border-gray-200 my-2"></div>
                  )}

                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('dealModal.dealTotal', 'Deal Total')}:</span>
                    <span className="text-red-600">{formatPrice(fullDeal.deal_total)}</span>
                  </div>
                </div>
              </div>

              {/* Cancel Button - Show if deal is claimed and active */}
              {canCancelOrReschedule && (
                <div className={`${px} ${pb2}`}>
                  <button
                    onClick={handleCancelClaimClick}
                    disabled={cancelling}
                    className={`hidden w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white ${buttonPy} ${buttonPx} rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${claimButtonText}`}
                  >
                    {cancelling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t('dealModal.cancelling', 'Cancelling...')}
                      </>
                    ) : (
                      t('dealModal.cancelClaim', 'Cancel Claim')
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Claim Deal Button - Fixed at Bottom - Only show if not claimed or not active */}
        {(!isClaimed || !isActiveClaim) && (
          <div className={`flex-shrink-0 border-t border-gray-200 bg-white ${bottomBar}`}>
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={handleAddToCart}
                className={`w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white ${buttonPy} ${buttonPx} rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${claimButtonText}`}
              >
                <ShoppingCart className="w-5 h-5" />
                {t('cart.add', 'Add to Cart')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        module="deal"
        itemName={fullDeal.deal_name}
        itemId={fullDeal._id}
        returnPath="/"
      />
      <PhoneRequiredModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSubmit={handlePhoneSubmit}
        userName={user?.name}
        required={true}
      />
      <ClaimDealModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onSubmit={proceedWithClaimDeal}
        deal={fullDeal}
      />
      <RescheduleModal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        onSubmit={handleRescheduleClaim}
        deal={fullDeal}
        currentDate={currentClaim?.preferred_datetime ? getPreferredDateFromDatetime(currentClaim.preferred_datetime) : ''}
        currentTime={currentClaim?.preferred_datetime ? getPreferredTimeFromDatetime(currentClaim.preferred_datetime) : ''}
      />
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelClaim}
        title={t('dealModal.cancelClaim', 'Cancel Deal')}
        message={t('dealModal.confirmCancel', 'Are you sure you want to cancel this deal?')}
        confirmText={t('dealModal.cancelClaim', 'Cancel Deal')}
        cancelText={t('common.cancel', 'Cancel')}
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        loading={cancelling}
      />
      <ConfirmModal
        isOpen={showReplaceConfirm}
        onClose={() => {
          setShowReplaceConfirm(false);
          setPendingAddDeal(null);
        }}
        onConfirm={async () => {
          setShowReplaceConfirm(false);
          await clearCart();
          if (pendingAddDeal) {
            try {
              const customerId = user?._id || user?.id;
              if (!customerId) {
                setShowLoginModal(true);
                return;
              }
              await cartAPI.addToCart(customerId, pendingAddDeal._id);
              await reload();
              openCart();
              toast.success(t('cart.added', 'Added to cart'));
              onClose();
            } catch (error) {
              const message = error?.response?.data?.message || error?.message;
              toast.error(message || t('cart.addFailed', 'Unable to add this deal right now.'));
            }
          }
          setPendingAddDeal(null);
        }}
        title={t('cart.replaceTitle', 'Replace cart items?')}
        message={t(
          'cart.replaceMessage',
          'Your cart can only include deals from one restaurant. Clear current cart and add this deal?'
        )}
        confirmText={t('cart.replaceConfirm', 'Clear & Add')}
        cancelText={t('common.cancel', 'Cancel')}
        confirmButtonClass="bg-orange-500 hover:bg-orange-600"
      />

      {/* Share popover: link in input with Copy on right, app buttons below */}
      {showSharePopover && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowSharePopover(false)}>
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
            {/* Input with Copy button on the right */}
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
            {/* Share via apps - WhatsApp, etc. */}
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
        </div>
      )}
    </div>
  );
};

export default DealModal;
