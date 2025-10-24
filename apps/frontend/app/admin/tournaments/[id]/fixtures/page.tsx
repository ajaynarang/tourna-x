'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import LiveScoring from '@/components/live-scoring';
import { Match as BaseMatch } from '@repo/schemas';
import { motion } from 'framer-motion';

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
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  format: string;
  venue: string;
}

export default function TournamentFixturesPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <TournamentFixturesContent params={params} />
    </AuthGuard>
  );
}

function TournamentFixturesContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [tournamentId, setTournamentId] = useState<string>('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    venue: '',
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
    setShowScoringModal(true);
  };

  const handleScoreUpdate = (updatedMatch: Match) => {
    // Update the match in the local state
    setMatches(prevMatches => 
      prevMatches.map(m => m._id === updatedMatch._id ? updatedMatch : m)
    );
  };

  const handleLiveScoreUpdate = (playerA: any, playerB: any, history: any[]) => {
    if (!selectedMatch) return;
    
    // Convert LiveScoring format to Match format
    const updatedMatch: Match = {
      ...selectedMatch,
      player1Score: [playerA.score],
      player2Score: [playerB.score],
      status: 'in_progress'
    };
    
    handleScoreUpdate(updatedMatch);
  };

  const handleMatchComplete = (winner: any, finalScore: { playerA: number; playerB: number }) => {
    if (!selectedMatch) return;
    
    const updatedMatch: Match = {
      ...selectedMatch,
      player1Score: [finalScore.playerA],
      player2Score: [finalScore.playerB],
      status: 'completed',
      winnerId: winner.id === selectedMatch.player1Id ? selectedMatch.player1Id : selectedMatch.player2Id
    };
    
    handleScoreUpdate(updatedMatch);
    setShowScoringModal(false);
    setSelectedMatch(null);
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
      } else {
        alert(data.error || 'Failed to schedule match');
      }
    } catch (error) {
      console.error('Error scheduling match:', error);
      alert('Failed to schedule match');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
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

  const getMatchStatusBadge = (match: Match) => {
    switch (match.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
            <Play className="h-3 w-3" />
            Ongoing
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-500">
            <Clock className="h-3 w-3" />
            Scheduled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-500">
            <Clock className="h-3 w-3" />
            Not Scheduled
          </span>
        );
    }
  };

  return (
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
            className="text-secondary hover:text-primary mb-4 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Fixtures
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-primary mb-2 text-3xl font-bold">Tournament Fixtures</h1>
              <p className="text-secondary">{tournament?.name}</p>
            </div>

            <Link
              href={`/admin/scoring/${tournamentId}`}
              className="bg-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-all hover:opacity-90"
            >
              <Edit className="h-5 w-5" />
              Start Scoring
            </Link>
          </div>
        </motion.div>

        {/* Matches by Round */}
        {rounds.map((round, index) => (
          <motion.div
            key={round}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="mb-8"
          >
            <h2 className="text-primary mb-4 flex items-center gap-2 text-xl font-semibold">
              <Trophy className="h-6 w-6 text-green-500" />
              {round}
            </h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matchesByRound[round]?.map((match) => (
                <div key={match._id} className="glass-card-intense rounded-xl p-6">
                  {/* Match Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-tertiary text-sm">Match {match.matchNumber}</p>
                      {match.category && (
                        <p className="text-tertiary text-xs">{match.category}</p>
                      )}
                    </div>
                    {getMatchStatusBadge(match)}
                  </div>

                  {/* Players */}
                  <div className="mb-4 space-y-3">
                    <div
                      className={`flex items-center justify-between rounded-lg p-3 ${
                        match.winnerId === match.player1Id
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'glass-card'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className={`font-medium ${match.player1Name === 'TBD' || !match.player1Name ? 'text-gray-500 italic' : 'text-primary'}`}>
                          {match.player1Name || 'TBD'}
                        </span>
                      </div>
                      {match.status === 'completed' && match.player1Score.length > 0 && (
                        <span className="text-primary font-bold">
                          {match.player1Score.join(', ')}
                        </span>
                      )}
                    </div>

                    <div className="text-tertiary text-center text-xs">VS</div>

                    <div
                      className={`flex items-center justify-between rounded-lg p-3 ${
                        match.winnerId === match.player2Id
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'glass-card'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className={`font-medium ${match.player2Name === 'TBD' || !match.player2Name ? 'text-gray-500 italic' : 'text-primary'}`}>
                          {match.player2Name || 'TBD'}
                        </span>
                      </div>
                      {match.status === 'completed' && match.player2Score.length > 0 && (
                        <span className="text-primary font-bold">
                          {match.player2Score.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Schedule Info */}
                  {(match.scheduledDate || match.scheduledTime || match.venue) && (
                    <div className="mb-4 space-y-2 border-t border-white/10 pt-4">
                      {match.scheduledDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-secondary">
                            {new Date(match.scheduledDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {match.scheduledTime && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-secondary">{match.scheduledTime}</span>
                        </div>
                      )}
                      {match.venue && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-secondary">{match.venue}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {match.status !== 'completed' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleScheduleMatch(match)}
                        className="glass-card w-full rounded-lg px-4 py-2 text-sm font-medium text-secondary transition-all hover:bg-white/10"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {match.scheduledDate ? 'Reschedule' : 'Schedule Match'}
                        </span>
                      </button>
                      
                      {(match.status === 'scheduled' || match.status === 'in_progress') && (
                        <button
                          onClick={() => handleScoreMatch(match)}
                          className="glass-card-intense w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-600/80"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <Target className="h-4 w-4" />
                            {match.status === 'scheduled' ? 'Start Scoring' : 'Live Score'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {matches.length === 0 && (
          <div className="py-12 text-center">
            <Trophy className="text-secondary mx-auto h-16 w-16" />
            <p className="text-secondary mt-4">No fixtures generated yet</p>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card-intense w-full max-w-md rounded-2xl p-6"
          >
            <h3 className="text-primary mb-4 text-xl font-bold">Schedule Match</h3>
            <p className="text-secondary mb-6 text-sm">
              {selectedMatch.player1Name} vs {selectedMatch.player2Name}
            </p>

            <div className="mb-6 space-y-4">
              <div>
                <label className="text-primary mb-2 block text-sm font-medium">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                  className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
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
                  className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                />
              </div>

              <div>
                <label className="text-primary mb-2 block text-sm font-medium">Venue</label>
                <input
                  type="text"
                  value={scheduleData.venue}
                  onChange={(e) => setScheduleData({ ...scheduleData, venue: e.target.value })}
                  className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                  placeholder="Enter venue"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedMatch(null);
                }}
                className="glass-card flex-1 rounded-lg px-4 py-2 font-medium text-secondary transition-all hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={!scheduleData.date || !scheduleData.time}
                className="bg-primary flex-1 rounded-lg px-4 py-2 font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Schedule
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Scoring Modal */}
      {showScoringModal && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-card-intense w-full max-w-2xl rounded-2xl p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-primary text-xl font-bold">Live Scoring</h3>
              <button
                onClick={() => {
                  setShowScoringModal(false);
                  setSelectedMatch(null);
                }}
                className="glass-card rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <LiveScoring 
              matchId={selectedMatch._id || ''} 
              playerA={{
                name: selectedMatch.player1Name || 'Player 1',
                score: selectedMatch.player1Score?.[0] || 0,
                id: selectedMatch.player1Id || ''
              }}
              playerB={{
                name: selectedMatch.player2Name || 'Player 2',
                score: selectedMatch.player2Score?.[0] || 0,
                id: selectedMatch.player2Id || ''
              }}
              onScoreUpdate={handleLiveScoreUpdate}
              onMatchComplete={handleMatchComplete}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
