'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, Users, Printer } from 'lucide-react';
import { Button, Badge } from '@repo/ui';

interface Match {
  _id: string;
  matchNumber: number;
  tournamentId: string;
  roundNumber: number;
  roundName: string;
  category: string;
  ageGroup?: string;
  player1Id?: string;
  player1Name?: string;
  player2Id?: string;
  player2Name?: string;
  player3Id?: string;
  player3Name?: string;
  player4Id?: string;
  player4Name?: string;
  player1Score?: number[];
  player2Score?: number[];
  winnerId?: string;
  winnerName?: string;
  status: string;
  scheduledDate?: string;
  scheduledTime?: string;
  venue?: string;
  isWalkover?: boolean;
  walkoverReason?: string;
}

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  format: string;
  startDate: string;
  endDate: string;
  venue?: string;
  description?: string;
  categories?: string[];
  ageGroups?: string[];
}

export default function PrintableBracketPage() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournamentId');
  const category = searchParams.get('category');
  const ageGroup = searchParams.get('ageGroup');

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId, category, ageGroup]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch tournament details
      const tournamentRes = await fetch(`/api/tournaments/${tournamentId}`);
      const tournamentData = await tournamentRes.json();
      if (tournamentData.success) {
        setTournament(tournamentData.data);
      }

      // Fetch matches
      const matchesRes = await fetch(`/api/tournaments/${tournamentId}/fixtures`);
      const matchesData = await matchesRes.json();
      if (matchesData.success) {
        let filteredMatches = matchesData.data;
        
        // Filter by category and age group if specified
        if (category) {
          filteredMatches = filteredMatches.filter((m: Match) => m.category === category);
        }
        if (ageGroup) {
          filteredMatches = filteredMatches.filter((m: Match) => m.ageGroup === ageGroup);
        }
        
        setMatches(filteredMatches);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading bracket...</p>
        </div>
      </div>
    );
  }

  if (!tournament || matches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center text-white">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">No Bracket Data</h2>
          <p className="text-gray-400">Unable to load bracket information.</p>
        </div>
      </div>
    );
  }

  // Group matches by round
  const rounds = Array.from(new Set(matches.map(m => m.roundNumber))).sort((a, b) => a - b);
  const matchesByRound = rounds.reduce((acc, round) => {
    acc[round] = matches.filter(m => m.roundNumber === round);
    return acc;
  }, {} as Record<number, Match[]>);

  const isDoubles = category === 'doubles' || category === 'mixed';

  const getPlayerDisplay = (match: Match, side: 'player1' | 'player2'): string => {
    if (side === 'player1') {
      if (!match.player1Name) return 'TBD';
      if (isDoubles && match.player3Name) {
        return `${match.player1Name} & ${match.player3Name}`;
      }
      return match.player1Name;
    } else {
      if (!match.player2Name) return 'TBD';
      if (isDoubles && match.player4Name) {
        return `${match.player2Name} & ${match.player4Name}`;
      }
      return match.player2Name;
    }
  };

  const isWinner = (match: Match, side: 'player1' | 'player2'): boolean => {
    if (!match.winnerId) return false;
    if (side === 'player1') {
      return match.winnerId === match.player1Id || match.winnerId === match.player3Id;
    } else {
      return match.winnerId === match.player2Id || match.winnerId === match.player4Id;
    }
  };

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-landscape {
            size: landscape;
          }
          .bracket-container {
            page-break-inside: avoid;
          }
          .round-section {
            page-break-inside: avoid;
          }
        }
        
        @page {
          size: A4 landscape;
          margin: 1cm;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 print:bg-white">
        {/* Header - Tournament Info */}
        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-b border-white/10 print:bg-white print:border-gray-300">
          <div className="max-w-[1600px] mx-auto px-6 py-8 print:py-4">
            <div className="flex items-start justify-between mb-6 print:mb-3">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2 print:text-black print:text-3xl">
                  {tournament.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 print:text-gray-700">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span className="font-medium capitalize">{tournament.format} Tournament</span>
                  </div>
                  {tournament.startDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {tournament.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{tournament.venue}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Print Button - Hidden when printing */}
              <Button
                onClick={handlePrint}
                className="no-print bg-green-600 hover:bg-green-700 gap-2"
                size="lg"
              >
                <Printer className="h-5 w-5" />
                Print Bracket
              </Button>
            </div>

            {/* Category & Age Group Info */}
            <div className="flex items-center gap-3">
              <Badge className="text-lg px-4 py-2 bg-green-500/20 text-green-400 print:bg-green-100 print:text-green-800">
                {category?.charAt(0).toUpperCase()}{category?.slice(1)} Category
              </Badge>
              {ageGroup && (
                <Badge className="text-lg px-4 py-2 bg-blue-500/20 text-blue-400 print:bg-blue-100 print:text-blue-800">
                  {ageGroup}
                </Badge>
              )}
              <Badge variant="outline" className="text-lg px-4 py-2 print:border-gray-400">
                {matches.length} Matches
              </Badge>
            </div>
          </div>
        </div>

        {/* Bracket Display */}
        <div className="max-w-[1600px] mx-auto px-6 py-8 print:py-4">
          <div className="bracket-container overflow-x-auto">
            <div className="flex gap-8 min-w-max">
              {rounds.map((round, roundIndex) => {
                const roundMatches = matchesByRound[round] || [];
                const roundName = roundMatches[0]?.roundName || `Round ${round}`;

                return (
                  <div key={round} className="round-section flex-shrink-0" style={{ width: '320px' }}>
                    {/* Round Header */}
                    <div className="mb-6 print:mb-3">
                      <h3 className="text-xl font-bold text-white text-center mb-2 print:text-black print:text-lg">
                        {roundName}
                      </h3>
                      <div className="h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full print:bg-gray-300"></div>
                    </div>

                    {/* Matches */}
                    <div className="space-y-8 print:space-y-4">
                      {roundMatches.map((match, matchIndex) => (
                        <motion.div
                          key={match._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: roundIndex * 0.1 + matchIndex * 0.05 }}
                          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden print:bg-white print:border-gray-300 print:shadow-sm"
                        >
                          {/* Match Header */}
                          <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 px-4 py-2 flex items-center justify-between print:bg-gray-100">
                            <span className="text-sm font-bold text-white print:text-black">
                              Match #{match.matchNumber}
                            </span>
                            {match.status === 'completed' && (
                              <>
                                {match.isWalkover ? (
                                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 print:bg-yellow-100 print:text-yellow-800">
                                    {match.walkoverReason === 'bye' ? 'Bye' : 'W/O'}
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 print:bg-green-100 print:text-green-800">
                                    Final
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {/* Players */}
                          <div className="p-4 space-y-3 print:p-3 print:space-y-2">
                            {/* Player/Team 1 */}
                            <div className={`rounded-lg p-3 print:p-2 ${
                              isWinner(match, 'player1')
                                ? 'bg-green-500/20 border-2 border-green-500/50 print:bg-green-50 print:border-green-500'
                                : 'bg-white/5 border border-white/10 print:bg-gray-50 print:border-gray-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {isWinner(match, 'player1') && (
                                    <Trophy className="h-4 w-4 text-green-400 flex-shrink-0 print:text-green-600" />
                                  )}
                                  <span className={`font-medium truncate ${
                                    getPlayerDisplay(match, 'player1') === 'TBD'
                                      ? 'text-gray-500 italic'
                                      : 'text-white print:text-black'
                                  }`}>
                                    {getPlayerDisplay(match, 'player1')}
                                  </span>
                                </div>
                                {match.status === 'completed' && match.player1Score && match.player1Score.length > 0 && (
                                  <span className="text-white font-bold ml-2 print:text-black">
                                    {match.player1Score.filter(s => s > 0).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* VS Divider */}
                            <div className="text-center text-sm text-gray-400 font-medium print:text-gray-600">
                              VS
                            </div>

                            {/* Player/Team 2 */}
                            <div className={`rounded-lg p-3 print:p-2 ${
                              isWinner(match, 'player2')
                                ? 'bg-green-500/20 border-2 border-green-500/50 print:bg-green-50 print:border-green-500'
                                : 'bg-white/5 border border-white/10 print:bg-gray-50 print:border-gray-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {isWinner(match, 'player2') && (
                                    <Trophy className="h-4 w-4 text-green-400 flex-shrink-0 print:text-green-600" />
                                  )}
                                  <span className={`font-medium truncate ${
                                    getPlayerDisplay(match, 'player2') === 'TBD'
                                      ? 'text-gray-500 italic'
                                      : 'text-white print:text-black'
                                  }`}>
                                    {getPlayerDisplay(match, 'player2')}
                                  </span>
                                </div>
                                {match.status === 'completed' && match.player2Score && match.player2Score.length > 0 && (
                                  <span className="text-white font-bold ml-2 print:text-black">
                                    {match.player2Score.filter(s => s > 0).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Schedule Info */}
                            {(match.scheduledDate || match.scheduledTime || match.venue) && (
                              <div className="pt-2 border-t border-white/10 text-xs text-gray-400 space-y-1 print:border-gray-200 print:text-gray-600">
                                {match.scheduledDate && (
                                  <div>📅 {new Date(match.scheduledDate).toLocaleDateString()}</div>
                                )}
                                {match.scheduledTime && (
                                  <div>🕐 {match.scheduledTime}</div>
                                )}
                                {match.venue && (
                                  <div>📍 {match.venue}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-sm text-gray-400 print:text-gray-600 print:py-3">
          <p>Generated by Tourna-X • {new Date().toLocaleString()}</p>
        </div>
      </div>
    </>
  );
}

