'use client';

import { useAuth } from '@/lib/auth';
import { Button } from '@repo/ui';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Trophy,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  startDate: string;
  endDate: string;
  status: string;
  participantCount: number;
  format: string;
}

interface Match {
  _id: string;
  tournamentId: string;
  category: string;
  ageGroup?: string;
  round: string;
  player1Name: string;
  player2Name: string;
  player1Score: number[];
  player2Score: number[];
  winnerName?: string;
  status: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

interface PlayerStats {
  _id: string;
  playerId: string;
  totalTournaments: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  titles: number;
  runnerUps: number;
  currentStreak: number;
  longestStreak: number;
  favoriteCategory: string;
  totalPoints: number;
  averageMatchDuration: number;
  societyRanking?: number;
  overallRanking?: number;
  recentForm: string[];
}

export default function MatchHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [tournamentId, setTournamentId] = useState<string>('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'matches' | 'stats'>('matches');

  useEffect(() => {
    params.then(p => {
      setTournamentId(p.id);
    });
  }, [params]);

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tournament details
      const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`);
      const tournamentResult = await tournamentResponse.json();
      
      if (tournamentResult.success) {
        setTournament(tournamentResult.data);
      }

      // Fetch matches
      const matchesResponse = await fetch(`/api/matches?tournamentId=${tournamentId}`);
      const matchesResult = await matchesResponse.json();
      
      if (matchesResult.success) {
        setMatches(matchesResult.data);
      }

      // Fetch player stats
      const statsResponse = await fetch(`/api/player-stats?tournamentId=${tournamentId}`);
      const statsResult = await statsResponse.json();
      
      if (statsResult.success) {
        setPlayerStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredMatches = () => {
    let filtered = matches;

    if (searchTerm) {
      filtered = filtered.filter(match =>
        match.player1Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.player2Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.winnerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(match => match.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(match => match.category === categoryFilter);
    }

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-500/10 border-blue-500/30 text-blue-400', icon: Clock },
      in_progress: { color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', icon: TrendingUp },
      completed: { color: 'bg-green-500/10 border-green-500/30 text-green-400', icon: Trophy },
      walkover: { color: 'bg-gray-500/10 border-gray-500/30 text-gray-400', icon: Users },
      cancelled: { color: 'bg-red-500/10 border-red-500/30 text-red-400', icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getTournamentStats = () => {
    const completedMatches = matches.filter(m => m.status === 'completed');
    const totalDuration = completedMatches.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = completedMatches.length > 0 ? totalDuration / completedMatches.length : 0;
    
    return {
      totalMatches: matches.length,
      completedMatches: completedMatches.length,
      averageDuration: Math.round(averageDuration),
      totalPlayers: new Set(matches.flatMap(m => [m.player1Name, m.player2Name])).size,
    };
  };

  const renderMatchesView = () => {
    const filteredMatches = getFilteredMatches();
    const stats = getTournamentStats();

    return (
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-intense p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Trophy className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-tertiary">Total Matches</p>
                <p className="text-2xl font-bold text-primary">{stats.totalMatches}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-intense p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-tertiary">Completed</p>
                <p className="text-2xl font-bold text-primary">{stats.completedMatches}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-intense p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-tertiary">Avg Duration</p>
                <p className="text-2xl font-bold text-primary">{stats.averageDuration}m</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card-intense p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-tertiary">Players</p>
                <p className="text-2xl font-bold text-primary">{stats.totalPlayers}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Matches List */}
        <div className="glass-card-intense p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-primary">Match History</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredMatches.map((match, index) => (
              <motion.div
                key={match._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-4 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="text-lg font-semibold text-primary group-hover:text-primary/80 transition-colors">
                        {match.round} - Match {index + 1}
                      </h4>
                      {getStatusBadge(match.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-tertiary">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {match.category} {match.ageGroup && `(${match.ageGroup})`}
                      </div>
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-2" />
                        {match.player1Name} vs {match.player2Name}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {match.duration ? `${match.duration} minutes` : 'Duration not recorded'}
                      </div>
                    </div>

                    {match.status === 'completed' && (
                      <div className="mt-3 p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium text-primary">{match.player1Name}:</span>
                            <span className="ml-2 text-tertiary">
                              {match.player1Score.length > 0 ? match.player1Score.join('-') : '0'}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-primary">{match.player2Name}:</span>
                            <span className="ml-2 text-tertiary">
                              {match.player2Score.length > 0 ? match.player2Score.join('-') : '0'}
                            </span>
                          </div>
                        </div>
                        {match.winnerName && (
                          <div className="mt-2 text-center">
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-400">
                              <Trophy className="h-4 w-4" />
                              Winner: {match.winnerName}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStatsView = () => {
    return (
      <div className="space-y-6">
        {/* Player Rankings */}
        <div className="glass-card-intense p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-primary">Player Statistics</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export Stats
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {playerStats.map((stats, index) => (
              <motion.div
                key={stats._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-primary">Player {stats.playerId}</h4>
                        <p className="text-sm text-tertiary">
                          {stats.totalTournaments} tournaments • {stats.totalMatches} matches
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="glass-card p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="h-4 w-4 text-green-400" />
                          <span className="text-tertiary">Win Rate</span>
                        </div>
                        <span className="text-xl font-bold text-primary">{stats.winRate}%</span>
                      </div>
                      
                      <div className="glass-card p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="h-4 w-4 text-yellow-400" />
                          <span className="text-tertiary">Titles</span>
                        </div>
                        <span className="text-xl font-bold text-primary">{stats.titles}</span>
                      </div>
                      
                      <div className="glass-card p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-blue-400" />
                          <span className="text-tertiary">Streak</span>
                        </div>
                        <span className="text-xl font-bold text-primary">{stats.currentStreak}</span>
                      </div>
                      
                      <div className="glass-card p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 className="h-4 w-4 text-purple-400" />
                          <span className="text-tertiary">Points</span>
                        </div>
                        <span className="text-xl font-bold text-primary">{stats.totalPoints}</span>
                      </div>
                    </div>

                    {stats.recentForm.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-tertiary mb-2">Recent Form</p>
                        <div className="flex gap-1">
                          {stats.recentForm.map((result, i) => (
                            <span
                              key={i}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                result === 'W' ? 'bg-green-500/20 text-green-400' :
                                result === 'L' ? 'bg-red-500/20 text-red-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {result}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="relative z-10 min-h-screen p-8 flex items-center justify-center">
        <div className="glass-card-intense p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-tertiary">Loading match history...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="relative z-10 min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">Tournament Not Found</h2>
          <p className="text-tertiary mb-6">The tournament you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/admin/tournaments">Back to Tournaments</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/tournaments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tournaments
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold gradient-title">
              Match History & Statistics
            </h1>
            <p className="text-tertiary">
              {tournament.name} - View match results and player statistics
            </p>
          </div>
        </div>

        {/* Tournament Info */}
        <div className="glass-card-intense p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">{tournament.name}</h2>
              <div className="flex items-center gap-4 text-sm text-tertiary mt-1">
                <span className="flex items-center">
                  <Trophy className="h-4 w-4 mr-1" />
                  {tournament.sport} • {tournament.format}
                </span>
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {tournament.participantCount} participants
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="glass-card-intense p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary">View Mode</h3>
              <p className="text-tertiary text-sm">Switch between match history and player statistics</p>
            </div>
            <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <Button
                onClick={() => setViewMode('matches')}
                variant={viewMode === 'matches' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none bg-transparent hover:bg-white/10"
              >
                <Trophy className="h-4 w-4 mr-1" />
                Matches
              </Button>
              <Button
                onClick={() => setViewMode('stats')}
                variant={viewMode === 'stats' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none bg-transparent hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Statistics
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {viewMode === 'matches' && (
          <div className="glass-card-intense p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search matches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary placeholder:text-tertiary"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                >
                  <option value="all">All Categories</option>
                  <option value="singles">Singles</option>
                  <option value="doubles">Doubles</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'matches' ? renderMatchesView() : renderStatsView()}
    </div>
  );
}

