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
  Plus
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

  const handleScoreUpdate = async (gameNumber: number, player1Score: number, player2Score: number) => {
    try {
      const response = await fetch(`/api/practice-matches/${id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_score',
          gameNumber,
          player1Score,
          player2Score,
          scoringFormat: {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="glass-card border-white/10 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Match Not Found</h2>
            <p className="text-gray-400 mb-6">The practice match you're looking for doesn't exist.</p>
            <Link href="/admin/practice-matches">
              <Button>Back to Practice Matches</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="glass-card-intense border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/practice-matches">
                <Button variant="outline" size="sm" className="border-white/10">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Practice Match</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getCategoryBadge(match.category)}>
                      {match.category}
                    </Badge>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-400">
                      {new Date(match.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {match.status === 'completed' && (
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                <CheckCircle className="mr-1 h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Match Info Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {/* Player Info */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  {match.player1IsGuest ? (
                    <UserX className="h-5 w-5 text-blue-400" />
                  ) : (
                    <UserCheck className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {match.player1Name}
                  </p>
                  {match.player1IsGuest && match.player1Phone && (
                    <p className="text-xs text-gray-500">Guest • {match.player1Phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center text-xs text-gray-500">vs</div>

              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
                  {match.player2IsGuest ? (
                    <UserX className="h-5 w-5 text-pink-400" />
                  ) : (
                    <UserCheck className="h-5 w-5 text-pink-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {match.player2Name}
                  </p>
                  {match.player2IsGuest && match.player2Phone && (
                    <p className="text-xs text-gray-500">Guest • {match.player2Phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Details */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {match.court && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Target className="h-4 w-4 text-gray-400" />
                  <span>{match.court}</span>
                </div>
              )}
              {match.venue && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{match.venue}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{new Date(match.createdAt).toLocaleDateString()}</span>
              </div>
              {match.startTime && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Started: {new Date(match.startTime).toLocaleTimeString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Score */}
          {match.games && match.games.length > 0 && (
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">Games Won</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">
                      {match.matchResult?.player1GamesWon || match.games.filter((g: any) => g.winner === 'player1').length}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {match.player1Name.split(' ')[0]}
                    </div>
                  </div>
                  <div className="text-gray-600">-</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-400">
                      {match.matchResult?.player2GamesWon || match.games.filter((g: any) => g.winner === 'player2').length}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {match.player2Name.split(' ')[0]}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Match Completed View */}
        {match.status === 'completed' && (
          <Card className="glass-card border-white/10 mb-6">
            <CardContent className="p-8 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-4">
                <Trophy className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Match Completed!</h2>
              <p className="text-gray-400 mb-4">
                Winner: <span className="text-white font-semibold">{match.winnerName}</span>
              </p>
              
              {/* Games Summary */}
              <div className="max-w-md mx-auto mt-6 space-y-2">
                {match.games?.map((game: any, index: number) => (
                  <div key={index} className="flex items-center justify-between glass-card p-3 rounded-lg">
                    <span className="text-sm text-gray-400">Game {game.gameNumber}</span>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium ${game.winner === 'player1' ? 'text-blue-400' : 'text-gray-500'}`}>
                        {game.player1Score}
                      </span>
                      <span className="text-gray-600">-</span>
                      <span className={`text-sm font-medium ${game.winner === 'player2' ? 'text-pink-400' : 'text-gray-500'}`}>
                        {game.player2Score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-3 justify-center">
                <Link href="/admin/practice-matches">
                  <Button variant="outline" className="border-white/10">
                    View All Matches
                  </Button>
                </Link>
                <Button
                  onClick={() => router.push('/admin/practice-matches')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Practice Match
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scoring Interface */}
        {match.status !== 'completed' && match.status !== 'cancelled' && (
          <>
            {match.status === 'scheduled' ? (
              <Card className="glass-card border-white/10">
                <CardContent className="p-12 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 mb-4">
                    <Clock className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Ready to Start?</h3>
                  <p className="text-gray-400 mb-6">Begin scoring this practice match</p>
                  <Button
                    onClick={handleStartMatch}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Start Match
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <SimpleLiveScoring
                match={match}
                currentGame={currentGame}
                onScoreUpdate={handleScoreUpdate}
                onWalkover={handleWalkover}
              />
            )}
          </>
        )}

        {/* Match Notes */}
        {match.notes && (
          <Card className="glass-card border-white/10 mt-6">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">{match.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Simplified Live Scoring Component for Practice Matches
function SimpleLiveScoring({
  match,
  currentGame,
  onScoreUpdate,
  onWalkover,
}: {
  match: PracticeMatch;
  currentGame: number;
  onScoreUpdate: (gameNumber: number, player1Score: number, player2Score: number) => void;
  onWalkover: (winner: 'player1' | 'player2', reason: string) => void;
}) {
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [showWalkoverDialog, setShowWalkoverDialog] = useState(false);

  // Load current game scores if available
  useEffect(() => {
    if (match.games && match.games.length > 0) {
      const currentGameData = match.games.find((g: any) => g.gameNumber === currentGame);
      if (currentGameData && !currentGameData.winner) {
        setPlayer1Score(currentGameData.player1Score || 0);
        setPlayer2Score(currentGameData.player2Score || 0);
      }
    }
  }, [match.games, currentGame]);

  const handleScoreChange = (player: 'player1' | 'player2', delta: number) => {
    if (player === 'player1') {
      const newScore = Math.max(0, player1Score + delta);
      setPlayer1Score(newScore);
      onScoreUpdate(currentGame, newScore, player2Score);
    } else {
      const newScore = Math.max(0, player2Score + delta);
      setPlayer2Score(newScore);
      onScoreUpdate(currentGame, player1Score, newScore);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Game {currentGame}</CardTitle>
            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
              <AlertCircle className="mr-1 h-3 w-3" />
              In Progress
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Player 1 Score */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">{match.player1Name}</p>
                <div className="text-6xl font-bold text-blue-400 mb-4">{player1Score}</div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleScoreChange('player1', 1)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    size="lg"
                  >
                    +1
                  </Button>
                  <Button
                    onClick={() => handleScoreChange('player1', -1)}
                    variant="outline"
                    className="border-blue-500/20 hover:bg-blue-500/10"
                    size="lg"
                    disabled={player1Score === 0}
                  >
                    -1
                  </Button>
                </div>
              </div>
            </div>

            {/* Player 2 Score */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">{match.player2Name}</p>
                <div className="text-6xl font-bold text-pink-400 mb-4">{player2Score}</div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleScoreChange('player2', 1)}
                    className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                    size="lg"
                  >
                    +1
                  </Button>
                  <Button
                    onClick={() => handleScoreChange('player2', -1)}
                    variant="outline"
                    className="border-pink-500/20 hover:bg-pink-500/10"
                    size="lg"
                    disabled={player2Score === 0}
                  >
                    -1
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Walkover Button */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => setShowWalkoverDialog(true)}
              className="w-full border-red-500/20 hover:bg-red-500/10 text-red-400"
            >
              Record Walkover
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous Games */}
      {match.games && match.games.filter((g: any) => g.winner).length > 0 && (
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Previous Games</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {match.games
              .filter((g: any) => g.winner)
              .map((game: any) => (
                <div key={game.gameNumber} className="flex items-center justify-between glass-card p-3 rounded-lg">
                  <span className="text-sm text-gray-400">Game {game.gameNumber}</span>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium ${game.winner === 'player1' ? 'text-blue-400' : 'text-gray-500'}`}>
                      {game.player1Score}
                    </span>
                    <span className="text-gray-600">-</span>
                    <span className={`text-sm font-medium ${game.winner === 'player2' ? 'text-pink-400' : 'text-gray-500'}`}>
                      {game.player2Score}
                    </span>
                  </div>
                  <Badge className={game.winner === 'player1' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}>
                    {game.winner === 'player1' ? match.player1Name.split(' ')[0] : match.player2Name.split(' ')[0]}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Walkover Dialog */}
      {showWalkoverDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="glass-card-intense border border-white/10 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white">Record Walkover</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400">Select the winner of the walkover:</p>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    onWalkover('player1', 'Walkover');
                    setShowWalkoverDialog(false);
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  {match.player1Name}
                </Button>
                <Button
                  onClick={() => {
                    onWalkover('player2', 'Walkover');
                    setShowWalkoverDialog(false);
                  }}
                  className="w-full bg-pink-500 hover:bg-pink-600"
                >
                  {match.player2Name}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowWalkoverDialog(false)}
                className="w-full border-white/10"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

