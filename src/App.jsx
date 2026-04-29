import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { ApiProvider } from './context/ApiContext';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';
import './App.css';
import SignupPage from './pages/SignupPage';
import { Toaster } from 'sonner';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import DealsPage from './pages/DealsPage';
import DealsPage2 from './pages/DealsPage2';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import MerchantTermsPage from './pages/MerchantTermsPage';
import NotificationsPage from './pages/NotificationsPage';
import RestaurantRequestPage from './pages/RestaurantRequestPage';
import ContactUsPage from './pages/ContactUsPage';
import DealSearchPage from './pages/DealSearchPage';
import RestaurantDetailsPage from './pages/RestaurantDetailsPage';
import CartPaymentStatusPage from './pages/CartPaymentStatusPage';
import ScrollToTop from './components/common/ScrollToTop';
import PhoneNumberCheck from './components/common/PhoneNumberCheck';
// import GoogleTranslate from './components/common/GoogleTranslate'; // COMMENTED: Using i18n instead, keep for revert
import NotificationPermissionModal from './components/common/NotificationPermissionModal';
import FirstOrderDiscountModal from './components/common/FirstOrderDiscountModal';
import { useNotificationPermission } from './hooks/useNotificationPermission';
import MyDealsPage from './pages/MyDealsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SetPasswordPage from './pages/SetPasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

function AppContent() {
  const { showModal, handleClose } = useNotificationPermission();
  const [showFirstOrderDiscountModal, setShowFirstOrderDiscountModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.showFirstOrderDiscountModal) {
      setShowFirstOrderDiscountModal(true);
    }
  }, [location.state]);

  const handleFirstOrderDiscountModalClose = () => {
    setShowFirstOrderDiscountModal(false);
    if (location.state?.showFirstOrderDiscountModal) {
      navigate(`${location.pathname}${location.search}${location.hash}`, {
        replace: true,
        state: {},
      });
    }
  };

  return (
    <div className="App">
      {/* <GoogleTranslate /> COMMENTED: Using i18n instead, keep for revert */}
      <ScrollToTop />
      <PhoneNumberCheck />
      <Toaster richColors position="top-right" />
      <NotificationPermissionModal isOpen={showModal} onClose={handleClose} />
      <FirstOrderDiscountModal
        isOpen={showFirstOrderDiscountModal}
        onClose={handleFirstOrderDiscountModalClose}
      />
      <Routes>
        <Route path="/" element={<DealsPage2 />} />
        <Route path="/restaurants" element={<HomePage />} />
        {/* <Route path="/" element={<HomePage />} />
        <Route path="/deals" element={<DealsPage2 />} /> */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/my-deals"
          element={
            <ProtectedRoute>
              <MyDealsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/deals-2" element={<DealsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/merchant-terms" element={<MerchantTermsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/restaurant-request" element={<RestaurantRequestPage />} />
        <Route path="/contact" element={<ContactUsPage />} />
        <Route path="/search" element={<DealSearchPage />} />
        <Route path="/restaurants/:id" element={<RestaurantDetailsPage />} />
        <Route path="/cart-payment" element={<CartPaymentStatusPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ApiProvider>
      <UserProvider>
        <NotificationProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </NotificationProvider>
      </UserProvider>
    </ApiProvider>
  );
}

export default App;
