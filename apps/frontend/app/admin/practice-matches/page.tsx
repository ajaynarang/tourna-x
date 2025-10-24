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
    e.preventDefault();
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
                  router.push('/admin/practice-matches/create');
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
                router.push('/admin/practice-matches/create');
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
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
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
