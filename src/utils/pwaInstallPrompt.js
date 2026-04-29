let initialized = false;
let deferredInstallPrompt = null;
let isInstalled = false;
const subscribers = new Set();

const notifySubscribers = () => {
  subscribers.forEach((callback) => {
    callback({
      deferredPromptAvailable: Boolean(deferredInstallPrompt),
      isInstalled,
    });
  });
};

export const initPWAInstallPrompt = () => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const standaloneByMedia = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const standaloneByNavigator = window.navigator?.standalone === true;
  isInstalled = Boolean(standaloneByMedia || standaloneByNavigator);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    notifySubscribers();
  });

  window.addEventListener("appinstalled", () => {
    isInstalled = true;
    deferredInstallPrompt = null;
    notifySubscribers();
  });

  notifySubscribers();
};

export const subscribePWAInstallPrompt = (callback) => {
  subscribers.add(callback);
  callback({
    deferredPromptAvailable: Boolean(deferredInstallPrompt),
    isInstalled,
  });

  return () => {
    subscribers.delete(callback);
  };
};

export const triggerPWAInstallPrompt = async () => {
  if (!deferredInstallPrompt) {
    return { ok: false, reason: "unavailable" };
  }

  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  notifySubscribers();

  return { ok: true, outcome };
};

export const registerPWAServiceWorker = () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const registerNow = () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  };

  if (document.readyState === "complete") {
    registerNow();
    return;
  }

  window.addEventListener("load", registerNow, { once: true });
};

