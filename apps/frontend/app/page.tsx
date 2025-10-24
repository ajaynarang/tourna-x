'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@repo/ui';
import { Trophy, Users, Calendar, Shield, ArrowRight, Smartphone, Globe, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  const { user, isAdmin, isPlayer, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else if (isPlayer) {
        router.push('/player/dashboard');
      }
    }
  }, [isLoading, isAdmin, isPlayer, router, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="relative min-h-screen w-full">
      {/* Header for landing page */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-background/95 sticky top-0 z-50 border-b border-white/10 backdrop-blur-md"
      >
        <div className="px-4 py-4 sm:px-8">
          <div className="flex items-center justify-between">
            <h1 className="gradient-title text-xl font-bold sm:text-2xl">
              Tourna-X
            </h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button asChild size="sm" className="bg-primary">
                <Link href="/login">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-8 flex justify-center">
              <div className="glass-card-intense p-4 lg:p-6">
                <Trophy className="h-12 w-12 text-green-400 lg:h-16 lg:w-16" />
              </div>
            </div>

            <h1 className="text-primary mb-6 text-4xl font-bold lg:text-6xl">
              Welcome to <span className="gradient-title">Tourna-X</span>
            </h1>

            <p className="text-primary mx-auto mb-8 max-w-3xl px-4 text-lg lg:text-xl">
              The modern tournament management system for badminton and tennis.
              Create tournaments, manage participants, and track matches with ease.
            </p>

            <div className="flex flex-col justify-center gap-4 px-4 sm:flex-row">
              <Button size="lg" asChild className="bg-primary h-12 px-8 lg:h-14">
                <Link href="/login">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="glass-card h-12 border-white/20 px-8 lg:h-14"
              >
                <Link href="/tournaments">View Tournaments</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-primary mb-4 text-3xl font-bold lg:text-4xl">
              Everything you need for tournament management
            </h2>
            <p className="text-primary text-lg">
              Built for organizers and participants alike
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            <FeatureCard
              icon={Trophy}
              title="Tournament Management"
              description="Create and manage tournaments with detailed settings"
              color="blue"
              delay={0.1}
            />
            <FeatureCard
              icon={Users}
              title="Easy Registration"
              description="Simple registration process for participants"
              color="green"
              delay={0.2}
            />
            <FeatureCard
              icon={Calendar}
              title="Smart Fixtures"
              description="Automatic fixture generation and scheduling"
              color="orange"
              delay={0.3}
            />
            <FeatureCard
              icon={Shield}
              title="Live Scoring"
              description="Real-time score updates and match tracking"
              color="purple"
              delay={0.4}
            />
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-primary mb-4 text-3xl font-bold lg:text-4xl">
              Why Choose Tourna-X?
            </h2>
            <p className="text-primary text-lg">
              Built for tournament organizers and players
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <KeyFeature
              icon={Smartphone}
              title="Easy Registration"
              description="Players can register with just their phone number using OTP verification. No complex signup process."
              color="blue"
              delay={0.1}
            />
            <KeyFeature
              icon={Globe}
              title="Society Management"
              description="Create society-only tournaments or open tournaments. Perfect for apartment complexes and sports clubs."
              color="green"
              delay={0.2}
            />
            <KeyFeature
              icon={Zap}
              title="Real-time Updates"
              description="Live scoring, instant notifications, and real-time tournament updates keep everyone informed."
              color="orange"
              delay={0.3}
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary relative overflow-hidden py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
              Ready to start your tournament?
            </h2>
            <p className="mb-8 text-lg text-blue-100 lg:text-xl">
              Join thousands of organizers using Tourna-X
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                variant="default"
                asChild
                className="h-12 px-8 hover:bg-blue-600 hover:text-white lg:h-14"
              >
                <Link href="/login">
                  Sign In Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="h-12 px-8 lg:h-14"
              >
                <Link href="/register">Create Account</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  delay,
}: {
  icon: any;
  title: string;
  description: string;
  color: string;
  delay: number;
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    orange: 'bg-orange-500/10 text-orange-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="glass-card hover-lift p-6 text-center"
    >
      <div
        className={`mx-auto mb-4 w-fit rounded-full p-3 ${colorClasses[color as keyof typeof colorClasses]}`}
      >
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-primary mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-primary text-sm">{description}</p>
    </motion.div>
  );
}

function KeyFeature({
  icon: Icon,
  title,
  description,
  color,
  delay,
}: {
  icon: any;
  title: string;
  description: string;
  color: string;
  delay: number;
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    orange: 'bg-orange-500/10 text-orange-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div
        className={`mx-auto mb-4 w-fit rounded-full p-4 ${colorClasses[color as keyof typeof colorClasses]}`}
      >
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-primary mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-primary">{description}</p>
    </motion.div>
  );
}
