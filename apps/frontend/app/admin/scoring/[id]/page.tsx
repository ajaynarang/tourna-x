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
  Pause,
  Square,
  Trophy,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Save
} from 'lucide-react';
import Link from 'next/link';

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
  status: 'scheduled' | 'in_progress' | 'completed';
  startTime?: string;
  endTime?: string;
  winnerId?: string;
  winnerName?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  court?: string;
}

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  venue: string;
  location: string;
}

export default function LiveScoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [matchId, setMatchId] = useState<string>('');
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [player1Score, setPlayer1Score] = useState<number[]>([]);
  const [player2Score, setPlayer2Score] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [isMatchStarted, setIsMatchStarted] = useState(false);

  useEffect(() => {
    params.then(p => {
      setMatchId(p.id);
    });
  }, [params]);

  useEffect(() => {
    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/matches/${matchId}`);
      const result = await response.json();
      
      if (result.success) {
        setMatch(result.data);
        setPlayer1Score(result.data.player1Score || []);
        setPlayer2Score(result.data.player2Score || []);
        setIsMatchStarted(result.data.status === 'in_progress');
        
        // Fetch tournament details
        const tournamentResponse = await fetch(`/api/tournaments/${result.data.tournamentId}`);
        const tournamentResult = await tournamentResponse.json();
        if (tournamentResult.success) {
          setTournament(tournamentResult.data);
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load match details');
    } finally {
      setIsLoading(false);
    }
  };

  const validateScore = (score1: number, score2: number): boolean => {
    // Badminton scoring rules
    // Normal win: 21 points with 2-point margin
    if (score1 === 21 && score2 <= 19) return true;
    if (score2 === 21 && score1 <= 19) return true;
    
    // Deuce win: Must win by 2, max 30
    if (score1 >= 20 && score2 >= 20) {
      if (Math.abs(score1 - score2) === 2) return true;
      if (score1 === 30 || score2 === 30) return true;
    }
    
    return false;
  };

  const updateScore = async (player: 'player1' | 'player2', increment: boolean = true) => {
    if (!match) return;

    const newPlayer1Score = [...player1Score];
    const newPlayer2Score = [...player2Score];

    // Ensure we have scores for current set
    if (!newPlayer1Score[currentSet - 1]) newPlayer1Score[currentSet - 1] = 0;
    if (!newPlayer2Score[currentSet - 1]) newPlayer2Score[currentSet - 1] = 0;

    if (increment) {
      if (player === 'player1') {
        newPlayer1Score[currentSet - 1]++;
      } else {
        newPlayer2Score[currentSet - 1]++;
      }
    } else {
      if (player === 'player1' && newPlayer1Score[currentSet - 1] > 0) {
        newPlayer1Score[currentSet - 1]--;
      } else if (player === 'player2' && newPlayer2Score[currentSet - 1] > 0) {
        newPlayer2Score[currentSet - 1]--;
      }
    }

    setPlayer1Score(newPlayer1Score);
    setPlayer2Score(newPlayer2Score);

    // Auto-save score
    await saveScore(newPlayer1Score, newPlayer2Score);
  };

  const saveScore = async (p1Score?: number[], p2Score?: number[]) => {
    if (!match) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1Score: p1Score || player1Score,
          player2Score: p2Score || player2Score,
          currentSet,
          isComplete: false
        }),
      });

      const result = await response.json();
      if (!result.success) {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to save score');
    } finally {
      setIsSaving(false);
    }
  };

  const startMatch = async () => {
    if (!match) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1Score: [0],
          player2Score: [0],
          currentSet: 1,
          isComplete: false
        }),
      });

      const result = await response.json();
      if (result.success) {
        setIsMatchStarted(true);
        setPlayer1Score([0]);
        setPlayer2Score([0]);
        setCurrentSet(1);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to start match');
    } finally {
      setIsSaving(false);
    }
  };

  const completeMatch = async () => {
    if (!match) return;

    // Determine winner
    const setWins = { player1: 0, player2: 0 };
    player1Score.forEach((score1, index) => {
      const score2 = player2Score[index];
      if (score1 > score2) setWins.player1++;
      else setWins.player2++;
    });

    const winner = setWins.player1 > setWins.player2 ? 'player1' : 'player2';

    setIsSaving(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1Score,
          player2Score,
          currentSet,
          isComplete: true
        }),
      });

      const result = await response.json();
      if (result.success) {
        router.push(`/admin/scoring?completed=${matchId}`);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to complete match');
    } finally {
      setIsSaving(false);
    }
  };

  const nextSet = () => {
    if (currentSet < 3) {
      setCurrentSet(prev => prev + 1);
      // Initialize new set scores
      const newPlayer1Score = [...player1Score];
      const newPlayer2Score = [...player2Score];
      newPlayer1Score[currentSet] = 0;
      newPlayer2Score[currentSet] = 0;
      setPlayer1Score(newPlayer1Score);
      setPlayer2Score(newPlayer2Score);
    }
  };

  const getCurrentSetScore = () => {
    return {
      player1: player1Score[currentSet - 1] || 0,
      player2: player2Score[currentSet - 1] || 0
    };
  };

  const getSetWinner = (setIndex: number) => {
    const score1 = player1Score[setIndex] || 0;
    const score2 = player2Score[setIndex] || 0;
    
    if (score1 > score2) return 'player1';
    if (score2 > score1) return 'player2';
    return null;
  };

  const getMatchWinner = () => {
    const setWins = { player1: 0, player2: 0 };
    player1Score.forEach((score1, index) => {
      const score2 = player2Score[index];
      if (score1 > score2) setWins.player1++;
      else setWins.player2++;
    });
    
    if (setWins.player1 > setWins.player2) return 'player1';
    if (setWins.player2 > setWins.player1) return 'player2';
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Match Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The match you\'re looking for doesn\'t exist.'}</p>
          <Button asChild>
            <Link href="/admin/scoring">Back to Scoring</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentScore = getCurrentSetScore();
  const matchWinner = getMatchWinner();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/scoring">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Scoring
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Live Scoring
              </h1>
              <p className="text-gray-600">
                {tournament?.name} - {match.category} {match.ageGroup && `(${match.ageGroup})`}
              </p>
            </div>
          </div>

          {/* Match Info */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {match.round} - Match {match.matchNumber}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {match.category}
                    </span>
                    {match.scheduledTime && (
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {match.scheduledTime}
                      </span>
                    )}
                    {match.court && (
                      <span className="flex items-center">
                        <Trophy className="h-4 w-4 mr-1" />
                        Court {match.court}
                      </span>
                    )}
                  </div>
                </div>
                <Badge className={`${
                  match.status === 'completed' ? 'bg-green-100 text-green-800' :
                  match.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {match.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player 1 */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-center text-lg">
                {match.player1Name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {currentScore.player1}
              </div>
              {isMatchStarted && match.status !== 'completed' && (
                <div className="space-y-2">
                  <Button
                    onClick={() => updateScore('player1', true)}
                    className="w-full"
                    size="lg"
                  >
                    +1
                  </Button>
                  <Button
                    onClick={() => updateScore('player1', false)}
                    variant="outline"
                    className="w-full"
                    disabled={currentScore.player1 === 0}
                  >
                    -1
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* VS & Controls */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-400 mb-6">VS</div>
              
              {/* Set Scores */}
              <div className="space-y-2 mb-6">
                {[1, 2, 3].map((setNum) => {
                  const setWinner = getSetWinner(setNum - 1);
                  return (
                    <div key={setNum} className={`flex justify-between items-center p-2 rounded ${
                      currentSet === setNum ? 'bg-blue-100' : 'bg-gray-50'
                    }`}>
                      <span className="font-medium">Set {setNum}</span>
                      <div className="flex items-center gap-2">
                        <span className={`${setWinner === 'player1' ? 'font-bold text-blue-600' : ''}`}>
                          {player1Score[setNum - 1] || 0}
                        </span>
                        <span>-</span>
                        <span className={`${setWinner === 'player2' ? 'font-bold text-blue-600' : ''}`}>
                          {player2Score[setNum - 1] || 0}
                        </span>
                        {setWinner && (
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Match Controls */}
              <div className="space-y-2">
                {!isMatchStarted ? (
                  <Button
                    onClick={startMatch}
                    disabled={isSaving}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Match
                  </Button>
                ) : match.status !== 'completed' ? (
                  <>
                    <Button
                      onClick={saveScore}
                      disabled={isSaving}
                      variant="outline"
                      className="w-full"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Score
                        </>
                      )}
                    </Button>
                    
                    {currentSet < 3 && (
                      <Button
                        onClick={nextSet}
                        variant="outline"
                        className="w-full"
                      >
                        Next Set
                      </Button>
                    )}
                    
                    <Button
                      onClick={completeMatch}
                      disabled={!matchWinner}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Match
                    </Button>
                  </>
                ) : (
                  <div className="text-center">
                    <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">Match Completed</p>
                    <p className="text-sm text-gray-600">
                      Winner: {match.winnerName}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Player 2 */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-center text-lg">
                {match.player2Name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {currentScore.player2}
              </div>
              {isMatchStarted && match.status !== 'completed' && (
                <div className="space-y-2">
                  <Button
                    onClick={() => updateScore('player2', true)}
                    className="w-full"
                    size="lg"
                  >
                    +1
                  </Button>
                  <Button
                    onClick={() => updateScore('player2', false)}
                    variant="outline"
                    className="w-full"
                    disabled={currentScore.player2 === 0}
                  >
                    -1
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Match Summary */}
        {match.status === 'completed' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-center">Match Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">{match.player1Name}</h3>
                  <div className="space-y-1">
                    {player1Score.map((score, index) => (
                      <div key={index} className="text-sm">
                        Set {index + 1}: {score}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">{match.player2Name}</h3>
                  <div className="space-y-1">
                    {player2Score.map((score, index) => (
                      <div key={index} className="text-sm">
                        Set {index + 1}: {score}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
