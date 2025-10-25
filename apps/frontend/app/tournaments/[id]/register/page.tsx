'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  categories: string[];
  ageGroups: Array<{
    name: string;
    minAge?: number;
    maxAge?: number;
  }>;
  allowMultipleAgeGroups: boolean;
  gender: string[];
  startDate: string;
  endDate: string;
  venue: string;
  location: string;
  registrationFee: number;
  registrationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  tournamentType: string;
  format: string;
}

interface RegistrationFormData {
  category: string;
  gender: string;
  ageGroups: string[];
  partnerId?: string;
  partnerName?: string;
  partnerPhone?: string;
  partnerGender?: string;
  partnerAge?: number;
  emergencyContact: string;
  emergencyContactName: string;
  medicalInfo: string;
  agreedToTerms: boolean;
}

interface Player {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  age?: number;
  society?: string;
}

export default function TournamentRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard requiredRoles={['player']}>
      <TournamentRegistrationContent params={params} />
    </AuthGuard>
  );
}

function TournamentRegistrationContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [tournamentId, setTournamentId] = useState<string>('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<RegistrationFormData>({
    category: '',
    gender: '',
    ageGroups: [],
    partnerId: '',
    partnerName: '',
    partnerPhone: '',
    partnerGender: '',
    partnerAge: undefined,
    emergencyContact: '',
    emergencyContactName: '',
    medicalInfo: '',
    agreedToTerms: false,
  });

  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [partnerSearchTerm, setPartnerSearchTerm] = useState('');
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setTournamentId(id);
      fetchTournament(id);
    });
  }, [params]);

  const fetchTournament = async (id: string) => {
    try {
      const response = await fetch(`/api/tournaments/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setTournament(data.data);
      } else {
        setError('Tournament not found');
      }
    } catch (err) {
      setError('Failed to load tournament details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailablePlayers = async (searchTerm: string = '') => {
    if (!tournamentId || !formData.category || !formData.gender) return;

    setIsLoadingPlayers(true);
    try {
      const params = new URLSearchParams({
        category: formData.category,
        gender: formData.gender,
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/tournaments/${tournamentId}/available-players?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailablePlayers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch available players:', err);
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const handlePartnerSelect = (player: Player) => {
    setFormData({
      ...formData,
      partnerId: player._id,
      partnerName: player.name,
      partnerPhone: player.phone,
      partnerGender: player.gender,
      partnerAge: player.age
    });
    setShowPartnerModal(false);
    setPartnerSearchTerm('');
  };

  const handlePartnerSearch = (searchTerm: string) => {
    setPartnerSearchTerm(searchTerm);
    fetchAvailablePlayers(searchTerm);
  };

  const toggleAgeGroup = (ageGroupName: string) => {
    setFormData(prev => ({
      ...prev,
      ageGroups: prev.ageGroups.includes(ageGroupName)
        ? prev.ageGroups.filter(group => group !== ageGroupName)
        : [...prev.ageGroups, ageGroupName]
    }));
  };

  const getEligibleAgeGroups = () => {
    if (!tournament?.ageGroups || !user?.age) return [];
    
    return tournament.ageGroups.filter((ageGroup: { name: string; minAge?: number; maxAge?: number }) => {
      const userAge = user.age;
      if (!userAge) return false;
      
      const minAge = ageGroup.minAge;
      const maxAge = ageGroup.maxAge;
      
      if (minAge && userAge < minAge) return false;
      if (maxAge && userAge > maxAge) return false;
      
      return true;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validation
    if (!formData.category) {
      setError('Please select a category');
      setIsSubmitting(false);
      return;
    }

    if (!formData.gender) {
      setError('Please select gender');
      setIsSubmitting(false);
      return;
    }

    // Validate age groups if tournament has them
    if (tournament?.ageGroups && tournament.ageGroups.length > 0) {
      if (formData.ageGroups.length === 0) {
        setError('Please select at least one age group');
        setIsSubmitting(false);
        return;
      }
    }

    if (tournament?.format === 'doubles' && !formData.partnerName) {
      setError('Partner details are required for doubles format');
      setIsSubmitting(false);
      return;
    }

    if (!formData.emergencyContact || !formData.emergencyContactName) {
      setError('Emergency contact details are required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.agreedToTerms) {
      setError('You must agree to the terms and conditions');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/tournaments/${tournamentId}`);
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Failed to submit registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Tournament not found</p>
          <Link href="/tournaments" className="mt-4 inline-block text-green-500 hover:text-green-400">
            ← Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-primary mb-2 text-2xl font-bold">Registration Successful!</h2>
          <p className="text-muted-foreground mb-6">
            Your registration has been submitted for approval.
          </p>
          <p className="text-tertiary text-sm">
            Redirecting to tournament details...
          </p>
        </motion.div>
      </div>
    );
  }

  const isDoublesFormat = tournament.format === 'doubles';
  const registrationDeadlinePassed = new Date(tournament.registrationDeadline) < new Date();
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href={`/tournaments/${tournamentId}`}
            className="text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tournament
          </Link>

          <h1 className="text-primary mb-2 text-3xl font-bold">Register for Tournament</h1>
          <p className="text-muted-foreground">Complete the form below to register</p>
        </motion.div>

        {/* Tournament Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card-intense mb-8 rounded-2xl p-6"
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-primary mb-1 text-xl font-semibold">{tournament.name}</h2>
              <p className="text-muted-foreground text-sm">{tournament.sport}</p>
            </div>
            <Trophy className="h-8 w-8 text-green-400" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">
                {new Date(tournament.startDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">{tournament.venue}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">₹{tournament.registrationFee}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">
                {tournament.currentParticipants}/{tournament.maxParticipants} registered
              </span>
            </div>
          </div>

          {(registrationDeadlinePassed || isFull) && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">
                {registrationDeadlinePassed
                  ? 'Registration deadline has passed'
                  : 'Tournament is full'}
              </span>
            </div>
          )}
        </motion.div>

        {/* Registration Form */}
        {!registrationDeadlinePassed && !isFull && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-red-500">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Tournament Details Section */}
            <div className="glass-card-intense rounded-2xl p-6">
              <h3 className="text-primary mb-4 text-lg font-semibold">Tournament Details</h3>

              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="text-primary mb-2 block text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {tournament.categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setFormData({ ...formData, category })}
                        className={`rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                          formData.category === category
                            ? 'border-green-500 bg-green-500/10 text-green-500'
                            : 'border-gray-200 dark:border-white/10 text-muted-foreground hover:border-green-500/50'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender Selection */}
                <div>
                  <label className="text-primary mb-2 block text-sm font-medium">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {tournament.gender.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={`rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                          formData.gender === g
                            ? 'border-green-500 bg-green-500/10 text-green-500'
                            : 'border-gray-200 dark:border-white/10 text-muted-foreground hover:border-green-500/50'
                        }`}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Group Selection */}
                {tournament.ageGroups && tournament.ageGroups.length > 0 && (
                  <div>
                    <label className="text-primary mb-2 block text-sm font-medium">
                      Age Groups <span className="text-red-500">*</span>
                    </label>
                    <p className="text-muted-foreground mb-3 text-xs">
                      Select the age groups you want to participate in. Your age: {user?.age || 'Not specified'}
                    </p>
                    
                    {getEligibleAgeGroups().length === 0 ? (
                      <div className="rounded-lg bg-yellow-500/10 p-3 text-yellow-600">
                        <p className="text-sm">
                          No age groups available for your age ({user?.age || 'Not specified'}).
                          Please contact the tournament organizer.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getEligibleAgeGroups().map((ageGroup: { name: string; minAge?: number; maxAge?: number }) => {
                          const isSelected = formData.ageGroups.includes(ageGroup.name);
                          const canSelect = tournament.allowMultipleAgeGroups || formData.ageGroups.length === 0 || isSelected;
                          
                          return (
                            <div key={ageGroup.name} className="flex items-center justify-between rounded-lg border p-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleAgeGroup(ageGroup.name)}
                                    disabled={!canSelect}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                      isSelected
                                        ? 'bg-green-500 text-white'
                                        : canSelect
                                        ? 'glass-card text-muted-foreground hover:text-primary'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    <span>{ageGroup.name}</span>
                                    {ageGroup.minAge && ageGroup.maxAge && (
                                      <span className="text-xs opacity-75">
                                        ({ageGroup.minAge}-{ageGroup.maxAge} years)
                                      </span>
                                    )}
                                    {ageGroup.minAge && !ageGroup.maxAge && (
                                      <span className="text-xs opacity-75">
                                        ({ageGroup.minAge}+ years)
                                      </span>
                                    )}
                                    {!ageGroup.minAge && ageGroup.maxAge && (
                                      <span className="text-xs opacity-75">
                                        (up to {ageGroup.maxAge} years)
                                      </span>
                                    )}
                                  </button>
                                </div>
                                {tournament.allowMultipleAgeGroups && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ✓ Multiple age group registration allowed
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {formData.ageGroups.length > 0 && (
                          <div className="rounded-lg bg-blue-500/10 p-3 text-blue-600">
                            <p className="text-sm">
                              Selected: {formData.ageGroups.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Partner Details (for Doubles/Mixed) */}
            {(formData.category === 'doubles' || formData.category === 'mixed') && (
              <div className="glass-card-intense rounded-2xl p-6">
                <h3 className="text-primary mb-4 text-lg font-semibold">Partner Details</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  {formData.category === 'mixed' 
                    ? 'This is a mixed doubles tournament. Please select a partner of the opposite gender.'
                    : 'This is a doubles tournament. Please select your partner.'
                  }
                </p>

                <div className="space-y-4">
                  {/* Partner Selection */}
                  <div>
                    <label className="text-primary mb-2 block text-sm font-medium">
                      Select Partner <span className="text-red-500">*</span>
                    </label>
                    
                    {formData.partnerId ? (
                      <div className="glass-card rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-primary font-medium">{formData.partnerName}</p>
                            <p className="text-muted-foreground text-sm">{formData.partnerPhone}</p>
                            {formData.partnerGender && (
                              <p className="text-muted-foreground text-sm capitalize">
                                Gender: {formData.partnerGender}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ 
                              ...formData, 
                              partnerId: '', 
                              partnerName: '', 
                              partnerPhone: '',
                              partnerGender: '',
                              partnerAge: undefined
                            })}
                            className="text-red-500 hover:text-red-400 text-sm"
                          >
                            Change Partner
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.category && formData.gender) {
                            fetchAvailablePlayers();
                            setShowPartnerModal(true);
                          } else {
                            setError('Please select category and gender first');
                          }
                        }}
                        className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50 hover:bg-white/5"
                      >
                        {formData.category && formData.gender 
                          ? 'Select Partner from Registered Players'
                          : 'Select Category and Gender First'
                        }
                      </button>
                    )}
                  </div>

                  {/* Manual Partner Entry (Alternative) */}
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-muted-foreground mb-3 text-sm">
                      Or enter partner details manually:
                    </p>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-primary mb-2 block text-sm font-medium">
                          Partner Name
                        </label>
                        <input
                          type="text"
                          value={formData.partnerName}
                          onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                          className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                          placeholder="Enter partner's full name"
                          disabled={!!formData.partnerId}
                        />
                      </div>

                      <div>
                        <label className="text-primary mb-2 block text-sm font-medium">
                          Partner Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.partnerPhone}
                          onChange={(e) => setFormData({ ...formData, partnerPhone: e.target.value })}
                          className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                          placeholder="Partner's phone number"
                          disabled={!!formData.partnerId}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contact Section */}
            <div className="glass-card-intense rounded-2xl p-6">
              <h3 className="text-primary mb-4 text-lg font-semibold">Emergency Contact</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-primary mb-2 block text-sm font-medium">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                    placeholder="Emergency contact person"
                  />
                </div>

                <div>
                  <label className="text-primary mb-2 block text-sm font-medium">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                    placeholder="Emergency contact number"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information Section */}
            <div className="glass-card-intense rounded-2xl p-6">
              <h3 className="text-primary mb-4 text-lg font-semibold">Medical Information</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Please mention any medical conditions, allergies, or injuries we should be aware of.
              </p>

              <textarea
                value={formData.medicalInfo}
                onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
                rows={4}
                className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                placeholder="None (or describe any medical conditions)"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="glass-card-intense rounded-2xl p-6">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-green-500 focus:ring-2 focus:ring-green-500"
                />
                <span className="text-muted-foreground text-sm">
                  I agree to the{' '}
                  <Link href="/terms" className="text-green-500 hover:text-green-400">
                    terms and conditions
                  </Link>{' '}
                  and confirm that all information provided is accurate. I understand that my registration
                  is subject to approval by the tournament organizers.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="glass-card flex-1 rounded-lg px-6 py-3 font-medium text-muted-foreground transition-all hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary flex-1 rounded-lg px-6 py-3 font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Registration'
                )}
              </button>
            </div>
          </motion.form>
        )}

        {/* Partner Selection Modal */}
        {showPartnerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card-intense w-full max-w-2xl rounded-2xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-primary text-xl font-bold">Select Partner</h3>
                <button
                  onClick={() => setShowPartnerModal(false)}
                  className="text-muted-foreground hover:text-primary text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search players by name, phone, or email..."
                  value={partnerSearchTerm}
                  onChange={(e) => handlePartnerSearch(e.target.value)}
                  className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                />
              </div>

              <div className="max-h-96 overflow-y-auto">
                {isLoadingPlayers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                  </div>
                ) : availablePlayers.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      {partnerSearchTerm ? 'No players found matching your search' : 'No available players found'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availablePlayers.map((player) => (
                      <button
                        key={player._id}
                        onClick={() => handlePartnerSelect(player)}
                        className="glass-card w-full rounded-lg p-4 text-left transition-all hover:bg-white/10"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-primary font-medium">{player.name}</p>
                            <p className="text-muted-foreground text-sm">{player.phone}</p>
                            {player.email && (
                              <p className="text-muted-foreground text-sm">{player.email}</p>
                            )}
                            {player.gender && (
                              <p className="text-muted-foreground text-sm capitalize">
                                Gender: {player.gender}
                              </p>
                            )}
                            {player.society && (
                              <p className="text-muted-foreground text-sm">Society: {player.society}</p>
                            )}
                          </div>
                          <div className="text-green-500">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowPartnerModal(false)}
                  className="glass-card flex-1 rounded-lg px-4 py-2 font-medium text-muted-foreground transition-all hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
