'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Trophy,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  Loader2,
  Target,
  Award,
  Sparkles,
  AlertCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@repo/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  categories: string[];
  ageGroups?: Array<{
    name: string;
    minAge?: number;
    maxAge?: number;
  }>;
  status: string;
  startDate: string;
  endDate: string;
  venue: string;
  location: string;
  entryFee: number;
  maxParticipants: number;
  tournamentType: string;
  allowedSociety?: string;
  format: string;
  description?: string;
  rules?: string;
  prizes?: string | {
    winner: Array<{
      type: string;
      value: number;
      description: string;
      currency: string;
    }>;
    runnerUp: Array<{
      type: string;
      value: number;
      description: string;
      currency: string;
    }>;
    semiFinalist: Array<{
      type: string;
      value: number;
      description: string;
      currency: string;
    }>;
  };
  contactPerson?: string;
  contactPhone?: string;
  participantCount: number;
  registrationDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TournamentDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [registrationError, setRegistrationError] = useState('');

  // Registration form state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [availablePartners, setAvailablePartners] = useState<any[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (id) {
      fetchTournament();
      if (user) {
        checkRegistrationStatus();
      }
    }
  }, [id, user]);

  const fetchTournament = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tournaments/${id}`);
      const result = await response.json();

      if (result.success) {
        setTournament(result.data);
      } else {
        setError(result.error || 'Tournament not found');
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
      setError('Failed to load tournament. Please check if the tournament ID is valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch(`/api/tournaments/${id}/check-registration`);
      const result = await response.json();
      if (result.registered) {
        setAlreadyRegistered(true);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const fetchAvailablePartners = async (category: string) => {
    if (!id || !user) return;

    setIsLoadingPartners(true);
    try {
      const params = new URLSearchParams({
        category: category,
        gender: (user as any).gender || 'male',
        search: ''
      });

      const response = await fetch(`/api/tournaments/${id}/available-players?${params}`);
      const data = await response.json();
      
      if (data.success) {
        // Filter out the current user from partners
        const filteredPartners = data.data.filter((p: any) => p._id !== (user as any)?.userId);
        setAvailablePartners(filteredPartners);
      }
    } catch (err) {
      console.error('Failed to fetch available partners:', err);
    } finally {
      setIsLoadingPartners(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newSelectedCategories = selectedCategories.includes(category) 
      ? selectedCategories.filter(cat => cat !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(newSelectedCategories);
    
    // Reset age groups and partner when category changes
    setSelectedAgeGroups([]);
    setSelectedPartner('');
    setAvailablePartners([]);
    
    // Check if any doubles/mixed categories are selected after toggle
    const hasDoublesOrMixed = newSelectedCategories.some(cat => cat === 'doubles' || cat === 'mixed');
    if (hasDoublesOrMixed) {
      // Use the first doubles/mixed category found for partner fetching
      const doublesOrMixedCategory = newSelectedCategories.find(cat => cat === 'doubles' || cat === 'mixed');
      if (doublesOrMixedCategory) {
        fetchAvailablePartners(doublesOrMixedCategory);
      }
    }
  };

  const toggleAgeGroup = (ageGroupName: string) => {
    if (!tournament?.ageGroups) return;

    const isSelected = selectedAgeGroups.includes(ageGroupName);
    const allowMultiple = (tournament as any).allowMultipleAgeGroups;
    const canSelect = allowMultiple || selectedAgeGroups.length === 0 || isSelected;

    if (!canSelect) return;

    setSelectedAgeGroups(prev => 
      isSelected 
        ? prev.filter(group => group !== ageGroupName)
        : [...prev, ageGroupName]
    );
  };

  const getEligibleAgeGroups = () => {
    if (!tournament?.ageGroups || !(user as any)?.age) return [];
    
    return tournament.ageGroups.filter(ageGroup => {
      const userAge = (user as any).age;
      if (!userAge) return false;
      
      const minAge = ageGroup.minAge;
      const maxAge = ageGroup.maxAge;
      
      if (minAge && userAge < minAge) return false;
      if (maxAge && userAge > maxAge) return false;
      
      return true;
    });
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (selectedCategories.length === 0) {
      setRegistrationError('Please select at least one category');
      return;
    }

    // Check if any doubles/mixed categories are selected and partner is required
    const hasDoublesOrMixed = selectedCategories.some(cat => cat === 'doubles' || cat === 'mixed');
    if (hasDoublesOrMixed && !selectedPartner) {
      setRegistrationError('Partner selection is required for doubles and mixed doubles');
      return;
    }

    // Check if tournament has age groups and if age groups are selected
    if (tournament?.ageGroups && tournament.ageGroups.length > 0) {
      if (selectedAgeGroups.length === 0) {
        setRegistrationError('Please select at least one age group');
        return;
      }
    }

    setRegistrationLoading(true);
    setRegistrationError('');
    setSuccess('');

    try {
      const addedCategories: string[] = [];
      const skippedCategories: string[] = [];

      // Register for each selected category
      for (const category of selectedCategories) {
        const registrationData: any = {
          category: category,
          ageGroups: selectedAgeGroups.length > 0 ? selectedAgeGroups : undefined,
        };

        // Only add payment details if tournament has entry fee
        if (tournament && tournament.entryFee > 0) {
          registrationData.paymentMethod = paymentMethod;
          registrationData.transactionId = transactionId || undefined;
        }

        // Only add partnerId for doubles/mixed categories
        if (category === 'doubles' || category === 'mixed') {
          registrationData.partnerId = selectedPartner;
        }

        const response = await fetch(`/api/tournaments/${id}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registrationData),
        });

        const result = await response.json();
        
        if (!result.success) {
          // If player is already registered for this category, continue with other categories
          if (result.error && result.error.includes('already registered for')) {
            skippedCategories.push(category);
            continue; // Skip this category and continue with others
          } else {
            setRegistrationError(result.error || `Failed to register for ${category}`);
            setRegistrationLoading(false);
            return;
          }
        } else {
          addedCategories.push(category);
        }
      }

      // Success - reset form and close modal
      setShowRegistrationForm(false);
      setSelectedCategories([]);
      setSelectedAgeGroups([]);
      setSelectedPartner('');
      setAvailablePartners([]);
      setPaymentMethod('');
      setTransactionId('');
      setAlreadyRegistered(true);

      // Show success message with details
      let message = `Successfully registered for ${addedCategories.length} category(ies): ${addedCategories.join(', ')}`;
      if (skippedCategories.length > 0) {
        message += `\nSkipped ${skippedCategories.length} category(ies) (already registered): ${skippedCategories.join(', ')}`;
      }
      message += '\n\nWaiting for admin approval.';
      setSuccess(message);

      // Refresh tournament data
      setTimeout(() => {
        fetchTournament();
      }, 1500);

      // Show success message and redirect to dashboard after delay
      setTimeout(() => {
        if (confirm('Registration successful! Would you like to view your tournaments on the dashboard?')) {
          router.push('/player/dashboard#my-tournaments');
        }
      }, 3000);
    } catch (error) {
      console.error('Error registering:', error);
      setRegistrationError('Failed to register. Please try again.');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const isEligibleForTournament = () => {
    if (!tournament) return false;
    if (tournament.tournamentType === 'open') return true;
    if (tournament.tournamentType === 'society_only' && tournament.allowedSociety) {
      return (user as any)?.society === tournament.allowedSociety;
    }
    return false;
  };

  const canRegister = () => {
    if (!tournament || !user) return false;
    return (
      tournament.status === 'registration_open' &&
      tournament.participantCount < tournament.maxParticipants &&
      isEligibleForTournament() &&
      !alreadyRegistered
    );
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Clock },
      published: { label: 'Published', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
      registration_open: { label: 'Registration Open', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
      ongoing: { label: 'Ongoing', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Trophy },
      completed: { label: 'Completed', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: CheckCircle },
      cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="relative z-10 min-h-screen p-8">
        <div className="mx-auto max-w-4xl">
          <div className="glass-card-intense flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-red-400">
            <XCircle className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-bold">Tournament Not Found</h2>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  const statusConfig = getStatusConfig(tournament.status);
  const StatusIcon = statusConfig.icon;
  const isFull = tournament.participantCount >= tournament.maxParticipants;

  return (
    <div className="relative z-10 min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/tournaments"
            className="glass-card flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-transform hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tournaments
          </Link>
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${statusConfig.color} ${statusConfig.bg}`}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Registration Status/Actions */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-semibold">{success}</p>
                    <p className="text-sm">
                      You'll receive a notification once your registration is approved.
                      Check your dashboard to track the status.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {alreadyRegistered && !success && (
              <Alert className="mb-6 border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  You are already registered for this tournament. Check your dashboard for status updates.
                </AlertDescription>
              </Alert>
            )}

            {tournament.tournamentType === 'society_only' && tournament.allowedSociety && (
              <Alert className={`mb-6 ${isEligibleForTournament() ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <Info className={`h-4 w-4 ${isEligibleForTournament() ? 'text-green-600' : 'text-red-600'}`} />
                <AlertDescription className={isEligibleForTournament() ? 'text-green-800' : 'text-red-800'}>
                  {isEligibleForTournament() 
                    ? `✓ You are eligible for this tournament (${tournament.allowedSociety} resident)`
                    : `This tournament is only for residents of ${tournament.allowedSociety}`
                  }
                </AlertDescription>
              </Alert>
            )}

            {canRegister() && !showRegistrationForm && (
              <div className="glass-card-intense p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-primary text-lg font-semibold mb-1">Ready to compete?</h3>
                  <p className="text-muted-foreground text-sm">
                    Register now to secure your spot in this tournament
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={() => setShowRegistrationForm(true)}
                >
                  <Sparkles className="h-5 w-5" />
                  Register Now
                </Button>
              </div>
            )}

            {!canRegister() && !alreadyRegistered && tournament.status === 'registration_open' && (
              <Alert className="mb-6 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  {isFull 
                    ? 'This tournament is full. Registration is closed.'
                    : !isEligibleForTournament()
                    ? 'You are not eligible for this tournament.'
                    : 'Registration is not available at this time.'
                  }
                </AlertDescription>
              </Alert>
            )}
          </motion.div>
        )}

        {!user && tournament.status === 'registration_open' && !isFull && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="border-blue-200 bg-blue-50">
              <LogIn className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 flex items-center justify-between">
                <span>Please login to register for this tournament</span>
                <Button 
                  size="sm"
                  onClick={() => router.push(`/login?redirect=/tournaments/${id}`)}
                  className="ml-4"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Registration Form Modal */}
        {showRegistrationForm && canRegister() && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card-intense w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-2xl p-4 sm:p-6 overflow-y-auto"
            >
              <div className="sticky top-0  pb-4 mb-2 border-b border-white/10 sm:static sm:border-0 sm:pb-0 sm:mb-4">
                <h3 className="text-primary text-lg sm:text-xl font-bold flex items-center">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                  Complete Your Registration
                </h3>
                <p className="text-muted-foreground mt-2 text-xs sm:text-sm">
                  Select categories, age groups, and payment method to register for this tournament.
                </p>
              </div>

              {registrationError && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{registrationError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleRegistration} className="space-y-4 sm:space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="text-primary mb-2 block text-sm font-medium">
                    Select Categories <span className="text-red-500">*</span>
                  </label>
                  <p className="text-muted-foreground mb-3 text-xs">
                    Select one or more categories for this registration
                  </p>
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                    {tournament.categories.map((category: string) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className={`rounded-lg border-2 p-2.5 sm:p-3 text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                          selectedCategories.includes(category)
                            ? 'border-green-500 bg-green-500/10 text-green-500'
                            : 'border-gray-200 dark:border-white/10 text-muted-foreground hover:border-green-500/50'
                        }`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Group Selection */}
                {selectedCategories.length > 0 && tournament.ageGroups && tournament.ageGroups.length > 0 && (
                  <div>
                    <label className="text-primary mb-2 block text-sm font-medium">
                      Age Groups <span className="text-red-500">*</span>
                    </label>
                    <p className="text-muted-foreground mb-3 text-xs">
                      Your age: <span className="font-semibold">{(user as any)?.age || 'Not specified'}</span>
                    </p>
                    
                    {getEligibleAgeGroups().length === 0 ? (
                      <div className="rounded-lg bg-yellow-500/10 p-3 text-yellow-600">
                        <p className="text-xs sm:text-sm">
                          No age groups available for your age ({(user as any)?.age || 'Not specified'}).
                          Please contact the tournament organizer.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {getEligibleAgeGroups().map((ageGroup) => {
                          const isSelected = selectedAgeGroups.includes(ageGroup.name);
                          const allowMultiple = (tournament as any).allowMultipleAgeGroups;
                          const canSelect = allowMultiple || selectedAgeGroups.length === 0 || isSelected;
                          
                          return (
                            <button
                              key={ageGroup.name}
                              type="button"
                              onClick={() => toggleAgeGroup(ageGroup.name)}
                              disabled={!canSelect}
                              className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 rounded-lg px-3 py-2.5 sm:py-2 text-xs sm:text-sm font-medium transition-all w-full active:scale-95 ${
                                isSelected
                                  ? 'bg-green-500 text-white'
                                  : canSelect
                                  ? 'glass-card text-muted-foreground hover:text-primary border border-white/10'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <span className="font-semibold">{ageGroup.name}</span>
                              {ageGroup.minAge && ageGroup.maxAge && (
                                <span className="text-[10px] sm:text-xs opacity-75">
                                  ({ageGroup.minAge}-{ageGroup.maxAge} years)
                                </span>
                              )}
                             
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Partner Selection for Doubles/Mixed */}
                {selectedCategories.length > 0 && (selectedCategories.includes('doubles') || selectedCategories.includes('mixed')) && (
                  <div>
                    <label className="text-primary mb-2 block text-sm font-medium">
                      Select Partner <span className="text-red-500">*</span>
                    </label>
                    {isLoadingPartners ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-green-500" />
                      </div>
                    ) : (
                      <select
                        value={selectedPartner}
                        onChange={(e) => setSelectedPartner(e.target.value)}
                        className="glass-card w-full rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                      >
                        <option value="">Choose a partner...</option>
                        {availablePartners.map((partner) => (
                          <option key={partner._id} value={partner._id}>
                            {partner.name} - {partner.phone} {partner.gender && `(${partner.gender})`}
                          </option>
                        ))}
                      </select>
                    )}
                    {availablePartners.length === 0 && !isLoadingPartners && (
                      <p className="text-muted-foreground text-xs sm:text-sm mt-2">
                        No available partners found for this category.
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Method - Only show if tournament has entry fee */}
                {tournament.entryFee > 0 && (
                  <>
                    <div>
                      <label className="text-primary mb-2 block text-sm font-medium">
                        Payment Method <span className="text-red-500">*</span>
                      </label>
                      <p className="text-muted-foreground mb-3 text-xs">
                        Entry Fee: <span className="font-semibold text-primary">₹{tournament.entryFee}</span>
                      </p>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                        <SelectTrigger className="h-10 sm:h-11 text-sm">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Transaction ID */}
                    {paymentMethod && paymentMethod !== 'cash' && (
                      <div>
                        <label className="text-primary mb-2 block text-sm font-medium">
                          Transaction ID
                        </label>
                        <Input
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="Enter transaction ID (if available)"
                          className="glass-card h-10 sm:h-11 text-sm"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Free Tournament Notice */}
                {tournament.entryFee === 0 && (
                  <div className="rounded-lg bg-green-500/10 p-3 border border-green-500/20">
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold">Free Entry</span> - No payment required for this tournament
                    </p>
                  </div>
                )}

                {/* Sticky Footer Buttons on Mobile */}
                <div className="sticky bottom-0 left-0 right-0 bg-inherit pt-4 pb-2 sm:pb-0 border-t border-white/10 sm:border-0 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static">
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRegistrationForm(false);
                        setSelectedCategories([]);
                        setSelectedAgeGroups([]);
                        setSelectedPartner('');
                        setAvailablePartners([]);
                        setPaymentMethod('');
                        setTransactionId('');
                        setRegistrationError('');
                      }}
                      className="glass-card flex-1 rounded-lg px-4 py-2.5 sm:py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-white/10 active:scale-95"
                      disabled={registrationLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        registrationLoading || 
                        selectedCategories.length === 0 || 
                        (tournament.entryFee > 0 && !paymentMethod) ||
                        ((selectedCategories.includes('doubles') || selectedCategories.includes('mixed')) && !selectedPartner) || 
                        (tournament.ageGroups && tournament.ageGroups.length > 0 && selectedAgeGroups.length === 0)
                      }
                      className="bg-primary flex-1 rounded-lg px-4 py-2.5 sm:py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                    >
                      {registrationLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Registering...</span>
                          <span className="sm:hidden">Wait...</span>
                        </span>
                      ) : (
                        'Register'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Tournament Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-intense mb-8 p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-blue-500">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-primary text-xl font-semibold">Tournament Overview</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Tournament Dates</div>
                <div className="text-primary font-semibold">
                  {new Date(tournament.startDate).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                  {tournament.startDate !== tournament.endDate && (
                    <> - {new Date(tournament.endDate).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}</>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <MapPin className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Venue</div>
                <div className="text-primary font-semibold">{tournament.venue}</div>
                <div className="text-tertiary text-xs">{tournament.location}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Entry Fee</div>
                <div className="text-primary font-semibold">₹{tournament.entryFee}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Participants</div>
                <div className="text-primary font-semibold">
                  {tournament.participantCount} / {tournament.maxParticipants}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tournament Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-intense p-6"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Info className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Basic Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-muted-foreground text-sm">Tournament Format</div>
                <div className="text-primary font-semibold capitalize">{tournament.format}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Tournament Type</div>
                <div className="text-primary font-semibold capitalize">
                  {tournament.tournamentType.replace('_', ' ')}
                </div>
              </div>
              {tournament.allowedSociety && (
                <div>
                  <div className="text-muted-foreground text-sm">Allowed Society</div>
                  <div className="text-primary font-semibold">{tournament.allowedSociety}</div>
                </div>
              )}
              {tournament.registrationDeadline && (
                <div>
                  <div className="text-muted-foreground text-sm">Registration Deadline</div>
                  <div className="text-primary font-semibold">
                    {new Date(tournament.registrationDeadline).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-intense p-6"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Categories</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-muted-foreground text-sm mb-2">Available Categories</div>
                <div className="flex flex-wrap gap-2">
                  {tournament.categories.map((category) => (
                    <span
                      key={category}
                      className="glass-card rounded-full px-3 py-1 text-sm font-medium text-primary capitalize"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              {tournament.ageGroups && tournament.ageGroups.length > 0 && (
                <div>
                  <div className="text-muted-foreground text-sm mb-2">Age Groups</div>
                  <div className="flex flex-wrap gap-2">
                    {tournament.ageGroups.map((ageGroup) => {
                      let ageRange = '';
                      if (ageGroup.minAge && ageGroup.maxAge) {
                        ageRange = ` (${ageGroup.minAge}-${ageGroup.maxAge} years)`;
                      } else if (ageGroup.minAge) {
                        ageRange = ` (${ageGroup.minAge}+ years)`;
                      } else if (ageGroup.maxAge) {
                        ageRange = ` (up to ${ageGroup.maxAge} years)`;
                      }
                      
                      return (
                        <span
                          key={ageGroup.name}
                          className="glass-card rounded-full px-3 py-1 text-sm font-medium text-primary"
                        >
                          {ageGroup.name}{ageRange}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Additional Information */}
        {(tournament.description || tournament.rules || tournament.prizes) && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Description */}
            {tournament.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card-intense p-6"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-primary text-xl font-semibold">Description</h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">{tournament.description}</p>
              </motion.div>
            )}

            {/* Rules */}
            {tournament.rules && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card-intense p-6"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-primary text-xl font-semibold">Rules & Regulations</h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">{tournament.rules}</p>
              </motion.div>
            )}

            {/* Prizes */}
            {tournament.prizes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card-intense p-6"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-primary text-xl font-semibold">Prizes</h2>
                </div>
                {typeof tournament.prizes === 'string' ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{tournament.prizes}</p>
                ) : (
                  <div className="space-y-4">
                    {tournament.prizes.winner && tournament.prizes.winner.length > 0 && (
                      <div>
                        <h4 className="text-primary mb-2 font-semibold">Winner</h4>
                        <ul className="text-muted-foreground space-y-1">
                          {tournament.prizes.winner.map((prize, index) => (
                            <li key={index}>
                              • {prize.description}: {prize.value} {prize.currency}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tournament.prizes.runnerUp && tournament.prizes.runnerUp.length > 0 && (
                      <div>
                        <h4 className="text-primary mb-2 font-semibold">Runner Up</h4>
                        <ul className="text-muted-foreground space-y-1">
                          {tournament.prizes.runnerUp.map((prize, index) => (
                            <li key={index}>
                              • {prize.description}: {prize.value} {prize.currency}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tournament.prizes.semiFinalist && tournament.prizes.semiFinalist.length > 0 && (
                      <div>
                        <h4 className="text-primary mb-2 font-semibold">Semi Finalist</h4>
                        <ul className="text-muted-foreground space-y-1">
                          {tournament.prizes.semiFinalist.map((prize, index) => (
                            <li key={index}>
                              • {prize.description}: {prize.value} {prize.currency}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Contact Information */}
        {(tournament.contactPerson || tournament.contactPhone) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 glass-card-intense p-6"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Contact Information</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {tournament.contactPerson && (
                <div>
                  <div className="text-muted-foreground text-sm">Contact Person</div>
                  <div className="text-primary font-semibold">{tournament.contactPerson}</div>
                </div>
              )}
              {tournament.contactPhone && (
                <div>
                  <div className="text-muted-foreground text-sm">Contact Phone</div>
                  <div className="text-primary font-semibold">{tournament.contactPhone}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
