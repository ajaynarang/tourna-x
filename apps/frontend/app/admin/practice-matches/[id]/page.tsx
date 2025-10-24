'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import LiveScoring from '@/components/live-scoring';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import {
  ArrowLeft,
  Dumbbell,
  Calendar,
  Users,
  MapPin,
  Target,
  Trophy,
  Clock,
  UserCheck,
  UserX,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  BarChart3,
  Minimize2,
  Maximize2
} from 'lucide-react';
import Link from 'next/link';

interface PracticeMatch {
  _id: string;
  category: string;
  player1Id?: string;
  player2Id?: string;
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
  startTime?: string;
  endTime?: string;
  matchResult?: {
    player1GamesWon: number;
    player2GamesWon: number;
    totalDuration?: number;
    completedAt?: string;
  };
}

export default function PracticeMatchScoringPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { user } = useAuth();
  const [match, setMatch] = useState<PracticeMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentGame, setCurrentGame] = useState(1);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true); // Start in fullscreen mode

  useEffect(() => {
    fetchMatch();
  }, [id]);

  const fetchMatch = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/practice-matches/${id}`);
      const data = await response.json();

      if (data.success) {
        setMatch(data.data);
        
        // Determine current game number
        if (data.data.games && data.data.games.length > 0) {
          const lastGame = data.data.games[data.data.games.length - 1];
          if (lastGame.winner) {
            setCurrentGame(data.data.games.length + 1);
          } else {
            setCurrentGame(data.data.games.length);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching practice match:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMatch = async () => {
    try {
      const response = await fetch(`/api/practice-matches/${id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_match' }),
      });

      if (response.ok) {
        fetchMatch();
      }
    } catch (error) {
      console.error('Error starting match:', error);
    }
  };

  const handleScoreUpdate = async (matchScore: any, history: any[]) => {
    try {
      const response = await fetch(`/api/practice-matches/${id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_score',
          matchScore: matchScore,
          pointHistory: history,
          scoringFormat: match?.scoringFormat || {
            pointsPerGame: 21,
            gamesPerMatch: 3,
            winBy: 2,
            maxPoints: 30,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMatch(data.match);

        // Check if match is completed
        if (data.match.status === 'completed') {
          setTimeout(() => {
            router.push('/admin/practice-matches');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const handleMatchComplete = async (winner: any, finalScore: any) => {
    try {
      const response = await fetch(`/api/practice-matches/${id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end_match',
          winnerId: winner.id,
          winnerName: winner.name,
          finalScore,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMatch(data.match);
        setTimeout(() => {
          router.push('/admin/practice-matches');
        }, 3000);
      }
    } catch (error) {
      console.error('Error completing match:', error);
    }
  };

  const handleWalkover = async (winner: 'player1' | 'player2', reason: string) => {
    try {
      const response = await fetch(`/api/practice-matches/${id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'walkover',
          winner,
          walkoverReason: reason,
        }),
      });

      if (response.ok) {
        fetchMatch();
        setTimeout(() => {
          router.push('/admin/practice-matches');
        }, 2000);
      }
    } catch (error) {
      console.error('Error recording walkover:', error);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-card border-white/10 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-primary mb-2">Match Not Found</h2>
            <p className="text-tertiary mb-6">The practice match you're looking for doesn't exist.</p>
            <Link href="/admin/practice-matches">
              <Button>Back to Practice Matches</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      {/* Distraction-Free Header */}
      <div className="glass-card-intense border-b">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/practice-matches">
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Dumbbell className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-primary">Practice Match</h1>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryBadge(match.category)}>
                      {match.category}
                    </Badge>
                    <span className="text-xs text-tertiary">•</span>
                    <span className="text-xs text-tertiary">
                      {new Date(match.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {match.status === 'completed' && (
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMatchDetails(!showMatchDetails)}
                className="border-white/10 hover:bg-white/5"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="border-white/10 hover:bg-white/5"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Collapsible Match Details */}
        {showMatchDetails && (
          <div className="mb-6 space-y-4">
            {/* Match Info Cards - Mobile Optimized */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Player Info */}
              <Card className="glass-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-tertiary uppercase tracking-wide">Players</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      {match.player1IsGuest ? (
                        <UserX className="h-4 w-4 text-blue-400" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">
                        {match.player1Name}
                      </p>
                      {match.player1IsGuest && match.player1Phone && (
                        <p className="text-xs text-tertiary">Guest • {match.player1Phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center text-xs text-tertiary">vs</div>

                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10">
                      {match.player2IsGuest ? (
                        <UserX className="h-4 w-4 text-pink-400" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-pink-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">
                        {match.player2Name}
                      </p>
                      {match.player2IsGuest && match.player2Phone && (
                        <p className="text-xs text-tertiary">Guest • {match.player2Phone}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Match Details */}
              <Card className="glass-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-tertiary uppercase tracking-wide">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {match.court && (
                    <div className="flex items-center gap-2 text-sm text-tertiary">
                      <Target className="h-3 w-3" />
                      <span>{match.court}</span>
                    </div>
                  )}
                  {match.venue && (
                    <div className="flex items-center gap-2 text-sm text-tertiary">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{match.venue}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-tertiary">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(match.createdAt).toLocaleDateString()}</span>
                  </div>
                  {match.startTime && (
                    <div className="flex items-center gap-2 text-sm text-tertiary">
                      <Clock className="h-3 w-3" />
                      <span>Started: {new Date(match.startTime).toLocaleTimeString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current Score */}
              {match.games && match.games.length > 0 && (
                <Card className="glass-card border-white/10 sm:col-span-2 lg:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-tertiary uppercase tracking-wide">Games Won</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-around">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {match.matchResult?.player1GamesWon || match.games.filter((g: any) => g.winner === 'player1').length}
                        </div>
                        <div className="text-xs text-tertiary mt-1">
                          {match.player1Name.split(' ')[0]}
                        </div>
                      </div>
                      <div className="text-tertiary">-</div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-400">
                          {match.matchResult?.player2GamesWon || match.games.filter((g: any) => g.winner === 'player2').length}
                        </div>
                        <div className="text-xs text-tertiary mt-1">
                          {match.player2Name.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Match Notes */}
            {match.notes && (
              <Card className="glass-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-tertiary uppercase tracking-wide">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-primary">{match.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Match Completed View */}
        {match.status === 'completed' && (
          <Card className="glass-card border-white/10 mb-6">
            <CardContent className="p-8 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-4">
                <Trophy className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Match Completed!</h2>
              <p className="text-tertiary mb-4">
                Winner: <span className="text-primary font-semibold">{match.winnerName}</span>
              </p>
              
              {/* Games Summary */}
              <div className="max-w-md mx-auto mt-6 space-y-2">
                {match.games?.map((game: any, index: number) => (
                  <div key={index} className="flex items-center justify-between glass-card p-3 rounded-lg">
                    <span className="text-sm text-tertiary">Game {game.gameNumber}</span>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium ${game.winner === 'player1' ? 'text-blue-400' : 'text-tertiary'}`}>
                        {game.player1Score}
                      </span>
                      <span className="text-tertiary">-</span>
                      <span className={`text-sm font-medium ${game.winner === 'player2' ? 'text-pink-400' : 'text-tertiary'}`}>
                        {game.player2Score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-3 justify-center">
                <Link href="/admin/practice-matches">
                  <Button variant="outline" className="border-white/10 hover:bg-white/5">
                    View All Matches
                  </Button>
                </Link>
                <Button
                  onClick={() => router.push('/admin/practice-matches')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Practice Match
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distraction-Free Scoring Interface */}
        {match.status !== 'completed' && match.status !== 'cancelled' && (
          <>
            {match.status === 'scheduled' ? (
              <Card className="glass-card border-white/10">
                <CardContent className="p-12 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-2">Ready to Start?</h3>
                  <p className="text-tertiary mb-6">Begin scoring this practice match</p>
                  <Button
                    onClick={handleStartMatch}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Start Match
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={`${isFullscreen ? 'fixed inset-0 z-40 bg-white dark:bg-black flex flex-col' : ''}`}>
                {/* Mobile-Optimized Player Header for Fullscreen Mode */}
                {isFullscreen && (
                  <div className="bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-white/20 backdrop-blur-sm">
                    {/* Mobile Header */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        {/* Large Exit Button for Mobile */}
                        <button
                          onClick={() => setIsFullscreen(false)}
                          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-semibold"
                        >
                          <ArrowLeft className="h-5 w-5" />
                          <span className="hidden sm:inline">Exit Scoring</span>
                          <span className="sm:hidden">Exit</span>
                        </button>
                        
                        {/* Match Status */}
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            {match.category}
                          </Badge>
                          <Badge className={match.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'}>
                            {match.status === 'in_progress' ? 'Live' : 'Scheduled'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Player Names - Mobile Optimized */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 flex-shrink-0">
                            {match.player1IsGuest ? (
                              <UserX className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{match.player1Name}</p>
                            {match.player1IsGuest && match.player1Phone && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Guest • {match.player1Phone}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-gray-600 dark:text-gray-400 font-bold mx-4 text-lg">VS</div>
                        
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="min-w-0 flex-1 text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{match.player2Name}</p>
                            {match.player2IsGuest && match.player2Phone && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Guest • {match.player2Phone}</p>
                            )}
                          </div>
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10 flex-shrink-0">
                            {match.player2IsGuest ? (
                              <UserX className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                            ) : (
                              <UserCheck className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Court/Venue Info - Mobile Optimized */}
                      {(match.court || match.venue) && (
                        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                          {match.court && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <Target className="h-4 w-4" />
                              <span>{match.court}</span>
                            </div>
                          )}
                          {match.venue && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate max-w-32">{match.venue}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Scoring Component */}
                <div className={`${isFullscreen ? 'flex-1 flex items-center justify-center p-4' : ''}`}>
                  <div className={`${isFullscreen ? 'w-full max-w-4xl' : ''}`}>
                    <LiveScoring
                      matchId={match._id}
                      playerA={{ 
                        name: match.player1Name, 
                        score: match.games && match.games.length > 0 
                          ? match.games[match.games.length - 1].player1Score || 0 
                          : 0, 
                        id: match.player1Id || 'guest1' 
                      }}
                      playerB={{ 
                        name: match.player2Name, 
                        score: match.games && match.games.length > 0 
                          ? match.games[match.games.length - 1].player2Score || 0 
                          : 0, 
                        id: match.player2Id || 'guest2' 
                      }}
                      scoringFormat={match.scoringFormat || {
                        pointsPerGame: 21,
                        gamesPerMatch: 3,
                        winBy: 2,
                        maxPoints: 30,
                      }}
                      onScoreUpdate={handleScoreUpdate}
                      onMatchComplete={handleMatchComplete}
                    />
                  </div>
                </div>
                
                {/* Mobile Bottom Navigation */}
                {isFullscreen && (
                  <div className="bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-white/20 backdrop-blur-sm p-4">
                    <div className="max-w-4xl mx-auto">
                      <button
                        onClick={() => setIsFullscreen(false)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-semibold text-lg"
                      >
                        <ArrowLeft className="h-6 w-6" />
                        Exit Scoring Mode
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Match Notes - Only show when details are expanded */}
        {match.notes && showMatchDetails && (
          <Card className="glass-card border-white/10 mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-tertiary uppercase tracking-wide">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-primary">{match.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


