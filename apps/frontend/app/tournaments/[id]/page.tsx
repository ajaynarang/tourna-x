'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users,
  DollarSign,
  ArrowLeft,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Home
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
  isPublished: boolean;
  participantCount: number;
  rules?: string;
  prizes?: {
    winner: number;
    runnerUp: number;
    semiFinalist: number;
  };
}

interface Participant {
  _id: string;
  name: string;
  phone: string;
  category: string;
  paymentStatus: string;
  isApproved: boolean;
  registeredAt: string;
}

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tournamentId, setTournamentId] = useState<string>('');

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

  const fetchTournamentDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tournament details
      const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`);
      if (!tournamentResponse.ok) {
        throw new Error('Tournament not found');
      }
      const tournamentData = await tournamentResponse.json();
      setTournament(tournamentData);

      // Fetch participants
      const participantsResponse = await fetch(`/api/tournaments/${tournamentId}/participants`);
      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        setParticipants(participantsData);
      }
    } catch (error) {
      console.error('Error fetching tournament details:', error);
      setError('Failed to load tournament details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'registration_open':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'Registration Open';
      case 'published':
        return 'Published';
      case 'ongoing':
        return 'Ongoing';
      case 'completed':
        return 'Completed';
      default:
        return status.replace('_', ' ');
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    if (!tournament) return false;
    return tournament.status === 'registration_open' && 
           tournament.participantCount < tournament.maxParticipants &&
           isEligibleForTournament();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tournament Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The tournament you\'re looking for doesn\'t exist.'}</p>
          <Button asChild>
            <Link href="/tournaments">Back to Tournaments</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/tournaments" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tournaments
            </Link>
          </Button>
        </div>

        {/* Tournament Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 mb-4 lg:mb-0">
                <div className="flex items-center space-x-2 mb-2">
                  <CardTitle className="text-2xl lg:text-3xl">{tournament.name}</CardTitle>
                  <Badge className={getStatusColor(tournament.status)}>
                    {getStatusText(tournament.status)}
                  </Badge>
                  {tournament.tournamentType === 'society_only' && (
                    <Badge variant="outline">
                      Society Only
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-lg">
                  {tournament.sport.charAt(0).toUpperCase() + tournament.sport.slice(1)} Tournament
                </CardDescription>
              </div>
              
              {canRegister() && (
                <Button size="lg" asChild>
                  <Link href={`/tournaments/${tournament._id}/register`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Register Now
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tournament Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Start Date</p>
                      <p className="text-sm text-gray-600">{new Date(tournament.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">End Date</p>
                      <p className="text-sm text-gray-600">{new Date(tournament.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Venue</p>
                      <p className="text-sm text-gray-600">{tournament.venue}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Entry Fee</p>
                      <p className="text-sm text-gray-600">₹{tournament.entryFee}</p>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                {tournament.categories && tournament.categories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {tournament.categories.map((category) => (
                        <Badge key={category} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Age Groups */}
                {tournament.ageGroups && tournament.ageGroups.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Age Groups</p>
                    <div className="flex flex-wrap gap-2">
                      {tournament.ageGroups.map((ageGroup) => (
                        <Badge key={ageGroup} variant="outline">
                          {ageGroup}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rules */}
                {tournament.rules && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Rules</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{tournament.rules}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle>Participants ({participants.length}/{tournament.maxParticipants})</CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No participants yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participants.map((participant) => (
                      <div key={participant._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{participant.name}</h4>
                            <Badge className={getPaymentStatusColor(participant.paymentStatus)}>
                              {participant.paymentStatus}
                            </Badge>
                            {participant.isApproved ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {participant.phone}
                            </span>
                            <span>{participant.category}</span>
                            <span>{new Date(participant.registeredAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Status */}
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Participants</span>
                  <span className="text-sm text-gray-600">{tournament.participantCount}/{tournament.maxParticipants}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(tournament.participantCount / tournament.maxParticipants) * 100}%` }}
                  ></div>
                </div>

                {tournament.tournamentType === 'society_only' && tournament.allowedSociety && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center text-sm text-blue-800">
                      <Home className="h-4 w-4 mr-2" />
                      <span>Only for {tournament.allowedSociety} residents</span>
                    </div>
                    {isEligibleForTournament() ? (
                      <div className="flex items-center text-sm text-green-600 mt-2">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        You are eligible
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-red-600 mt-2">
                        <XCircle className="h-4 w-4 mr-1" />
                        Not eligible
                      </div>
                    )}
                  </div>
                )}

                {canRegister() && (
                  <Button asChild className="w-full">
                    <Link href={`/tournaments/${tournament._id}/register`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Register Now
                    </Link>
                  </Button>
                )}

                {tournament.status === 'registration_open' && tournament.participantCount >= tournament.maxParticipants && (
                  <div className="flex items-center text-sm text-red-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    Registration Full
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prizes */}
            {tournament.prizes && (
              <Card>
                <CardHeader>
                  <CardTitle>Prizes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Winner</span>
                    <span className="text-sm font-semibold text-green-600">₹{tournament.prizes.winner}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Runner-up</span>
                    <span className="text-sm font-semibold text-blue-600">₹{tournament.prizes.runnerUp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Semi-finalist</span>
                    <span className="text-sm font-semibold text-orange-600">₹{tournament.prizes.semiFinalist}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
