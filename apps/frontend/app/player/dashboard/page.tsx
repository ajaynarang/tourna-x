'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  Phone,
  Mail,
  Home,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Brain,
  RefreshCw,
  Sparkles,
  Star,
  MessageCircle,
  Share2,
  Heart
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  endDate: string;
  venue: string;
  entryFee: number;
  tournamentType: string;
  allowedSociety?: string;
}

interface Match {
  _id: string;
  tournamentName: string;
  round: string;
  player1Name: string;
  player2Name: string;
  scheduledTime: string;
  court: string;
  status: string;
  player1Score: number[];
  player2Score: number[];
}

interface Participant {
  _id: string;
  tournamentId: string;
  tournamentName: string;
  category: string;
  paymentStatus: string;
  isApproved: boolean;
  registeredAt: string;
}

export default function PlayerDashboard() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participations, setParticipations] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for AI recommendations and player stats
  const aiRecommendations = [
    {
      title: "Improve your serve",
      description: "Focus on consistency in your serve technique",
      priority: "high" as const,
      icon: Trophy,
      action: "Practice"
    },
    {
      title: "Practice backhand",
      description: "Your backhand needs more power and accuracy",
      priority: "medium" as const,
      icon: Trophy,
      action: "Focus"
    }
  ];

  const playerStats = {
    totalMatches: 15,
    winRate: 73.3,
    currentStreak: 4,
    ranking: 12
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch available tournaments
      const tournamentsResponse = await fetch('/api/tournaments');
      const tournamentsData = await tournamentsResponse.json();
      setTournaments(tournamentsData.filter((t: Tournament) => 
        ['published', 'registration_open'].includes(t.status)
      ));

      // Fetch player's matches
      const matchesResponse = await fetch('/api/player/matches');
      const matchesData = await matchesResponse.json();
      setMatches(matchesData.slice(0, 5)); // Show only upcoming 5

      // Fetch player's participations
      const participationsResponse = await fetch('/api/player/participations');
      const participationsData = await participationsResponse.json();
      setParticipations(participationsData.slice(0, 5)); // Show only recent 5

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const isEligibleForTournament = (tournament: Tournament) => {
    if (tournament.tournamentType === 'open') return true;
    if (tournament.tournamentType === 'society_only' && tournament.allowedSociety) {
      return user?.society === tournament.allowedSociety;
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Welcome back, {user?.name || 'Player'}!
                </h1>
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
                  <Brain className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">AI Coach</span>
                </div>
              </div>
              <p className="text-gray-600">
                Your personalized tournament experience with intelligent insights.
              </p>
            </div>
            <Button 
              onClick={() => fetchDashboardData()} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* AI Recommendations */}
        {aiRecommendations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Recommendations</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiRecommendations.map((rec, index) => {
                const Icon = rec.icon;
                return (
                  <Card key={index} className={`border-l-4 ${
                    rec.priority === 'high' ? 'border-l-red-500 bg-red-50' :
                    rec.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                    'border-l-blue-500 bg-blue-50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          <Icon className="h-5 w-5 text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{rec.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge className={`${
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {rec.priority.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">{rec.action} →</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Profile Card */}
        <Card className="mb-8 bg-gradient-to-r from-white to-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {user?.name?.charAt(0) || 'P'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{user?.name || 'Player'}</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {user?.phone && (
                      <span className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {user.phone}
                      </span>
                    )}
                    {user?.email && (
                      <span className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {user.email}
                      </span>
                    )}
                    {user?.society && (
                      <span className="flex items-center">
                        <Home className="h-4 w-4 mr-1" />
                        {user.society}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/player/profile">
                    <Eye className="h-4 w-4 mr-1" />
                    View Profile
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/player/profile">
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Player Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{playerStats.totalMatches}</div>
                  <div className="text-xs text-gray-600">Total Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{playerStats.winRate.toFixed(0)}%</div>
                  <div className="text-xs text-gray-600">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{playerStats.currentStreak}</div>
                  <div className="text-xs text-gray-600">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">#{playerStats.ranking}</div>
                  <div className="text-xs text-gray-600">Ranking</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Matches */}
          <Card className="bg-gradient-to-br from-white to-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Upcoming Matches
                </CardTitle>
                <CardDescription>Your scheduled matches</CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/player/matches">
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matches.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming matches</p>
                    <p className="text-sm text-gray-400 mt-2">Register for tournaments to see your matches here</p>
                  </div>
                ) : (
                  matches.map((match) => (
                    <div key={match._id} className="p-4 border border-gray-200 rounded-lg hover:bg-white/50 transition-colors bg-white/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{match.tournamentName}</h3>
                        <Badge className={getStatusColor(match.status)}>
                          {match.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <p><strong>Round:</strong> {match.round}</p>
                        <p><strong>Opponent:</strong> {match.player2Name}</p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(match.scheduledTime).toLocaleString()}
                        </span>
                        {match.court && (
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Court {match.court}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Tournaments */}
          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-600" />
                  Available Tournaments
                </CardTitle>
                <CardDescription>Tournaments you can join</CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/tournaments">
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tournaments.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tournaments available</p>
                    <p className="text-sm text-gray-400 mt-2">Check back later for new tournaments</p>
                  </div>
                ) : (
                  tournaments.slice(0, 3).map((tournament) => (
                    <div key={tournament._id} className="p-4 border border-gray-200 rounded-lg hover:bg-white/50 transition-colors bg-white/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{tournament.name}</h3>
                        <Badge className={getStatusColor(tournament.status)}>
                          {tournament.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <p><strong>Sport:</strong> {tournament.sport}</p>
                        <p><strong>Entry Fee:</strong> ₹{tournament.entryFee}</p>
                        <p><strong>Start Date:</strong> {new Date(tournament.startDate).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          {tournament.venue}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/tournaments/${tournament._id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Link>
                        </Button>
                        {isEligibleForTournament(tournament) && (
                          <Button size="sm" asChild>
                            <Link href={`/register?tournament=${tournament._id}`}>
                              <Plus className="h-4 w-4 mr-1" />
                              Register
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Participations */}
        <Card className="mt-8 bg-gradient-to-br from-white to-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Recent Participations
            </CardTitle>
            <CardDescription>Your recent tournament registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {participations.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No participations yet</p>
                  <p className="text-sm text-gray-400 mt-2">Register for tournaments to see your participations here</p>
                </div>
              ) : (
                participations.map((participation) => (
                  <div key={participation._id} className="p-4 border border-gray-200 rounded-lg hover:bg-white/50 transition-colors bg-white/30">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{participation.tournamentName}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPaymentStatusColor(participation.paymentStatus)}>
                          {participation.paymentStatus}
                        </Badge>
                        <Badge className={participation.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {participation.isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>Category:</strong> {participation.category}</p>
                      <p><strong>Registered:</strong> {new Date(participation.registeredAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}