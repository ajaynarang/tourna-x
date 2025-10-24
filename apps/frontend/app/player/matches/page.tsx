'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trophy,
  Users,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Award,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface Match {
  _id: string;
  tournamentId: string;
  tournamentName: string;
  round: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  scheduledDate: string;
  court: string;
  status: string;
  player1Score: number[];
  player2Score: number[];
  winnerId?: string;
}

export default function PlayerMatches() {
  return (
    <AuthGuard requiredRoles={['player']}>
      <PlayerMatchesContent />
    </AuthGuard>
  );
}

function PlayerMatchesContent() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      
      // Fetch matches from the API
      const response = await fetch('/api/matches');
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setMatches(result.data);
      } else {
        console.error('Failed to fetch matches:', result.error);
        setMatches([]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return Clock;
      case 'in_progress':
        return AlertCircle;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'upcoming') return match.status === 'scheduled' || match.status === 'in_progress';
    if (filter === 'completed') return match.status === 'completed';
    return true;
  });

  const formatScore = (player1Score: number[], player2Score: number[]) => {
    if (!player1Score || player1Score.length === 0 || !player2Score || player2Score.length === 0) {
      return 'TBD';
    }
    return `${player1Score.join('-')} vs ${player2Score.join('-')}`;
  };

  const isWinner = (match: Match) => {
    return match.winnerId === user?._id;
  };

  const getMatchResult = (match: Match) => {
    if (match.status !== 'completed') return null;
    if (!match.winnerId) return 'Draw';
    return isWinner(match) ? 'Won' : 'Lost';
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/player/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                  My Matches
                </h1>
                <p className="text-gray-600 mt-1">
                  Track your tournament matches and performance
                </p>
              </div>
            </div>
            <Button 
              onClick={fetchMatches} 
              variant="outline" 
              size="lg"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Matches</div>
                  <div className="text-3xl font-bold text-gray-900">{matches.length}</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Upcoming</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {matches.filter(m => m.status === 'scheduled').length}
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Completed</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {matches.filter(m => m.status === 'completed').length}
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Matches ({matches.length})
                </button>
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'upcoming'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Upcoming ({matches.filter(m => m.status === 'scheduled' || m.status === 'in_progress').length})
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'completed'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Completed ({matches.filter(m => m.status === 'completed').length})
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matches List */}
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Matches Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {filter === 'upcoming' 
                    ? "You don't have any upcoming matches scheduled. Register for tournaments to start playing!"
                    : filter === 'completed'
                    ? "You haven't completed any matches yet. Play your first match to see results here."
                    : "You don't have any matches yet. Browse and register for tournaments to get started!"
                  }
                </p>
                <Button asChild size="lg">
                  <Link href="/tournaments">
                    <Trophy className="h-5 w-5 mr-2" />
                    Browse Tournaments
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredMatches.map((match) => {
              const StatusIcon = getStatusIcon(match.status);
              const isUpcoming = match.status === 'scheduled' || match.status === 'in_progress';
              const isCompleted = match.status === 'completed';
              const matchResult = getMatchResult(match);
              
              return (
                <Card 
                  key={match._id} 
                  className={`border-0 shadow-lg hover:shadow-xl transition-all ${
                    isCompleted && matchResult === 'Won' 
                      ? 'bg-gradient-to-br from-green-50 to-green-100/50' 
                      : isCompleted && matchResult === 'Lost'
                      ? 'bg-gradient-to-br from-red-50 to-red-100/50'
                      : isUpcoming
                      ? 'bg-gradient-to-br from-blue-50 to-blue-100/50'
                      : 'bg-white/80'
                  } backdrop-blur-sm`}
                >
                  <CardContent className="p-6">
                    {/* Match Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {match.tournamentName}
                          </h3>
                          <Badge className={getStatusColor(match.status)} variant="outline">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {match.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong>Round:</strong> {match.round}
                        </p>
                      </div>
                      {isCompleted && matchResult && (
                        <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                          matchResult === 'Won' 
                            ? 'bg-green-600 text-white' 
                            : matchResult === 'Lost'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}>
                          {matchResult === 'Won' ? '🏆 Won' : matchResult === 'Lost' ? '😔 Lost' : 'Draw'}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Match Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 text-sm mb-3">Match Details</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span><strong>Opponent:</strong> {match.player2Name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span><strong>Date:</strong> {new Date(match.scheduledDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span><strong>Time:</strong> {new Date(match.scheduledDate).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        {match.court && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span><strong>Court:</strong> {match.court}</span>
                          </div>
                        )}
                      </div>

                      {/* Score Section */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 text-sm mb-3">
                          {isCompleted ? 'Final Score' : 'Match Status'}
                        </h4>
                        {isCompleted ? (
                          <div className="bg-white/70 rounded-lg p-4 border-2 border-gray-200">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900 mb-2">
                                {formatScore(match.player1Score, match.player2Score)}
                              </div>
                              {match.winnerId && (
                                <div className={`text-sm font-medium ${
                                  isWinner(match) ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {isWinner(match) ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <Award className="h-4 w-4" />
                                      Victory!
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-2">
                                      <TrendingUp className="h-4 w-4" />
                                      Keep improving!
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white/70 rounded-lg p-4 border-2 border-gray-200">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-700 mb-1">
                                {match.status === 'scheduled' ? 'Scheduled' : 'In Progress'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {match.status === 'scheduled' ? 'Match will start soon' : 'Live match in progress'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/tournaments/${match.tournamentId}`}>
                          <Trophy className="h-4 w-4 mr-2" />
                          View Tournament
                        </Link>
                      </Button>
                      {match.status === 'in_progress' && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Live Match
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
