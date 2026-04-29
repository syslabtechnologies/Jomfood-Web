import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OtpInput from 'react-otp-input';
import CommonLayout from '../components/layout/CommonLayout';
import { toast } from '../utils/toast';
import { forgotPasswordAPI } from '../utils/api';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState('request'); // request -> verify -> reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(t('auth.emailRequired', 'Email is required'));
      return;
    }

    try {
      setSubmitting(true);
      await forgotPasswordAPI.sendOTP(email.trim());
      toast.success(t('auth.otpSent', 'OTP sent to your email'));
      setStep('verify');
    } catch (err) {
      toast.error(err?.message || t('auth.failedToSendOtp', 'Failed to send OTP'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error(t('auth.otpRequired', 'OTP is required'));
      return;
    }

    try {
      setSubmitting(true);
      await forgotPasswordAPI.verifyOTP(email.trim(), otp.trim());
      toast.success(t('auth.otpVerified', 'OTP verified'));
      setStep('reset');
    } catch (err) {
      toast.error(err?.message || t('auth.invalidOtp', 'Invalid OTP'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error(t('auth.passwordMinLength', 'Password must be at least 6 characters'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('auth.passwordMismatch', 'Passwords do not match'));
      return;
    }

    try {
      setSubmitting(true);
      await forgotPasswordAPI.resetPassword(email.trim(), otp.trim(), password);
      toast.success(t('auth.passwordResetSuccess', 'Password reset successfully'));
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err?.message || t('auth.passwordResetFailed', 'Failed to reset password'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setSubmitting(true);
      await forgotPasswordAPI.sendOTP(email.trim());
      toast.success(t('auth.otpResent', 'OTP resent successfully'));
    } catch (err) {
      toast.error(err?.message || t('auth.failedToSendOtp', 'Failed to send OTP'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CommonLayout>
      <div className="flex items-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
              {t('auth.forgotPasswordTitle', 'Forgot Password')}
            </h1>
            <p className="text-sm text-gray-600 mb-6 text-center">
              {step === 'request' && t('auth.forgotPasswordSubtitle', 'Enter your email to receive OTP')}
              {step === 'verify' && t('auth.verifyOtpSubtitle', 'Enter the OTP sent to your email')}
              {step === 'reset' && t('auth.resetPasswordSubtitle', 'Set your new password')}
            </p>

            {step === 'request' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('auth.emailLabel', 'Email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  {submitting ? t('auth.sending', 'Sending...') : t('auth.sendOtp', 'Send OTP')}
                </button>
              </form>
            )}

            {step === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  {/* <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                    {t('auth.otpCode', 'OTP Code')}
                  </label> */}
                  <div className="flex justify-center">
                    <OtpInput
                      value={otp}
                      onChange={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
                      numInputs={6}
                      renderSeparator={<span className="w-2"></span>}
                      renderInput={(props) => (
                        <input
                          {...props}
                          className="!w-8 !h-10 sm:w-16 sm:h-16 text-xl font-semibold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all shadow-sm"
                        />
                      )}
                      shouldAutoFocus
                      inputType="tel"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    {t('auth.otpExpiryHint', 'Code expires in 10 minutes')}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={submitting || otp.length !== 6}
                  className="w-full bg-primary hover:bg-primary-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  {submitting ? t('auth.verifying', 'Verifying...') : t('auth.verifyOtp', 'Verify OTP')}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleResendOtp}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  {t('auth.resendOtp', 'Resend OTP')}
                </button>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('auth.newPassword', 'New Password')}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.newPasswordPlaceholder', 'Enter new password')}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('auth.confirmPassword', 'Confirm Password')}
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.confirmPasswordPlaceholder', 'Confirm new password')}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  {submitting ? t('auth.resetting', 'Resetting...') : t('auth.resetPassword', 'Reset Password')}
                </button>
              </form>
            )}

            <div className="text-sm text-gray-600 mt-4 text-center">
              <Link to="/login" className="text-primary font-medium">
                {t('auth.backToLogin', 'Back to Login')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </CommonLayout>
  );
};

export default ForgotPasswordPage;
