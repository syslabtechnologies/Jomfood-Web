import React, { useEffect, useMemo, useState } from "react";
import { Smartphone, X } from "lucide-react";
import { getStoreUrlForCurrentDevice } from "../../utils/appStoreLinks";

const DISMISS_KEY = "jomfood.mobile.app.popup.dismissed";

const MobileAppInstallPopup = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    const shouldShow = window.innerWidth < 1024 && !dismissed;
    setVisible(shouldShow);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setVisible(false);
      }
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const storeUrl = useMemo(() => getStoreUrlForCurrentDevice(), []);

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISMISS_KEY, "1");
    }
  };

  const handleOpenStore = () => {
    window.open(storeUrl, "_blank", "noopener,noreferrer");
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-2 z-[70] w-max  lg:hidden">
      <div className="flex items-center justify-between rounded-full bg-primary px-4 py-2 text-white shadow-xl">
        <button
          type="button"
          onClick={handleOpenStore}
          className="inline-flex items-center gap-2 text-sm font-semibold"
        >
          <Smartphone className="h-4 w-4" />
          Continue on App
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close app popup"
          className="rounded-full p-1 text-white/90 hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default MobileAppInstallPopup;

