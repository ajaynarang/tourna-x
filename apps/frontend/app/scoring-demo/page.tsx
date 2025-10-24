'use client';

import { useState } from 'react';
import LiveScoring from '@/components/live-scoring';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { MatchScore } from '@/lib/scoring-utils';

interface PointHistory {
  player: string;
  reason: string | null;
  scoreA: number;
  scoreB: number;
  timestamp: Date;
}

interface Player {
  name: string;
  score: number;
  id: string;
}

export default function ScoringDemo() {
  const [showDemo, setShowDemo] = useState(false);

  const demoPlayerA = {
    name: 'Alice Johnson',
    score: 0,
    id: 'player-a'
  };

  const demoPlayerB = {
    name: 'Bob Smith',
    score: 0,
    id: 'player-b'
  };

  const handleScoreUpdate = (matchScore: MatchScore, history: PointHistory[]) => {
    console.log('Score updated:', { matchScore, history });
  };

  const handleMatchComplete = (winner: Player, finalScore: MatchScore) => {
    alert(`Match completed! ${winner.name} won!`);
    setShowDemo(false);
  };

  if (showDemo) {
    return (
      <LiveScoring
        matchId="demo-match"
        playerA={demoPlayerA}
        playerB={demoPlayerB}
        scoringFormat={{ pointsPerGame: 21, gamesPerMatch: 3, winBy: 2, maxPoints: 30 }}
        onScoreUpdate={handleScoreUpdate}
        onMatchComplete={handleMatchComplete}
      />
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Badminton Scoring Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-slate-300">
              <h3 className="text-lg font-semibold mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Mobile-optimized touch interface</li>
                <li>Optional point analysis tracking</li>
                <li>Real-time statistics</li>
                <li>Match progress visualization</li>
                <li>Undo functionality</li>
                <li>Match completion detection</li>
              </ul>
            </div>
            
            <div className="text-slate-300">
              <h3 className="text-lg font-semibold mb-2">Mobile Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Large touch targets for easy scoring</li>
                <li>Responsive design for all screen sizes</li>
                <li>Smooth animations and transitions</li>
                <li>Sticky header for easy access to controls</li>
                <li>Collapsible statistics panel</li>
              </ul>
            </div>

            <Button
              onClick={() => setShowDemo(true)}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Demo Match
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
