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
  Trophy,
  Calendar,
  MapPin,
  Target,
  Clock,
  UserCheck,
  UserX,
  CheckCircle,
  AlertCircle,
  XCircle,
  Maximize2,
  Play,
  Edit,
} from 'lucide-react';
import Link from 'next/link';

interface TournamentMatch {
  _id: string;
  tournamentId: string;
  tournamentName?: string;
  matchNumber: number;
  roundNumber: number;
  roundName: string;
  category: string;
  ageGroup?: string;
  player1Id?: string;
  player2Id?: string;
  player3Id?: string;
  player4Id?: string;
  player1Name: string;
  player2Name: string;
  player3Name?: string;
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
  notes?: string;
}

export default function TournamentMatchDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { user } = useAuth();
  const [match, setMatch] = useState<TournamentMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showScoring, setShowScoring] = useState(false);

  useEffect(() => {
    fetchMatch();
  }, [id]);

  const fetchMatch = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/matches/${id}`);
      const data = await response.json();

      if (response.ok && data.success) {
        console.log('Tournament match data:', data.data);
        setMatch(data.data);
      } else {
        console.log('Match not found or error:', data.error);
        setMatch(null);
      }
    } catch (error) {
      console.error('Error fetching tournament match:', error);
      setMatch(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_match' }),
      });

      if (response.ok) {
        await fetchMatch();
        setShowScoring(true);
      }
    } catch (error) {
      console.error('Error starting match:', error);
    }
  };

  const handleScoreUpdate = async (matchScore: any, history: any[]) => {
    try {
      const response = await fetch(`/api/matches/${id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_score',
          matchScore: matchScore,
          pointHistory: history,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMatch(data.match);

        // If match is completed, go back to listing after showing result
        if (data.match.status === 'completed') {
          setTimeout(() => {
            router.push('/admin/tournament-matches');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const handleMatchComplete = async (winner: any, finalScore: any) => {
    // Match completion is already handled in handleScoreUpdate
    await fetchMatch();
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      singles: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      doubles: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      mixed: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
  };

  const getCompletionTypeBadge = (completionType?: string) => {
    if (!completionType) return null;

    const badges = {
      normal: { 
        label: 'Won', 
        className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', 
        icon: Trophy 
      },
      walkover: { 
        label: 'W/O', 
        className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', 
        icon: XCircle 
      },
      forfeit: { 
        label: 'Forfeit', 
        className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', 
        icon: XCircle 
      },
      disqualification: { 
        label: 'DQ', 
        className: 'bg-red-600/10 text-red-700 dark:text-red-400 border-red-600/20', 
        icon: XCircle 
      },
      retired: { 
        label: 'Retired', 
        className: 'bg-yellow-600/10 text-yellow-700 dark:text-yellow-400 border-yellow-600/20', 
        icon: XCircle 
      },
      manual: { 
        label: 'Manual', 
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', 
        icon: Edit 
      },
    };

    const badgeConfig = badges[completionType as keyof typeof badges];
    if (!badgeConfig) return null;

    const Icon = badgeConfig.icon;

    return (
      <Badge className={badgeConfig.className} style={{ fontSize: '14px', padding: '8px 16px' }}>
        <Icon className="mr-1.5 h-4 w-4 inline" />
        {badgeConfig.label}
      </Badge>
    );
  };

  const formatPlayers = (match: TournamentMatch) => {
    const isDoubles = match.category === 'doubles' || match.category === 'mixed';
    
    if (isDoubles) {
      const team1 = match.player3Name 
        ? `${match.player1Name} / ${match.player3Name}` 
        : match.player1Name || 'TBD';
      const team2 = match.player4Name 
        ? `${match.player2Name} / ${match.player4Name}` 
        : match.player2Name || 'TBD';
      return { team1, team2 };
    } else {
      return { 
        team1: match.player1Name || 'TBD', 
        team2: match.player2Name || 'TBD' 
      };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Match Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The tournament match you're looking for doesn't exist.</p>
            <Link href="/admin/tournament-matches">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                Back to Tournament Matches
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If scoring mode is active, show full-screen scoring
  if (showScoring && match.status === 'in_progress') {
    const players = formatPlayers(match);
    return (
      <LiveScoring
        matchId={match._id}
        playerA={{ 
          name: players.team1,
          score: match.games && match.games.length > 0 
            ? match.games[match.games.length - 1].player1Score || 0 
            : 0, 
          id: match.player1Id || 'tbd1' 
        }}
        playerB={{ 
          name: players.team2,
          score: match.games && match.games.length > 0 
            ? match.games[match.games.length - 1].player2Score || 0 
            : 0, 
          id: match.player2Id || 'tbd2' 
        }}
        scoringFormat={{
          pointsPerGame: 21,
          gamesPerMatch: 3,
          winBy: 2,
          maxPoints: 30,
        }}
        onScoreUpdate={handleScoreUpdate}
        onMatchComplete={handleMatchComplete}
        onViewDetails={() => setShowScoring(false)}
      />
    );
  }

  const players = formatPlayers(match);
  const isPlayer1Winner = match.winnerId && (match.winnerId === match.player1Id || match.winnerId === match.player3Id);
  const isPlayer2Winner = match.winnerId && (match.winnerId === match.player2Id || match.winnerId === match.player4Id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin/tournament-matches">
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            
            {match.status !== 'completed' && match.status !== 'cancelled' && (
              <Button
                onClick={() => {
                  if (match.status === 'scheduled') {
                    handleStartMatch();
                  } else {
                    setShowScoring(true);
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-500/25"
              >
                {match.status === 'scheduled' ? (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Scoring
                  </>
                ) : (
                  <>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Continue Scoring
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Match Status Badge */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Badge className={getCategoryBadge(match.category)} style={{ fontSize: '14px', padding: '8px 16px' }}>
            {match.category.toUpperCase()}
          </Badge>
          {match.ageGroup && (
            <Badge className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" style={{ fontSize: '14px', padding: '8px 16px' }}>
              {match.ageGroup}
            </Badge>
          )}
          <Badge 
            className={
              match.status === 'completed' 
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' 
                : match.status === 'in_progress'
                ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
            }
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            {match.status === 'scheduled' && <Clock className="mr-1.5 h-4 w-4 inline" />}
            {match.status === 'in_progress' && <AlertCircle className="mr-1.5 h-4 w-4 inline" />}
            {match.status === 'completed' && <CheckCircle className="mr-1.5 h-4 w-4 inline" />}
            {match.status.replace('_', ' ').toUpperCase()}
          </Badge>
          {match.status === 'completed' && getCompletionTypeBadge(match.completionType)}
        </div>

        {/* Tournament Info Banner */}
        {match.tournamentName && (
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tournament</p>
                <p className="font-semibold text-gray-900 dark:text-white">{match.tournamentName}</p>
              </div>
              <div className="ml-auto">
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                  {match.roundName} • Match #{match.matchNumber}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Match Completion Card - Apple-like Design */}
        {match.status === 'completed' && (
          <div className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-3xl border border-green-200/50 dark:border-green-800/50 p-8 shadow-lg">
            {/* Header with Trophy */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <Trophy className="h-10 w-10 text-white" />
              </div>
            </div>
            
            {/* Match Type Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 rounded-full border border-green-200 dark:border-green-700">
                <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300 capitalize">
                  {match.category} Tournament Match
                </span>
              </div>
            </div>
            
            {/* Winner Announcement */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Match Complete!
              </h2>
              {match.winnerName && (
                <div className="text-xl text-green-700 dark:text-green-300 font-semibold">
                  {match.winnerName} wins!
                </div>
              )}
            </div>
            
            {/* Final Score Display */}
            {match.player1Score.length > 0 && match.player2Score.length > 0 && (
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-green-100 dark:border-green-800 mb-8">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 text-center mb-6 uppercase tracking-wider">
                  Final Score
                </h3>
                <div className="flex items-center justify-center gap-12">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">{players.team1}</div>
                    <div className={`text-5xl font-bold ${
                      isPlayer1Winner
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {match.player1Score.filter(s => s >= 21 || s > match.player2Score[match.player1Score.indexOf(s)]).length}
                    </div>
                  </div>
                  
                  <div className="text-3xl font-bold text-gray-300 dark:text-gray-600">-</div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">{players.team2}</div>
                    <div className={`text-5xl font-bold ${
                      isPlayer2Winner
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {match.player2Score.filter(s => s >= 21 || s > match.player1Score[match.player2Score.indexOf(s)]).length}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Game-by-Game Breakdown */}
            {match.games && match.games.length > 0 && (
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-green-100 dark:border-green-800">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 text-center mb-6 uppercase tracking-wider">
                  Game Breakdown
                </h3>
                <div className="space-y-4">
                  {match.games.map((game, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {game.gameNumber}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Game {game.gameNumber}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{players.team1}</div>
                          <div className={`text-lg font-bold ${
                            game.winner === 'player1' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {game.player1Score}
                          </div>
                        </div>
                        
                        <div className="text-lg font-bold text-gray-300 dark:text-gray-600">-</div>
                        
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{players.team2}</div>
                          <div className={`text-lg font-bold ${
                            game.winner === 'player2' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {game.player2Score}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Completion Reason */}
            {match.completionReason && (
              <div className="mt-6 p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-green-100 dark:border-green-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  <span className="font-medium">Note:</span> {match.completionReason}
                </p>
              </div>
            )}
            
            {/* Match Duration and Completion Time */}
            {(match.duration || match.endTime) && (
              <div className="mt-6 flex justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
                {match.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Duration: {match.duration} minutes</span>
                  </div>
                )}
                {match.endTime && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Completed: {new Date(match.endTime).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Players Card */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Team 1 */}
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  {match.category === 'singles' ? 'Player 1' : 'Team 1'}
                </div>
                <div className="space-y-3">
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${
                    isPlayer1Winner 
                      ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                      : 'bg-blue-50 dark:bg-blue-950/20'
                  }`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isPlayer1Winner ? 'bg-green-500/20' : 'bg-blue-500/20'
                    }`}>
                      {isPlayer1Winner ? (
                        <Trophy className={`h-5 w-5 ${isPlayer1Winner ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                      ) : (
                        <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${
                        isPlayer1Winner 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {match.player1Name || 'TBD'}
                      </p>
                    </div>
                  </div>
                  
                  {match.player3Name && (
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${
                      isPlayer1Winner 
                        ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                        : 'bg-blue-50 dark:bg-blue-950/20'
                    }`}>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isPlayer1Winner ? 'bg-green-500/20' : 'bg-blue-500/20'
                      }`}>
                        {isPlayer1Winner ? (
                          <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${
                          isPlayer1Winner 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {match.player3Name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex items-center justify-center">
                <div className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-600 dark:text-gray-400">
                  VS
                </div>
              </div>

              {/* Team 2 */}
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  {match.category === 'singles' ? 'Player 2' : 'Team 2'}
                </div>
                <div className="space-y-3">
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${
                    isPlayer2Winner 
                      ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                      : 'bg-pink-50 dark:bg-pink-950/20'
                  }`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isPlayer2Winner ? 'bg-green-500/20' : 'bg-pink-500/20'
                    }`}>
                      {isPlayer2Winner ? (
                        <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <UserCheck className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${
                        isPlayer2Winner 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {match.player2Name || 'TBD'}
                      </p>
                    </div>
                  </div>
                  
                  {match.player4Name && (
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${
                      isPlayer2Winner 
                        ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                        : 'bg-pink-50 dark:bg-pink-950/20'
                    }`}>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isPlayer2Winner ? 'bg-green-500/20' : 'bg-pink-500/20'
                      }`}>
                        {isPlayer2Winner ? (
                          <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <UserCheck className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${
                          isPlayer2Winner 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {match.player4Name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Details Card */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Match Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {match.scheduledDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled Date</div>
                    <div className="text-gray-900 dark:text-white">
                      {new Date(match.scheduledDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              )}

              {match.scheduledTime && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled Time</div>
                    <div className="text-gray-900 dark:text-white">{match.scheduledTime}</div>
                  </div>
                </div>
              )}

              {match.court && (
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Court</div>
                    <div className="text-gray-900 dark:text-white">{match.court}</div>
                  </div>
                </div>
              )}

              {match.venue && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Venue</div>
                    <div className="text-gray-900 dark:text-white">{match.venue}</div>
                  </div>
                </div>
              )}

              {match.startTime && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Started</div>
                    <div className="text-gray-900 dark:text-white">
                      {new Date(match.startTime).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </div>
                  </div>
                </div>
              )}

              {match.duration && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</div>
                    <div className="text-gray-900 dark:text-white">{match.duration} minutes</div>
                  </div>
                </div>
              )}

              {match.notes && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</div>
                  <p className="text-gray-900 dark:text-white">{match.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

