'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  ArrowLeft,
  ArrowRight,
  User,
  Users,
  UserPlus,
  Phone,
  Mail,
  Home,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Trophy,
  MapPin,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  categories: string[];
  ageGroups?: string[];
  format: string;
  startDate: string;
  endDate: string;
  venue: string;
  location: string;
  entryFee: number;
  maxParticipants: number;
  participantCount: number;
  tournamentType: string;
  allowedSociety?: string;
  status: string;
  rules?: string;
  prizes: {
    winner: number;
    runnerUp: number;
    semiFinalist: number;
  };
}

interface RegistrationFormData {
  // Basic Info
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  
  // Society Info
  society: string;
  block: string;
  flatNumber: string;
  
  // Category Selection
  category: 'singles' | 'doubles' | 'mixed';
  ageGroup: string;
  
  // Partner Info (for doubles/mixed)
  partnerName: string;
  partnerPhone: string;
  partnerAge: number;
  partnerGender: 'male' | 'female' | 'other';
  
  // Payment
  paymentMethod: string;
  transactionId: string;
}

const initialFormData: RegistrationFormData = {
  name: '',
  age: 0,
  gender: 'male',
  society: '',
  block: '',
  flatNumber: '',
  category: 'singles',
  ageGroup: '',
  partnerName: '',
  partnerPhone: '',
  partnerAge: 0,
  partnerGender: 'male',
  paymentMethod: '',
  transactionId: '',
};

export default function TournamentRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tournamentId, setTournamentId] = useState<string>('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const totalSteps = 4;

  useEffect(() => {
    params.then(p => {
      setTournamentId(p.id);
    });
  }, [params]);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentDetails();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        society: user.society || '',
        block: user.block || '',
        flatNumber: user.flatNumber || '',
        age: user.age || 0,
        gender: user.gender || 'male',
      }));
    }
  }, [user]);

  const fetchTournamentDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/details`);
      const result = await response.json();
      
      if (result.success) {
        setTournament(result.data);
      } else {
        setErrors({ fetch: result.error });
      }
    } catch (error) {
      setErrors({ fetch: 'Failed to load tournament details' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.age || formData.age < 1) newErrors.age = 'Valid age is required';
        if (tournament?.tournamentType === 'society_only' && !formData.society.trim()) {
          newErrors.society = 'Society is required for this tournament';
        }
        break;
      
      case 2:
        if (!formData.category) newErrors.category = 'Category is required';
        if (tournament?.ageGroups && tournament.ageGroups.length > 0 && !formData.ageGroup) {
          newErrors.ageGroup = 'Age group is required';
        }
        break;
      
      case 3:
        if ((formData.category === 'doubles' || formData.category === 'mixed') && !formData.partnerName.trim()) {
          newErrors.partnerName = 'Partner name is required';
        }
        if ((formData.category === 'doubles' || formData.category === 'mixed') && !formData.partnerPhone.trim()) {
          newErrors.partnerPhone = 'Partner phone is required';
        }
        break;
      
      case 4:
        if (tournament?.entryFee > 0 && !formData.paymentMethod.trim()) {
          newErrors.paymentMethod = 'Payment method is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/tournaments/${tournamentId}?registered=true`);
      } else {
        setErrors({ submit: result.error || 'Failed to register for tournament' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to register for tournament' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof RegistrationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStepContent = () => {
    if (!tournament) return null;

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.age}
                  onChange={(e) => updateFormData('age', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateFormData('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {tournament.tournamentType === 'society_only' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Society Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Society Name *
                  </label>
                  <input
                    type="text"
                    value={formData.society}
                    onChange={(e) => updateFormData('society', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.society ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter society name"
                  />
                  {errors.society && <p className="text-red-500 text-sm mt-1">{errors.society}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Block/Tower
                    </label>
                    <input
                      type="text"
                      value={formData.block}
                      onChange={(e) => updateFormData('block', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Block A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Flat Number
                    </label>
                    <input
                      type="text"
                      value={formData.flatNumber}
                      onChange={(e) => updateFormData('flatNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 101"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="space-y-2">
                {tournament.categories.map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category}
                      checked={formData.category === category}
                      onChange={(e) => updateFormData('category', e.target.value)}
                      className="mr-2"
                    />
                    <span className="capitalize">{category}</span>
                  </label>
                ))}
              </div>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            {tournament.ageGroups && tournament.ageGroups.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Group *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {tournament.ageGroups.map((ageGroup) => (
                    <label key={ageGroup} className="flex items-center">
                      <input
                        type="radio"
                        name="ageGroup"
                        value={ageGroup}
                        checked={formData.ageGroup === ageGroup}
                        onChange={(e) => updateFormData('ageGroup', e.target.value)}
                        className="mr-2"
                      />
                      <span>{ageGroup}</span>
                    </label>
                  ))}
                </div>
                {errors.ageGroup && <p className="text-red-500 text-sm mt-1">{errors.ageGroup}</p>}
              </div>
            )}
          </div>
        );

      case 3:
        if (formData.category === 'singles') {
          return (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Singles Registration</h3>
              <p className="text-gray-600">You're registering for singles category. No partner required.</p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <UserPlus className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                {formData.category === 'doubles' ? 'Doubles' : 'Mixed Doubles'} Partner
              </h3>
              <p className="text-gray-600">Enter your partner's details</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner Name *
              </label>
              <input
                type="text"
                value={formData.partnerName}
                onChange={(e) => updateFormData('partnerName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.partnerName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter partner's full name"
              />
              {errors.partnerName && <p className="text-red-500 text-sm mt-1">{errors.partnerName}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partner Phone *
                </label>
                <input
                  type="tel"
                  value={formData.partnerPhone}
                  onChange={(e) => updateFormData('partnerPhone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.partnerPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter partner's phone number"
                />
                {errors.partnerPhone && <p className="text-red-500 text-sm mt-1">{errors.partnerPhone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partner Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.partnerAge}
                  onChange={(e) => updateFormData('partnerAge', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner Gender
              </label>
              <select
                value={formData.partnerGender}
                onChange={(e) => updateFormData('partnerGender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Registration Summary</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>Tournament:</strong> {tournament.name}</p>
                <p><strong>Category:</strong> {formData.category}</p>
                {formData.ageGroup && <p><strong>Age Group:</strong> {formData.ageGroup}</p>}
                <p><strong>Entry Fee:</strong> ₹{tournament.entryFee}</p>
                {formData.category !== 'singles' && (
                  <p><strong>Partner:</strong> {formData.partnerName}</p>
                )}
              </div>
            </div>

            {tournament.entryFee > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select payment method</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
                {errors.paymentMethod && <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>}
              </div>
            )}

            {tournament.entryFee > 0 && formData.paymentMethod && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) => updateFormData('transactionId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter transaction ID if available"
                />
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>Your registration will be reviewed by the tournament admin. You'll receive a notification once approved.</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = (step: number) => {
    const titles = [
      'Personal Information',
      'Category Selection',
      'Partner Details',
      'Payment & Confirmation'
    ];
    return titles[step - 1];
  };

  const getStepIcon = (step: number) => {
    const icons = [User, Trophy, UserPlus, CheckCircle];
    const Icon = icons[step - 1];
    return <Icon className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (errors.fetch || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tournament Not Found</h2>
          <p className="text-gray-600 mb-6">{errors.fetch || 'The tournament you\'re looking for doesn\'t exist.'}</p>
          <Button asChild>
            <Link href="/tournaments">Back to Tournaments</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/tournaments/${tournamentId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tournament
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Register for Tournament
              </h1>
              <p className="text-gray-600">
                Complete your registration in 4 simple steps
              </p>
            </div>
          </div>

          {/* Tournament Info Card */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{tournament.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {tournament.venue}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(tournament.startDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      ₹{tournament.entryFee}
                    </span>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {tournament.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step <= currentStep
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {step < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  getStepIcon(step)
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStepIcon(currentStep)}
              {getStepTitle(currentStep)}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Enter your personal information'}
              {currentStep === 2 && 'Select your category and age group'}
              {currentStep === 3 && 'Enter your partner details (if applicable)'}
              {currentStep === 4 && 'Review and confirm your registration'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}

            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-red-700">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {currentStep < totalSteps ? (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
