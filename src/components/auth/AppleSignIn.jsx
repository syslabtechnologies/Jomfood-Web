import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '../../utils/toast';
import { Loader2 } from 'lucide-react';

const AppleSignIn = ({ onSuccess, onError, buttonText }) => {
  const { t } = useTranslation();
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
  const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI;
  const [loading, setLoading] = useState(false);

  // Use refs to always access latest callbacks without re-registering listeners
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const processingRef = useRef(false);

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    // Only load the script once
    if (document.querySelector('script[src*="appleid.auth.js"]')) return;

    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const handleSuccess = (event) => {
      if (processingRef.current) return;
      if (!event.detail?.authorization) return;

      processingRef.current = true;
      try {
        const { authorization, user } = event.detail;
        const userInfo = {
          identityToken: authorization.id_token,
          authorizationCode: authorization.code,
          email: user?.email || null,
          name: user ? `${user.name?.firstName || ''} ${user.name?.lastName || ''}`.trim() || null : null,
        };
        onSuccessRef.current(userInfo);
      } catch (error) {
        console.error('Apple OAuth error:', error);
        toast.error(t('auth.appleSignInFailed'));
        onErrorRef.current(error);
      } finally {
        setLoading(false);
        setTimeout(() => { processingRef.current = false; }, 1000);
      }
    };

    const handleFailure = (event) => {
      setLoading(false);
      if (event.detail?.error === 'popup_closed_by_user') return;
      console.error('Apple Sign-In failure:', event.detail);
      toast.error(t('auth.appleSignInFailed'));
      onErrorRef.current(event.detail);
    };

    document.addEventListener('AppleIDSignInOnSuccess', handleSuccess);
    document.addEventListener('AppleIDSignInOnFailure', handleFailure);

    return () => {
      document.removeEventListener('AppleIDSignInOnSuccess', handleSuccess);
      document.removeEventListener('AppleIDSignInOnFailure', handleFailure);
    };
  }, [t]);

  const handleAppleSignIn = () => {
    if (!clientId) {
      toast.error(t('auth.appleSignInUnavailable'));
      return;
    }

    setLoading(true);

    try {
      if (window.AppleID) {
        window.AppleID.auth.init({
          clientId: clientId,
          scope: 'name email',
          redirectURI: redirectURI || window.location.origin,
          usePopup: true,
        });
        window.AppleID.auth.signIn();
      } else {
        setLoading(false);
        toast.error(t('auth.appleSignInUnavailable'));
      }
    } catch (error) {
      setLoading(false);
      console.error('Apple Sign-In init error:', error);
      toast.error(t('auth.appleSignInFailed'));
      onErrorRef.current(error);
    }
  };

  if (!clientId) {
    return null;
  }

  return (
    <button
      onClick={handleAppleSignIn}
      disabled={loading}
      className="w-full relative flex items-center px-3 py-2 bg-black hover:bg-gray-900 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg shadow-md transition-all duration-200 font-medium text-white text-sm mt-3"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      {loading ? (
        <>
          <div className="rounded p-1.5 flex-shrink-0">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          </div>
          <span className="absolute inset-0 flex items-center justify-center">{t('auth.signingIn', 'Signing in...')}</span>
        </>
      ) : (
        <>
          <div className="rounded p-1.5 flex-shrink-0">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          </div>
          <span className="absolute inset-0 flex items-center justify-center">{buttonText || t('auth.continueWithApple')}</span>
        </>
      )}
    </button>
  );
};

export default AppleSignIn;
