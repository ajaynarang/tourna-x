'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { Card, CardContent } from '@repo/ui';
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
  Filter,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface Match {
  _id: string;
  matchType: string;
  tournamentId?: string;
  tournamentName?: string;
  tournamentVenue?: string;
  round?: string;
  category: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  player3Name?: string;
  player4Name?: string;
  opponentName: string;
  opponentId: string;
  isPlayer1: boolean;
  scheduledDate: string;
  court: string;
  status: string;
  player1Score: number[];
  player2Score: number[];
  winnerId?: string;
  ageGroup?: string;
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
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'tournament' | 'practice'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'singles' | 'doubles' | 'mixed'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      
      // Fetch matches from the player-specific API endpoint
      const response = await fetch('/api/player/matches');
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
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
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
    // Status filter
    if (statusFilter === 'upcoming' && !(match.status === 'scheduled' || match.status === 'in_progress')) return false;
    if (statusFilter === 'completed' && match.status !== 'completed') return false;
    
    // Type filter
    if (typeFilter === 'tournament' && match.matchType !== 'tournament') return false;
    if (typeFilter === 'practice' && match.matchType !== 'practice') return false;
    
    // Category filter
    if (categoryFilter !== 'all' && match.category !== categoryFilter) return false;
    
    return true;
  });

  const formatScore = (match: Match) => {
    const { player1Score, player2Score, isPlayer1 } = match;
    
    if (!player1Score || player1Score.length === 0 || !player2Score || player2Score.length === 0) {
      return 'TBD';
    }
    
    // Show current player's score first
    if (isPlayer1) {
      return `${player1Score.join('-')} vs ${player2Score.join('-')}`;
    } else {
      return `${player2Score.join('-')} vs ${player1Score.join('-')}`;
    }
  };

  const isWinner = (match: Match) => {
    return match.winnerId?.toString() === user?._id?.toString();
  };

  const getMatchResult = (match: Match) => {
    if (match.status !== 'completed') return null;
    if (!match.winnerId) return 'Draw';
    return isWinner(match) ? 'Won' : 'Lost';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'singles':
        return '👤';
      case 'doubles':
        return '👥';
      case 'mixed':
        return '👫';
      default:
        return '🏸';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header - Apple-style clean design */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button - Desktop */}
            <Link
              href="/player/dashboard"
              className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            
            <div className="flex items-center gap-2 ml-auto">
              {/* Mobile Filter Toggle */}
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFilters(!showFilters);
                }}
                variant="outline"
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filters</span>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fetchMatches();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Summary */}
        {!isLoading && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Matches</div>
                  <div className="text-gray-900 dark:text-white text-3xl font-bold">{matches.length}</div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Upcoming</div>
                  <div className="text-gray-900 dark:text-white text-3xl font-bold">{matches.filter(m => m.status === 'scheduled').length}</div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Completed</div>
                  <div className="text-gray-900 dark:text-white text-3xl font-bold">{matches.filter(m => m.status === 'completed').length}</div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Filters - Apple-style segmented control */}
        <div className={`mb-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Status
                </label>
                <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-full">
                  {['all', 'upcoming', 'completed'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStatusFilter(status as any);
                      }}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        statusFilter === status
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {status === 'all' ? 'All' : 
                       status === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Match Type
                </label>
                <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-full">
                  {['all', 'tournament', 'practice'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTypeFilter(type as any);
                      }}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        typeFilter === type
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {type === 'all' ? 'All' : 
                       type === 'tournament' ? 'Tournament' : 'Practice'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Category
                </label>
                <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-full">
                  {['all', 'singles', 'doubles', 'mixed'].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCategoryFilter(category as any);
                      }}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        categoryFilter === category
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {category === 'all' ? 'All' : 
                       category === 'singles' ? 'Singles' :
                       category === 'doubles' ? 'Doubles' : 'Mixed'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Matches List - Apple-style cards */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading matches...</p>
            </div>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-6">
              <Calendar className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Matches Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
              {statusFilter === 'upcoming' 
                ? "You don't have any upcoming matches scheduled. Register for tournaments to start playing!"
                : statusFilter === 'completed'
                ? "You haven't completed any matches yet. Play your first match to see results here."
                : "You don't have any matches yet. Browse and register for tournaments to get started!"
              }
            </p>
            <Button
              type="button"
              variant="default"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push('/tournaments');
              }}
            >
              <Trophy className="mr-2 h-4 w-4" />
              Browse Tournaments
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMatches.map((match) => {
              const StatusIcon = getStatusIcon(match.status);
              const isCompleted = match.status === 'completed';
              const matchResult = getMatchResult(match);
              
              return (
                <Card 
                  key={match._id}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      {/* Match Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {match.matchType === 'practice' ? (
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                              Practice Match
                            </h3>
                          ) : (
                            <div className="mb-2">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                {match.tournamentName}
                              </h3>
                              {match.round && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {match.round}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* Badges Row */}
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            {/* Match Type Badge */}
                            <Badge className={
                              match.matchType === 'practice'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            }>
                              {match.matchType === 'practice' ? 'Practice' : 'Tournament'}
                            </Badge>
                            
                            {/* Status Badge */}
                            <Badge className={getStatusColor(match.status)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {match.status.replace('_', ' ')}
                            </Badge>
                            
                            {/* Category Badge */}
                            <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 capitalize">
                              {match.category}
                            </Badge>
                            
                            {/* Age Group Badge */}
                            {match.ageGroup && (
                              <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                                {match.ageGroup}
                              </Badge>
                            )}
                            
                            {/* Win/Loss Badge */}
                            {isCompleted && matchResult && (
                              <Badge className={
                                matchResult === 'Won' 
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' 
                                  : matchResult === 'Lost'
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                  : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
                              }>
                                {matchResult === 'Won' ? '✓ Won' : matchResult === 'Lost' ? '✗ Lost' : 'Draw'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Match Details */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Users className="h-4 w-4" />
                            <span className="font-medium text-gray-900 dark:text-white">{match.opponentName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(match.scheduledDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(match.scheduledDate).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          {match.court && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="h-4 w-4" />
                              <span>{match.court}</span>
                            </div>
                          )}
                          {match.matchType === 'tournament' && match.tournamentVenue && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{match.tournamentVenue}</span>
                            </div>
                          )}
                        </div>

                        {/* Score Section */}
                        <div className="space-y-2">
                          {isCompleted ? (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                  {formatScore(match)}
                                </div>
                                {match.winnerId && (
                                  <div className={`text-sm font-medium ${
                                    isWinner(match) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {isWinner(match) ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <Award className="h-4 w-4" />
                                        Victory!
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-1">
                                        <TrendingUp className="h-4 w-4" />
                                        Keep improving!
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                              <div className="text-center">
                                <div className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                  {match.status === 'scheduled' ? 'Scheduled' : 'In Progress'}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {match.status === 'scheduled' ? 'Match will start soon' : 'Live match'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons - Only show for in-progress matches */}
                      {match.status === 'in_progress' && (
                        <div className="flex items-center justify-end pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/player/scoring?matchId=${match._id}`);
                            }}
                          >
                            <Trophy className="h-4 w-4 mr-2" />
                            Update Score
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

