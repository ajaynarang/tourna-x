'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { 
  Trophy, 
  Calendar, 
  Target,
  Award,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const ONBOARDING_STEPS = [
  {
    icon: Trophy,
    title: 'Discover Tournaments',
    description: 'Browse and search for tournaments that match your skills and interests',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Target,
    title: 'Register Instantly',
    description: 'Quick registration process with automatic approval for eligible tournaments',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Calendar,
    title: 'Track Your Matches',
    description: 'View your upcoming matches, results, and tournament standings in real-time',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Award,
    title: 'Analyze Performance',
    description: 'Get AI-powered insights and track your progress with detailed statistics',
    color: 'from-orange-500 to-orange-600'
  }
];

export default function PlayerWelcome() {
  return (
    <AuthGuard requiredRoles={['player']}>
      <PlayerWelcomeContent />
    </AuthGuard>
  );
}

function PlayerWelcomeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    router.push('/player/dashboard');
  };

  const handleGetStarted = () => {
    router.push('/tournaments');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-4xl w-full"
      >
        {/* Welcome Header */}
        <motion.div variants={item} className="text-center mb-8">
          <div className="inline-flex p-4 glass-card-intense rounded-full shadow-lg mb-4">
            <Sparkles className="h-12 w-12 text-blue-400" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-3">
            Welcome to Tourna-X! 👋
          </h1>
          <p className="text-xl text-secondary">
            Hi <strong className="text-blue-400">{user?.name}</strong>, let's get you started on your tournament journey
          </p>
        </motion.div>

        {/* Main Onboarding Card */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm mb-6">
          <CardContent className="p-8">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-8">
              {ONBOARDING_STEPS.map((_, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      index <= currentStep 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < ONBOARDING_STEPS.length - 1 && (
                    <div 
                      className={`flex-1 h-1 mx-2 rounded transition-all ${
                        index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Current Step Content */}
            <div className="text-center py-8">
              <div className={`inline-flex p-6 bg-gradient-to-br ${ONBOARDING_STEPS[currentStep].color} rounded-2xl shadow-xl mb-6`}>
                {(() => {
                  const Icon = ONBOARDING_STEPS[currentStep].icon;
                  return <Icon className="h-16 w-16 text-white" />;
                })()}
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {ONBOARDING_STEPS[currentStep].title}
              </h2>
              
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {ONBOARDING_STEPS[currentStep].description}
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200">
              <Button 
                variant="ghost" 
                size="lg"
                onClick={handleSkip}
              >
                Skip Tutorial
              </Button>

              <div className="flex items-center gap-3">
                {currentStep < ONBOARDING_STEPS.length - 1 ? (
                  <Button 
                    size="lg"
                    onClick={handleNext}
                    className="min-w-32"
                  >
                    Next
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    size="lg"
                    onClick={handleGetStarted}
                    className="min-w-32 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Get Started
                    <Sparkles className="h-5 w-5 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Browse Tournaments</div>
                  <div className="text-xs text-gray-600">Find your perfect match</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Track Progress</div>
                  <div className="text-xs text-gray-600">Monitor your performance</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Connect & Play</div>
                  <div className="text-xs text-gray-600">Join the community</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

