'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Undo2, 
  Settings, 
  BarChart3, 
  X, 
  Trophy,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui';

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
  onScoreUpdate?: (playerA: Player, playerB: Player, history: PointHistory[]) => void;
  onMatchComplete?: (winner: Player, finalScore: { playerA: number; playerB: number }) => void;
}

const pointCategories = {
  winner: [
    { id: 'smash', label: 'Smash', icon: '🏸', color: 'bg-red-500', description: 'Powerful overhead shot' },
    { id: 'drop', label: 'Drop Shot', icon: '💧', color: 'bg-blue-500', description: 'Soft shot over net' },
    { id: 'net', label: 'Net Kill', icon: '🎯', color: 'bg-purple-500', description: 'Quick net shot' },
    { id: 'clear', label: 'Clear', icon: '🌙', color: 'bg-yellow-500', description: 'High defensive shot' },
    { id: 'drive', label: 'Drive', icon: '⚡', color: 'bg-orange-500', description: 'Fast flat shot' },
  ],
  error: [
    { id: 'unforced', label: 'Opponent Error', icon: '❌', color: 'bg-gray-500', description: 'Unforced mistake' },
    { id: 'forced', label: 'Forced Error', icon: '💪', color: 'bg-green-500', description: 'Forced by pressure' },
  ]
};

export default function LiveScoring({ 
  matchId, 
  playerA: initialPlayerA, 
  playerB: initialPlayerB,
  onScoreUpdate,
  onMatchComplete 
}: LiveScoringProps) {
  const [playerA, setPlayerA] = useState<Player>(initialPlayerA);
  const [playerB, setPlayerB] = useState<Player>(initialPlayerB);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentPoint, setCurrentPoint] = useState<{ player: string; winner: string } | null>(null);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const handleScore = (player: string) => {
    if (trackingEnabled) {
      setCurrentPoint({ player, winner: player });
      setShowAnalysis(true);
    } else {
      addPoint(player, null);
    }
  };

  const addPoint = (player: string, reason: string | null) => {
    const newHistory: PointHistory = {
      player,
      reason,
      scoreA: player === 'A' ? playerA.score + 1 : playerA.score,
      scoreB: player === 'B' ? playerB.score + 1 : playerB.score,
      timestamp: new Date()
    };
    
    const updatedHistory = [...history, newHistory];
    setHistory(updatedHistory);
    
    const updatedPlayerA = player === 'A' ? { ...playerA, score: playerA.score + 1 } : playerA;
    const updatedPlayerB = player === 'B' ? { ...playerB, score: playerB.score + 1 } : playerB;
    
    setPlayerA(updatedPlayerA);
    setPlayerB(updatedPlayerB);
    
    // Check for match completion (21 points)
    if (updatedPlayerA.score >= 21 || updatedPlayerB.score >= 21) {
      const winner = updatedPlayerA.score >= 21 ? updatedPlayerA : updatedPlayerB;
      onMatchComplete?.(winner, { 
        playerA: updatedPlayerA.score, 
        playerB: updatedPlayerB.score 
      });
    }
    
    onScoreUpdate?.(updatedPlayerA, updatedPlayerB, updatedHistory);
    setShowAnalysis(false);
    setCurrentPoint(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    const lastPoint = history[history.length - 1];
    if (!lastPoint) return;
    
    const newHistory = history.slice(0, -1);
    
    setHistory(newHistory);
    
    if (lastPoint.player === 'A') {
      setPlayerA({ ...playerA, score: playerA.score - 1 });
    } else {
      setPlayerB({ ...playerB, score: playerB.score - 1 });
    }
  };

  const handleAnalysisSelect = (reasonId: string) => {
    if (currentPoint) {
      addPoint(currentPoint.player, reasonId);
    }
  };

  const skipAnalysis = () => {
    if (currentPoint?.player) {
      addPoint(currentPoint.player, 'skipped');
    }
  };

  const getStats = () => {
    const stats = { A: {} as Record<string, number>, B: {} as Record<string, number> };
    
    history.forEach(point => {
      if (point.reason && point.reason !== 'skipped' && point.player) {
        const playerKey = point.player as keyof typeof stats;
        if (!stats[playerKey][point.reason]) {
          stats[playerKey][point.reason] = 0;
        }
        stats[playerKey][point.reason] = (stats[playerKey][point.reason] || 0) + 1;
      }
    });
    
    return stats;
  };

  const stats = getStats();
  const totalPoints = history.length;
  const playerAPoints = history.filter(p => p.player === 'A').length;
  const playerBPoints = history.filter(p => p.player === 'B').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Live Scoring</h1>
              <p className="text-sm text-slate-400">Match ID: {matchId}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-50"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              {trackingEnabled && history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStats(!showStats)}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-4xl mx-auto px-4 py-4"
          >
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Point Analysis Tracking</h3>
                    <p className="text-sm text-slate-400">Record why each point was won/lost</p>
                  </div>
                  <button
                    onClick={() => setTrackingEnabled(!trackingEnabled)}
                    className={`relative w-14 h-8 rounded-full transition ${
                      trackingEnabled ? 'bg-green-500' : 'bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        trackingEnabled ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Display */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Player A */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-blue-100">
                  {playerA.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-6xl font-bold text-center mb-4 text-white">
                  {playerA.score}
                </div>
                <Button
                  onClick={() => handleScore('A')}
                  className="w-full bg-white text-blue-700 font-bold py-4 rounded-xl hover:bg-blue-50 transition-colors"
                  size="lg"
                >
                  + Point
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Player B */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-500 shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-emerald-100">
                  {playerB.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-6xl font-bold text-center mb-4 text-white">
                  {playerB.score}
                </div>
                <Button
                  onClick={() => handleScore('B')}
                  className="w-full bg-white text-emerald-700 font-bold py-4 rounded-xl hover:bg-emerald-50 transition-colors"
                  size="lg"
                >
                  + Point
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Progress Bar */}
        {totalPoints > 0 && (
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Match Progress</span>
                <span className="text-sm text-slate-400">{totalPoints} points played</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${(playerAPoints / totalPoints) * 100}%` }}
                  />
                </div>
                <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(playerBPoints / totalPoints) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{playerAPoints} points</span>
                <span>{playerBPoints} points</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        {trackingEnabled && history.length > 0 && (
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5" />
                      Match Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          {playerA.name}
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(stats.A).map(([key, value]) => {
                            const category = [...pointCategories.winner, ...pointCategories.error].find(c => c.id === key);
                            return (
                              <div key={key} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{category?.icon}</span>
                                  <span className="text-slate-300">{category?.label || key}</span>
                                </div>
                                <Badge variant="secondary" className="bg-slate-700 text-white">
                                  {value}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          {playerB.name}
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(stats.B).map(([key, value]) => {
                            const category = [...pointCategories.winner, ...pointCategories.error].find(c => c.id === key);
                            return (
                              <div key={key} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{category?.icon}</span>
                                  <span className="text-slate-300">{category?.label || key}</span>
                                </div>
                                <Badge variant="secondary" className="bg-slate-700 text-white">
                                  {value}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Analysis Modal */}
      <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              How did {currentPoint?.player === 'A' ? playerA.name : playerB.name} score?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Winning Shots
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {pointCategories.winner.map(cat => (
                  <Button
                    key={cat.id}
                    onClick={() => handleAnalysisSelect(cat.id)}
                    className={`${cat.color} hover:opacity-90 transition-all h-auto p-3 flex flex-col items-center gap-1`}
                    variant="default"
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-xs font-semibold">{cat.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-600" />

            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Opponent Mistakes
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {pointCategories.error.map(cat => (
                  <Button
                    key={cat.id}
                    onClick={() => handleAnalysisSelect(cat.id)}
                    className={`${cat.color} hover:opacity-90 transition-all h-auto p-3 flex flex-col items-center gap-1`}
                    variant="default"
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-xs font-semibold">{cat.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={skipAnalysis}
              variant="outline"
              className="w-full bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 hover:text-white"
            >
              Skip Analysis
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}