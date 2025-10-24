'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Input } from '@repo/ui';
import { Label } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';
import { CountryCodeSelector } from '@repo/ui';
import { Trophy, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  // Unified login state
  const [loginForm, setLoginForm] = useState({
    phone: '',
    otp: '',
  });

  const { loginWithPhone, sendOtp } = useAuth();
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await sendOtp(loginForm.phone, 'login');
      setOtpSent(true);
      setOtpTimer(60);
      
      // Start countdown timer
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      if (err.message?.includes('No account found')) {
        setError('No account found with this phone number. Please register first.');
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await loginWithPhone(loginForm.phone, loginForm.otp);
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (otpTimer > 0) return;
    
    setIsLoading(true);
    setError('');

    try {
      await sendOtp(loginForm.phone, 'login');
      setOtpTimer(60);
      
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      if (err.message?.includes('No account found')) {
        setError('No account found with this phone number. Please register first.');
      } else {
        setError(err.message || 'Failed to resend OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-center p-6 lg:p-8">
        <div className="flex items-center gap-2 text-primary">
          <Trophy className="h-5 w-5" />
          <span className="gradient-title font-semibold">Tourna-X</span>
        </div>
      </div>

      {/* Main Content - Perfectly Centered */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-8 pb-20">
        <div className="w-full max-w-sm">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-6 ring-1 ring-slate-200">
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-primary mb-2 text-3xl font-bold">
              {!otpSent ? 'Welcome Back' : 'Verify Your Phone'}
            </h1>
            <p className="text-secondary text-lg">
              {!otpSent 
                ? 'Sign in to continue to your account' 
                : 'Enter the verification code we sent'
              }
            </p>
          </div>

          {/* Login Form */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm relative">
            {/* Close Button */}
            <Link 
              href="/" 
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
            >
              <X className="text-tertiary hover:text-primary h-4 w-4" />
            </Link>
            <CardContent className="p-8">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-primary text-sm font-semibold">
                      Phone Number
                    </Label>
                    <CountryCodeSelector
                      value={loginForm.phone}
                      onChange={(value) => setLoginForm({ ...loginForm, phone: value })}
                      placeholder="9876543210"
                      className="h-12 text-lg border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-500"
                      disabled={false}
                    />
                    <p className="text-tertiary text-sm leading-relaxed">
                      We'll send you a verification code. Works for both admins and players.
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    variant="default"
                    className="w-full h-12 text-lg font-semibold" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Verification Code'
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="otp" className="text-primary text-sm font-semibold">
                      Verification Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={loginForm.otp}
                      onChange={(e) => setLoginForm({ ...loginForm, otp: e.target.value })}
                      className="h-12 text-lg text-center tracking-widest border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      maxLength={6}
                      required
                    />
                    <p className="text-tertiary text-sm">
                      Code sent to <span className="text-primary font-medium">{loginForm.phone}</span>
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>For testing:</strong> Use verification code <span className="font-mono font-bold">123456</span>
                      </p>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    variant="default"
                    className="w-full h-12 text-lg font-semibold" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Sign In'
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={resendOtp}
                      disabled={otpTimer > 0}
                      className="text-sm font-medium"
                    >
                      {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend verification code'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="text-secondary text-center text-sm">
                  Don't have an account?{' '}
                  <Link 
                    href="/register" 
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Create one here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}