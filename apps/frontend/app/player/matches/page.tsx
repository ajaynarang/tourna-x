'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
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
  const router = useRouter();
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative z-10 min-h-screen p-8">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={item} className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/player/dashboard"
                className="text-muted-foreground hover:text-primary flex items-center gap-2 text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
            <button
              onClick={fetchMatches}
              className="glass-card flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-primary transition-all hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          variants={item}
          className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          <StatCard
            title="Total Matches"
            value={matches.length}
            icon={Trophy}
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Upcoming"
            value={matches.filter(m => m.status === 'scheduled').length}
            icon={Clock}
            color="from-yellow-500 to-amber-500"
          />
          <StatCard
            title="Completed"
            value={matches.filter(m => m.status === 'completed').length}
            icon={CheckCircle}
            color="from-green-500 to-emerald-500"
          />
        </motion.div>

        {/* Filter Tabs */}
        <motion.div variants={item} className="mb-6">
          <div className="glass-card-intense p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-tertiary" />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'all'
                      ? 'bg-primary text-white shadow-md'
                      : 'glass-card text-tertiary hover:text-primary hover:bg-white/10'
                  }`}
                >
                  All Matches ({matches.length})
                </button>
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'upcoming'
                      ? 'bg-primary text-white shadow-md'
                      : 'glass-card text-tertiary hover:text-primary hover:bg-white/10'
                  }`}
                >
                  Upcoming ({matches.filter(m => m.status === 'scheduled' || m.status === 'in_progress').length})
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'completed'
                      ? 'bg-primary text-white shadow-md'
                      : 'glass-card text-tertiary hover:text-primary hover:bg-white/10'
                  }`}
                >
                  Completed ({matches.filter(m => m.status === 'completed').length})
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Matches List */}
        <motion.div variants={item} className="space-y-4">
          {filteredMatches.length === 0 ? (
            <div className="glass-card-intense p-12 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20">
                <Calendar className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="text-primary mb-2 text-xl font-semibold">No Matches Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {filter === 'upcoming' 
                  ? "You don't have any upcoming matches scheduled. Register for tournaments to start playing!"
                  : filter === 'completed'
                  ? "You haven't completed any matches yet. Play your first match to see results here."
                  : "You don't have any matches yet. Browse and register for tournaments to get started!"
                }
              </p>
              <button
                onClick={() => router.push('/tournaments')}
                className="bg-primary inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-transform hover:scale-105"
              >
                <Trophy className="h-5 w-5" />
                Browse Tournaments
              </button>
            </div>
          ) : (
            filteredMatches.map((match, index) => {
              const StatusIcon = getStatusIcon(match.status);
              const isUpcoming = match.status === 'scheduled' || match.status === 'in_progress';
              const isCompleted = match.status === 'completed';
              const matchResult = getMatchResult(match);
              
              return (
                <motion.div
                  key={match._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-card p-6 transition-all hover:scale-[1.01] ${
                    isCompleted && matchResult === 'Won' 
                      ? 'border-l-4 border-l-green-500' 
                      : isCompleted && matchResult === 'Lost'
                      ? 'border-l-4 border-l-red-500'
                      : isUpcoming
                      ? 'border-l-4 border-l-blue-500'
                      : ''
                  }`}
                >
                  <div className="p-6">
                    {/* Match Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-primary">
                            {match.tournamentName}
                          </h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(match.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {match.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Round:</strong> {match.round}
                        </p>
                      </div>
                      {isCompleted && matchResult && (
                        <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                          matchResult === 'Won' 
                            ? 'bg-green-500 text-white' 
                            : matchResult === 'Lost'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}>
                          {matchResult === 'Won' ? '🏆 Won' : matchResult === 'Lost' ? '😔 Lost' : 'Draw'}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Match Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-primary text-sm mb-3">Match Details</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4 text-tertiary" />
                          <span><strong>Opponent:</strong> {match.player2Name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 text-tertiary" />
                          <span><strong>Date:</strong> {new Date(match.scheduledDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 text-tertiary" />
                          <span><strong>Time:</strong> {new Date(match.scheduledDate).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        {match.court && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 text-tertiary" />
                            <span><strong>Court:</strong> {match.court}</span>
                          </div>
                        )}
                      </div>

                      {/* Score Section */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-primary text-sm mb-3">
                          {isCompleted ? 'Final Score' : 'Match Status'}
                        </h4>
                        {isCompleted ? (
                          <div className="glass-card rounded-lg p-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary mb-2">
                                {formatScore(match.player1Score, match.player2Score)}
                              </div>
                              {match.winnerId && (
                                <div className={`text-sm font-medium ${
                                  isWinner(match) ? 'text-green-400' : 'text-red-400'
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
                          <div className="glass-card rounded-lg p-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-primary mb-1">
                                {match.status === 'scheduled' ? 'Scheduled' : 'In Progress'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {match.status === 'scheduled' ? 'Match will start soon' : 'Live match in progress'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                      <button
                        onClick={() => router.push(`/tournaments/${match.tournamentId}`)}
                        className="glass-card flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-primary transition-all hover:bg-white/10"
                      >
                        <Trophy className="h-4 w-4" />
                        View Tournament
                      </button>
                      {match.status === 'in_progress' && (
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Live Match
                          </span>
                          <button
                            onClick={() => router.push(`/player/scoring?matchId=${match._id}`)}
                            className="glass-card flex items-center gap-2 rounded-lg px-3 py-1 font-medium text-primary transition-all hover:bg-white/10 text-xs"
                          >
                            <Trophy className="h-3 w-3" />
                            Score
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div className="glass-card-intense p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-muted-foreground text-sm mb-1">{title}</div>
          <div className="text-primary text-3xl font-bold">{value}</div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
