'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import { 
  Dumbbell,
  Plus,
  Clock,
  MapPin,
  Calendar,
  Filter,
  RefreshCw,
  Trophy,
  Target,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Users,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PracticeMatch {
  _id: string;
  category: string;
  player1Name: string;
  player2Name: string;
  player3Name?: string;
  player4Name?: string;
  player1Phone?: string;
  player2Phone?: string;
  player3Phone?: string;
  player4Phone?: string;
  player1IsGuest: boolean;
  player2IsGuest: boolean;
  player3IsGuest?: boolean;
  player4IsGuest?: boolean;
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
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    matchId: string | null;
    matchName: string;
  }>({
    isOpen: false,
    matchId: null,
    matchName: '',
  });

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

      if (response.ok && data.success) {
        setMatches(data.data);
      } else {
        console.error('Failed to fetch matches:', data.error);
        // Don't show alert for fetch errors as it might be annoying
      }
    } catch (error) {
      console.error('Error fetching practice matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMatch = (matchId: string, matchName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmDialog({
      isOpen: true,
      matchId,
      matchName,
    });
  };

  const confirmDeleteMatch = async () => {
    if (!deleteConfirmDialog.matchId) return;

    try {
      console.log('Deleting match:', deleteConfirmDialog.matchId);
      const response = await fetch(`/api/practice-matches/${deleteConfirmDialog.matchId}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);
      const data = await response.json();
      console.log('Delete response data:', data);

      if (response.ok && data.success) {
        console.log('Match deleted successfully, refreshing list...');
        // Successfully deleted, refresh the matches list
        await fetchMatches();
        // Close the dialog
        setDeleteConfirmDialog({
          isOpen: false,
          matchId: null,
          matchName: '',
        });
      } else {
        console.log('Delete failed:', data.error);
        // Show specific error message from API
        alert(data.error || 'Failed to delete match');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Failed to delete match');
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

  const getCategoryBadge = (category: string) => {
    const colors = {
      singles: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      doubles: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      mixed: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
  };

  const formatPlayers = (match: PracticeMatch) => {
    if (match.category === 'singles') {
      return `${match.player1Name} vs ${match.player2Name}`;
    } else {
      const team1 = match.player3Name ? `${match.player1Name} / ${match.player3Name}` : match.player1Name;
      const team2 = match.player4Name ? `${match.player2Name} / ${match.player4Name}` : match.player2Name;
      return `${team1} vs ${team2}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header - Apple-style clean design */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-l font-semibold text-gray-900 dark:text-white">Practice Matches</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{matches.length} total matches</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCreateDialogOpen(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-500/25"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Match</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Desktop Filters - Apple-style segmented control */}
        <div className={`mb-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Status
                </label>
                <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-full">
                  {['all', 'scheduled', 'in_progress', 'completed'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFilter(status as any);
                      }}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        filter === status
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {status === 'all' ? 'All' : 
                       status === 'scheduled' ? 'Scheduled' :
                       status === 'in_progress' ? 'Live' : 'Completed'}
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
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
                Showing {matches.length} match{matches.length !== 1 ? 'es' : ''}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fetchMatches();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
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
        ) : matches.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-6">
              <Dumbbell className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No practice matches yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
              Get started by creating your first practice match and track your progress
            </p>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCreateDialogOpen(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-500/25"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Practice Match
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => {
              const StatusIcon = getStatusIcon(match.status);
              
              return (
                <Link
                  key={match._id}
                  href={`/admin/practice-matches/${match._id}`}
                  className="block group"
                >
                  <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        {/* Match Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={getCategoryBadge(match.category)}>
                              {match.category}
                            </Badge>
                            <Badge className={getStatusColor(match.status)}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {match.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                              {formatPlayers(match)}
                            </div>
                            
                            {/* Winner Display */}
                            {match.status === 'completed' && match.winnerName && (
                              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                <Trophy className="h-4 w-4" />
                                <span className="font-medium">{match.winnerName} won</span>
                                {match.matchResult && (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    ({match.matchResult.player1GamesWon}-{match.matchResult.player2GamesWon})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Match Details */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(match.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            {match.court && (
                              <div className="flex items-center gap-1.5">
                                <Target className="h-4 w-4" />
                                <span>{match.court}</span>
                              </div>
                            )}
                            {match.venue && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate max-w-[150px]">{match.venue}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <div className="flex items-center gap-2">
                          {match.status !== 'completed' && match.status !== 'cancelled' && (
                            <Button
                              type="button"
                              onClick={(e) => handleDeleteMatch(match._id, formatPlayers(match), e)}
                              variant="outline"
                              size="sm"
                              className="border-gray-300 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

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

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmDialog.isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmDialog({
              isOpen: false,
              matchId: null,
              matchName: '',
            });
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">Delete Practice Match</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the practice match "{deleteConfirmDialog.matchName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeleteConfirmDialog({
                  isOpen: false,
                  matchId: null,
                  matchName: '',
                });
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                confirmDeleteMatch();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    team1Player1: { type: 'registered', userId: '', name: '', phone: '', gender: '', isGuest: false },
    team1Player2: { type: 'registered', userId: '', name: '', phone: '', gender: '', isGuest: false },
    team2Player1: { type: 'registered', userId: '', name: '', phone: '', gender: '', isGuest: false },
    team2Player2: { type: 'registered', userId: '', name: '', phone: '', gender: '', isGuest: false },
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
  const [searchTerms, setSearchTerms] = useState({
    team1Player1: '',
    team1Player2: '',
    team2Player1: '',
    team2Player2: ''
  });

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

  const getFilteredUsers = (searchTerm: string, excludeUserIds: string[] = []) => {
    let filtered = users.filter(user => 
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)) &&
      !excludeUserIds.includes(user._id)
    );

    // For mixed doubles, apply gender filtering
    if (formData.category === 'mixed' && step > 1) {
      const playerKeys = ['team1Player1', 'team1Player2', 'team2Player1', 'team2Player2'];
      const currentKey = playerKeys[step - 2];
      
      // Get genders of selected players
      const selectedGenders = playerKeys
        .filter(key => formData[key as keyof typeof formData] && typeof formData[key as keyof typeof formData] === 'object')
        .map(key => (formData[key as keyof typeof formData] as any).gender)
        .filter(Boolean);
      
      // For team partners, ensure opposite gender
      if (currentKey === 'team1Player2' && formData.team1Player1.gender) {
        filtered = filtered.filter(user => user.gender && user.gender !== formData.team1Player1.gender);
      } else if (currentKey === 'team2Player2' && formData.team2Player1.gender) {
        filtered = filtered.filter(user => user.gender && user.gender !== formData.team2Player1.gender);
      }
    }

    return filtered;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Build the request body based on category
      let body: any = {
        category: formData.category,
        court: formData.court,
        venue: formData.venue,
        notes: formData.notes,
        scoringFormat: formData.scoringFormat,
      };

      if (formData.category === 'singles') {
        body.player1 = formData.team1Player1;
        body.player2 = formData.team2Player1;
      } else {
        // Doubles or Mixed
        body.player1 = formData.team1Player1;
        body.player2 = formData.team2Player1;
        body.player3 = formData.team1Player2;
        body.player4 = formData.team2Player2;
      }

      const response = await fetch('/api/practice-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        return formData.team1Player1.name && formData.team1Player1.phone;
      case 3:
        if (formData.category === 'singles') return true;
        return formData.team1Player2.name && formData.team1Player2.phone;
      case 4:
        return formData.team2Player1.name && formData.team2Player1.phone;
      case 5:
        if (formData.category === 'singles') return true;
        return formData.team2Player2.name && formData.team2Player2.phone;
      case 6:
        return true;
      case 7:
        return true;
      default:
        return false;
    }
  };

  const totalSteps = formData.category === 'singles' ? 5 : 7;

  const renderPlayerSelection = (
    playerKey: 'team1Player1' | 'team1Player2' | 'team2Player1' | 'team2Player2',
    title: string
  ) => {
    const player = formData[playerKey];
    const searchTerm = searchTerms[playerKey];
    const excludeIds = Object.keys(searchTerms)
      .filter(key => key !== playerKey)
      .map(key => formData[key as keyof typeof formData] as any)
      .filter(p => p && p.userId)
      .map(p => p.userId);
    
    const filteredUsers = getFilteredUsers(searchTerm, excludeIds);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFormData({ 
              ...formData, 
              [playerKey]: { ...player, type: 'registered', isGuest: false } 
            })}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              player.type === 'registered'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Registered Player
          </button>
          <button
            onClick={() => setFormData({ 
              ...formData, 
              [playerKey]: { ...player, type: 'guest', isGuest: true, userId: '' } 
            })}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              player.type === 'guest'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Guest Player
          </button>
        </div>

        {player.type === 'registered' ? (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerms({ ...searchTerms, [playerKey]: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No users found
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        [playerKey]: {
                          ...player,
                          userId: user._id,
                          name: user.name,
                          phone: user.phone,
                          gender: user.gender || '',
                        }
                      });
                    }}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      player.userId === user._id
                        ? 'bg-blue-500/10 border-2 border-blue-500'
                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-500/50'
                    }`}
                  >
                    <p className="text-gray-900 dark:text-white font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.phone}</p>
                    {user.gender && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Player Name"
              value={player.name}
              onChange={(e) => setFormData({
                ...formData,
                [playerKey]: { ...player, name: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={player.phone}
              onChange={(e) => setFormData({
                ...formData,
                [playerKey]: { ...player, phone: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {formData.category === 'mixed' && (
              <select
                value={player.gender}
                onChange={(e) => setFormData({
                  ...formData,
                  [playerKey]: { ...player, gender: e.target.value }
                })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Practice Match</h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8 gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i + 1 === step
                    ? 'w-8 bg-gradient-to-r from-blue-600 to-purple-600'
                    : i + 1 < step
                    ? 'w-1.5 bg-blue-600'
                    : 'w-1.5 bg-gray-300 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Category */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Match Type</h3>
              <div className="grid gap-3">
                {[
                  { id: 'singles', label: 'Singles', description: '1 vs 1 match', icon: Users },
                  { id: 'doubles', label: 'Doubles', description: '2 vs 2 match (same gender)', icon: Users },
                  { id: 'mixed', label: 'Mixed Doubles', description: 'Male + Female vs Male + Female', icon: Users }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`p-5 rounded-xl text-left transition-all ${
                      formData.category === cat.id
                        ? 'bg-blue-500/10 border-2 border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <cat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-900 dark:text-white font-semibold">{cat.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{cat.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg mt-6 h-12"
              >
                Next
              </Button>
            </div>
          )}

          {/* Player Selection Steps */}
          {step === 2 && renderPlayerSelection('team1Player1', `Select Team 1 Player ${formData.category === 'singles' ? '' : '1'}`)}
          {step === 3 && formData.category !== 'singles' && renderPlayerSelection('team1Player2', 'Select Team 1 Player 2')}
          {step === (formData.category === 'singles' ? 3 : 4) && renderPlayerSelection('team2Player1', `Select Team 2 Player ${formData.category === 'singles' ? '' : '1'}`)}
          {step === 5 && formData.category !== 'singles' && renderPlayerSelection('team2Player2', 'Select Team 2 Player 2')}

          {/* Scoring Format Step */}
          {step === (formData.category === 'singles' ? 4 : 6) && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scoring Format</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Points per Game</label>
                <div className="grid grid-cols-3 gap-3">
                  {[11, 15, 21].map((points) => (
                    <button
                      key={points}
                      onClick={() => setFormData({
                        ...formData,
                        scoringFormat: { ...formData.scoringFormat, pointsPerGame: points }
                      })}
                      className={`p-4 rounded-xl text-center font-semibold transition-all ${
                        formData.scoringFormat.pointsPerGame === points
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {points}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Games per Match</label>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 3].map((games) => (
                    <button
                      key={games}
                      onClick={() => setFormData({
                        ...formData,
                        scoringFormat: { ...formData.scoringFormat, gamesPerMatch: games }
                      })}
                      className={`p-4 rounded-xl text-center font-semibold transition-all ${
                        formData.scoringFormat.gamesPerMatch === games
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {games === 1 ? 'Single Game' : 'Best of 3'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Win by (Deuce Rule)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map((winBy) => (
                    <button
                      key={winBy}
                      onClick={() => setFormData({
                        ...formData,
                        scoringFormat: { ...formData.scoringFormat, winBy }
                      })}
                      className={`p-4 rounded-xl text-center font-semibold transition-all ${
                        formData.scoringFormat.winBy === winBy
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {winBy === 1 ? 'Win by 1' : 'Win by 2'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {formData.scoringFormat.winBy === 1 
                    ? 'First to reach target points wins' 
                    : 'Must win by 2 points (deuce at 20-20 for 21-point games)'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Match Details Step */}
          {step === (formData.category === 'singles' ? 5 : 7) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Match Details (Optional)</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Court</label>
                <input
                  type="text"
                  placeholder="Court number or name"
                  value={formData.court}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Venue</label>
                <input
                  type="text"
                  placeholder="Venue name"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step > 1 && (
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  // Skip team2Player2 step if category is singles
                  if (step === 4 && formData.category === 'singles') {
                    setStep(3);
                  } else if (step === 3 && formData.category === 'singles') {
                    setStep(2);
                  } else {
                    setStep(step - 1);
                  }
                }}
                variant="outline"
                className="flex-1 border-gray-300 dark:border-gray-700 h-12"
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  if (step === totalSteps) {
                    handleSubmit();
                  } else {
                    // Skip team1Player2 step if category is singles
                    if (step === 2 && formData.category === 'singles') {
                      setStep(3);
                    } else {
                      setStep(step + 1);
                    }
                  }
                }}
                disabled={!canProceed() || isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg h-12"
              >
                {step === totalSteps ? (isLoading ? 'Creating...' : 'Create Match') : 'Next'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
