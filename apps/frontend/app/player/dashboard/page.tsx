'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
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
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Award,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle
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
  scheduledDate: string;
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
  return (
    <AuthGuard requiredRoles={['player']}>
      <PlayerDashboardContent />
    </AuthGuard>
  );
}

function PlayerDashboardContent() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participations, setParticipations] = useState<Participant[]>([]);
  const [playerStats, setPlayerStats] = useState({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalTournaments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const dashboardResponse = await fetch('/api/player/dashboard');
      const dashboardResult = await dashboardResponse.json();
      
      if (dashboardResult.success && dashboardResult.data) {
        const data = dashboardResult.data;
        
        setTournaments(data.availableTournaments || []);
        setMatches(data.upcomingMatches || []);
        setParticipations(data.recentParticipations || []);
        
        if (data.player) {
          setPlayerStats(data.player.stats || {
            totalMatches: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalTournaments: 0
          });
        }
      }
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                  Welcome back, {user?.name || 'Player'}!
                </h1>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-100 to-blue-100 rounded-full border border-green-200">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">AI Insights</span>
                </div>
              </div>
              <p className="text-gray-600 text-lg">
                Your personalized tournament experience and performance insights
              </p>
            </div>
            <Button 
              onClick={fetchDashboardData} 
              variant="outline" 
              size="lg"
              className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview - Apple Card Style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-6 w-6 opacity-80" />
                <Target className="h-8 w-8 opacity-20" />
              </div>
              <div className="text-3xl font-bold mb-1">{playerStats.totalMatches}</div>
              <div className="text-sm text-blue-100">Total Matches</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-6 w-6 opacity-80" />
                <Award className="h-8 w-8 opacity-20" />
              </div>
              <div className="text-3xl font-bold mb-1">{playerStats.winRate.toFixed(0)}%</div>
              <div className="text-sm text-green-100">Win Rate</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="h-6 w-6 opacity-80" />
                <Trophy className="h-8 w-8 opacity-20" />
              </div>
              <div className="text-3xl font-bold mb-1">{playerStats.wins}</div>
              <div className="text-sm text-purple-100">Victories</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-6 w-6 opacity-80" />
                <Users className="h-8 w-8 opacity-20" />
              </div>
              <div className="text-3xl font-bold mb-1">{playerStats.totalTournaments}</div>
              <div className="text-sm text-orange-100">Tournaments</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/tournaments" className="block group">
            <Card className="border-2 border-transparent hover:border-blue-300 transition-all hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Discover</div>
                    <div className="text-lg font-semibold text-gray-900">Browse Tournaments</div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                    <Trophy className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/player/matches" className="block group">
            <Card className="border-2 border-transparent hover:border-green-300 transition-all hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Track</div>
                    <div className="text-lg font-semibold text-gray-900">My Matches</div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/player/profile" className="block group">
            <Card className="border-2 border-transparent hover:border-purple-300 transition-all hover:shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Manage</div>
                    <div className="text-lg font-semibold text-gray-900">My Profile</div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upcoming Matches */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Calendar className="h-6 w-6 text-green-600" />
                    Upcoming Matches
                  </CardTitle>
                  <CardDescription className="mt-2">Your scheduled matches</CardDescription>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/player/matches" className="flex items-center gap-1">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matches.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-2">No upcoming matches</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Register for tournaments to see your matches here
                    </p>
                    <Button asChild size="sm">
                      <Link href="/tournaments">
                        <Trophy className="h-4 w-4 mr-2" />
                        Browse Tournaments
                      </Link>
                    </Button>
                  </div>
                ) : (
                  matches.map((match) => (
                    <div 
                      key={match._id} 
                      className="p-4 border-2 border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{match.tournamentName}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge className={getStatusColor(match.status)} variant="outline">
                              {match.status.replace('_', ' ')}
                            </Badge>
                            <span>•</span>
                            <span>{match.round}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-700">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          vs. <strong className="ml-1">{match.player2Name}</strong>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          {new Date(match.scheduledDate).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </div>
                        {match.court && (
                          <div className="flex items-center text-gray-700">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            Court {match.court}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Tournaments */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Trophy className="h-6 w-6 text-blue-600" />
                    Open Tournaments
                  </CardTitle>
                  <CardDescription className="mt-2">Join these tournaments</CardDescription>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/tournaments" className="flex items-center gap-1">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tournaments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                      <Trophy className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-2">No tournaments available</p>
                    <p className="text-sm text-gray-500">
                      Check back later for new tournaments
                    </p>
                  </div>
                ) : (
                  tournaments.slice(0, 3).map((tournament) => (
                    <div 
                      key={tournament._id} 
                      className="p-4 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{tournament.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(tournament.status)} variant="outline">
                              {tournament.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center text-gray-700">
                          <Trophy className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="capitalize">{tournament.sport}</span>
                          <span className="mx-2">•</span>
                          <span>₹{tournament.entryFee}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {new Date(tournament.startDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center text-gray-700">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          {tournament.venue}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <Link href={`/tournaments/${tournament._id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Link>
                        </Button>
                        {isEligibleForTournament(tournament) && (
                          <Button size="sm" asChild className="flex-1">
                            <Link href={`/tournaments/${tournament._id}`}>
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
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Activity className="h-6 w-6 text-purple-600" />
              My Registrations
            </CardTitle>
            <CardDescription>Recent tournament registrations and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {participations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">No registrations yet</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Register for tournaments to see your participations here
                  </p>
                  <Button asChild>
                    <Link href="/tournaments">
                      <Trophy className="h-4 w-4 mr-2" />
                      Browse Tournaments
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {participations.map((participation) => (
                    <div 
                      key={participation._id} 
                      className="p-4 border-2 border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                          {participation.tournamentName}
                        </h3>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getPaymentStatusColor(participation.paymentStatus)} variant="outline">
                            {participation.paymentStatus}
                          </Badge>
                          <Badge 
                            className={participation.isApproved 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            } 
                            variant="outline"
                          >
                            {participation.isApproved ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> Pending</>
                            )}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600">
                          <strong>Category:</strong> {participation.category}
                        </div>
                        <div className="text-xs text-gray-500">
                          Registered: {new Date(participation.registeredAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
