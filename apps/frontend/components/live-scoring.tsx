'use client';

import React, { useState } from 'react';
import { Undo2, BarChart3, X, Trophy, ArrowLeft } from 'lucide-react';
import { useScoring } from '@/contexts/scoring-context';
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
  const { setIsScoring } = useScoring();
  
  // Set scoring mode when component mounts
  React.useEffect(() => {
    setIsScoring(true);
    
    return () => {
      setIsScoring(false);
    };
  }, [setIsScoring]);
  
  const [playerA, setPlayerA] = useState({ name: initialPlayerA.name, score: initialPlayerA.score });
  const [playerB, setPlayerB] = useState({ name: initialPlayerB.name, score: initialPlayerB.score });
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentPoint, setCurrentPoint] = useState<{ player: string; winner: string } | null>(null);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [showSettings, setShowSettings] = useState(true);
  const [matchScore, setMatchScore] = useState<MatchScore>(initializeMatch(scoringFormat));
  const [showNewGameNotification, setShowNewGameNotification] = useState(false);

  // Keyboard shortcuts for quick point analysis
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!showAnalysis || !currentPoint) return;

      const allCategories = [...pointCategories.winner, ...pointCategories.error];
      const key = e.key;

      // Numbers 1-9 for quick selection
      if (key >= '1' && key <= '9') {
        const index = parseInt(key) - 1;
        if (index < allCategories.length) {
          e.preventDefault();
          handleAnalysisSelect(allCategories[index]?.id || '');
        }
      }

      // Escape to skip
      if (key === 'Escape') {
        e.preventDefault();
        skipAnalysis();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showAnalysis, currentPoint]);

  const pointCategories = {
    winner: [
      { id: 'smash', label: 'Smash', color: 'bg-red-600 hover:bg-red-700', description: 'Power shot' },
      { id: 'drop', label: 'Drop', color: 'bg-blue-600 hover:bg-blue-700', description: 'Soft shot' },
      { id: 'net', label: 'Net Kill', color: 'bg-purple-600 hover:bg-purple-700', description: 'At net' },
      { id: 'clear', label: 'Clear', color: 'bg-amber-600 hover:bg-amber-700', description: 'Deep shot' },
      { id: 'drive', label: 'Drive', color: 'bg-orange-600 hover:bg-orange-700', description: 'Fast & flat' },
      { id: 'lob', label: 'Lob', color: 'bg-teal-600 hover:bg-teal-700', description: 'High defensive' },
    ],
    error: [
      { id: 'net_error', label: 'Net Error', color: 'bg-gray-600 hover:bg-gray-700', description: 'Hit net' },
      { id: 'out', label: 'Out', color: 'bg-slate-600 hover:bg-slate-700', description: 'Out of bounds' },
      { id: 'service_fault', label: 'Service Fault', color: 'bg-zinc-600 hover:bg-zinc-700', description: 'Bad serve' },
      { id: 'forced_error', label: 'Forced Error', color: 'bg-green-600 hover:bg-green-700', description: 'Pressure play' },
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
    const previousGameCount = matchScore.games.length;
    const updatedMatchScore = updateMatchScore(matchScore, scoringPlayer, scoringFormat);
    
    // Check if a new game started
    if (updatedMatchScore.games.length > previousGameCount) {
      setShowNewGameNotification(true);
      setTimeout(() => setShowNewGameNotification(false), 3000); // Hide after 3 seconds
    }
    
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
      const winner = updatedMatchScore.winner === 'player1' ? { ...playerA, id: initialPlayerA.id } : { ...playerB, id: initialPlayerB.id };
      
      // Save match result to backend
      saveMatchResult(winner, updatedMatchScore);
      
      // Notify parent component
      onMatchComplete?.(winner, updatedMatchScore);
    }
  };
  
  const saveMatchResult = async (winner: Player, finalScore: MatchScore) => {
    try {
      // Determine which team won based on winner
      const winnerTeam = finalScore.winner === 'player1' ? 'team1' : 'team2';
      
      console.log('[LIVE-SCORING] Saving match result to backend...', {
        matchId,
        winnerTeam,
        player1GamesWon: finalScore.player1GamesWon,
        player2GamesWon: finalScore.player2GamesWon
      });
      
      const response = await fetch(`/api/matches/${matchId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerTeam,
          player1Score: finalScore.games.map(g => g.player1Score),
          player2Score: finalScore.games.map(g => g.player2Score),
          games: finalScore.games,
          player1GamesWon: finalScore.player1GamesWon,
          player2GamesWon: finalScore.player2GamesWon,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('[LIVE-SCORING] Match result saved successfully');
      } else {
        console.error('[LIVE-SCORING] Failed to save match result:', data.error);
      }
    } catch (error) {
      console.error('[LIVE-SCORING] Error saving match result:', error);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    const lastPoint = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    setHistory(newHistory);
    
    // Update match score by removing the last point
    const currentGameIndex = matchScore.currentGame - 1;
    const currentGame = matchScore.games[currentGameIndex];
    
    if (currentGame && lastPoint) {
      const newGame = {
        ...currentGame,
        player1Score: lastPoint.player === 'A' ? Math.max(0, currentGame.player1Score - 1) : currentGame.player1Score,
        player2Score: lastPoint.player === 'B' ? Math.max(0, currentGame.player2Score - 1) : currentGame.player2Score,
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
        if (stats[player] && point.reason) {
          if (!stats[player][point.reason]) {
            stats[player][point.reason] = 0;
          }
          if (stats[player][point.reason] !== undefined) {
            stats[player][point.reason] = (stats[player][point.reason] || 0) + 1;
          }
        }
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
      <div 
        className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black flex items-center justify-center p-6 overflow-y-auto z-[9999]"
      >
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 dark:bg-green-500/10 mb-4">
              <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
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
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/20 dark:bg-yellow-500/10 mr-6 animate-bounce">
                  <Trophy className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-left">
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{winner.name}</h2>
                  <p className="text-2xl text-green-600 dark:text-green-400 font-bold">🏆 WINNER 🏆</p>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">Congratulations!</p>
                </div>
              </div>
              
              {/* Victory Message */}
              <div className="bg-green-500/10 dark:bg-green-500/5 border border-green-500/20 dark:border-green-500/10 rounded-xl p-4 mb-6">
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
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = '/practice-matches';
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              <ArrowLeft className="inline mr-2 h-5 w-5" />
              Back to Matches
            </button>
            {onViewDetails && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewDetails();
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-colors"
              >
                View Match Details
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-gray-50 dark:bg-gray-950 overflow-y-auto z-[9999]"
    >
      {/* New Game Notification */}
      {showNewGameNotification && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] animate-in zoom-in-95 duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6 rounded-2xl shadow-2xl text-center">
            <div className="text-2xl font-bold mb-2">🎉 New Game Started! 🎉</div>
            <div className="text-lg">Game {matchScore.games.length} of {scoringFormat.gamesPerMatch}</div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex flex-col min-h-screen px-4 py-4">
        {/* Close Button - Top */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsScoring(false);
              if (onViewDetails) {
                onViewDetails();
              } else {
                window.history.back();
              }
            }}
            className="flex items-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <X size={20} />
            <span>Close</span>
          </button>
        </div>

        {/* Point Analysis Settings - Full Width */}
        {showSettings && (
          <div className="w-full mb-4">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Point Analysis</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Track shot types and analyze gameplay</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTrackingEnabled(!trackingEnabled);
                  }}
                  className={`relative w-14 h-7 rounded-full transition ${
                    trackingEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                      trackingEnabled ? 'translate-x-7' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Match Score Display - Full Width */}
        <div className="w-full mb-6">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Overall Match Score</h3>
            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
              {getMatchDisplayText(matchScore)}
            </div>
            {matchScore.games.length > 0 && (
              <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                Game {matchScore.currentGame} of {scoringFormat.gamesPerMatch}
              </div>
            )}
            {/* Game Progress Indicator */}
            <div className="flex justify-center items-center gap-2 mt-3">
              {Array.from({ length: scoringFormat.gamesPerMatch }, (_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index < matchScore.games.length
                      ? matchScore.games[index]?.winner === 'player1'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                      : index === matchScore.games.length
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
            {/* Game Status */}
            {matchScore.games.length > 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {matchScore.games[matchScore.games.length - 1]?.isGameComplete ? (
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    Game {matchScore.games.length} Complete
                  </span>
                ) : (
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    Game {matchScore.games.length} In Progress
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Undo Button - Full Width */}
        <div className="w-full mb-6">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleUndo();
            }}
            disabled={history.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
          >
            <span className="text-lg font-medium">Undo Last Point</span>
          </button>
        </div>

        {/* Player Cards - Full Width */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Player A */}
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white truncate text-center">{playerA.name}</h2>
            <div className="text-8xl font-bold mb-6 text-gray-900 dark:text-white text-center">
              {matchScore.games[matchScore.games.length - 1]?.player1Score || 0}
            </div>
            {matchScore.games[matchScore.games.length - 1]?.isDeuce && (
              <div className="text-lg text-yellow-600 dark:text-yellow-400 font-semibold mb-4 text-center">Deuce!</div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleScore('A');
              }}
              disabled={matchScore.isMatchComplete}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 rounded-xl transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-xl"
            >
              + Point
            </button>
          </div>

          {/* Player B */}
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white truncate text-center">{playerB.name}</h2>
            <div className="text-8xl font-bold mb-6 text-gray-900 dark:text-white text-center">
              {matchScore.games[matchScore.games.length - 1]?.player2Score || 0}
            </div>
            {matchScore.games[matchScore.games.length - 1]?.isDeuce && (
              <div className="text-lg text-yellow-600 dark:text-yellow-400 font-semibold mb-4 text-center">Deuce!</div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleScore('B');
              }}
              disabled={matchScore.isMatchComplete}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 rounded-xl transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-xl"
            >
              + Point
            </button>
          </div>
        </div>

        {/* Stats - Full Width at Bottom */}
        {trackingEnabled && history.length > 0 && (
          <div className="w-full">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={24} className="text-gray-900 dark:text-white" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Point Analysis Stats</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Player A Stats */}
                <div>
                  <p className="text-gray-900 dark:text-white font-semibold mb-4 text-xl">{playerA.name}</p>
                  <div className="space-y-3">
                    {Object.entries(stats.A).map(([key, value]) => {
                      const category = [...pointCategories.winner, ...pointCategories.error].find(c => c.id === key);
                      if (!category) return null;
                      return (
                        <div key={key} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-4 h-4 rounded-full ${category.color.split(' ')[0]}`}></div>
                            <span className="text-gray-700 dark:text-gray-300 text-base">{category.label}</span>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white text-xl">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Player B Stats */}
                <div>
                  <p className="text-gray-900 dark:text-white font-semibold mb-4 text-xl">{playerB.name}</p>
                  <div className="space-y-3">
                    {Object.entries(stats.B).map(([key, value]) => {
                      const category = [...pointCategories.winner, ...pointCategories.error].find(c => c.id === key);
                      if (!category) return null;
                      return (
                        <div key={key} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-4 h-4 rounded-full ${category.color.split(' ')[0]}`}></div>
                            <span className="text-gray-700 dark:text-gray-300 text-base">{category.label}</span>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white text-xl">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Modal */}
      {showAnalysis && currentPoint && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            skipAnalysis();
          }}
        >
          <div 
            className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  How did {currentPoint.player === 'A' ? playerA.name : playerB.name} score?
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Tap a reason or tap outside to skip</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  skipAnalysis();
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
                title="Skip (Esc)"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-4 sm:space-y-5">
              {/* Winning Shots */}
              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Trophy size={16} className="text-green-600 dark:text-green-400 sm:w-[18px] sm:h-[18px]" />
                  <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Winning Shots</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {pointCategories.winner.map((cat, index) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAnalysisSelect(cat.id);
                      }}
                      className={`${cat.color} py-3 sm:py-4 px-3 sm:px-4 rounded-xl font-semibold transition transform active:scale-95 text-white shadow-lg hover:shadow-xl group relative overflow-hidden touch-manipulation`}
                      title={`${cat.description} (Press ${index + 1})`}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                          <span className="text-base sm:text-lg">{cat.label}</span>
                          <span className="text-xs bg-white/20 rounded px-1.5 py-0.5 font-mono">{index + 1}</span>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opponent Errors */}
              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <X size={16} className="text-gray-600 dark:text-gray-400 sm:w-[18px] sm:h-[18px]" />
                  <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Opponent Errors</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {pointCategories.error.map((cat, index) => {
                    const keyNumber = pointCategories.winner.length + index + 1;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAnalysisSelect(cat.id);
                        }}
                        className={`${cat.color} py-3 sm:py-4 px-3 sm:px-4 rounded-xl font-semibold transition transform active:scale-95 text-white shadow-lg hover:shadow-xl group relative overflow-hidden touch-manipulation`}
                        title={`${cat.description} (Press ${keyNumber})`}
                      >
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                            <span className="text-base sm:text-lg">{cat.label}</span>
                            <span className="text-xs bg-white/20 rounded px-1.5 py-0.5 font-mono">{keyNumber}</span>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skip Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  skipAnalysis();
                }}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 sm:py-4 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition font-semibold border-2 border-gray-200 dark:border-gray-700 touch-manipulation"
              >
                <span className="text-sm sm:text-base">Skip Analysis</span>
                <span className="text-xs ml-2 opacity-60 hidden sm:inline">(Esc)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}