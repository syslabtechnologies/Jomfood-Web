import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import OtpInput from 'react-otp-input';
import { api } from '../utils/api';
import { useUser } from '../context/UserContext';
import { authStorage } from '../utils/auth';
import { toast } from '../utils/toast';
import CommonLayout from '../components/layout/CommonLayout';
import jomfoodLogo from '../assets/JomFood.png';

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const { reload } = useUser();
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();

    const [otp, setOtp] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [autoVerifying, setAutoVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [verificationStatus, setVerificationStatus] = useState(null); // 'success' | 'error' | null
    const [errorMessage, setErrorMessage] = useState('');
    const [userEmail, setUserEmail] = useState('');

    // Get userId from URL params or localStorage
    const userIdFromUrl = searchParams.get('userId');
    const otpFromUrl = searchParams.get('otp');
    const userId = userIdFromUrl || localStorage.getItem('pendingUserId');

    // Auto-verify from email link
    useEffect(() => {
        const autoVerify = async () => {
            if (userIdFromUrl && otpFromUrl) {
                setAutoVerifying(true);
                try {
                    const response = await api.get(
                        `/auth/customer/verify-email?userId=${userIdFromUrl}&otp=${otpFromUrl}`
                    );

                    if (response.success) {
                        setVerificationStatus('success');

                        authStorage.setAccessToken(response.data.tokens.token);
                        authStorage.setRefreshToken(response.data.tokens.refreshToken);

                        localStorage.removeItem('pendingUserId');

                        if (response.data?.requiresPasswordSetup) {
                            toast.success('Email verified! Please set your password.');
                            setTimeout(() => {
                                navigate('/set-password', { replace: true });
                            }, 1500);
                        } else {
                            await reload();
                            toast.success('Email verified successfully! Redirecting...');
                            setTimeout(() => {
                                navigate('/', { replace: true });
                            }, 2000);
                        }
                    }
                } catch (err) {
                    setVerificationStatus('error');
                    const message = err?.response?.data?.message || err?.message || 'Verification failed';
                    setErrorMessage(message);
                    toast.error(message);
                } finally {
                    setAutoVerifying(false);
                }
            }
        };

        autoVerify();
    }, [userIdFromUrl, otpFromUrl, navigate, reload]);

    // Cooldown timer for resend button
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Redirect if no userId
    useEffect(() => {
        if (!userId && !autoVerifying) {
            console.log('No pending verification found. Please register first.');
            navigate('/signup', { replace: true });
        }
    }, [userId, autoVerifying, navigate]);

    // Manual OTP submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setSubmitting(true);
        setErrorMessage('');

        try {
            const response = await api.post('/auth/customer/verify-email', {
                userId,
                otp: otp.trim()
            });

            if (response.success) {
                setVerificationStatus('success');

                authStorage.setAccessToken(response.data.tokens.token);
                authStorage.setRefreshToken(response.data.tokens.refreshToken);

                localStorage.removeItem('pendingUserId');

                if (response.data?.requiresPasswordSetup) {
                    toast.success('Email verified! Please set your password.');
                    setTimeout(() => {
                        navigate('/set-password', { replace: true });
                    }, 1500);
                } else {
                    await reload();
                    toast.success('Email verified successfully!');
                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 1500);
                }
            }
        } catch (err) {
            setVerificationStatus('error');
            const message = err?.response?.data?.message || err?.message || 'Verification failed';
            setErrorMessage(message);
            toast.error(message);

            // Clear OTP input on error
            setOtp('');
        } finally {
            setSubmitting(false);
        }
    };

    // Resend OTP
    const handleResend = async () => {
        if (resendCooldown > 0) return;

        setResending(true);
        setErrorMessage('');

        try {
            const response = await api.post('/auth/customer/resend-otp', {
                userId
            });

            if (response.success) {
                toast.success('Verification code has been resent to your email');
                setResendCooldown(60); // 60 seconds cooldown

                // Extract email from response if available
                if (response.data?.email) {
                    setUserEmail(response.data.email);
                }
            }
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'Failed to resend code';
            toast.error(message);
        } finally {
            setResending(false);
        }
    };

    // Show loading state during auto-verification
    if (autoVerifying) {
        return (
            <CommonLayout>
                <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your email...</h2>
                        <p className="text-sm text-gray-600">Please wait while we verify your email address.</p>
                    </div>
                </div>
            </CommonLayout>
        );
    }

    return (
        <CommonLayout>
            <div className="flex items-center min-h-[calc(100vh-120px)]">
                <div className="w-full max-w-7xl mx-auto px-4 py-6">
                    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6 shadow-sm">

                        {/* Success State */}
                        {verificationStatus === 'success' ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Email Verified!</h1>
                                <p className="text-sm text-gray-600 mb-4">
                                    Your email has been successfully verified. Redirecting you to the home page...
                                </p>
                                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-8 h-8 text-primary" />
                                    </div>
                                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verify Your Email</h1>
                                    <p className="text-sm text-gray-600">
                                        We've sent a 6-digit verification code to your email address.
                                        {userEmail && (
                                            <span className="block font-medium text-gray-900 mt-1">{userEmail}</span>
                                        )}
                                    </p>
                                </div>

                                {/* Error Message */}
                                {errorMessage && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-800">{errorMessage}</p>
                                    </div>
                                )}

                                {/* OTP Form */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="flex justify-center">
                                        <OtpInput
                                            value={otp}
                                            onChange={setOtp}
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
                                    <p className="text-xs text-gray-500 text-center">
                                        Code expires in 10 minutes
                                    </p>

                                    <button
                                        type="submit"
                                        disabled={submitting || otp.length !== 6}
                                        className="w-full bg-primary hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify Email'
                                        )}
                                    </button>
                                </form>

                                {/* Resend Code */}
                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resending || resendCooldown > 0}
                                        className="text-primary hover:text-primary-600 font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {resending ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Sending...
                                            </span>
                                        ) : resendCooldown > 0 ? (
                                            `Resend Code (${resendCooldown}s)`
                                        ) : (
                                            'Resend Code'
                                        )}
                                    </button>
                                </div>

                                {/* Help Text */}
                                {/* <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs text-blue-800">
                                        <strong>Tip:</strong> Check your spam folder if you don't see the email.
                                        You can also click the verification link in the email to verify automatically.
                                    </p>
                                </div> */}

                                {/* Back to Login */}
                                <div className="mt-6 text-center">
                                    <Link
                                        to="/login"
                                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        ← Back to Login
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </CommonLayout>
    );
};

export default VerifyEmailPage;
