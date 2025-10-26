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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
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

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationLoading(true);
    setRegistrationError('');
    setSuccess('');

    try {
      const registrationData: any = {
        category: selectedCategory,
        paymentMethod,
        transactionId: transactionId || undefined,
      };

      // Add age groups if applicable
      if (tournament?.ageGroups && tournament.ageGroups.length > 0) {
        registrationData.ageGroups = selectedAgeGroups;
      }

      // Add partner details for doubles/mixed
      if (selectedCategory === 'doubles' || selectedCategory === 'mixed') {
        if (!partnerName || !partnerPhone) {
          setRegistrationError('Partner details are required for doubles/mixed categories');
          setRegistrationLoading(false);
          return;
        }
        registrationData.partnerName = partnerName;
        registrationData.partnerPhone = partnerPhone;
      }

      const response = await fetch(`/api/tournaments/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message || 'Registration successful! Waiting for admin approval.');
        setShowRegistrationForm(false);
        setAlreadyRegistered(true);

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
      } else {
        setRegistrationError(result.error || 'Registration failed');
      }
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

        {/* Registration Form */}
        {showRegistrationForm && canRegister() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
                  Complete Your Registration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {registrationError && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{registrationError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleRegistration} className="space-y-4">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {tournament.categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Age Group Selection */}
                  {tournament.ageGroups && tournament.ageGroups.length > 0 && (
                    <div className="space-y-2">
                      <Label>Age Groups *</Label>
                      <div className="space-y-2">
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
                            <label key={ageGroup.name} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedAgeGroups.includes(ageGroup.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAgeGroups([...selectedAgeGroups, ageGroup.name]);
                                  } else {
                                    setSelectedAgeGroups(selectedAgeGroups.filter(ag => ag !== ageGroup.name));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{ageGroup.name}{ageRange}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Partner Details for Doubles/Mixed */}
                  {(selectedCategory === 'doubles' || selectedCategory === 'mixed') && (
                    <div className="space-y-4 p-4 bg-blue-100 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Partner Details</h4>
                      <div className="space-y-2">
                        <Label htmlFor="partnerName">Partner Name *</Label>
                        <Input
                          id="partnerName"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          placeholder="Enter partner's name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partnerPhone">Partner Phone *</Label>
                        <Input
                          id="partnerPhone"
                          value={partnerPhone}
                          onChange={(e) => setPartnerPhone(e.target.value)}
                          placeholder="Enter partner's phone number"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                      <SelectTrigger>
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
                    <div className="space-y-2">
                      <Label htmlFor="transactionId">Transaction ID</Label>
                      <Input
                        id="transactionId"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter transaction ID (if available)"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRegistrationForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={registrationLoading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {registrationLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Submit Registration
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
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
