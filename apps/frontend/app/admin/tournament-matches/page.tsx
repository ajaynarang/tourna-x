'use client';

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
  MapPin,
  RefreshCw,
  Search,
  Target,
  Trophy,
  Users,
  XCircle,
  Edit,
  Zap,
  Filter,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
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
  matchNumber: number;
  roundNumber: number;
  roundName: string;
  category: string;
  ageGroup?: string;
  player1Id?: string;
  player1Name: string;
  player2Id?: string;
  player2Name: string;
  player3Id?: string;
  player3Name?: string;
  player4Id?: string;
  player4Name?: string;
  player1Score: number[];
  player2Score: number[];
  games?: Array<{
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    winner?: string;
  }>;
  winnerId?: string;
  winnerName?: string;
  status: string;
  completionType?: 'normal' | 'walkover' | 'forfeit' | 'disqualification' | 'manual' | 'retired';
  completionReason?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  venue?: string;
  court?: string;
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

export default function TournamentMatchesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'matches' | 'stats'>('matches');

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchMatchData();
    }
  }, [selectedTournamentId]);

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tournaments');
      const result = await response.json();
      
      if (result.success && result.data) {
        setTournaments(result.data);
        // Auto-select first tournament if available
        if (result.data.length > 0 && !selectedTournamentId) {
          setSelectedTournamentId(result.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatchData = async () => {
    try {
      setIsLoadingMatches(true);
      
      // Fetch tournament details
      const tournamentResponse = await fetch(`/api/tournaments/${selectedTournamentId}`);
      const tournamentResult = await tournamentResponse.json();
      
      if (tournamentResult.success) {
        setSelectedTournament(tournamentResult.data);
      }

      // Fetch matches
      const matchesResponse = await fetch(`/api/tournaments/${selectedTournamentId}/fixtures`);
      const matchesResult = await matchesResponse.json();
      
      if (matchesResult.success) {
        // Sort by completion date (most recent first)
        const sortedMatches = (matchesResult.data || []).sort((a: Match, b: Match) => {
          if (a.endTime && b.endTime) {
            return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
          }
          return b.matchNumber - a.matchNumber;
        });
        setMatches(sortedMatches);
      }

      // Fetch player stats
      const statsResponse = await fetch(`/api/player-stats?tournamentId=${selectedTournamentId}`);
      const statsResult = await statsResponse.json();
      
      if (statsResult.success) {
        setPlayerStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error fetching match data:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const getFilteredMatches = () => {
    let filtered = matches;

    if (searchTerm) {
      filtered = filtered.filter(match =>
        match.player1Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.player2Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.player3Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.player4Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const getCompletionTypeBadge = (match: Match) => {
    if (match.status !== 'completed' || !match.completionType) return null;

    const badges = {
      normal: { 
        label: 'Won', 
        className: 'bg-green-500/10 text-green-500 border-green-500/30', 
        icon: Trophy 
      },
      walkover: { 
        label: 'W/O', 
        className: 'bg-orange-500/10 text-orange-500 border-orange-500/30', 
        icon: XCircle 
      },
      forfeit: { 
        label: 'Forfeit', 
        className: 'bg-red-500/10 text-red-500 border-red-500/30', 
        icon: XCircle 
      },
      disqualification: { 
        label: 'DQ', 
        className: 'bg-red-600/10 text-red-600 border-red-600/30', 
        icon: XCircle 
      },
      retired: { 
        label: 'Retired', 
        className: 'bg-yellow-600/10 text-yellow-600 border-yellow-600/30', 
        icon: XCircle 
      },
      manual: { 
        label: 'Manual', 
        className: 'bg-blue-500/10 text-blue-500 border-blue-500/30', 
        icon: Edit 
      },
    };

    const badgeConfig = badges[match.completionType as keyof typeof badges];
    if (!badgeConfig) return null;

    const Icon = badgeConfig.icon;

    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${badgeConfig.className}`}>
        <Icon className="h-3 w-3" />
        {badgeConfig.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-500/10 border-blue-500/30 text-blue-400', icon: Clock },
      in_progress: { color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', icon: Zap },
      completed: { color: 'bg-green-500/10 border-green-500/30 text-green-400', icon: CheckCircle },
      cancelled: { color: 'bg-red-500/10 border-red-500/30 text-red-400', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getRoundName = (roundNumber: number, totalRounds: number): string => {
    const roundsFromEnd = totalRounds - roundNumber;
    
    if (roundsFromEnd === 0) return 'Final';
    if (roundsFromEnd === 1) return 'Semi Final';
    if (roundsFromEnd === 2) return 'Quarter Final';
    return `Round ${roundNumber}`;
  };

  const getTournamentStats = () => {
    const completedMatches = matches.filter(m => m.status === 'completed');
    const totalDuration = completedMatches.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = completedMatches.length > 0 ? totalDuration / completedMatches.length : 0;
    
    return {
      totalMatches: matches.length,
      completedMatches: completedMatches.length,
      inProgress: matches.filter(m => m.status === 'in_progress').length,
      scheduled: matches.filter(m => m.status === 'scheduled').length,
      averageDuration: Math.round(averageDuration),
      totalPlayers: new Set(matches.flatMap(m => [m.player1Name, m.player2Name, m.player3Name, m.player4Name].filter(Boolean))).size,
    };
  };

  const renderMatchesView = () => {
    const filteredMatches = getFilteredMatches();
    const stats = getTournamentStats();
    const totalRounds = Math.max(...matches.map(m => m.roundNumber), 0);

    return (
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 lg:p-6 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Trophy className="h-5 w-5 lg:h-6 lg:w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-400">Total</p>
                <p className="text-xl lg:text-2xl font-bold text-white">{stats.totalMatches}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 lg:p-6 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6 text-green-400" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-400">Completed</p>
                <p className="text-xl lg:text-2xl font-bold text-white">{stats.completedMatches}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 lg:p-6 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-400">Avg Time</p>
                <p className="text-xl lg:text-2xl font-bold text-white">{stats.averageDuration}m</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 lg:p-6 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 lg:h-6 lg:w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-400">Players</p>
                <p className="text-xl lg:text-2xl font-bold text-white">{stats.totalPlayers}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Matches List */}
        <div className="space-y-3">
          {filteredMatches.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
              <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No matches found</p>
            </div>
          ) : (
            filteredMatches.map((match, index) => {
              const isDoubles = match.category === 'doubles' || match.category === 'mixed';
              const player1Display = isDoubles && match.player3Name
                ? `${match.player1Name || 'TBD'} & ${match.player3Name}`
                : match.player1Name || 'TBD';
              
              const player2Display = isDoubles && match.player4Name
                ? `${match.player2Name || 'TBD'} & ${match.player4Name}`
                : match.player2Name || 'TBD';
              
              const isPlayer1Winner = match.winnerId && (match.winnerId === match.player1Id || match.winnerId === match.player3Id);
              const isPlayer2Winner = match.winnerId && (match.winnerId === match.player2Id || match.winnerId === match.player4Id);
              
              return (
                <Link
                  key={match._id}
                  href={`/admin/tournament-matches/${match._id}`}
                  className="block group"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 hover:bg-white/[0.07] transition-all cursor-pointer"
                  >
                    {/* Match Header */}
                    <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-white/10 bg-white/[0.02]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 lg:gap-4">
                        <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                          <span className="text-xs lg:text-sm font-semibold text-gray-400">
                            Match #{match.matchNumber}
                          </span>
                          <span className="text-xs lg:text-sm font-medium text-white">
                            {getRoundName(match.roundNumber, totalRounds)}
                          </span>
                          <span className="text-xs lg:text-sm text-gray-400 capitalize">
                            {match.category} {match.ageGroup && `• ${match.ageGroup}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(match.status)}
                          {getCompletionTypeBadge(match)}
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors ml-2" />
                        </div>
                      </div>
                    </div>

                    {/* Match Content */}
                    <div className="p-4 lg:p-6">
                      {/* Players */}
                      <div className="space-y-3 mb-4">
                        {/* Player 1 */}
                        <div className={`flex items-center justify-between p-3 lg:p-4 rounded-xl border ${
                          isPlayer1Winner 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-white/5 border-white/10'
                        }`}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {isPlayer1Winner && <Trophy className="h-4 w-4 lg:h-5 lg:w-5 text-green-400 flex-shrink-0" />}
                            <span className={`text-sm lg:text-base font-medium truncate ${
                              player1Display === 'TBD' 
                                ? 'text-gray-500 italic' 
                                : isPlayer1Winner 
                                  ? 'text-green-400 font-semibold' 
                                  : 'text-white'
                            }`}>
                              {player1Display}
                            </span>
                          </div>
                          {match.status === 'completed' && match.player1Score.length > 0 && (
                            <div className="flex gap-2 ml-3">
                              {match.player1Score.filter(s => s > 0).map((score, i) => (
                                <span 
                                  key={i} 
                                  className={`text-sm lg:text-base font-bold px-2 py-1 rounded ${
                                    isPlayer1Winner ? 'text-green-400' : 'text-gray-400'
                                  }`}
                                >
                                  {score}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">VS</span>
                        </div>

                        {/* Player 2 */}
                        <div className={`flex items-center justify-between p-3 lg:p-4 rounded-xl border ${
                          isPlayer2Winner 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-white/5 border-white/10'
                        }`}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {isPlayer2Winner && <Trophy className="h-4 w-4 lg:h-5 lg:w-5 text-green-400 flex-shrink-0" />}
                            <span className={`text-sm lg:text-base font-medium truncate ${
                              player2Display === 'TBD' 
                                ? 'text-gray-500 italic' 
                                : isPlayer2Winner 
                                  ? 'text-green-400 font-semibold' 
                                  : 'text-white'
                            }`}>
                              {player2Display}
                            </span>
                          </div>
                          {match.status === 'completed' && match.player2Score.length > 0 && (
                            <div className="flex gap-2 ml-3">
                              {match.player2Score.filter(s => s > 0).map((score, i) => (
                                <span 
                                  key={i} 
                                  className={`text-sm lg:text-base font-bold px-2 py-1 rounded ${
                                    isPlayer2Winner ? 'text-green-400' : 'text-gray-400'
                                  }`}
                                >
                                  {score}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Match Details */}
                      {(match.scheduledDate || match.scheduledTime || match.venue || match.court || match.duration) && (
                        <div className="flex flex-wrap gap-3 lg:gap-4 text-xs lg:text-sm text-gray-400 pt-3 border-t border-white/10">
                          {match.scheduledDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                              <span>{new Date(match.scheduledDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {match.scheduledTime && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                              <span>{match.scheduledTime}</span>
                            </div>
                          )}
                          {(match.venue || match.court) && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                              <span>{match.venue || 'Venue'}{match.court && ` • Court ${match.court}`}</span>
                            </div>
                          )}
                          {match.duration && match.status === 'completed' && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                              <span>{match.duration} minutes</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Completion Reason */}
                      {match.completionReason && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-gray-400">
                            <span className="font-medium">Note:</span> {match.completionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderStatsView = () => {
    return (
      <div className="space-y-6">
        {/* Player Rankings */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Player Statistics</h3>
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>

          {playerStats.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No player statistics available yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {playerStats.map((stats, index) => (
                <motion.div
                  key={stats._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-white">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Player {stats.playerId}</h4>
                      <p className="text-sm text-gray-400">
                        {stats.totalTournaments} tournaments • {stats.totalMatches} matches
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="h-4 w-4 text-green-400" />
                        <span className="text-xs text-gray-400">Win Rate</span>
                      </div>
                      <span className="text-xl font-bold text-white">{stats.winRate}%</span>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="h-4 w-4 text-yellow-400" />
                        <span className="text-xs text-gray-400">Titles</span>
                      </div>
                      <span className="text-xl font-bold text-white">{stats.titles}</span>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-gray-400">Streak</span>
                      </div>
                      <span className="text-xl font-bold text-white">{stats.currentStreak}</span>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-gray-400">Points</span>
                      </div>
                      <span className="text-xl font-bold text-white">{stats.totalPoints}</span>
                    </div>
                  </div>

                  {stats.recentForm && stats.recentForm.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-2">Recent Form</p>
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
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="relative z-10 min-h-screen p-4 lg:p-8 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="relative z-10 min-h-screen p-4 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Tournaments Found</h2>
          <p className="text-gray-400 mb-6">Create a tournament to view match history.</p>
          <Button asChild>
            <Link href="/admin/tournaments">Go to Tournaments</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 lg:mb-8">
          {/* Tournament Selector */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 lg:p-6 mb-6 border border-white/10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Filter className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-1">Select Tournament</label>
                  <p className="text-xs text-gray-400">Choose a tournament to view its matches</p>
                </div>
              </div>
              
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-white text-sm lg:text-base"
              >
                {tournaments.map((tournament) => (
                  <option key={tournament._id} value={tournament._id} className="bg-gray-900">
                    {tournament.name} ({tournament.sport} • {tournament.format})
                  </option>
                ))}
              </select>
              
              <Button 
                onClick={fetchMatchData} 
                variant="outline" 
                size="sm" 
                className="bg-white/5 border-white/10 hover:bg-white/10 w-full lg:w-auto"
                disabled={isLoadingMatches}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMatches ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Tournament Info Card */}
          {selectedTournament && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 lg:p-6 mb-6 border border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-6 text-xs lg:text-sm text-gray-400 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{selectedTournament.participantCount} participants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(selectedTournament.startDate).toLocaleDateString()} - {new Date(selectedTournament.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl w-full sm:w-auto mb-6">
            <button
              onClick={() => setViewMode('matches')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'matches' 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Matches</span>
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'stats' 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Statistics</span>
            </button>
          </div>

          {/* Filters */}
          {viewMode === 'matches' && selectedTournamentId && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 lg:p-6 mb-6 border border-white/10">
              <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 lg:pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-white placeholder:text-gray-500 text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 lg:flex-none px-3 lg:px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-white text-sm"
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
                    className="flex-1 lg:flex-none px-3 lg:px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-white text-sm"
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
        {isLoadingMatches ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : selectedTournamentId ? (
          viewMode === 'matches' ? renderMatchesView() : renderStatsView()
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
            <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Select a tournament to view matches</p>
          </div>
        )}
      </div>
    </div>
  );
}

