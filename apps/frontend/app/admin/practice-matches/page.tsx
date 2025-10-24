'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  Dumbbell,
  Plus,
  Clock,
  Users,
  MapPin,
  Calendar,
  Filter,
  RefreshCw,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Trophy,
  Target,
  ChevronRight,
  Settings,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PracticeMatch {
  _id: string;
  category: string;
  player1Name: string;
  player2Name: string;
  player1Phone?: string;
  player2Phone?: string;
  player1IsGuest: boolean;
  player2IsGuest: boolean;
  status: string;
  court?: string;
  venue?: string;
  notes?: string;
  createdAt: string;
  games?: any[];
  winnerId?: string;
  winnerName?: string;
  matchResult?: {
    player1GamesWon: number;
    player2GamesWon: number;
    totalDuration?: number;
    completedAt?: string;
  };
}

export default function PracticeMatchesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<PracticeMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'singles' | 'doubles' | 'mixed'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<PracticeMatch | null>(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [filter, categoryFilter]);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await fetch(`/api/practice-matches?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setMatches(data.data);
      }
    } catch (error) {
      console.error('Error fetching practice matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this practice match?')) return;

    try {
      const response = await fetch(`/api/practice-matches/${matchId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMatches();
      } else {
        alert('Failed to delete match');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Failed to delete match');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
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

  const getCategoryBadge = (category: string) => {
    const colors = {
      singles: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      doubles: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      mixed: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/10 text-gray-400';
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end ">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Match
          </Button>
        </div>
      </div>

      {/* Compact Mobile Filters */}
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-xl p-3 mb-4">
          <div className="space-y-3">
            {/* Compact Filter Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-tertiary" />
                <span className="text-sm font-medium text-primary">Filters</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMatches}
                className="border-white/10 hover:bg-white/5 text-tertiary h-8 px-2"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Compact Status Filter */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-tertiary uppercase tracking-wide">Status</span>
              <div className="grid grid-cols-4 gap-1">
                {['all', 'scheduled', 'in_progress', 'completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as any)}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                      filter === status
                        ? 'bg-primary text-white shadow-lg'
                        : 'glass-card text-tertiary hover:bg-white/5 border border-white/10'
                    }`}
                  >
                    {status === 'all' ? 'All' : 
                     status === 'scheduled' ? 'Scheduled' :
                     status === 'in_progress' ? 'Live' : 'Done'}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Category Filter */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-tertiary uppercase tracking-wide">Type</span>
              <div className="grid grid-cols-4 gap-1">
                {['all', 'singles', 'doubles', 'mixed'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category as any)}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                      categoryFilter === category
                        ? 'bg-primary text-white shadow-lg'
                        : 'glass-card text-tertiary hover:bg-white/5 border border-white/10'
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
        </div>

        {/* Streamlined Matches List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : matches.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Dumbbell className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">No practice matches yet</h3>
            <p className="text-tertiary mb-6">Get started by creating your first practice match</p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Practice Match
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const StatusIcon = getStatusIcon(match.status);
              
              // Debug: Log match data to see what's available
              console.log('Match data:', {
                id: match._id,
                status: match.status,
                winnerName: match.winnerName,
                matchResult: match.matchResult,
                games: match.games
              });
              
              return (
                <Card 
                  key={match._id} 
                  className="glass-card border-white/10 overflow-hidden hover:border-primary/30 transition-all cursor-pointer active:scale-[0.98]"
                  onClick={() => {
                    setSelectedMatch(match);
                    setShowMatchDetails(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <Badge className={getCategoryBadge(match.category)}>
                            {match.category}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-primary truncate">
                              {match.player1Name}
                            </span>
                            <span className="text-xs text-tertiary">vs</span>
                            <span className="text-sm font-medium text-primary truncate">
                              {match.player2Name}
                            </span>
                          </div>
                          
                          {/* Show match result for completed matches */}
                          {match.status === 'completed' && (
                            <div className="flex items-center gap-2 mb-1">
                              <Trophy className="h-3 w-3 text-yellow-500" />
                              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                {match.winnerName ? `${match.winnerName} won` : 'Match completed'}
                              </span>
                              {match.matchResult && (
                                <span className="text-xs text-tertiary">
                                  ({match.matchResult.player1GamesWon}-{match.matchResult.player2GamesWon})
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-tertiary">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(match.createdAt).toLocaleDateString()}</span>
                            {match.court && (
                              <>
                                <span>•</span>
                                <Target className="h-3 w-3" />
                                <span>{match.court}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={getStatusColor(match.status)}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {match.status.replace('_', ' ')}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-tertiary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Improved Match Details Modal */}
      {showMatchDetails && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-md">
          <div className="bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-white/20 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Match Details</h2>
                <button
                  onClick={() => setShowMatchDetails(false)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryBadge(selectedMatch.category)}>
                    {selectedMatch.category}
                  </Badge>
                  <Badge className={getStatusColor(selectedMatch.status)}>
                    {React.createElement(getStatusIcon(selectedMatch.status), { className: "mr-1 h-3 w-3" })}
                    {selectedMatch.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      {selectedMatch.player1IsGuest ? (
                        <UserX className="h-5 w-5 text-blue-400" />
                      ) : (
                        <UserCheck className="h-5 w-5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {selectedMatch.player1Name}
                      </p>
                      {selectedMatch.player1IsGuest && selectedMatch.player1Phone && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Guest • {selectedMatch.player1Phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400">vs</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
                      {selectedMatch.player2IsGuest ? (
                        <UserX className="h-5 w-5 text-pink-400" />
                      ) : (
                        <UserCheck className="h-5 w-5 text-pink-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {selectedMatch.player2Name}
                      </p>
                      {selectedMatch.player2IsGuest && selectedMatch.player2Phone && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Guest • {selectedMatch.player2Phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedMatch.court && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Target className="h-4 w-4" />
                    <span>{selectedMatch.court}</span>
                  </div>
                )}

                {selectedMatch.venue && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{selectedMatch.venue}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedMatch.createdAt).toLocaleDateString()}</span>
                </div>

                {selectedMatch.notes && (
                  <div className="pt-3 border-t border-gray-200 dark:border-white/20">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Notes</p>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedMatch.notes}</p>
                  </div>
                )}

                {selectedMatch.status === 'completed' && (
                  <div className="pt-3 border-t border-gray-200 dark:border-white/20">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span className="text-lg font-bold text-green-700 dark:text-green-300">Match Complete!</span>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          🏆 {selectedMatch.winnerName ? `${selectedMatch.winnerName} Wins!` : 'Match Completed!'} 🏆
                        </p>
                        {selectedMatch.matchResult && (
                          <div className="flex justify-center items-center gap-4 mt-2">
                            <div className="text-center">
                              <div className="text-sm text-gray-600 dark:text-gray-400">{selectedMatch.player1Name}</div>
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedMatch.matchResult.player1GamesWon}
                              </div>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-lg font-bold">-</div>
                            <div className="text-center">
                              <div className="text-sm text-gray-600 dark:text-gray-400">{selectedMatch.player2Name}</div>
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedMatch.matchResult.player2GamesWon}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Match Duration */}
                    {selectedMatch.matchResult?.totalDuration && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <Clock className="h-4 w-4" />
                        <span>Duration: {selectedMatch.matchResult.totalDuration} minutes</span>
                      </div>
                    )}
                    
                    {/* Game Details */}
                    {selectedMatch.games && selectedMatch.games.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Game Results</h4>
                        <div className="space-y-1">
                          {selectedMatch.games.map((game: any, index: number) => (
                            <div key={index} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700/30 rounded-lg p-2">
                              <span className="text-sm text-gray-700 dark:text-gray-300">Game {index + 1}</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {game.player1Score} - {game.player2Score}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {game.winner === 'player1' ? selectedMatch.player1Name : selectedMatch.player2Name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                {selectedMatch.status !== 'completed' && selectedMatch.status !== 'cancelled' && (
                  <Link
                    href={`/admin/practice-matches/${selectedMatch._id}`}
                    className="flex-1"
                  >
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {selectedMatch.status === 'in_progress' ? 'Continue Scoring' : 'Start Scoring'}
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowMatchDetails(false)}
                  className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-3"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Match Dialog */}
      {isCreateDialogOpen && (
        <CreatePracticeMatchDialog
          onClose={() => setIsCreateDialogOpen(false)}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            fetchMatches();
          }}
        />
      )}
    </div>
  );
}

// Create Practice Match Dialog Component
function CreatePracticeMatchDialog({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: 'singles',
    player1: { type: 'registered', userId: '', name: '', phone: '', gender: '', isGuest: false },
    player2: { type: 'registered', userId: '', name: '', phone: '', gender: '', isGuest: false },
    court: '',
    venue: '',
    notes: '',
    scoringFormat: {
      pointsPerGame: 21,
      gamesPerMatch: 3,
      winBy: 2,
      maxPoints: 30,
    },
  });
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Filter users based on category requirements
  const getFilteredUsers = (searchTerm: string, excludeUserId?: string) => {
    let filtered = users.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)
    );

    // Exclude already selected player
    if (excludeUserId) {
      filtered = filtered.filter(user => user._id !== excludeUserId);
    }

    // For mixed doubles, filter by gender
    if (formData.category === 'mixed') {
      const player1Gender = formData.player1.gender;
      if (player1Gender) {
        filtered = filtered.filter(user => user.gender !== player1Gender);
      }
    }

    return filtered;
  };

  const filteredUsers1 = getFilteredUsers(searchTerm1, formData.player2.userId);
  const filteredUsers2 = getFilteredUsers(searchTerm2, formData.player1.userId);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/practice-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create practice match');
      }
    } catch (error) {
      console.error('Error creating practice match:', error);
      alert('Failed to create practice match');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.category;
      case 2:
        return formData.player1.name && formData.player1.phone;
      case 3:
        return formData.player2.name && formData.player2.phone;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-card-intense border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">Create Practice Match</h2>
            <button
              onClick={onClose}
              className="text-tertiary hover:text-primary transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8 gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step
                    ? 'w-8 bg-primary'
                    : s < step
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Category */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary mb-4">Select Match Type</h3>
              <div className="grid gap-3">
                {[
                  { id: 'singles', label: 'Singles', description: '1 vs 1 match' },
                  { id: 'doubles', label: 'Doubles', description: '2 vs 2 match' },
                  { id: 'mixed', label: 'Mixed Doubles', description: 'Male + Female vs Male + Female' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`p-4 rounded-lg text-left transition-all ${
                      formData.category === cat.id
                        ? 'bg-primary/20 border-2 border-primary'
                        : 'glass-card border-2 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <p className="text-primary font-medium">{cat.label}</p>
                    <p className="text-sm text-tertiary">{cat.description}</p>
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="w-full bg-primary hover:bg-primary/90 mt-6"
              >
                Next
              </Button>
            </div>
          )}

          {/* Step 2: Player 1 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary mb-4">
                Select {formData.category === 'singles' ? 'Player 1' : 'Team 1 Player 1'}
              </h3>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setFormData({ ...formData, player1: { ...formData.player1, type: 'registered', isGuest: false } })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.player1.type === 'registered'
                      ? 'bg-primary text-white'
                      : 'glass-card text-tertiary'
                  }`}
                >
                  Registered Player
                </button>
                <button
                  onClick={() => setFormData({ ...formData, player1: { ...formData.player1, type: 'guest', isGuest: true, userId: '' } })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.player1.type === 'guest'
                      ? 'bg-primary text-white'
                      : 'glass-card text-tertiary'
                  }`}
                >
                  Guest Player
                </button>
              </div>

              {formData.player1.type === 'registered' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm1}
                    onChange={(e) => setSearchTerm1(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-primary placeholder-tertiary focus:border-primary focus:outline-none"
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredUsers1.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => setFormData({
                          ...formData,
                          player1: {
                            ...formData.player1,
                            userId: user._id,
                            name: user.name,
                            phone: user.phone,
                            gender: user.gender || '',
                          }
                        })}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          formData.player1.userId === user._id
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'glass-card border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="text-primary font-medium">{user.name}</p>
                        <p className="text-sm text-tertiary">{user.phone}</p>
                        {user.gender && (
                          <p className="text-xs text-tertiary">Gender: {user.gender}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Player Name"
                    value={formData.player1.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      player1: { ...formData.player1, name: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-primary placeholder-tertiary focus:border-primary focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.player1.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      player1: { ...formData.player1, phone: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-primary placeholder-tertiary focus:border-primary focus:outline-none"
                  />
                  {formData.category === 'mixed' && (
                    <select
                      value={formData.player1.gender}
                      onChange={(e) => setFormData({
                        ...formData,
                        player1: { ...formData.player1, gender: e.target.value }
                      })}
                      className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-primary focus:border-primary focus:outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-white/10 hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Player 2 */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary mb-4">
                Select {formData.category === 'singles' ? 'Player 2' : 'Team 1 Player 2'}
              </h3>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setFormData({ ...formData, player2: { ...formData.player2, type: 'registered', isGuest: false } })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.player2.type === 'registered'
                      ? 'bg-primary text-white'
                      : 'glass-card text-tertiary'
                  }`}
                >
                  Registered Player
                </button>
                <button
                  onClick={() => setFormData({ ...formData, player2: { ...formData.player2, type: 'guest', isGuest: true, userId: '' } })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.player2.type === 'guest'
                      ? 'bg-primary text-white'
                      : 'glass-card text-tertiary'
                  }`}
                >
                  Guest Player
                </button>
              </div>

              {formData.player2.type === 'registered' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm2}
                    onChange={(e) => setSearchTerm2(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-primary placeholder-tertiary focus:border-primary focus:outline-none"
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredUsers2.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => setFormData({
                          ...formData,
                          player2: {
                            ...formData.player2,
                            userId: user._id,
                            name: user.name,
                            phone: user.phone,
                            gender: user.gender || '',
                          }
                        })}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          formData.player2.userId === user._id
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'glass-card border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="text-primary font-medium">{user.name}</p>
                        <p className="text-sm text-tertiary">{user.phone}</p>
                        {user.gender && (
                          <p className="text-xs text-tertiary">Gender: {user.gender}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Player Name"
                    value={formData.player2.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      player2: { ...formData.player2, name: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-primary placeholder-tertiary focus:border-primary focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.player2.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      player2: { ...formData.player2, phone: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-primary placeholder-tertiary focus:border-primary focus:outline-none"
                  />
                  {formData.category === 'mixed' && (
                    <select
                      value={formData.player2.gender}
                      onChange={(e) => setFormData({
                        ...formData,
                        player2: { ...formData.player2, gender: e.target.value }
                      })}
                      className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-primary focus:border-primary focus:outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 border-white/10 hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!canProceed()}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Scoring Format */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary mb-4">Scoring Format</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Points per Game</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[11, 15, 21].map((points) => (
                      <button
                        key={points}
                        onClick={() => setFormData({
                          ...formData,
                          scoringFormat: { ...formData.scoringFormat, pointsPerGame: points }
                        })}
                        className={`p-3 rounded-lg text-center font-medium transition-all ${
                          formData.scoringFormat.pointsPerGame === points
                            ? 'bg-primary text-white'
                            : 'glass-card border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {points}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Games per Match</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 3].map((games) => (
                      <button
                        key={games}
                        onClick={() => setFormData({
                          ...formData,
                          scoringFormat: { ...formData.scoringFormat, gamesPerMatch: games }
                        })}
                        className={`p-3 rounded-lg text-center font-medium transition-all ${
                          formData.scoringFormat.gamesPerMatch === games
                            ? 'bg-primary text-white'
                            : 'glass-card border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {games === 1 ? 'Single Game' : 'Best of 3'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Win by (Deuce Rule)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2].map((winBy) => (
                      <button
                        key={winBy}
                        onClick={() => setFormData({
                          ...formData,
                          scoringFormat: { ...formData.scoringFormat, winBy }
                        })}
                        className={`p-3 rounded-lg text-center font-medium transition-all ${
                          formData.scoringFormat.winBy === winBy
                            ? 'bg-primary text-white'
                            : 'glass-card border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {winBy === 1 ? 'Win by 1' : 'Win by 2'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-tertiary mt-1">
                    {formData.scoringFormat.winBy === 1 
                      ? 'First to reach target points wins' 
                      : 'Must win by 2 points (deuce at 20-20 for 21-point games)'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Maximum Points</label>
                  <input
                    type="number"
                    min="20"
                    max="50"
                    value={formData.scoringFormat.maxPoints}
                    onChange={(e) => setFormData({
                      ...formData,
                      scoringFormat: { ...formData.scoringFormat, maxPoints: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-primary focus:border-primary focus:outline-none"
                  />
                  <p className="text-xs text-tertiary mt-1">
                    Maximum points before game ends (prevents infinite deuce)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setStep(3)}
                  variant="outline"
                  className="flex-1 border-white/10 hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(5)}
                  disabled={!canProceed()}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Match Details */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary mb-4">Match Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Court</label>
                  <input
                    type="text"
                    placeholder="Court number or name"
                    value={formData.court}
                    onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-primary placeholder-tertiary focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Venue</label>
                  <input
                    type="text"
                    placeholder="Venue name"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-primary placeholder-tertiary focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Notes (Optional)</label>
                  <textarea
                    placeholder="Any additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-primary placeholder-tertiary focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setStep(4)}
                  variant="outline"
                  className="flex-1 border-white/10 hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? 'Creating...' : 'Create Match'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

