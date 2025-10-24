'use client';

import React, { useState } from 'react';
import { Undo2, Settings, BarChart3, X, Trophy, ArrowLeft } from 'lucide-react';
import { 
  ScoringFormat, 
  MatchScore, 
  GameScore, 
  updateMatchScore, 
  initializeMatch,
  getGameDisplayText,
  getMatchDisplayText
} from '@/lib/scoring-utils';

interface Player {
  name: string;
  score: number;
  id: string;
}

interface PointHistory {
  player: string;
  reason: string | null;
  scoreA: number;
  scoreB: number;
  timestamp: Date;
}

interface LiveScoringProps {
  matchId: string;
  playerA: Player;
  playerB: Player;
  scoringFormat: ScoringFormat;
  onScoreUpdate?: (matchScore: MatchScore, history: PointHistory[]) => void;
  onMatchComplete?: (winner: Player, finalScore: MatchScore) => void;
  onViewDetails?: () => void;
}

export default function LiveScoring({ 
  matchId, 
  playerA: initialPlayerA, 
  playerB: initialPlayerB,
  scoringFormat,
  onScoreUpdate,
  onMatchComplete,
  onViewDetails
}: LiveScoringProps) {
  const [playerA, setPlayerA] = useState({ name: initialPlayerA.name, score: initialPlayerA.score });
  const [playerB, setPlayerB] = useState({ name: initialPlayerB.name, score: initialPlayerB.score });
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentPoint, setCurrentPoint] = useState<{ player: string; winner: string } | null>(null);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [showSettings, setShowSettings] = useState(true);
  const [matchScore, setMatchScore] = useState<MatchScore>(initializeMatch(scoringFormat));

  const pointCategories = {
    winner: [
      { id: 'smash', label: '🏸 Smash', color: 'bg-red-500' },
      { id: 'drop', label: '💧 Drop Shot', color: 'bg-blue-500' },
      { id: 'net', label: '🎯 Net Kill', color: 'bg-purple-500' },
      { id: 'clear', label: '🌙 Clear', color: 'bg-yellow-500' },
      { id: 'drive', label: '⚡ Drive', color: 'bg-orange-500' },
    ],
    error: [
      { id: 'unforced', label: '❌ Opponent Error', color: 'bg-gray-500' },
      { id: 'forced', label: '💪 Forced Error', color: 'bg-green-500' },
    ]
  };

  const handleScore = (player: string) => {
    if (trackingEnabled) {
      setCurrentPoint({ player, winner: player });
      setShowAnalysis(true);
    } else {
      addPoint(player, null);
    }
  };

  const addPoint = (player: string, reason: string | null) => {
    const scoringPlayer = player === 'A' ? 'player1' : 'player2';
    const updatedMatchScore = updateMatchScore(matchScore, scoringPlayer, scoringFormat);
    
    const newHistory = [...history, {
      player,
      reason,
      scoreA: updatedMatchScore.games[updatedMatchScore.games.length - 1]?.player1Score || 0,
      scoreB: updatedMatchScore.games[updatedMatchScore.games.length - 1]?.player2Score || 0,
      timestamp: new Date()
    }];
    
    setHistory(newHistory);
    setMatchScore(updatedMatchScore);
    setShowAnalysis(false);
    setCurrentPoint(null);
    
    // Notify parent component
    onScoreUpdate?.(updatedMatchScore, newHistory);
    
    // Check if match is complete
    if (updatedMatchScore.isMatchComplete && updatedMatchScore.winner) {
      const winner = updatedMatchScore.winner === 'player1' ? playerA : playerB;
      onMatchComplete?.(winner, updatedMatchScore);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    const lastPoint = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    setHistory(newHistory);
    
    // Update match score by removing the last point
    const scoringPlayer = lastPoint.player === 'A' ? 'player1' : 'player2';
    const updatedMatchScore = updateMatchScore(matchScore, scoringPlayer, scoringFormat);
    
    // For undo, we need to reverse the scoring logic
    // This is a simplified approach - in a real implementation, you'd want to store the previous state
    const currentGameIndex = matchScore.currentGame - 1;
    const currentGame = matchScore.games[currentGameIndex];
    
    if (currentGame) {
      const newGame = {
        ...currentGame,
        player1Score: lastPoint.player === 'A' ? currentGame.player1Score - 1 : currentGame.player1Score,
        player2Score: lastPoint.player === 'B' ? currentGame.player2Score - 1 : currentGame.player2Score,
        isGameComplete: false,
        winner: undefined,
        isDeuce: false
      };
      
      const updatedGames = [...matchScore.games];
      updatedGames[currentGameIndex] = newGame;
      
      const updatedMatchScoreUndo = {
        ...matchScore,
        games: updatedGames,
        isMatchComplete: false,
        winner: undefined
      };
      
      setMatchScore(updatedMatchScoreUndo);
      
      // Notify parent component
      onScoreUpdate?.(updatedMatchScoreUndo, newHistory);
    }
  };

  const handleAnalysisSelect = (reasonId: string) => {
    addPoint(currentPoint!.player, reasonId);
  };

  const skipAnalysis = () => {
    addPoint(currentPoint!.player, 'skipped');
  };

  const getStats = () => {
    const stats = { A: {} as Record<string, number>, B: {} as Record<string, number> };
    
    history.forEach(point => {
      if (point.reason && point.reason !== 'skipped') {
        const player = point.player === 'A' ? 'A' : 'B';
        if (!stats[player][point.reason]) {
          stats[player][point.reason] = 0;
        }
        stats[player][point.reason]++;
      }
    });
    
    return stats;
  };

  const stats = getStats();

  // Show completion screen if match is complete
  if (matchScore.isMatchComplete && matchScore.winner) {
    const winner = matchScore.winner === 'player1' ? playerA : playerB;
    const loser = matchScore.winner === 'player1' ? playerB : playerA;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black flex items-center justify-center p-6 relative overflow-hidden">
        {/* Celebration Confetti Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-20 right-20 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-32 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-16 right-1/3 w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-24 left-3/4 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="max-w-2xl w-full relative z-10">
          {/* Match Complete Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
              <Trophy className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Match Complete!</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">🏆 {winner.name} Wins! 🏆</p>
          </div>

          {/* Winner Display */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 mb-6 text-center shadow-xl relative overflow-hidden">
            {/* Celebration Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-green-400/10 to-yellow-400/10 animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/20 mr-6 animate-bounce">
                  <Trophy className="h-12 w-12 text-yellow-500" />
                </div>
                <div className="text-left">
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{winner.name}</h2>
                  <p className="text-2xl text-green-600 dark:text-green-400 font-bold">🏆 WINNER 🏆</p>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">Congratulations!</p>
                </div>
              </div>
              
              {/* Victory Message */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                  🎉 {winner.name} has won the match! 🎉
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Great game! Well played by both players.
                </p>
              </div>
              
              {/* Final Score */}
              <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4">Final Match Score</h3>
                <div className="flex justify-center items-center gap-8">
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{winner.name}</div>
                    <div className="text-5xl font-bold text-green-600 dark:text-green-400">{matchScore.player1GamesWon}</div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-semibold">WINNER</div>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-3xl font-bold">-</div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{loser.name}</div>
                    <div className="text-5xl font-bold text-gray-500 dark:text-gray-400">{matchScore.player2GamesWon}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Runner-up</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Breakdown */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6 shadow-xl">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Game Breakdown</h4>
            <div className="space-y-2">
              {matchScore.games.map((game, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700/30 rounded-lg p-3">
                  <span className="text-gray-700 dark:text-gray-300">Game {index + 1}</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {game.player1Score} - {game.player2Score}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {game.winner === 'player1' ? winner.name : loser.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.href = '/admin/practice-matches'}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              <ArrowLeft className="inline mr-2 h-5 w-5" />
              Back to Matches
            </button>
            <button
              onClick={() => onViewDetails?.()}
              className="flex-1 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              <BarChart3 className="inline mr-2 h-5 w-5" />
              View Match Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Badminton Scorer</h1>
          <div className="flex gap-2">
            {/* <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 glass-card rounded-lg hover:bg-white/5 transition"
            >
              <Settings size={20} className="text-tertiary" />
            </button> */}
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-2 glass-card rounded-lg hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Undo2 size={20} className="text-tertiary" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="max-w-4xl mx-auto mb-6 glass-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1 text-primary">Point Analysis Tracking</h3>
              <p className="text-sm text-tertiary">Record why each point was won/lost</p>
            </div>
            <button
              onClick={() => setTrackingEnabled(!trackingEnabled)}
              className={`relative w-14 h-8 rounded-full transition ${
                trackingEnabled ? 'bg-primary' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  trackingEnabled ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Match Score Display */}
      <div className="max-w-4xl mx-auto mb-6 px-6">
        <div className="glass-card-intense rounded-2xl p-4 text-center">
          <h3 className="text-lg font-semibold text-primary mb-2">Match Score</h3>
          <div className="text-3xl font-bold text-primary">
            {getMatchDisplayText(matchScore)}
          </div>
          {matchScore.games.length > 0 && (
            <div className="text-sm text-tertiary mt-2">
              Game {matchScore.currentGame} of {scoringFormat.gamesPerMatch}
            </div>
          )}
        </div>
      </div>

      {/* Current Game Score Display */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4 mb-8 px-6">
        {/* Player A */}
        <div className="glass-card-intense rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold mb-2 opacity-90 text-primary">{playerA.name}</h2>
          <div className="text-7xl font-bold mb-4 text-primary">
            {matchScore.games[matchScore.games.length - 1]?.player1Score || 0}
          </div>
          {matchScore.games[matchScore.games.length - 1]?.isDeuce && (
            <div className="text-sm text-yellow-500 mb-2">Deuce!</div>
          )}
          <button
            onClick={() => handleScore('A')}
            disabled={matchScore.isMatchComplete}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Point
          </button>
        </div>

        {/* Player B */}
        <div className="glass-card-intense rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold mb-2 opacity-90 text-primary">{playerB.name}</h2>
          <div className="text-7xl font-bold mb-4 text-primary">
            {matchScore.games[matchScore.games.length - 1]?.player2Score || 0}
          </div>
          {matchScore.games[matchScore.games.length - 1]?.isDeuce && (
            <div className="text-sm text-yellow-500 mb-2">Deuce!</div>
          )}
          <button
            onClick={() => handleScore('B')}
            disabled={matchScore.isMatchComplete}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Point
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {trackingEnabled && history.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8 glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={20} className="text-primary" />
            <h3 className="font-semibold text-primary">Quick Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-primary font-semibold mb-2">{playerA.name}</p>
              {Object.entries(stats.A).map(([key, value]) => {
                const category = [...pointCategories.winner, ...pointCategories.error].find(c => c.id === key);
                return (
                  <div key={key} className="flex justify-between text-tertiary">
                    <span>{category?.label || key}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                );
              })}
            </div>
            <div>
              <p className="text-primary font-semibold mb-2">{playerB.name}</p>
              {Object.entries(stats.B).map(([key, value]) => {
                const category = [...pointCategories.winner, ...pointCategories.error].find(c => c.id === key);
                return (
                  <div key={key} className="flex justify-between text-tertiary">
                    <span>{category?.label || key}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysis && currentPoint && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="glass-card-intense rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-primary">
                How did {currentPoint.player === 'A' ? playerA.name : playerB.name} score?
              </h3>
              <button
                onClick={skipAnalysis}
                className="text-tertiary hover:text-primary"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-tertiary mb-2 font-semibold">Winning Shots</p>
                <div className="grid grid-cols-2 gap-2">
                  {pointCategories.winner.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleAnalysisSelect(cat.id)}
                      className={`${cat.color} py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition transform active:scale-95 text-white`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-tertiary mb-2 font-semibold">Opponent Mistakes</p>
                <div className="grid grid-cols-2 gap-2">
                  {pointCategories.error.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleAnalysisSelect(cat.id)}
                      className={`${cat.color} py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition transform active:scale-95 text-white`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={skipAnalysis}
                className="w-full glass-card text-tertiary py-3 rounded-lg hover:bg-white/5 transition"
              >
                Skip Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}