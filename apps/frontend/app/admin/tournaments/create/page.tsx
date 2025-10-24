'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  ArrowLeft,
  ArrowRight,
  Trophy,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Settings,
  Eye,
  Save,
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface TournamentFormData {
  // Step 1: Basic Info
  name: string;
  sport: 'badminton' | 'tennis';
  venue: string;
  location: string;
  startDate: string;
  endDate: string;
  
  // Step 2: Categories & Format
  categories: ('singles' | 'doubles' | 'mixed')[];
  ageGroups: string[];
  gender: ('men' | 'women' | 'mixed')[];
  format: 'knockout' | 'round_robin';
  
  // Step 3: Registration Settings
  entryFee: number;
  maxParticipants: number;
  registrationDeadline: string;
  courts: number;
  
  // Step 4: Rules & Prizes
  rules: string;
  prizes: {
    winner: number;
    runnerUp: number;
    semiFinalist: number;
  };
  
  // Step 5: Tournament Type
  tournamentType: 'society_only' | 'open';
  allowedSociety: string;
}

const initialFormData: TournamentFormData = {
  name: '',
  sport: 'badminton',
  venue: '',
  location: '',
  startDate: '',
  endDate: '',
  categories: [],
  ageGroups: [],
  gender: [],
  format: 'knockout',
  entryFee: 0,
  maxParticipants: 32,
  registrationDeadline: '',
  courts: 1,
  rules: '',
  prizes: {
    winner: 0,
    runnerUp: 0,
    semiFinalist: 0,
  },
  tournamentType: 'open',
  allowedSociety: '',
};

const ageGroupOptions = ['Open', 'U-18', 'U-25', 'U-35', 'U-45', '40+', '50+'];
const genderOptions = ['men', 'women', 'mixed'];

export default function CreateTournamentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TournamentFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 5;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Tournament name is required';
        if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
          newErrors.endDate = 'End date must be after start date';
        }
        break;
      
      case 2:
        if (formData.categories.length === 0) newErrors.categories = 'Select at least one category';
        break;
      
      case 3:
        if (formData.maxParticipants < 2) newErrors.maxParticipants = 'Minimum 2 participants required';
        if (formData.courts < 1) newErrors.courts = 'At least 1 court required';
        break;
      
      case 5:
        if (formData.tournamentType === 'society_only' && !formData.allowedSociety.trim()) {
          newErrors.allowedSociety = 'Society name is required for society-only tournaments';
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
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/admin/tournaments/${result.data._id}`);
      } else {
        setErrors({ submit: result.error || 'Failed to create tournament' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to create tournament' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof TournamentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Summer Badminton Championship 2025"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sport *
              </label>
              <select
                value={formData.sport}
                onChange={(e) => updateFormData('sport', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="badminton">Badminton</option>
                <option value="tennis">Tennis</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue *
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => updateFormData('venue', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.venue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Sports Complex"
                />
                {errors.venue && <p className="text-red-500 text-sm mt-1">{errors.venue}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Phase 2, Sector 56"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateFormData('startDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateFormData('endDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories *
              </label>
              <div className="space-y-2">
                {(['singles', 'doubles', 'mixed'] as const).map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFormData('categories', [...formData.categories, category]);
                        } else {
                          updateFormData('categories', formData.categories.filter(c => c !== category));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="capitalize">{category}</span>
                  </label>
                ))}
              </div>
              {errors.categories && <p className="text-red-500 text-sm mt-1">{errors.categories}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Groups (Optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ageGroupOptions.map((ageGroup) => (
                  <label key={ageGroup} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.ageGroups.includes(ageGroup)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFormData('ageGroups', [...formData.ageGroups, ageGroup]);
                        } else {
                          updateFormData('ageGroups', formData.ageGroups.filter(a => a !== ageGroup));
                        }
                      }}
                      className="mr-2"
                    />
                    <span>{ageGroup}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender Categories (Optional)
              </label>
              <div className="space-y-2">
                {genderOptions.map((gender) => (
                  <label key={gender} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.gender.includes(gender)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFormData('gender', [...formData.gender, gender]);
                        } else {
                          updateFormData('gender', formData.gender.filter(g => g !== gender));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="capitalize">{gender}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Format *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="knockout"
                    checked={formData.format === 'knockout'}
                    onChange={(e) => updateFormData('format', e.target.value)}
                    className="mr-2"
                  />
                  <span>Knockout (Single Elimination)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="round_robin"
                    checked={formData.format === 'round_robin'}
                    onChange={(e) => updateFormData('format', e.target.value)}
                    className="mr-2"
                  />
                  <span>Round Robin (All vs All)</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.entryFee}
                  onChange={(e) => updateFormData('entryFee', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Participants *
                </label>
                <input
                  type="number"
                  min="2"
                  max="1000"
                  value={formData.maxParticipants}
                  onChange={(e) => updateFormData('maxParticipants', parseInt(e.target.value) || 2)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.maxParticipants ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.maxParticipants && <p className="text-red-500 text-sm mt-1">{errors.maxParticipants}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  value={formData.registrationDeadline}
                  onChange={(e) => updateFormData('registrationDeadline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Courts *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.courts}
                  onChange={(e) => updateFormData('courts', parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.courts ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.courts && <p className="text-red-500 text-sm mt-1">{errors.courts}</p>}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Rules
              </label>
              <textarea
                value={formData.rules}
                onChange={(e) => updateFormData('rules', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tournament rules and regulations..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Distribution (₹)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Winner</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.prizes.winner}
                    onChange={(e) => updateFormData('prizes', { ...formData.prizes, winner: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Runner-up</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.prizes.runnerUp}
                    onChange={(e) => updateFormData('prizes', { ...formData.prizes, runnerUp: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Semi-finalist</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.prizes.semiFinalist}
                    onChange={(e) => updateFormData('prizes', { ...formData.prizes, semiFinalist: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Type *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="open"
                    checked={formData.tournamentType === 'open'}
                    onChange={(e) => updateFormData('tournamentType', e.target.value)}
                    className="mr-2"
                  />
                  <span>Open Tournament (Anyone can register)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="society_only"
                    checked={formData.tournamentType === 'society_only'}
                    onChange={(e) => updateFormData('tournamentType', e.target.value)}
                    className="mr-2"
                  />
                  <span>Society Only (Restricted to specific society)</span>
                </label>
              </div>
            </div>

            {formData.tournamentType === 'society_only' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed Society *
                </label>
                <input
                  type="text"
                  value={formData.allowedSociety}
                  onChange={(e) => updateFormData('allowedSociety', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.allowedSociety ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Green Valley Society"
                />
                {errors.allowedSociety && <p className="text-red-500 text-sm mt-1">{errors.allowedSociety}</p>}
              </div>
            )}

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Tournament Preview</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Name:</strong> {formData.name || 'Not specified'}</p>
                <p><strong>Sport:</strong> {formData.sport}</p>
                <p><strong>Venue:</strong> {formData.venue || 'Not specified'}</p>
                <p><strong>Categories:</strong> {formData.categories.join(', ') || 'Not specified'}</p>
                <p><strong>Format:</strong> {formData.format}</p>
                <p><strong>Entry Fee:</strong> ₹{formData.entryFee}</p>
                <p><strong>Max Participants:</strong> {formData.maxParticipants}</p>
                <p><strong>Type:</strong> {formData.tournamentType === 'open' ? 'Open' : 'Society Only'}</p>
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
      'Basic Information',
      'Categories & Format',
      'Registration Settings',
      'Rules & Prizes',
      'Tournament Type'
    ];
    return titles[step - 1];
  };

  const getStepIcon = (step: number) => {
    const icons = [Trophy, Users, Settings, DollarSign, Eye];
    const Icon = icons[step - 1];
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/tournaments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tournaments
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Create Tournament
              </h1>
              <p className="text-gray-600">
                Set up a new tournament in 5 simple steps
              </p>
            </div>
          </div>

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
              {currentStep === 1 && 'Enter basic tournament information'}
              {currentStep === 2 && 'Select categories and tournament format'}
              {currentStep === 3 && 'Configure registration settings'}
              {currentStep === 4 && 'Set rules and prize distribution'}
              {currentStep === 5 && 'Choose tournament type and preview'}
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
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Tournament
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