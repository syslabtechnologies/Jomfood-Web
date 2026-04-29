export const PLAY_STORE_URL =
  import.meta.env.VITE_PLAY_STORE_URL ||
  "https://play.google.com/store/apps/details?id=com.jomfood";

export const APP_STORE_URL =
  import.meta.env.VITE_APP_STORE_URL || "https://apps.apple.com/us/app/jomfood/id6757225361";

export const isIOSDevice = () => {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export const isAndroidDevice = () => {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
};

export const getStoreUrlForCurrentDevice = () => {
  if (isIOSDevice()) return APP_STORE_URL;
  if (isAndroidDevice()) return PLAY_STORE_URL;
  return PLAY_STORE_URL;
};

