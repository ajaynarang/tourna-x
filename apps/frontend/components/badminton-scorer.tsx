'use client';

import React, { useState } from 'react';
import { Undo2, Settings, BarChart3, X } from 'lucide-react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';

interface PointHistory {
  player: string;
  reason: string | null;
  scoreA: number;
  scoreB: number;
  timestamp: Date;
}

interface BadmintonScorerProps {
  playerA: { name: string; score: number };
  playerB: { name: string; score: number };
  onScoreUpdate: (player: string, reason?: string) => void;
  onUndo: () => void;
  history: PointHistory[];
  trackingEnabled?: boolean;
  onToggleTracking?: (enabled: boolean) => void;
}

export default function BadmintonScorer({
  playerA,
  playerB,
  onScoreUpdate,
  onUndo,
  history,
  trackingEnabled = true,
  onToggleTracking
}: BadmintonScorerProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentPoint, setCurrentPoint] = useState<{ player: string; winner: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

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
      onScoreUpdate(player);
    }
  };

  const handleAnalysisSelect = (reasonId: string) => {
    onScoreUpdate(currentPoint!.player, reasonId);
    setShowAnalysis(false);
    setCurrentPoint(null);
  };

  const skipAnalysis = () => {
    onScoreUpdate(currentPoint!.player, 'skipped');
    setShowAnalysis(false);
    setCurrentPoint(null);
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-card-intense border-b">
        <div className="max-w-4xl mx-auto mb-6 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Badminton Scorer</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 glass-card rounded-lg hover:bg-white/5 transition"
              >
                <Settings size={20} className="text-tertiary" />
              </button>
              <button
                onClick={onUndo}
                disabled={history.length === 0}
                className="p-2 glass-card rounded-lg hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo2 size={20} className="text-tertiary" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && onToggleTracking && (
        <div className="max-w-4xl mx-auto mb-6 glass-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1 text-primary">Point Analysis Tracking</h3>
              <p className="text-sm text-tertiary">Record why each point was won/lost</p>
            </div>
            <button
              onClick={() => onToggleTracking(!trackingEnabled)}
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

      {/* Score Display */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4 mb-8 px-6">
        {/* Player A */}
        <div className="glass-card-intense rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold mb-2 opacity-90 text-primary">{playerA.name}</h2>
          <div className="text-7xl font-bold mb-4 text-primary">{playerA.score}</div>
          <button
            onClick={() => handleScore('A')}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition transform active:scale-95"
          >
            + Point
          </button>
        </div>

        {/* Player B */}
        <div className="glass-card-intense rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold mb-2 opacity-90 text-primary">{playerB.name}</h2>
          <div className="text-7xl font-bold mb-4 text-primary">{playerB.score}</div>
          <button
            onClick={() => handleScore('B')}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition transform active:scale-95"
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
