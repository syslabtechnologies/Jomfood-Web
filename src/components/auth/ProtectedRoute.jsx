import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { authStorage } from '../../utils/auth';
import { useTranslation } from 'react-i18next';

const ProtectedRoute = ({ children }) => {
  const { user, reload, loading } = useUser();
  const location = useLocation();
  const { t } = useTranslation();
  const hasToken = !!authStorage.getAccessToken() || !!authStorage.getRefreshToken();

  useEffect(() => {
    if (hasToken && !user && !loading) {
      reload();
    }
  }, [hasToken, user, loading, reload]);

  if (loading || (hasToken && !user)) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-sm text-gray-500">{t('common.loading', 'Loading...')}</div>
      </div>
    );
  }

  if (!user && !hasToken) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
