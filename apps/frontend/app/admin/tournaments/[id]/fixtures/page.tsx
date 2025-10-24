'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  ArrowLeft,
  Play,
  Settings,
  Trophy,
  Users,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  format: string;
  status: string;
  participantCount: number;
  maxParticipants: number;
}

interface Match {
  _id: string;
  tournamentId: string;
  category: string;
  ageGroup?: string;
  round: string;
  roundNumber: number;
  matchNumber: number;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1Score: number[];
  player2Score: number[];
  winnerId?: string;
  winnerName?: string;
  status: string;
  court?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  startTime?: string;
  endTime?: string;
}

export default function FixtureManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [tournamentId, setTournamentId] = useState<string>('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'bracket' | 'list'>('bracket');

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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFixtures = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/fixtures/generate`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        fetchData(); // Refresh the data
      }
    } catch (error) {
      console.error('Error generating fixtures:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-500/10 border-blue-500/30 text-blue-400', icon: Clock },
      in_progress: { color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', icon: Play },
      completed: { color: 'bg-green-500/10 border-green-500/30 text-green-400', icon: CheckCircle },
      walkover: { color: 'bg-gray-500/10 border-gray-500/30 text-gray-400', icon: AlertCircle },
      cancelled: { color: 'bg-red-500/10 border-red-500/30 text-red-400', icon: AlertCircle },
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

  const getFilteredMatches = () => {
    let filtered = matches;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(match => match.category === selectedCategory);
    }

    if (selectedRound !== 'all') {
      filtered = filtered.filter(match => match.round === selectedRound);
    }

    return filtered;
  };

  const getRounds = () => {
    const rounds = [...new Set(matches.map(match => match.round))];
    return rounds.sort((a, b) => {
      const roundOrder = ['Final', 'Semi Final', 'Quarter Final'];
      const aIndex = roundOrder.findIndex(r => a.includes(r));
      const bIndex = roundOrder.findIndex(r => b.includes(r));
      return aIndex - bIndex;
    });
  };

  const getCategories = () => {
    return [...new Set(matches.map(match => match.category))];
  };

  const renderBracketView = () => {
    const rounds = getRounds();
    const filteredMatches = getFilteredMatches();

    return (
      <div className="space-y-8">
        {rounds.map((round, roundIndex) => {
          const roundMatches = filteredMatches.filter(match => match.round === round);
          
          return (
            <motion.div
              key={round}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: roundIndex * 0.1 }}
              className="glass-card-intense p-6"
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-primary mb-2">{round}</h3>
                <div className="flex items-center gap-4 text-sm text-tertiary">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {roundMatches.length} matches
                  </span>
                  <span className="flex items-center">
                    <Trophy className="h-4 w-4 mr-1" />
                    {roundMatches.filter(m => m.status === 'completed').length} completed
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roundMatches.map((match) => (
                  <motion.div
                    key={match._id}
                    whileHover={{ scale: 1.02 }}
                    className="glass-card p-4 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-tertiary">Match {match.matchNumber}</span>
                      {getStatusBadge(match.status)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${match.winnerId === match.player1Id ? 'text-green-400' : 'text-primary'}`}>
                          {match.player1Name}
                        </span>
                        <span className="text-sm text-tertiary">
                          {match.player1Score.length > 0 ? match.player1Score.join('-') : '0'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${match.winnerId === match.player2Id ? 'text-green-400' : 'text-primary'}`}>
                          {match.player2Name}
                        </span>
                        <span className="text-sm text-tertiary">
                          {match.player2Score.length > 0 ? match.player2Score.join('-') : '0'}
                        </span>
                      </div>
                    </div>

                    {match.scheduledTime && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between text-xs text-tertiary">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {match.scheduledTime}
                          </span>
                          {match.court && (
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              Court {match.court}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-white/5 border-white/10 hover:bg-white/10"
                      >
                        <Link href={`/admin/scoring/${match._id}`}>
                          <Play className="h-3 w-3 mr-1" />
                          Score
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/5 border-white/10 hover:bg-white/10"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    const filteredMatches = getFilteredMatches();

    return (
      <div className="space-y-4">
        {filteredMatches.map((match) => (
          <motion.div
            key={match._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card-intense p-6 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-lg font-semibold text-primary group-hover:text-primary/80 transition-colors">
                    {match.round} - Match {match.matchNumber}
                  </h3>
                  {getStatusBadge(match.status)}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-tertiary">
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
                    {match.scheduledTime || 'Not scheduled'}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {match.court ? `Court ${match.court}` : 'No court'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <Link href={`/admin/scoring/${match._id}`}>
                    <Play className="h-4 w-4 mr-1" />
                    Score
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="relative z-10 min-h-screen p-8 flex items-center justify-center">
        <div className="glass-card-intense p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-tertiary">Loading fixtures...</p>
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
              Fixture Management
            </h1>
            <p className="text-tertiary">
              {tournament.name} - Manage matches and brackets
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
                  {tournament.participantCount}/{tournament.maxParticipants} participants
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {matches.length} matches
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {matches.length === 0 ? (
                <Button
                  onClick={generateFixtures}
                  disabled={isGenerating}
                  className="bg-primary hover:bg-primary/80"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Fixtures
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        {matches.length > 0 && (
          <div className="glass-card-intense p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                >
                  <option value="all">All Categories</option>
                  {getCategories().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                >
                  <option value="all">All Rounds</option>
                  {getRounds().map(round => (
                    <option key={round} value={round}>{round}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <Button
                  onClick={() => setViewMode('bracket')}
                  variant={viewMode === 'bracket' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-r-none bg-transparent hover:bg-white/10"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none bg-transparent hover:bg-white/10"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixtures */}
      {matches.length === 0 ? (
        <div className="glass-card-intense p-12 text-center">
          <Trophy className="h-16 w-16 text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No Fixtures Generated</h3>
          <p className="text-tertiary mb-6">
            Generate fixtures to create the tournament bracket and schedule matches.
          </p>
          <Button
            onClick={generateFixtures}
            disabled={isGenerating}
            className="bg-primary hover:bg-primary/80"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Fixtures...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Fixtures
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-tertiary">
              Showing {getFilteredMatches().length} of {matches.length} matches
            </p>
          </div>
          
          {viewMode === 'bracket' ? renderBracketView() : renderListView()}
        </>
      )}
    </div>
  );
}
