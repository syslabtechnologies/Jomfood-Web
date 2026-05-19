import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, UtensilsCrossed, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { isRichHtmlEmpty, prepareRedeemHtml, REDEEM_HTML_CONTENT_CLASS } from '../../utils/sanitizeHtml';

const SERVICE_TYPES = [
  {
    id: 'delivery',
    contentKey: 'delivery',
    labelKey: 'dealCard.delivery',
    defaultLabel: 'Delivery',
    Icon: Truck,
    badgeClass: 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-medium',
    activeClass: 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-200 text-xs font-medium',
    idleClass: 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-xs font-medium',
    iconClass: 'text-blue-600',
  },
  {
    id: 'dine-in',
    contentKey: 'dine_in',
    labelKey: 'dealCard.dineIn',
    defaultLabel: 'Dine-in',
    Icon: UtensilsCrossed,
    badgeClass: 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-200 text-xs font-medium',
    activeClass: 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-green-500 bg-green-50 text-green-700 ring-1 ring-green-200 text-xs font-medium',
    idleClass: 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-green-200 bg-white text-green-600 hover:bg-green-50 text-xs font-medium',
    iconClass: 'text-green-600',
  },
  {
    id: 'self_pickup',
    contentKey: 'self_pickup',
    labelKey: 'dealCard.selfPickup',
    defaultLabel: 'Pickup',
    Icon: ShoppingBag,
    badgeClass: 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-xs font-medium',
    activeClass: 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-200 text-xs font-medium',
    idleClass: 'inline-flex items-center gap-1 px-2 py-1 rounded-full border border-orange-200 bg-white text-orange-600 hover:bg-orange-50 text-xs font-medium',
    iconClass: 'text-orange-600',
  },
];

const DealRedeemInstructionsPanel = ({
  consumptionTypes = [],
  redeemInstructions = null,
  className = '',
  productFont = 'text-xs',
  descriptionClassName = 'text-xs text-gray-600',
  descriptionStyle,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [activeType, setActiveType] = useState('');

  const availableTypes = useMemo(() => {
    if (!Array.isArray(consumptionTypes) || !consumptionTypes.length) return [];
    return SERVICE_TYPES.filter((type) => consumptionTypes.includes(type.id));
  }, [consumptionTypes]);

  const sectionsWithContent = useMemo(() => {
    return availableTypes
      .map((type) => {
        const html = redeemInstructions?.[type.contentKey];
        if (!html || isRichHtmlEmpty(html)) return null;
        return { ...type, html };
      })
      .filter(Boolean);
  }, [availableTypes, redeemInstructions]);

  useEffect(() => {
    if (!sectionsWithContent.length) {
      setActiveType('');
      return;
    }
    if (!sectionsWithContent.some((s) => s.id === activeType)) {
      setActiveType(sectionsWithContent[0].id);
    }
  }, [sectionsWithContent, activeType]);

  if (!availableTypes.length) return null;

  const showRedeemToggle = sectionsWithContent.length > 0;
  const activeSection = sectionsWithContent.find((s) => s.id === activeType);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (next && sectionsWithContent[0] && !activeType) {
        setActiveType(sectionsWithContent[0].id);
      }
      return next;
    });
  };

  const handleBadgePress = (typeId) => {
    if (!expanded) return;
    if (sectionsWithContent.some((s) => s.id === typeId)) {
      setActiveType(typeId);
    }
  };

  const renderBadge = (type) => {
    const Icon = type.Icon;
    const label = t(type.labelKey, type.defaultLabel);
    const hasContent = sectionsWithContent.some((s) => s.id === type.id);
    const isActive = expanded && activeType === type.id;

    if (expanded && hasContent) {
      return (
        <button
          key={type.id}
          type="button"
          onClick={() => handleBadgePress(type.id)}
          className={isActive ? type.activeClass : type.idleClass}
        >
          <Icon className={`w-3.5 h-3.5 ${type.iconClass}`} />
          {label}
        </button>
      );
    }

    return (
      <span key={type.id} className={type.badgeClass}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  };

  return (
    <div className={className}>
      <div className={`flex items-center gap-2 flex-wrap ${productFont}`}>
        {availableTypes.map(renderBadge)}
      </div>

      {showRedeemToggle && (
        <>
          <button
            type="button"
            onClick={toggleExpanded}
            className={`mt-2 inline-flex items-center gap-1 leading-tight ${descriptionClassName} font-medium text-primary hover:text-primary-600 transition-colors`}
          >
            {t('dealModal.howToRedeemQuestion', 'How to redeem?')}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expanded && activeSection && (
            <div
              style={descriptionStyle}
              className={`mt-1 max-w-none ${descriptionClassName} ${REDEEM_HTML_CONTENT_CLASS}`}
              dangerouslySetInnerHTML={{ __html: prepareRedeemHtml(activeSection.html) }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DealRedeemInstructionsPanel;
