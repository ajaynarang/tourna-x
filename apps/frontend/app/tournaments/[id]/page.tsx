'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { Label } from '@repo/ui';
import { Input } from '@repo/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  Loader2,
  Sparkles,
  Target,
  Award,
  Edit
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  categories: string[];
  ageGroups?: string[];
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
}

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const [registrationForm, setRegistrationForm] = useState({
    category: '',
    ageGroup: '',
    partnerName: '',
    partnerPhone: '',
    partnerAge: '',
    partnerGender: '',
    paymentMethod: 'cash',
    transactionId: '',
  });

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tournaments/${id}`);
      const result = await response.json();

      if (result.success) {
        setTournament(result.data);
        
        // Check if user is already registered
        if (user) {
          const participantsResponse = await fetch(`/api/tournaments/${id}/participants`);
          const participantsResult = await participantsResponse.json();
          
          if (participantsResult.success && participantsResult.data) {
            const isRegistered = participantsResult.data.some(
              (p: any) => p.userId === user._id
            );
            setAlreadyRegistered(isRegistered);
          }
        }
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push(`/login?redirect=/tournaments/${id}`);
      return;
    }

    setIsRegistering(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/tournaments/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationForm),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message || 'Registration successful! Waiting for admin approval.');
        setShowRegistrationForm(false);
        setAlreadyRegistered(true);
        
        // Refresh tournament data
        setTimeout(() => {
          fetchTournament();
        }, 2000);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering:', error);
      setError('Failed to register. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'bg-green-500 text-white';
      case 'ongoing':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'Registration Open';
      case 'ongoing':
        return 'Ongoing';
      case 'completed':
        return 'Completed';
      default:
        return status.replace('_', ' ');
    }
  };

  const isEligibleForTournament = () => {
    if (!tournament) return false;
    if (tournament.tournamentType === 'open') return true;
    if (tournament.tournamentType === 'society_only' && tournament.allowedSociety) {
      return user?.society === tournament.allowedSociety;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tournament Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button asChild>
              <Link href="/tournaments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tournaments
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tournament) return null;

  const isDoubles = tournament.categories.some(cat => 
    cat.toLowerCase().includes('doubles') || cat.toLowerCase().includes('mixed')
  );

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
          <div>
            <h1 className="text-primary text-3xl font-bold">{tournament.name}</h1>
            <p className="text-muted-foreground mt-1">{tournament.sport.charAt(0).toUpperCase() + tournament.sport.slice(1)} Tournament</p>
          </div>
        </div>

        {/* Hero Section */}
        <Card className="mb-8 overflow-hidden border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Badge className={`${getStatusColor(tournament.status)} mb-4`}>
                  {getStatusText(tournament.status)}
                </Badge>
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                  {tournament.name}
                </h1>
                <p className="text-blue-100 text-lg flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  {tournament.sport.charAt(0).toUpperCase() + tournament.sport.slice(1)} Tournament
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold">{tournament.participantCount}</div>
                  <div className="text-sm text-blue-100">Participants</div>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Key Info Cards */}
              <div className="flex items-start space-x-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tournament Dates</div>
                  <div className="font-semibold text-gray-900">
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

              <div className="flex items-start space-x-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Venue</div>
                  <div className="font-semibold text-gray-900">{tournament.venue}</div>
                  <div className="text-sm text-gray-500">{tournament.location}</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Entry Fee</div>
                  <div className="font-semibold text-gray-900">₹{tournament.entryFee}</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Capacity</div>
                  <div className="font-semibold text-gray-900">
                    {tournament.participantCount} / {tournament.maxParticipants}
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            {tournament.categories && tournament.categories.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Categories Available
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tournament.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-sm px-4 py-2">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Age Groups */}
            {tournament.ageGroups && tournament.ageGroups.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Age Groups</h3>
                <div className="flex flex-wrap gap-2">
                  {tournament.ageGroups.map((ageGroup: any) => {
                    const isString = typeof ageGroup === 'string';
                    const name = isString ? ageGroup : ageGroup.name;
                    const minAge = !isString && ageGroup.minAge;
                    const maxAge = !isString && ageGroup.maxAge;
                    
                    let ageRange = '';
                    if (minAge && maxAge) {
                      ageRange = ` (${minAge}-${maxAge} years)`;
                    } else if (minAge) {
                      ageRange = ` (${minAge}+ years)`;
                    } else if (maxAge) {
                      ageRange = ` (up to ${maxAge} years)`;
                    }
                    
                    return (
                      <Badge key={name} variant="outline" className="text-sm px-4 py-2">
                        {name}{ageRange}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Registration Deadline */}
            {tournament.registrationDeadline && (
              <Alert className="mb-6 border-orange-200 bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Registration closes on{' '}
                  <strong>
                    {new Date(tournament.registrationDeadline).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Success/Error Messages */}
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Eligibility Check */}
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

            {/* Already Registered */}
            {alreadyRegistered && (
              <Alert className="mb-6 border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  ✓ You are already registered for this tournament. Check your dashboard for updates.
                </AlertDescription>
              </Alert>
            )}

            {/* Registration Button */}
            {!showRegistrationForm && (
              <div className="flex flex-col sm:flex-row gap-4">
                {canRegister() ? (
                  <Button 
                    size="lg" 
                    className="flex-1 text-lg h-14"
                    onClick={() => setShowRegistrationForm(true)}
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Register for Tournament
                  </Button>
                ) : alreadyRegistered ? (
                  <Button size="lg" className="flex-1 text-lg h-14" disabled>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Already Registered
                  </Button>
                ) : tournament.status !== 'registration_open' ? (
                  <Button size="lg" className="flex-1 text-lg h-14" disabled>
                    <Clock className="h-5 w-5 mr-2" />
                    Registration Closed
                  </Button>
                ) : tournament.participantCount >= tournament.maxParticipants ? (
                  <Button size="lg" className="flex-1 text-lg h-14" disabled>
                    <XCircle className="h-5 w-5 mr-2" />
                    Tournament Full
                  </Button>
                ) : !user ? (
                  <Button 
                    size="lg" 
                    className="flex-1 text-lg h-14"
                    onClick={() => router.push(`/login?redirect=/tournaments/${id}`)}
                  >
                    Sign In to Register
                  </Button>
                ) : (
                  <Button size="lg" className="flex-1 text-lg h-14" disabled>
                    <XCircle className="h-5 w-5 mr-2" />
                    Not Eligible
                  </Button>
                )}
                
                {user && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="sm:w-auto text-lg h-14"
                    asChild
                  >
                    <Link href="/player/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {/* Registration Form */}
            {showRegistrationForm && canRegister() && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
                    Complete Your Registration
                  </CardTitle>
                  <CardDescription>
                    Fill in the required details to register for this tournament
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Category Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select 
                          value={registrationForm.category}
                          onValueChange={(value) => setRegistrationForm({ ...registrationForm, category: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {tournament.categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Age Group Selection */}
                      {tournament.ageGroups && tournament.ageGroups.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="ageGroup">Age Group *</Label>
                          <Select 
                            value={registrationForm.ageGroup}
                            onValueChange={(value) => setRegistrationForm({ ...registrationForm, ageGroup: value })}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select age group" />
                            </SelectTrigger>
                            <SelectContent>
                              {tournament.ageGroups.map((ageGroup: any) => {
                                const isString = typeof ageGroup === 'string';
                                const name = isString ? ageGroup : ageGroup.name;
                                const minAge = !isString && ageGroup.minAge;
                                const maxAge = !isString && ageGroup.maxAge;
                                
                                let ageRange = '';
                                if (minAge && maxAge) {
                                  ageRange = ` (${minAge}-${maxAge} years)`;
                                } else if (minAge) {
                                  ageRange = ` (${minAge}+ years)`;
                                } else if (maxAge) {
                                  ageRange = ` (up to ${maxAge} years)`;
                                }
                                
                                return (
                                  <SelectItem key={name} value={name}>
                                    {name}{ageRange}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Partner Details for Doubles */}
                    {isDoubles && (
                      <div className="space-y-4 p-4 bg-white/50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Partner Details (For Doubles)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="partnerName">Partner Name</Label>
                            <Input
                              id="partnerName"
                              type="text"
                              placeholder="Partner's full name"
                              value={registrationForm.partnerName}
                              onChange={(e) => setRegistrationForm({ ...registrationForm, partnerName: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="partnerPhone">Partner Phone</Label>
                            <Input
                              id="partnerPhone"
                              type="tel"
                              placeholder="+91 9876543210"
                              value={registrationForm.partnerPhone}
                              onChange={(e) => setRegistrationForm({ ...registrationForm, partnerPhone: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="partnerAge">Partner Age</Label>
                            <Input
                              id="partnerAge"
                              type="number"
                              placeholder="Age"
                              value={registrationForm.partnerAge}
                              onChange={(e) => setRegistrationForm({ ...registrationForm, partnerAge: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="partnerGender">Partner Gender</Label>
                            <Select 
                              value={registrationForm.partnerGender}
                              onValueChange={(value) => setRegistrationForm({ ...registrationForm, partnerGender: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
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
                    )}

                    {/* Payment Details */}
                    <div className="space-y-4 p-4 bg-white/50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Payment Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentMethod">Payment Method *</Label>
                          <Select 
                            value={registrationForm.paymentMethod}
                            onValueChange={(value) => setRegistrationForm({ ...registrationForm, paymentMethod: value })}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="netbanking">Net Banking</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {registrationForm.paymentMethod !== 'cash' && (
                          <div className="space-y-2">
                            <Label htmlFor="transactionId">Transaction ID</Label>
                            <Input
                              id="transactionId"
                              type="text"
                              placeholder="Enter transaction ID"
                              value={registrationForm.transactionId}
                              onChange={(e) => setRegistrationForm({ ...registrationForm, transactionId: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Entry fee: <strong>₹{tournament.entryFee}</strong>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="flex-1"
                        disabled={isRegistering}
                      >
                        {isRegistering ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Complete Registration
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="lg"
                        onClick={() => setShowRegistrationForm(false)}
                        disabled={isRegistering}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Admin Management Section */}
        {user && user.roles?.includes('admin') && (
          <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <Award className="h-5 w-5 mr-2" />
                Tournament Management
              </CardTitle>
              <CardDescription className="text-blue-700">
                Admin tools for managing this tournament
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2 border-blue-300 hover:bg-blue-100"
                  asChild
                >
                  <Link href={`/admin/tournaments/${id}/participants`}>
                    <Users className="h-6 w-6 text-blue-600" />
                    <span className="text-sm font-medium">Manage Participants</span>
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2 border-green-300 hover:bg-green-100"
                  asChild
                >
                  <Link href={`/admin/tournaments/${id}/fixtures`}>
                    <Target className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium">Generate Fixtures</span>
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2 border-purple-300 hover:bg-purple-100"
                  asChild
                >
                  <Link href={`/admin/tournaments/${id}/edit`}>
                    <Edit className="h-6 w-6 text-purple-600" />
                    <span className="text-sm font-medium">Edit Tournament</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Description */}
          {tournament.description && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-600" />
                  About Tournament
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{tournament.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tournament Format */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-purple-600" />
                Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Tournament Format</div>
                  <div className="font-semibold text-gray-900 capitalize">{tournament.format}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tournament Type</div>
                  <div className="font-semibold text-gray-900 capitalize">
                    {tournament.tournamentType.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rules */}
          {tournament.rules && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-green-600" />
                  Rules & Regulations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{tournament.rules}</p>
              </CardContent>
            </Card>
          )}

          {/* Prizes */}
          {tournament.prizes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-600" />
                  Prizes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typeof tournament.prizes === 'string' ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{tournament.prizes}</p>
                ) : (
                  <div className="space-y-4">
                    {tournament.prizes.winner && tournament.prizes.winner.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Winner</h4>
                        <ul className="text-gray-700 space-y-1">
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
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Runner Up</h4>
                        <ul className="text-gray-700 space-y-1">
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
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Semi Finalist</h4>
                        <ul className="text-gray-700 space-y-1">
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
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          {(tournament.contactPerson || tournament.contactPhone) && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournament.contactPerson && (
                    <div>
                      <div className="text-sm text-gray-600">Contact Person</div>
                      <div className="font-semibold text-gray-900">{tournament.contactPerson}</div>
                    </div>
                  )}
                  {tournament.contactPhone && (
                    <div>
                      <div className="text-sm text-gray-600">Contact Phone</div>
                      <div className="font-semibold text-gray-900">{tournament.contactPhone}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
