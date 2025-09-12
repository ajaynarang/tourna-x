'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Trophy, Shield, Users, Calendar, ArrowRight, Smartphone, Globe, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, isAdmin, isPlayer, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else if (isPlayer) {
        router.push('/player/dashboard');
      }
    }
  }, [isLoading, isAdmin, isPlayer, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section - Mobile First */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6 lg:mb-8">
              <div className="p-3 lg:p-4 bg-white rounded-2xl lg:rounded-3xl shadow-lg">
                <Trophy className="h-12 w-12 lg:h-16 lg:w-16 text-primary" />
              </div>
            </div>
            
            <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6">
              Welcome to <span className="text-primary">Tourna-X</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-gray-600 mb-6 lg:mb-8 max-w-3xl mx-auto px-4">
              The modern tournament management system for badminton and tennis. 
              Create tournaments, manage participants, and track matches with ease.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center px-4">
              <Button size="lg" asChild className="h-12 lg:h-14 px-6 lg:px-8">
                <Link href="/login">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 lg:h-5 lg:w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-12 lg:h-14 px-6 lg:px-8">
                <Link href="/tournaments">
                  View Tournaments
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Everything you need for tournament management
            </h2>
            <p className="text-base lg:text-lg text-gray-600">
              Built for organizers and participants alike
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="mx-auto p-3 bg-blue-100 rounded-full w-fit mb-4">
                  <Trophy className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                </div>
                <CardTitle className="text-base lg:text-lg">Tournament Management</CardTitle>
                <CardDescription className="text-sm lg:text-base">
                  Create and manage tournaments with detailed settings
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="mx-auto p-3 bg-green-100 rounded-full w-fit mb-4">
                  <Users className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                </div>
                <CardTitle className="text-base lg:text-lg">Easy Registration</CardTitle>
                <CardDescription className="text-sm lg:text-base">
                  Simple registration process for participants
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="mx-auto p-3 bg-orange-100 rounded-full w-fit mb-4">
                  <Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
                </div>
                <CardTitle className="text-base lg:text-lg">Smart Fixtures</CardTitle>
                <CardDescription className="text-sm lg:text-base">
                  Automatic fixture generation and scheduling
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="mx-auto p-3 bg-purple-100 rounded-full w-fit mb-4">
                  <Shield className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
                </div>
                <CardTitle className="text-base lg:text-lg">Live Scoring</CardTitle>
                <CardDescription className="text-sm lg:text-base">
                  Real-time score updates and match tracking
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="py-12 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Why Choose Tourna-X?
            </h2>
            <p className="text-base lg:text-lg text-gray-600">
              Built for tournament organizers and players
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto p-4 bg-blue-100 rounded-full w-fit mb-4">
                <Smartphone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Registration</h3>
              <p className="text-gray-600">
                Players can register with just their phone number using OTP verification. No complex signup process.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto p-4 bg-green-100 rounded-full w-fit mb-4">
                <Globe className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Society Management</h3>
              <p className="text-gray-600">
                Create society-only tournaments or open tournaments. Perfect for apartment complexes and sports clubs.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto p-4 bg-orange-100 rounded-full w-fit mb-4">
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Updates</h3>
              <p className="text-gray-600">
                Live scoring, instant notifications, and real-time tournament updates keep everyone informed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 lg:py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Ready to start your tournament?
          </h2>
          <p className="text-lg lg:text-xl text-blue-100 mb-6 lg:mb-8">
            Join thousands of organizers using Tourna-X
          </p>
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="h-12 lg:h-14 px-6 lg:px-8">
              <Link href="/login">
                Sign In Now
                <ArrowRight className="ml-2 h-4 w-4 lg:h-5 lg:w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 lg:h-14 px-6 lg:px-8 border-white text-white hover:bg-white hover:text-primary">
              <Link href="/register">
                Create Account
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}