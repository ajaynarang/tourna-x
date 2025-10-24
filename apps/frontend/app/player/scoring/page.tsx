'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import LiveScoring from '@/components/live-scoring';
import { ArrowLeft, Trophy, Users, Calendar, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';

interface Match {
  _id: string;
  tournamentId: string;
  tournamentName: string;
  round: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  scheduledDate: string;
  court: string;
  status: string;
  player1Score: number[];
  player2Score: number[];
  winnerId?: string;
}

interface Player {
  name: string;
  score: number;
  id: string;
}

export default function MatchScoring() {
  return (
    <AuthGuard requiredRoles={['player', 'admin']}>
      <MatchScoringContent />
    </AuthGuard>
  );
}

function MatchScoringContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');
  
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  useEffect(() => {
    if (matchId) {
      fetchMatch();
    } else {
      setError('No match ID provided');
      setIsLoading(false);
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/matches/${matchId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setMatch(result.data);
      } else {
        setError(result.error || 'Failed to fetch match details');
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      setError('Failed to fetch match details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreUpdate = (playerA: Player, playerB: Player, history: any[]) => {
    // Update match scores in real-time
    console.log('Score updated:', { playerA, playerB, history });
    
    // Here you would typically send the score update to your API
    // For now, we'll just log it
  };

  const handleMatchComplete = (winner: Player, finalScore: { playerA: number; playerB: number }) => {
    // Handle match completion
    console.log('Match completed:', { winner, finalScore });
    
    // Here you would typically:
    // 1. Send final score to API
    // 2. Update match status to completed
    // 3. Redirect to match results or tournament page
    
    // For demo purposes, show an alert
    alert(`Match completed! ${winner.name} won ${finalScore.playerA}-${finalScore.playerB}`);
    
    // Redirect back to matches page
    router.push('/player/matches');
  };

  const canScore = () => {
    if (!match || !user) return false;
    
    // Allow scoring if:
    // 1. User is admin, OR
    // 2. User is one of the players in the match, OR
    // 3. Match status is 'in_progress'
    return (
      user.role === 'admin' ||
      match.player1Id === user._id ||
      match.player2Id === user._id ||
      match.status === 'in_progress'
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
              <p className="text-red-600 mb-4">{error || 'Match not found'}</p>
              <Button onClick={() => router.push('/player/matches')}>
                Back to Matches
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!canScore()) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">Access Denied</h2>
              <p className="text-yellow-600 mb-4">
                You don't have permission to score this match.
              </p>
              <Button onClick={() => router.push('/player/matches')}>
                Back to Matches
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isScoring) {
    const playerA: Player = {
      name: match.player1Name,
      score: match.player1Score?.[0] || 0,
      id: match.player1Id
    };
    
    const playerB: Player = {
      name: match.player2Name,
      score: match.player2Score?.[0] || 0,
      id: match.player2Id
    };

    return (
      <LiveScoring
        matchId={match._id}
        playerA={playerA}
        playerB={playerB}
        onScoreUpdate={handleScoreUpdate}
        onMatchComplete={handleMatchComplete}
      />
    );
  }

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/player/matches"
              className="text-secondary hover:text-primary flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Matches
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Match Scoring</h1>
          <p className="text-secondary">Live scoring for your tournament match</p>
        </div>

        {/* Match Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {match.tournamentName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-primary mb-2">Match Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-tertiary" />
                      <span><strong>Round:</strong> {match.round}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-tertiary" />
                      <span><strong>Date:</strong> {new Date(match.scheduledDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-tertiary" />
                      <span><strong>Time:</strong> {new Date(match.scheduledDate).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    {match.court && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-tertiary" />
                        <span><strong>Court:</strong> {match.court}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-primary mb-2">Players</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-800">{match.player1Name}</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Player 1
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <span className="font-medium text-emerald-800">{match.player2Name}</span>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                        Player 2
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-primary mb-2">Match Status</h3>
                  <Badge 
                    variant={match.status === 'in_progress' ? 'default' : 'secondary'}
                    className={
                      match.status === 'in_progress' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {match.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Scoring Button */}
        <div className="text-center">
          <Button
            onClick={() => setIsScoring(true)}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold"
          >
            Start Live Scoring
          </Button>
          <p className="text-sm text-secondary mt-2">
            Begin tracking points and analyzing match performance
          </p>
        </div>
      </motion.div>
    </div>
  );
}
