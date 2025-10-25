'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import LiveScoring from '@/components/live-scoring';
import { TournamentBracket } from '@/components/tournament-bracket';
import { Match as BaseMatch } from '@repo/schemas';
import { MatchScore } from '@/lib/scoring-utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Trophy,
  MapPin,
  Edit,
  CheckCircle,
  XCircle,
  Play,
  Loader2,
  Target,
  LayoutGrid,
  List,
  GitBranch,
  CalendarDays,
  Filter,
  Search,
  Download,
  RefreshCw,
  Zap,
  Printer,
  ExternalLink,
  Shuffle,
} from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@repo/ui';
import { useToast } from '@/hooks/use-toast';

interface PointHistory {
  player: string;
  reason: string | null;
  scoreA: number;
  scoreB: number;
  timestamp: Date;
}

interface Player {
  name: string;
  score: number;
  id: string;
}

// Extended Match interface with new scoring fields
interface Match extends Omit<BaseMatch, 'games'> {
  games: Array<{
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    winner?: 'player1' | 'player2';
    duration?: number;
    completedAt?: Date;
    pointHistory?: Array<{
      player: 'player1' | 'player2';
      reason: string;
      scoreAfter: { player1: number; player2: number; };
    }>;
  }>;
  matchResult?: {
    player1GamesWon: number;
    player2GamesWon: number;
    totalDuration?: number;
    completedAt?: Date;
  };
}

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  format: string;
  venue: string;
  categories: string[];
  ageGroups?: Array<{ name: string; minAge?: number; maxAge?: number }>;
}

type ViewMode = 'bracket' | 'schedule' | 'list';

export default function TournamentFixturesPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <TournamentFixturesContent params={params} />
    </AuthGuard>
  );
}

function TournamentFixturesContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [tournamentId, setTournamentId] = useState<string>('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [showDeclareWinnerModal, setShowDeclareWinnerModal] = useState(false);
  const [showScoringFormatModal, setShowScoringFormatModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    venue: '',
  });
  const [declareWinnerData, setDeclareWinnerData] = useState({
    winnerId: '',
    reason: 'walkover',
    player1Score: '',
    player2Score: '',
  });
  const [scoringFormat, setScoringFormat] = useState({
    pointsPerGame: 21,
    gamesPerMatch: 3,
    winBy: 2,
    maxPoints: 30,
  });

  useEffect(() => {
    params.then(({ id }) => {
      setTournamentId(id);
      fetchData(id);
    });
  }, [params]);

  const fetchData = async (id: string) => {
    try {
      setIsLoading(true);

      // Fetch tournament
      const tournamentRes = await fetch(`/api/tournaments/${id}`);
      const tournamentData = await tournamentRes.json();
      if (tournamentData.success) {
        setTournament(tournamentData.data);
      }

      // Fetch matches
      const matchesRes = await fetch(`/api/matches?tournamentId=${id}`);
      const matchesData = await matchesRes.json();
      if (matchesData.success && Array.isArray(matchesData.data)) {
        setMatches(matchesData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load fixtures data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString().split('T')[0] || '';
    return '';
  };

  const handleScheduleMatch = (match: Match) => {
    setSelectedMatch(match);
    setScheduleData({
      date: formatDate(match.scheduledDate),
      time: match.scheduledTime || '',
      venue: match.venue || tournament?.venue || '',
    });
    setShowScheduleModal(true);
  };

  const handleScoreMatch = (match: Match) => {
    setSelectedMatch(match);
    // Show format configuration first
    setShowScoringFormatModal(true);
  };

  const handleStartScoring = () => {
    setShowScoringFormatModal(false);
    setShowScoringModal(true);
  };

  const handleDeclareWinner = (match: Match) => {
    setSelectedMatch(match);
    
    // If match is already completed, pre-fill the data for editing
    if (match.status === 'completed') {
      const completionType = (match as any).completionType || ((match as any).isWalkover ? 'walkover' : 'manual');
      
      // Only pre-fill scores if they were manually entered or from live scoring (normal)
      // Don't pre-fill default walkover scores [21,0,0] or [0,0,0]
      const hasRealScores = completionType === 'normal' || completionType === 'manual';
      const shouldShowScores = hasRealScores && match.player1Score && match.player1Score.length > 0;
      
      setDeclareWinnerData({
        winnerId: match.winnerId?.toString() || '',
        reason: completionType,
        player1Score: shouldShowScores ? match.player1Score.join(',') : '',
        player2Score: shouldShowScores && match.player2Score && match.player2Score.length > 0 ? match.player2Score.join(',') : '',
      });
    } else {
      // New declaration
      setDeclareWinnerData({
        winnerId: '',
        reason: 'walkover',
        player1Score: '',
        player2Score: '',
      });
    }
    
    setShowDeclareWinnerModal(true);
  };

  const handleSaveDeclareWinner = async () => {
    if (!selectedMatch || !declareWinnerData.winnerId) {
      toast({
        title: "Error",
        description: "Please select a winner",
        variant: "destructive",
      });
      return;
    }

    try {
      // Parse scores if provided
      let player1Score: number[] = [];
      let player2Score: number[] = [];
      
      if (declareWinnerData.player1Score && declareWinnerData.player2Score) {
        player1Score = declareWinnerData.player1Score.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        player2Score = declareWinnerData.player2Score.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      }

      const response = await fetch(`/api/matches/${selectedMatch._id}/declare-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: declareWinnerData.winnerId,
          reason: declareWinnerData.reason,
          player1Score: player1Score.length > 0 ? player1Score : undefined,
          player2Score: player2Score.length > 0 ? player2Score : undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: selectedMatch.status === 'completed' ? "Result Updated" : "Winner Declared",
          description: data.message,
        });
        setShowDeclareWinnerModal(false);
        setSelectedMatch(null);
        
        // Refresh fixture data
        await fetchData(tournamentId);
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to declare winner',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error declaring winner:', error);
      toast({
        title: "Error",
        description: "Failed to declare winner",
        variant: "destructive",
      });
    }
  };

  const handleScoreUpdate = (updatedMatch: Match) => {
    setMatches(prevMatches => 
      prevMatches.map(m => m._id === updatedMatch._id ? updatedMatch : m)
    );
  };

  const handleLiveScoreUpdate = (matchScore: MatchScore, history: PointHistory[]) => {
    if (!selectedMatch) return;
    
    const updatedMatch: Match = {
      ...selectedMatch,
      player1Score: [matchScore.games[matchScore.currentGame - 1]?.player1Score || 0],
      player2Score: [matchScore.games[matchScore.currentGame - 1]?.player2Score || 0],
      status: matchScore.isMatchComplete ? 'completed' : 'in_progress'
    };
    
    handleScoreUpdate(updatedMatch);
  };

  const handleMatchComplete = async (winner: Player, finalScore: MatchScore) => {
    if (!selectedMatch) return;
    
    const updatedMatch: Match = {
      ...selectedMatch,
      player1Score: [finalScore.player1GamesWon],
      player2Score: [finalScore.player2GamesWon],
      status: 'completed',
      winnerId: winner.id === selectedMatch.player1Id ? selectedMatch.player1Id : selectedMatch.player2Id
    };
    
    handleScoreUpdate(updatedMatch);
    setShowScoringModal(false);
    setSelectedMatch(null);
    
    toast({
      title: "Match Completed!",
      description: `${winner.name} wins the match. Winner has been progressed to next round.`,
    });
    
    // Refresh fixture data to show updated next round matches
    await fetchData(tournamentId);
  };

  const handleSaveSchedule = async () => {
    if (!selectedMatch) return;

    try {
      const response = await fetch(`/api/matches/${selectedMatch._id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });

      const data = await response.json();
      if (data.success) {
        setShowScheduleModal(false);
        setSelectedMatch(null);
        fetchData(tournamentId);
        toast({
          title: "Match Scheduled",
          description: "Match has been scheduled successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to schedule match',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error scheduling match:', error);
      toast({
        title: "Error",
        description: "Failed to schedule match",
        variant: "destructive",
      });
    }
  };

  const handleSyncFixtures = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/fixtures/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Fixtures Re-synced",
          description: data.message || `Successfully updated ${data.data?.updated || 0} matches`,
        });
        // Refresh fixture data
        await fetchData(tournamentId);
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to sync fixtures',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error syncing fixtures:', error);
      toast({
        title: "Error",
        description: "Failed to sync fixtures",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter matches based on category, age group, and search
  const filteredMatches = matches.filter(match => {
    const categoryMatch = selectedCategory === 'all' || match.category === selectedCategory;
    const ageGroupMatch = selectedAgeGroup === 'all' || match.ageGroup === selectedAgeGroup;
    const searchMatch = searchQuery === '' || 
      match.player1Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.player2Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.player3Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.player4Name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return categoryMatch && ageGroupMatch && searchMatch;
  });

  // Group matches by category for bracket view
  const matchesByCategory = filteredMatches.reduce((acc, match) => {
    const key = `${match.category}${match.ageGroup ? `-${match.ageGroup}` : ''}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // Get unique categories and age groups
  const categories = ['all', ...new Set(matches.map(m => m.category).filter(Boolean))];
  const ageGroups = ['all', ...new Set(matches.map(m => m.ageGroup).filter(Boolean))];

  // Group matches by round
  const matchesByRound = filteredMatches.reduce((acc, match) => {
    const key = match.round || 'Unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const rounds = Object.keys(matchesByRound).sort((a, b) => {
    const roundOrder: Record<string, number> = {
      'Group Stage': 1,
      'Round of 64': 2,
      'Round of 32': 3,
      'Round of 16': 4,
      'Quarter Final': 5,
      'Semi Final': 6,
      'Final': 7,
    };
    return (roundOrder[a] || 0) - (roundOrder[b] || 0);
  });

  // Statistics
  const stats = {
    total: filteredMatches.length,
    completed: filteredMatches.filter(m => m.status === 'completed').length,
    ongoing: filteredMatches.filter(m => m.status === 'in_progress').length,
    scheduled: filteredMatches.filter(m => m.status === 'scheduled').length,
    pending: filteredMatches.filter(m => m.status !== 'completed' && m.status !== 'in_progress' && m.status !== 'scheduled').length,
  };

  if (isLoading) {
        return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <>
 <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin/fixtures"
            className="text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Fixtures
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h1 className="text-primary mb-2 text-3xl font-bold">{tournament?.name}</h1>
              <p className="text-muted-foreground mb-4">Fixture Management</p>
              
              {/* Stats Bar */}
              <div className="flex flex-wrap gap-3">
                <div className="glass-card rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="font-semibold text-primary">{stats.total}</span>
                  </div>
                </div>
                <div className="glass-card rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-muted-foreground">Completed:</span>
                    <span className="font-semibold text-green-400">{stats.completed}</span>
                  </div>
                </div>
                <div className="glass-card rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-muted-foreground">Ongoing:</span>
                    <span className="font-semibold text-blue-400">{stats.ongoing}</span>
                  </div>
                </div>
                <div className="glass-card rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-muted-foreground">Scheduled:</span>
                    <span className="font-semibold text-yellow-400">{stats.scheduled}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => fetchData(tournamentId)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleSyncFixtures}
                className="gap-2 border-blue-600/50 text-blue-600 hover:bg-blue-600/10"
                title="Re-sync all fixtures - progress winners to next rounds"
              >
                <Shuffle className="h-4 w-4" />
                Re-sync Fixtures
              </Button>
              <Link href={`/admin/scoring/${tournamentId}`}>
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                  <Zap className="h-4 w-4" />
                  Live Scoring
                </Button>
            </Link>
            </div>
          </div>
        </motion.div>

        {/* View Mode Selector & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 glass-card-intense rounded-xl p-4"
        >
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full lg:w-auto">
              <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                <TabsTrigger value="list" className="gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Schedule</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2">
               {/* Printable Bracket Button */}
               {tournament?.format === 'knockout' && matches.length > 0 && (
                <Button
                  onClick={() => {
                    window.open(`/tournaments/${tournamentId}/bracket-print`, '_blank');
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-2 "
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Print Bracket View</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}

              {/* Refresh Button */}
              <Button
                onClick={() => fetchData(tournamentId)}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

             
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 lg:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-card w-full rounded-lg py-2 pl-10 pr-4 text-sm text-primary outline-none transition-all focus:ring-2 focus:ring-green-500/50 lg:w-64"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="glass-card rounded-lg px-4 py-2 text-sm text-primary outline-none transition-all focus:ring-2 focus:ring-green-500/50"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-gray-900">
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>

              {/* Age Group Filter */}
              {ageGroups.length > 1 && (
                <select
                  value={selectedAgeGroup}
                  onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  className="glass-card rounded-lg px-4 py-2 text-sm text-primary outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                >
                  {ageGroups.map(age => (
                    <option key={age} value={age} className="bg-gray-900">
                      {age === 'all' ? 'All Age Groups' : age}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content based on view mode */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' && (
            <ListView
              rounds={rounds}
              matchesByRound={matchesByRound}
              onSchedule={handleScheduleMatch}
              onScore={handleScoreMatch}
              onDeclareWinner={handleDeclareWinner}
            />
          )}
          
          {viewMode === 'bracket' && tournament?.format === 'knockout' && (
            <BracketView
              matches={filteredMatches}
              onSchedule={handleScheduleMatch}
              onScore={handleScoreMatch}
            />
          )}
          
          {viewMode === 'schedule' && (
            <ScheduleView
              matches={filteredMatches}
              onSchedule={handleScheduleMatch}
              onScore={handleScoreMatch}
            />
          )}
        </AnimatePresence>

        {filteredMatches.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-12 text-center"
          >
            <Trophy className="text-muted-foreground mx-auto h-16 w-16" />
            <p className="text-muted-foreground mt-4">
              {searchQuery || selectedCategory !== 'all' || selectedAgeGroup !== 'all' 
                ? 'No matches found with current filters'
                : 'No fixtures generated yet'}
            </p>
          </motion.div>
        )}
      </div>
    </div>

     {/* Schedule Modal */}
     <AlertDialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <AlertDialogContent 
          className="w-[500px] max-w-[90vw]" 
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule Match</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mt-2 space-y-1">
                <p className="font-medium text-primary">
                  {getPlayerDisplay(selectedMatch, 'player1')} 
                  <span className="text-muted-foreground mx-2">vs</span>
                  {getPlayerDisplay(selectedMatch, 'player2')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedMatch?.category && `${selectedMatch.category.charAt(0).toUpperCase() + selectedMatch.category.slice(1)}`}
                  {selectedMatch?.ageGroup && ` • ${selectedMatch.ageGroup}`}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-primary mb-2 block text-sm font-medium">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={scheduleData.date}
                onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-colors focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            <div>
              <label className="text-primary mb-2 block text-sm font-medium">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={scheduleData.time}
                onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-colors focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            <div>
              <label className="text-primary mb-2 block text-sm font-medium">Venue</label>
              <input
                type="text"
                value={scheduleData.venue}
                onChange={(e) => setScheduleData({ ...scheduleData, venue: e.target.value })}
                className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-colors focus:ring-2 focus:ring-green-500/50"
                placeholder="Enter venue"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveSchedule}
              disabled={!scheduleData.date || !scheduleData.time}
            >
              Save Schedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Scoring Modal */}
      {showScoringModal && selectedMatch && (
        <LiveScoring 
          matchId={selectedMatch._id || ''} 
          playerA={{
            name: getPlayerDisplay(selectedMatch, 'player1'),
            score: selectedMatch.player1Score?.[0] || 0,
            id: selectedMatch.player1Id || ''
          }}
          playerB={{
            name: getPlayerDisplay(selectedMatch, 'player2'),
            score: selectedMatch.player2Score?.[0] || 0,
            id: selectedMatch.player2Id || ''
          }}
          scoringFormat={scoringFormat}
          onScoreUpdate={handleLiveScoreUpdate}
          onMatchComplete={handleMatchComplete}
          onViewDetails={() => {
            setShowScoringModal(false);
            setSelectedMatch(null);
          }}
        />
      )}

      {/* Scoring Format Configuration Modal */}
      <Dialog open={showScoringFormatModal} onOpenChange={setShowScoringFormatModal}>
        <DialogContent 
          className="w-[600px] max-w-[90vw] bg-background/95 backdrop-blur-xl border-white/10" 
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              Configure Match Format
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Set the scoring format for this match before starting
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-6 py-4">
              {/* Match Info */}
              <div className="glass-card-intense rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Match #{selectedMatch.matchNumber} • {selectedMatch.category}
                  {selectedMatch.ageGroup && ` • ${selectedMatch.ageGroup}`}
                </div>
                <div className="flex items-center justify-center gap-4 text-lg font-semibold">
                  <span className="text-primary">
                    {getPlayerDisplay(selectedMatch, 'player1')}
                  </span>
                  <span className="text-muted-foreground">VS</span>
                  <span className="text-primary">
                    {getPlayerDisplay(selectedMatch, 'player2')}
                  </span>
                </div>
              </div>

              {/* Points Per Game */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-primary">
                  Points Per Game
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[11, 15, 21].map((points) => (
                    <button
                      key={points}
                      type="button"
                      onClick={() => setScoringFormat({ ...scoringFormat, pointsPerGame: points })}
                      className={`p-3 rounded-lg text-center font-semibold transition-colors ${
                        scoringFormat.pointsPerGame === points
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-white/5 border border-white/10 text-primary hover:bg-white/10'
                      }`}
                    >
                      {points}
                    </button>
                  ))}
                </div>
              </div>

              {/* Games Per Match */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-primary">
                  Games Per Match
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 3].map((games) => (
                    <button
                      key={games}
                      type="button"
                      onClick={() => setScoringFormat({ ...scoringFormat, gamesPerMatch: games })}
                      className={`p-3 rounded-lg text-center font-semibold transition-colors ${
                        scoringFormat.gamesPerMatch === games
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-white/5 border border-white/10 text-primary hover:bg-white/10'
                      }`}
                    >
                      {games === 1 ? 'Single Game' : 'Best of 3'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Win By */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-primary">
                  Win By
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map((winBy) => (
                    <button
                      key={winBy}
                      type="button"
                      onClick={() => setScoringFormat({ ...scoringFormat, winBy })}
                      className={`p-3 rounded-lg text-center font-semibold transition-colors ${
                        scoringFormat.winBy === winBy
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-white/5 border border-white/10 text-primary hover:bg-white/10'
                      }`}
                    >
                      {winBy === 1 ? 'Win by 1' : 'Win by 2'}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {scoringFormat.winBy === 1 
                    ? 'First to reach target points wins' 
                    : 'Must win by 2 points (deuce at 20-20 for 21-point games)'
                  }
                </p>
              </div>

              {/* Max Points */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-primary">
                  Maximum Points (for deuce situations)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[25, 30, 35].map((maxPoints) => (
                    <button
                      key={maxPoints}
                      type="button"
                      onClick={() => setScoringFormat({ ...scoringFormat, maxPoints })}
                      className={`p-3 rounded-lg text-center font-semibold transition-colors ${
                        scoringFormat.maxPoints === maxPoints
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-white/5 border border-white/10 text-primary hover:bg-white/10'
                      }`}
                    >
                      {maxPoints}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowScoringFormatModal(false);
                setSelectedMatch(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartScoring}
              className="bg-green-600 hover:bg-green-700"
            >
              <Target className="mr-2 h-4 w-4" />
              Start Scoring
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Declare Winner Modal */}
      <Dialog open={showDeclareWinnerModal} onOpenChange={setShowDeclareWinnerModal}>
        <DialogContent 
          className="w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-white/10" 
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {selectedMatch?.status === 'completed' ? 'Edit Match Result' : 'Declare Match Winner'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedMatch?.status === 'completed' 
                ? 'Update the match result. Changes will update the fixture automatically.'
                : 'Manually declare the winner for this match. Optionally record scores if available.'}
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-6 py-4">
              {/* Match Info */}
              <div className="glass-card-intense rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Match #{selectedMatch.matchNumber} • {selectedMatch.category}
                  {selectedMatch.ageGroup && ` • ${selectedMatch.ageGroup}`}
                </div>
                <div className="flex items-center justify-center gap-4 text-lg font-semibold">
                  <span className="text-primary">
                    {getPlayerDisplay(selectedMatch, 'player1')}
                  </span>
                  <span className="text-muted-foreground">VS</span>
                  <span className="text-primary">
                    {getPlayerDisplay(selectedMatch, 'player2')}
                  </span>
                </div>
              </div>

              {/* Winner Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-primary">
                  Select Winner *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeclareWinnerData(prev => ({ ...prev, winnerId: selectedMatch.player1Id?.toString() || '' }))}
                    className={`h-auto min-h-[100px] py-4 px-4 flex flex-col items-center justify-center gap-2 rounded-lg border-2 transition-colors ${
                      declareWinnerData.winnerId === selectedMatch.player1Id?.toString()
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white/5 border-white/10 text-primary hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <Trophy className="h-5 w-5" />
                    <div className="text-sm font-medium text-center">
                      {getPlayerDisplay(selectedMatch, 'player1')}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclareWinnerData(prev => ({ ...prev, winnerId: selectedMatch.player2Id?.toString() || '' }))}
                    className={`h-auto min-h-[100px] py-4 px-4 flex flex-col items-center justify-center gap-2 rounded-lg border-2 transition-colors ${
                      declareWinnerData.winnerId === selectedMatch.player2Id?.toString()
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white/5 border-white/10 text-primary hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <Trophy className="h-5 w-5" />
                    <div className="text-sm font-medium text-center">
                      {getPlayerDisplay(selectedMatch, 'player2')}
                    </div>
                  </button>
                </div>
              </div>

              {/* Reason Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-primary">
                  Reason *
                </label>
                <select
                  value={declareWinnerData.reason}
                  onChange={(e) => setDeclareWinnerData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-primary focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="walkover">Walkover (W/O)</option>
                  <option value="forfeit">Forfeit</option>
                  <option value="retired">Retired (Injury)</option>
                  <option value="disqualification">Disqualification</option>
                  <option value="manual">Manual Entry (with scores)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {declareWinnerData.reason === 'walkover' && 'Player did not show up'}
                  {declareWinnerData.reason === 'forfeit' && 'Player gave up during match'}
                  {declareWinnerData.reason === 'retired' && 'Player retired due to injury'}
                  {declareWinnerData.reason === 'disqualification' && 'Player was disqualified'}
                  {declareWinnerData.reason === 'manual' && 'Record the actual scores manually'}
                </p>
              </div>

              {/* Optional Scores */}
              <div className="space-y-3 glass-card-intense rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-primary">
                    Record Scores (Optional)
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Format: 21,19,15 (comma-separated)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      {getPlayerDisplay(selectedMatch, 'player1')} Scores
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., 21,19,15"
                      value={declareWinnerData.player1Score}
                      onChange={(e) => setDeclareWinnerData(prev => ({ ...prev, player1Score: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      {getPlayerDisplay(selectedMatch, 'player2')} Scores
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., 18,21,13"
                      value={declareWinnerData.player2Score}
                      onChange={(e) => setDeclareWinnerData(prev => ({ ...prev, player2Score: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave blank to use default walkover scores (21-0)
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeclareWinnerModal(false);
                setSelectedMatch(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDeclareWinner}
              disabled={!declareWinnerData.winnerId}
              className="bg-green-600 hover:bg-green-700"
            >
              <Trophy className="mr-2 h-4 w-4" />
              {selectedMatch?.status === 'completed' ? 'Update Result' : 'Declare Winner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
   

  );
}

// Helper function to display player names (handles singles/doubles)
function getPlayerDisplay(match: Match | null, side: 'player1' | 'player2'): string {
  if (!match) return 'TBD';
  
  if (match.category === 'singles') {
    return side === 'player1' 
      ? (match.player1Name || 'TBD')
      : (match.player2Name || 'TBD');
  } else {
    // Doubles or Mixed
    if (side === 'player1') {
      const p1 = match.player1Name || 'TBD';
      const p3 = match.player3Name || 'TBD';
      return `${p1} & ${p3}`;
    } else {
      const p2 = match.player2Name || 'TBD';
      const p4 = match.player4Name || 'TBD';
      return `${p2} & ${p4}`;
    }
  }
}

// Match Completion Type Badge Component
function CompletionTypeBadge({ match }: { match: Match }) {
  const completionType = (match as any).completionType;
  
  if (!completionType || match.status !== 'completed') return null;

  const badges = {
    normal: {
      label: 'Won',
      className: 'gap-1 bg-green-500/10 text-green-500 border-green-500/30',
      icon: Trophy,
    },
    walkover: {
      label: 'W/O',
      className: 'gap-1 bg-orange-500/10 text-orange-500 border-orange-500/30',
      icon: XCircle,
    },
    forfeit: {
      label: 'Forfeit',
      className: 'gap-1 bg-red-500/10 text-red-500 border-red-500/30',
      icon: XCircle,
    },
    disqualification: {
      label: 'DQ',
      className: 'gap-1 bg-red-600/10 text-red-600 border-red-600/30',
      icon: XCircle,
    },
    retired: {
      label: 'Retired',
      className: 'gap-1 bg-yellow-600/10 text-yellow-600 border-yellow-600/30',
      icon: XCircle,
    },
    manual: {
      label: 'Manual',
      className: 'gap-1 bg-blue-500/10 text-blue-500 border-blue-500/30',
      icon: Edit,
    },
  };

  const badgeConfig = badges[completionType as keyof typeof badges];
  if (!badgeConfig) return null;

  const Icon = badgeConfig.icon;

  return (
    <Badge variant="outline" className={badgeConfig.className}>
      <Icon className="h-3 w-3" />
      {badgeConfig.label}
    </Badge>
  );
}

// Match Status Badge Component
function MatchStatusBadge({ match }: { match: Match }) {
  switch (match.status) {
    case 'completed':
      return (
        <Badge className="gap-1 bg-green-500/10 text-green-500 hover:bg-green-500/20">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge className="gap-1 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
          <Play className="h-3 w-3" />
          Live
        </Badge>
      );
    case 'scheduled':
      return (
        <Badge className="gap-1 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
          <Clock className="h-3 w-3" />
          Scheduled
        </Badge>
      );
    default:
      return (
        <Badge className="gap-1 bg-gray-500/10 text-gray-500 hover:bg-gray-500/20">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
  }
}

// List View Component
function ListView({ 
  rounds, 
  matchesByRound, 
  onSchedule, 
  onScore,
  onDeclareWinner
}: { 
  rounds: string[]; 
  matchesByRound: Record<string, Match[]>;
  onSchedule: (match: Match) => void;
  onScore: (match: Match) => void;
  onDeclareWinner?: (match: Match) => void;
}) {
  return (
    <motion.div
      key="list-view"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-8"
    >
        {rounds.map((round, index) => (
          <motion.div
            key={round}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          >
            <h2 className="text-primary mb-4 flex items-center gap-2 text-xl font-semibold">
            <Trophy className="h-5 w-5 text-green-500" />
              {round}
            <span className="text-muted-foreground text-sm font-normal">
              ({matchesByRound[round]?.length} matches)
            </span>
            </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {matchesByRound[round]?.map((match) => (
              <MatchCard
                key={match._id}
                match={match}
                onSchedule={onSchedule}
                onScore={onScore}
                onDeclareWinner={onDeclareWinner}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Match Card Component
function MatchCard({ 
  match, 
  onSchedule, 
  onScore,
  onDeclareWinner
}: { 
  match: Match;
  onSchedule: (match: Match) => void;
  onScore: (match: Match) => void;
  onDeclareWinner?: (match: Match) => void;
}) {
  const isDoubles = match.category === 'doubles' || match.category === 'mixed';
  
  return (
    <motion.div
      layout
      className="glass-card-intense rounded-xl p-5 transition-all hover:scale-[1.02]"
    >
      {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
          <p className="text-tertiary text-sm font-medium">Match {match.matchNumber}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {match.category?.charAt(0).toUpperCase() + match.category?.slice(1)}
            </Badge>
            {match.ageGroup && (
              <Badge variant="outline" className="text-xs">
                {match.ageGroup}
              </Badge>
                      )}
                    </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <MatchStatusBadge match={match} />
          <CompletionTypeBadge match={match} />
        </div>
                  </div>

                  {/* Players */}
      <div className="mb-4 space-y-2">
        {/* Team 1 */}
                    <div
          className={`rounded-lg p-3 transition-all ${
                        match.winnerId === match.player1Id
              ? 'bg-green-500/10 ring-1 ring-green-500/30'
                          : 'glass-card'
                      }`}
                    >
          <div className="flex items-center justify-between">
            <div className="flex-1">
                      <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    match.player1Name === 'TBD' ? 'text-gray-500 italic' : 'text-primary'
                  }`}>
                          {match.player1Name || 'TBD'}
                  </p>
                  {isDoubles && (
                    <p className={`text-sm truncate ${
                      match.player3Name === 'TBD' ? 'text-gray-500 italic' : 'text-muted-foreground'
                    }`}>
                      {match.player3Name || 'TBD'}
                    </p>
                  )}
                </div>
              </div>
                      </div>
                      {match.status === 'completed' && match.player1Score.length > 0 && (
              <span className="text-primary ml-3 text-lg font-bold">
                          {match.player1Score.join(', ')}
                        </span>
                      )}
          </div>
                    </div>

        <div className="text-tertiary text-center text-xs font-medium">VS</div>

        {/* Team 2 */}
                    <div
          className={`rounded-lg p-3 transition-all ${
                        match.winnerId === match.player2Id
              ? 'bg-green-500/10 ring-1 ring-green-500/30'
                          : 'glass-card'
                      }`}
                    >
          <div className="flex items-center justify-between">
            <div className="flex-1">
                      <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    match.player2Name === 'TBD' ? 'text-gray-500 italic' : 'text-primary'
                  }`}>
                          {match.player2Name || 'TBD'}
                  </p>
                  {isDoubles && (
                    <p className={`text-sm truncate ${
                      match.player4Name === 'TBD' ? 'text-gray-500 italic' : 'text-muted-foreground'
                    }`}>
                      {match.player4Name || 'TBD'}
                    </p>
                  )}
                </div>
              </div>
                      </div>
                      {match.status === 'completed' && match.player2Score.length > 0 && (
              <span className="text-primary ml-3 text-lg font-bold">
                          {match.player2Score.join(', ')}
                        </span>
                      )}
          </div>
                    </div>
                  </div>

                  {/* Schedule Info */}
                  {(match.scheduledDate || match.scheduledTime || match.venue) && (
        <div className="mb-4 space-y-1.5 border-t border-white/10 pt-3">
                      {match.scheduledDate && (
                        <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-muted-foreground">
                {new Date(match.scheduledDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
                          </span>
                        </div>
                      )}
                      {match.scheduledTime && (
                        <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-muted-foreground">{match.scheduledTime}</span>
                        </div>
                      )}
                      {match.venue && (
                        <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-muted-foreground truncate">{match.venue}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                    <div className="space-y-2">
        {match.status !== 'completed' && (
          <>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSchedule(match)}
                className="flex-1 gap-2"
              >
                <Calendar className="h-3.5 w-3.5" />
                {match.scheduledDate ? 'Reschedule' : 'Schedule'}
              </Button>
                      
                      {(match.status === 'scheduled' || match.status === 'in_progress') && (
                <Button
                  size="sm"
                  onClick={() => onScore(match)}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Target className="h-3.5 w-3.5" />
                  {match.status === 'in_progress' ? 'Continue' : 'Start'}
                </Button>
                      )}
                    </div>
            
            {/* Declare Winner Button */}
            {match.player1Name !== 'TBD' && match.player2Name !== 'TBD' && onDeclareWinner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeclareWinner(match)}
                className="w-full gap-2 text-yellow-600 border-yellow-600/50 hover:bg-yellow-600/10"
              >
                <Trophy className="h-3.5 w-3.5" />
                Declare Winner
              </Button>
            )}
          </>
        )}

        {/* Edit Result Button - for completed matches */}
        {match.status === 'completed' && onDeclareWinner && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeclareWinner(match)}
            className="w-full gap-2 text-blue-600 border-blue-600/50 hover:bg-blue-600/10"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit Result
          </Button>
        )}
            </div>
          </motion.div>
  );
}

// Bracket View Component (for Knockout tournaments)
function BracketView({ 
  matches, 
  onSchedule, 
  onScore 
}: { 
  matches: Match[];
  onSchedule: (match: Match) => void;
  onScore: (match: Match) => void;
}) {
  // Group matches by category and age group
  const matchesByCategory = matches.reduce((acc, match) => {
    const key = `${match.category}${match.ageGroup ? `-${match.ageGroup}` : ''}`;
    if (!acc[key]) {
      acc[key] = {
        category: match.category,
        ageGroup: match.ageGroup,
        matches: []
      };
    }
    acc[key].matches.push(match);
    return acc;
  }, {} as Record<string, { category: string; ageGroup?: string; matches: Match[] }>);

  // Sort categories (singles, doubles, mixed)
  const sortedCategories = Object.entries(matchesByCategory).sort((a, b) => {
    const categoryOrder: Record<string, number> = { 'singles': 1, 'doubles': 2, 'mixed': 3 };
    return (categoryOrder[a[1].category] || 99) - (categoryOrder[b[1].category] || 99);
  });

  return (
    <motion.div
      key="bracket-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      {sortedCategories.map(([key, data]) => (
        <div key={key} className="space-y-4">
          <TournamentBracket
            matches={data.matches as any}
            category={data.category}
            ageGroup={data.ageGroup}
            onMatchClick={(match: any) => {
              const fullMatch = data.matches.find(m => m._id === match._id);
              if (fullMatch && fullMatch.status !== 'completed') {
                if (fullMatch.status === 'scheduled' || fullMatch.status === 'in_progress') {
                  onScore(fullMatch);
                } else {
                  onSchedule(fullMatch);
                }
              }
            }}
          />
          
          {/* Print Button */}
          <div className="flex justify-end no-print">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Print {data.category.charAt(0).toUpperCase() + data.category.slice(1)} Bracket
            </Button>
          </div>
      </div>
      ))}
    </motion.div>
  );
}

// Schedule View Component (Timeline view)
function ScheduleView({ 
  matches, 
  onSchedule, 
  onScore 
}: { 
  matches: Match[];
  onSchedule: (match: Match) => void;
  onScore: (match: Match) => void;
}) {
  // Group matches by date
  const matchesByDate = matches.reduce((acc, match) => {
    if (!match.scheduledDate) {
      if (!acc['unscheduled']) acc['unscheduled'] = [];
      acc['unscheduled'].push(match);
      return acc;
    }
    
    const dateKey = new Date(match.scheduledDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // Sort matches within each date by time
  Object.keys(matchesByDate).forEach(date => {
    if (date !== 'unscheduled' && matchesByDate[date]) {
      matchesByDate[date]!.sort((a, b) => {
        if (!a.scheduledTime) return 1;
        if (!b.scheduledTime) return -1;
        return a.scheduledTime.localeCompare(b.scheduledTime);
      });
    }
  });

  const dates = Object.keys(matchesByDate).sort((a, b) => {
    if (a === 'unscheduled') return 1;
    if (b === 'unscheduled') return -1;
    return new Date(a).getTime() - new Date(b).getTime();
  });

  return (
    <motion.div
      key="schedule-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {dates.map((date, index) => (
        <motion.div
          key={date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="glass-card-intense rounded-xl p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-green-500" />
            <h3 className="text-primary text-lg font-semibold">
              {date === 'unscheduled' ? 'Unscheduled Matches' : date}
            </h3>
            <Badge variant="outline" className="ml-auto">
              {matchesByDate[date]?.length || 0} matches
            </Badge>
        </div>

          <div className="space-y-3">
            {matchesByDate[date]?.map((match) => (
              <div
                key={match._id}
                className="glass-card rounded-lg p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
              >
                {/* Time */}
                <div className="flex flex-col items-center justify-center min-w-[80px]">
                  {match.scheduledTime ? (
                    <>
                      <Clock className="h-4 w-4 text-gray-400 mb-1" />
                      <span className="text-primary font-semibold text-sm">
                        {match.scheduledTime}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500 text-xs italic">No time</span>
                  )}
                </div>

                {/* Match Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      Match {match.matchNumber}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {match.round}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {match.category}
                    </Badge>
                    <MatchStatusBadge match={match} />
                    <CompletionTypeBadge match={match} />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className={match.player1Name === 'TBD' ? 'text-gray-500 italic' : 'text-primary font-medium'}>
                      {getPlayerDisplay(match, 'player1')}
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className={match.player2Name === 'TBD' ? 'text-gray-500 italic' : 'text-primary font-medium'}>
                      {getPlayerDisplay(match, 'player2')}
                    </span>
                  </div>

                  {match.venue && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {match.venue}
                    </div>
      )}
    </div>

                {/* Score */}
                {match.status === 'completed' && match.player1Score.length > 0 && match.player2Score.length > 0 && (
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span className={match.winnerId === match.player1Id ? 'text-green-400' : 'text-primary'}>
                      {match.player1Score.join(', ')}
                    </span>
                    <span className="text-muted-foreground">-</span>
                    <span className={match.winnerId === match.player2Id ? 'text-green-400' : 'text-primary'}>
                      {match.player2Score.join(', ')}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {match.status !== 'completed' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSchedule(match)}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                      </Button>
                      {(match.status === 'scheduled' || match.status === 'in_progress') && (
                        <Button
                          size="sm"
                          onClick={() => onScore(match)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Target className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
