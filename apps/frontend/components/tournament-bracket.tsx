'use client';

import { motion } from 'framer-motion';
import { Trophy, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Badge } from '@repo/ui';

interface Match {
  _id: string;
  matchNumber: number;
  round: string;
  roundNumber: number;
  category: string;
  ageGroup?: string;
  player1Name?: string;
  player2Name?: string;
  player3Name?: string;
  player4Name?: string;
  player1Score: number[];
  player2Score: number[];
  winnerId?: string;
  player1Id?: string;
  player2Id?: string;
  status: string;
  scheduledDate?: Date | string;
  scheduledTime?: string;
  venue?: string;
}

interface TournamentBracketProps {
  matches: Match[];
  category: string;
  ageGroup?: string;
  onMatchClick?: (match: Match) => void;
}

export function TournamentBracket({ matches, category, ageGroup, onMatchClick }: TournamentBracketProps) {
  // Group matches by round
  const matchesByRound: Record<string, Match[]> = {};
  matches.forEach(match => {
    const round = match.round || 'Unknown';
    if (!matchesByRound[round]) {
      matchesByRound[round] = [];
    }
    matchesByRound[round].push(match);
  });

  // Sort rounds
  const roundOrder: Record<string, number> = {
    'Round 1': 1,
    'Round of 64': 2,
    'Round of 32': 3,
    'Round of 16': 4,
    'Quarter Final': 5,
    'Semi Final': 6,
    'Final': 7,
  };

  const sortedRounds = Object.keys(matchesByRound).sort((a, b) => {
    return (roundOrder[a] || 0) - (roundOrder[b] || 0);
  });

  const isDoubles = category === 'doubles' || category === 'mixed';

  return (
    <div className="tournament-bracket-container">
      {/* Header */}
      <div className="mb-6 print:mb-4">
        <h2 className="text-2xl font-bold text-primary print:text-black">
          {category.charAt(0).toUpperCase() + category.slice(1)}
          {ageGroup && ` • ${ageGroup}`}
        </h2>
        <p className="text-sm text-muted-foreground print:text-gray-600">
          {matches.length} matches • Knockout Format
        </p>
      </div>

      {/* Bracket Grid */}
      <div className="bracket-grid flex gap-6 overflow-x-auto pb-6 print:gap-4">
        {sortedRounds.map((round, roundIndex) => (
          <div key={round} className="bracket-round flex flex-col" style={{ minWidth: '280px' }}>
            {/* Round Header */}
            <div className="mb-4 sticky top-0 bg-background/95 backdrop-blur print:bg-white z-10 py-2">
              <h3 className="text-lg font-semibold text-primary text-center print:text-black">
                {round}
              </h3>
              <p className="text-xs text-muted-foreground text-center print:text-gray-600">
                {matchesByRound[round]?.length || 0} {(matchesByRound[round]?.length || 0) === 1 ? 'match' : 'matches'}
              </p>
            </div>

            {/* Matches */}
            <div className="flex flex-col justify-around gap-6 flex-1" style={{
              gap: `${Math.pow(2, roundIndex) * 1.5}rem`
            }}>
              {matchesByRound[round]?.map((match, matchIndex) => (
                <BracketMatch
                  key={match._id}
                  match={match}
                  isDoubles={isDoubles}
                  onClick={() => onMatchClick?.(match)}
                  delay={roundIndex * 0.1 + matchIndex * 0.05}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .tournament-bracket-container {
            page-break-inside: avoid;
          }
          .bracket-grid {
            overflow-x: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function BracketMatch({ 
  match, 
  isDoubles, 
  onClick,
  delay 
}: { 
  match: Match; 
  isDoubles: boolean;
  onClick?: () => void;
  delay: number;
}) {
  const isCompleted = match.status === 'completed';
  const team1Won = match.winnerId === match.player1Id;
  const team2Won = match.winnerId === match.player2Id;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={`bracket-match glass-card rounded-lg overflow-hidden ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-green-500/50' : ''} print:border print:border-gray-300 print:shadow-none`}
    >
      {/* Match Header */}
      <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 px-3 py-2 print:bg-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-primary print:text-black">
          Match #{match.matchNumber}
        </span>
        {isCompleted && (
          <>
            {(match as any).isBye ? (
              <Badge className="text-xs bg-blue-500/20 text-blue-500 print:bg-blue-100 print:text-blue-800">
                Bye
              </Badge>
            ) : (match as any).isWalkover ? (
              <Badge className="text-xs bg-yellow-500/20 text-yellow-500 print:bg-yellow-100 print:text-yellow-800">
                W/O
              </Badge>
            ) : (
              <Badge className="text-xs bg-green-500/20 text-green-500 print:bg-green-100 print:text-green-800">
                Final
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Teams */}
      <div className="p-3 space-y-2">
        {/* Team 1 */}
        <div className={`rounded-lg p-2.5 transition-all ${
          team1Won
            ? 'bg-green-500/20 ring-2 ring-green-500/50 print:bg-green-50 print:ring-green-500'
            : 'bg-white/5 print:bg-gray-50'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${
                match.player1Name === 'TBD' ? 'text-gray-500 italic' : 'text-primary print:text-black'
              }`}>
                {match.player1Name || 'TBD'}
              </p>
              {isDoubles && match.player3Name && (
                <p className="text-xs text-muted-foreground truncate print:text-gray-600">
                  {match.player3Name}
                </p>
              )}
            </div>
            {isCompleted && match.player1Score.length > 0 && (
              <div className="flex items-center gap-1">
                {match.player1Score.map((score, idx) => (
                  <span key={idx} className={`text-sm font-bold px-1.5 py-0.5 rounded ${
                    team1Won ? 'text-green-600 print:text-green-800' : 'text-primary print:text-black'
                  }`}>
                    {score}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className="text-center">
          <span className="text-xs font-medium text-muted-foreground print:text-gray-500">VS</span>
        </div>

        {/* Team 2 */}
        <div className={`rounded-lg p-2.5 transition-all ${
          team2Won
            ? 'bg-green-500/20 ring-2 ring-green-500/50 print:bg-green-50 print:ring-green-500'
            : 'bg-white/5 print:bg-gray-50'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${
                match.player2Name === 'TBD' ? 'text-gray-500 italic' : 'text-primary print:text-black'
              }`}>
                {match.player2Name || 'TBD'}
              </p>
              {isDoubles && match.player4Name && (
                <p className="text-xs text-muted-foreground truncate print:text-gray-600">
                  {match.player4Name}
                </p>
              )}
            </div>
            {isCompleted && match.player2Score.length > 0 && (
              <div className="flex items-center gap-1">
                {match.player2Score.map((score, idx) => (
                  <span key={idx} className={`text-sm font-bold px-1.5 py-0.5 rounded ${
                    team2Won ? 'text-green-600 print:text-green-800' : 'text-primary print:text-black'
                  }`}>
                    {score}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Match Details */}
      {(match.scheduledDate || match.scheduledTime || match.venue) && (
        <div className="px-3 pb-3 pt-1 border-t border-white/10 print:border-gray-200">
          <div className="space-y-1">
            {match.scheduledDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground print:text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(match.scheduledDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
            {match.scheduledTime && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground print:text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{match.scheduledTime}</span>
              </div>
            )}
            {match.venue && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground print:text-gray-600">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{match.venue}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

