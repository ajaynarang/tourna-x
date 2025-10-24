'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Trophy, Clock, Users, AlertCircle } from 'lucide-react';
import { Match as BaseMatch } from '@repo/schemas';

// Extended Match interface with new scoring fields
interface Match extends BaseMatch {
  games?: Array<{
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    winner?: 'player1' | 'player2';
    duration?: number;
    completedAt?: string;
  }>;
  matchResult?: {
    player1GamesWon: number;
    player2GamesWon: number;
    totalDuration?: number;
    completedAt?: string;
  };
}

interface ScoringFormat {
  pointsPerGame: number;
  gamesPerMatch: number;
  winBy: number;
  maxPoints?: number;
}

interface Game {
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  winner?: 'player1' | 'player2';
  duration?: number;
  completedAt?: string;
}

interface LiveScoringProps {
  matchId: string;
  onScoreUpdate?: (match: Match) => void;
}

export function LiveScoring({ matchId, onScoreUpdate }: LiveScoringProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentGame, setCurrentGame] = useState(1);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [showWalkoverModal, setShowWalkoverModal] = useState(false);
  const [walkoverReason, setWalkoverReason] = useState('');
  const [walkoverWinner, setWalkoverWinner] = useState<'player1' | 'player2'>('player1');

  // Fetch match data
  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}/score`);
      const result = await response.json();
      
      if (result.success) {
        setMatch(result.match);
        // Update current game and scores based on match state
        updateCurrentGameState(result.match);
      }
    } catch (error) {
      console.error('Error fetching match:', error);
    }
  };

  const updateCurrentGameState = (matchData: Match) => {
    if (matchData.games && matchData.games.length > 0) {
      const latestGame = matchData.games[matchData.games.length - 1];
      if (!latestGame.winner) {
        setCurrentGame(latestGame.gameNumber);
        setPlayer1Score(latestGame.player1Score);
        setPlayer2Score(latestGame.player2Score);
      } else {
        // Start next game
        const nextGameNumber = latestGame.gameNumber + 1;
        setCurrentGame(nextGameNumber);
        setPlayer1Score(0);
        setPlayer2Score(0);
      }
    }
  };

  const updateScore = async (action: string, data?: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          gameNumber: currentGame,
          player1Score,
          player2Score,
          scoringFormat: match?.scoringFormat,
          ...data
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMatch(result.match);
        updateCurrentGameState(result.match);
        onScoreUpdate?.(result.match);
      }
    } catch (error) {
      console.error('Error updating score:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementScore = (player: 'player1' | 'player2') => {
    if (match?.status !== 'in_progress') return;
    
    if (player === 'player1') {
      setPlayer1Score(prev => prev + 1);
    } else {
      setPlayer2Score(prev => prev + 1);
    }
  };

  const decrementScore = (player: 'player1' | 'player2') => {
    if (match?.status !== 'in_progress') return;
    
    if (player === 'player1') {
      setPlayer1Score(prev => Math.max(0, prev - 1));
    } else {
      setPlayer2Score(prev => Math.max(0, prev - 1));
    }
  };

  const startMatch = () => updateScore('start_match');
  const endMatch = () => updateScore('end_match');
  const cancelMatch = () => updateScore('cancel_match');

  const handleWalkover = () => {
    updateScore('walkover', {
      walkoverReason,
      winner: walkoverWinner
    });
    setShowWalkoverModal(false);
  };

  const getGameStatus = () => {
    if (!match?.scoringFormat) return '';
    
    const { pointsPerGame, winBy, maxPoints } = match.scoringFormat;
    const scoreDiff = Math.abs(player1Score - player2Score);
    
    if (player1Score >= pointsPerGame || player2Score >= pointsPerGame) {
      if (scoreDiff >= winBy) {
        return 'Game Point';
      }
      if (maxPoints && (player1Score >= maxPoints || player2Score >= maxPoints)) {
        return 'Sudden Death';
      }
    }
    
    return '';
  };

  const getMatchStatus = () => {
    if (!match) return '';
    
    switch (match.status) {
      case 'scheduled': return 'Scheduled';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'walkover': return 'Walkover';
      case 'cancelled': return 'Cancelled';
      default: return '';
    }
  };

  const getStatusColor = () => {
    switch (match?.status) {
      case 'scheduled': return 'text-blue-500';
      case 'in_progress': return 'text-green-500';
      case 'completed': return 'text-purple-500';
      case 'walkover': return 'text-orange-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (!match) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 space-y-6">
      {/* Match Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-gray-400" />
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getMatchStatus()}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {match.player1Name} vs {match.player2Name}
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {match.scoringFormat.pointsPerGame} points per game • Best of {match.scoringFormat.gamesPerMatch}
        </div>
      </div>

      {/* Games Summary */}
      {match.games && match.games.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Games</h3>
          <div className="grid grid-cols-3 gap-2">
            {match.games.map((game, index) => (
              <div
                key={game.gameNumber}
                className={`glass-card rounded-lg p-3 text-center ${
                  game.winner ? 'ring-2 ring-green-500/50' : ''
                }`}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400">Game {game.gameNumber}</div>
                <div className="text-sm font-medium">
                  {game.player1Score} - {game.player2Score}
                </div>
                {game.winner && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {game.winner === 'player1' ? match.player1Name : match.player2Name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Game Score */}
      {match.status === 'in_progress' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Game {currentGame} {getGameStatus() && `• ${getGameStatus()}`}
            </div>
            
            <div className="flex items-center justify-center gap-8">
              {/* Player 1 */}
              <div className="text-center space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {match.player1Name}
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {player1Score}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => decrementScore('player1')}
                    disabled={loading || player1Score === 0}
                    className="glass-card rounded-lg px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <button
                    onClick={() => incrementScore('player1')}
                    disabled={loading}
                    className="glass-card rounded-lg px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* VS */}
              <div className="text-2xl font-bold text-gray-400">VS</div>

              {/* Player 2 */}
              <div className="text-center space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {match.player2Name}
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {player2Score}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => decrementScore('player2')}
                    disabled={loading || player2Score === 0}
                    className="glass-card rounded-lg px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <button
                    onClick={() => incrementScore('player2')}
                    disabled={loading}
                    className="glass-card rounded-lg px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Update Score Button */}
          <div className="flex justify-center">
            <button
              onClick={() => updateScore('update_score')}
              disabled={loading}
              className="glass-card-intense rounded-lg px-6 py-2 text-sm font-medium text-white hover:bg-green-600/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Score'}
            </button>
          </div>
        </div>
      )}

      {/* Match Result */}
      {match.status === 'completed' && match.matchResult && (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Winner: {match.winnerName}
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {match.matchResult.player1GamesWon} - {match.matchResult.player2GamesWon}
            {match.matchResult.totalDuration && ` • ${match.matchResult.totalDuration} minutes`}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        {match.status === 'scheduled' && (
          <button
            onClick={startMatch}
            disabled={loading}
            className="flex items-center gap-2 glass-card-intense rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-green-600/80 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Start Match
          </button>
        )}

        {match.status === 'in_progress' && (
          <>
            <button
              onClick={endMatch}
              disabled={loading}
              className="flex items-center gap-2 glass-card rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50"
            >
              <Square className="h-4 w-4" />
              End Match
            </button>
            <button
              onClick={() => setShowWalkoverModal(true)}
              disabled={loading}
              className="flex items-center gap-2 glass-card rounded-lg px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50"
            >
              <AlertCircle className="h-4 w-4" />
              Walkover
            </button>
          </>
        )}

        {(match.status === 'scheduled' || match.status === 'in_progress') && (
          <button
            onClick={cancelMatch}
            disabled={loading}
            className="flex items-center gap-2 glass-card rounded-lg px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            <Pause className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>

      {/* Walkover Modal */}
      <AnimatePresence>
        {showWalkoverModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowWalkoverModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-intense rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Record Walkover
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Winner
                  </label>
                  <select
                    value={walkoverWinner}
                    onChange={(e) => setWalkoverWinner(e.target.value as 'player1' | 'player2')}
                    className="glass-card w-full rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none"
                  >
                    <option value="player1">{match.player1Name}</option>
                    <option value="player2">{match.player2Name}</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Reason
                  </label>
                  <textarea
                    value={walkoverReason}
                    onChange={(e) => setWalkoverReason(e.target.value)}
                    placeholder="e.g., Player did not show up, injury, etc."
                    className="glass-card w-full rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none resize-none"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowWalkoverModal(false)}
                  className="flex-1 glass-card rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWalkover}
                  disabled={loading || !walkoverReason.trim()}
                  className="flex-1 glass-card-intense rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-orange-600/80 disabled:opacity-50"
                >
                  Record Walkover
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
