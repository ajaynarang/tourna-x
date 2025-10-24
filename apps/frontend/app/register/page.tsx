'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Input } from '@repo/ui';
import { Label } from '@repo/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';
import { CountryCodeSelector } from '@repo/ui';
import { Trophy, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: '',
    society: '',
    block: '',
    flatNumber: '',
    otp: '',
  });

  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Client-side validation
    if (!form.phone || form.phone.length < 13) {
      setError('Please enter a complete 10-digit phone number');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: form.phone, purpose: 'register' }),
      });

      if (response.ok) {
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
      } else {
        const errorData = await response.json();
        if (errorData.userExists) {
          setError('An account with this phone number already exists. Please sign in instead.');
        } else {
          throw new Error(errorData.error || 'Failed to send OTP');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age),
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (otpTimer > 0) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: form.phone, purpose: 'register' }),
      });

      if (response.ok) {
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
      } else {
        const errorData = await response.json();
        if (errorData.userExists) {
          setError('An account with this phone number already exists. Please sign in instead.');
        } else {
          throw new Error(errorData.error || 'Failed to resend OTP');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your account has been created successfully. You can now sign in to your account.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Sign In Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md lg:max-w-lg">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-4">
            <Trophy className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Join Tourna-X as a player</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={otpSent ? handleRegister : handleSendOtp} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <CountryCodeSelector
                    value={form.phone}
                    onChange={(value) => setForm({ ...form, phone: value })}
                    placeholder="9876543210"
                    disabled={false}
                    showValidation={true}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      min="1"
                      max="100"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={form.gender} onValueChange={(value) => setForm({ ...form, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Society Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Society Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="society">Society/Apartment Name</Label>
                  <Input
                    id="society"
                    type="text"
                    placeholder="Green Valley Apartments"
                    value={form.society}
                    onChange={(e) => setForm({ ...form, society: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="block">Block/Tower</Label>
                    <Input
                      id="block"
                      type="text"
                      placeholder="Block A"
                      value={form.block}
                      onChange={(e) => setForm({ ...form, block: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flatNumber">Flat Number</Label>
                    <Input
                      id="flatNumber"
                      type="text"
                      placeholder="101"
                      value={form.flatNumber}
                      onChange={(e) => setForm({ ...form, flatNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* OTP Verification */}
              {otpSent && (
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={form.otp}
                    onChange={(e) => setForm({ ...form, otp: e.target.value })}
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Enter the code sent to {form.phone}
                  </p>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={otpTimer > 0}
                      className="text-sm text-primary hover:text-primary/80 disabled:text-gray-400"
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {otpSent ? 'Complete Registration' : 'Send OTP & Continue'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
