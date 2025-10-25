'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@repo/ui';
import { Trophy, Calendar, MapPin, Users, CheckCircle } from 'lucide-react';

interface Match {
  _id: string;
  matchNumber: number;
  tournamentId: string;
  roundNumber: number;
  roundName: string;
  player1Id?: string;
  player1Name?: string;
  player2Id?: string;
  player2Name?: string;
  player3Id?: string;
  player3Name?: string;
  player4Id?: string;
  player4Name?: string;
  category: string;
  ageGroup?: string;
  status: string;
  winnerId?: string;
  winnerName?: string;
  player1Score?: number[];
  player2Score?: number[];
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
  organizer?: string;
  categories?: string[];
  ageGroups?: string[];
}

export default function BracketPrintPage() {
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setIsRefreshing(true);
      const resolvedParams = await params;
      const tournamentId = resolvedParams.id as string;
        
        console.log('Fetching data for tournament:', tournamentId);
        
        // Fetch tournament details
        const tournamentRes = await fetch(`/api/tournaments/${tournamentId}`);
        const tournamentData = await tournamentRes.json();
        
        console.log('Tournament data:', tournamentData);
        
        // Fetch matches
        const matchesRes = await fetch(`/api/tournaments/${tournamentId}/fixtures`);
        const matchesData = await matchesRes.json();
        
        console.log('Matches data:', matchesData);
        
        if (tournamentData.success) {
          setTournament(tournamentData.data);
        }
        
      if (matchesData.success) {
        setMatches(matchesData.data || []);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [params]);
  
  // Auto-refresh every 30 seconds while page is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData(false); // Silent refresh
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [params]);

  // Don't auto-print - let user control when to print
  // useEffect(() => {
  //   if (!isLoading && matches.length > 0) {
  //     setTimeout(() => {
  //       window.print();
  //     }, 500);
  //   }
  // }, [isLoading, matches]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-900 text-xl">Loading bracket...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-900 text-xl">Tournament not found</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-gray-900 text-xl mb-2">No fixtures generated yet</div>
          <div className="text-gray-600">Please generate fixtures first from the admin panel</div>
        </div>
      </div>
    );
  }

  // Group matches by category and age group
  const matchesByGroup = matches.reduce((acc, match) => {
    // Apply filters
    if (selectedCategory !== 'all' && match.category !== selectedCategory) return acc;
    if (selectedAgeGroup !== 'all' && match.ageGroup !== selectedAgeGroup) return acc;

    const key = `${match.category}${match.ageGroup ? `-${match.ageGroup}` : ''}`;
    if (!acc[key]) {
      acc[key] = {
        category: match.category,
        ageGroup: match.ageGroup,
        matches: []
      };
    }
    acc[key].matches.push(match);
    return acc;
  }, {} as Record<string, { category: string; ageGroup?: string; matches: Match[] }>);

  // Get unique categories and age groups for filters
  const categories = Array.from(new Set(matches.map(m => m.category)));
  const ageGroups = Array.from(new Set(matches.map(m => m.ageGroup).filter(Boolean))) as string[];

  return (
    <>
      {/* No-print controls - floating toolbar */}
      <div className="no-print fixed top-4 right-4 z-50 print:hidden">
        <div className="flex gap-2 items-center">
          {/* Last Updated Indicator */}
          <div className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-xs text-slate-300 shadow-lg">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
          
          {/* Category Filter */}
          {categories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          )}

          {/* Age Group Filter */}
          {ageGroups.length > 0 && (
            <select
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value)}
              className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Age Groups</option>
              {ageGroups.map(ag => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium shadow-lg transition-colors flex items-center gap-2"
            title="Refresh to see latest match results"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-lg transition-colors"
          >
            🖨️ Print
          </button>
          
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium shadow-lg transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Auto-refresh indicator */}
        <div className="mt-2 text-right">
          <span className="text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
            Auto-refreshes every 30s
          </span>
        </div>
      </div>

      {/* Printable Content - Standalone */}
      <div className="min-h-screen bg-white p-8 print:p-0">
        {Object.entries(matchesByGroup).map(([key, group], index) => (
          <div key={key} className={`mb-16 ${index > 0 ? 'print:break-before-page' : ''}`}>
            {/* Tournament Header */}
            <div className="mb-8 print:mb-6">
              <div className="text-center mb-6 print:mb-4">
                <h1 className="text-4xl font-bold text-gray-900 mb-2 print:text-3xl">
                  {tournament.name}
                </h1>
                <div className="flex items-center justify-center gap-6 text-sm text-gray-600 flex-wrap mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span className="capitalize font-semibold">{group.category}</span>
                    {group.ageGroup && <span>• {group.ageGroup}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  {tournament.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{tournament.venue}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

            {/* Bracket */}
            <BracketView matches={group.matches} category={group.category} />
          </div>
        ))}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5in;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .no-print {
            display: none !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}

// Helper function to get standardized round name
function getRoundName(roundNumber: number, totalRounds: number, matchesInRound: number): string {
  // Calculate from the end to determine finals, semis, quarters
  const roundsFromEnd = totalRounds - roundNumber;
  
  if (roundsFromEnd === 0) {
    return 'Final';
  } else if (roundsFromEnd === 1) {
    return 'Semi Final';
  } else if (roundsFromEnd === 2) {
    return 'Quarter Final';
  } else if (matchesInRound === 32) {
    return 'Round of 64';
  } else if (matchesInRound === 16) {
    return 'Round of 32';
  } else if (matchesInRound === 8) {
    return 'Round of 16';
  } else {
    return `Round ${roundNumber}`;
  }
}

function BracketView({ matches, category }: { matches: Match[]; category: string }) {
  const isDoubles = category === 'doubles' || category === 'mixed';

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.roundNumber;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  const totalRounds = rounds.length;

  return (
    <div className="overflow-x-auto print:overflow-visible">
      <div className="inline-flex gap-8 min-w-full print:gap-6">
        {rounds.map((round, roundIndex) => {
          const roundMatches = matchesByRound[round] || [];
          const matchesInRound = roundMatches.length;
          
          // Calculate vertical spacing
          const spacingMultiplier = Math.pow(2, roundIndex);
          const baseSpacing = 20;
          const spacing = baseSpacing * spacingMultiplier;

          const standardRoundName = getRoundName(round, totalRounds, matchesInRound);
          
          return (
            <div key={round} className="flex flex-col justify-around min-w-[280px] print:min-w-[220px]">
              {/* Round Header */}
              <div className="text-center mb-4 print:mb-3">
                <h3 className="text-lg font-bold text-gray-900 print:text-base">
                  {standardRoundName}
                </h3>
                <p className="text-sm text-gray-600">
                  {matchesInRound} {matchesInRound === 1 ? 'Match' : 'Matches'}
                </p>
              </div>

              {/* Matches */}
              <div className="flex flex-col justify-around flex-1" style={{ gap: `${spacing}px` }}>
                {roundMatches.map((match) => (
                  <BracketMatch key={match._id} match={match} isDoubles={isDoubles} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketMatch({ match, isDoubles }: { match: Match; isDoubles: boolean }) {
  const player1Display = isDoubles && match.player3Name
    ? `${match.player1Name || 'TBD'} & ${match.player3Name}`
    : match.player1Name || 'TBD';
  
  const player2Display = isDoubles && match.player4Name
    ? `${match.player2Name || 'TBD'} & ${match.player4Name}`
    : match.player2Name || 'TBD';

  const isPlayer1Winner = match.winnerId && (match.winnerId === match.player1Id || match.winnerId === match.player3Id);
  const isPlayer2Winner = match.winnerId && (match.winnerId === match.player2Id || match.winnerId === match.player4Id);

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-3 shadow-sm">
      {/* Match Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-700">
          Match #{match.matchNumber}
        </span>
        {match.status === 'completed' && (
          <>
            {(() => {
              const completionType = (match as any).completionType;
              
              if (completionType === 'walkover' && (match as any).walkoverReason === 'bye') {
                return (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                    Bye
                  </span>
                );
              }
              
              switch (completionType) {
                case 'walkover':
                  return (
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded font-medium">
                      W/O
                    </span>
                  );
                case 'forfeit':
                  return (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                      Forfeit
                    </span>
                  );
                case 'disqualification':
                  return (
                    <span className="text-xs px-2 py-1 bg-red-200 text-red-900 rounded font-medium">
                      DQ
                    </span>
                  );
                case 'retired':
                  return (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">
                      Retired
                    </span>
                  );
                case 'manual':
                  return (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-medium">
                      Won (Manual)
                    </span>
                  );
                case 'normal':
                default:
                  return (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Won (Scored)
                    </span>
                  );
              }
            })()}
          </>
        )}
      </div>

      {/* Players */}
      <div className="space-y-2">
        {/* Player 1 */}
        <div className={`flex items-center justify-between p-2 rounded border ${
          isPlayer1Winner 
            ? 'bg-green-50 border-green-300 border-2' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <span className={`text-sm font-medium ${
            player1Display === 'TBD' 
              ? 'text-gray-400 italic' 
              : isPlayer1Winner 
                ? 'text-green-900 font-bold' 
                : 'text-gray-900'
          }`}>
            {player1Display}
          </span>
          {match.status === 'completed' && match.player1Score && match.player1Score.length > 0 && !(match as any).isBye && (
            <span className={`text-sm font-bold ${
              isPlayer1Winner ? 'text-green-900' : 'text-gray-600'
            }`}>
              {match.player1Score.filter(s => s > 0).join(', ')}
            </span>
          )}
        </div>

        <div className="text-center text-xs text-gray-500 font-medium">VS</div>

        {/* Player 2 */}
        <div className={`flex items-center justify-between p-2 rounded border ${
          isPlayer2Winner 
            ? 'bg-green-50 border-green-300 border-2' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <span className={`text-sm font-medium ${
            player2Display === 'TBD' 
              ? 'text-gray-400 italic' 
              : isPlayer2Winner 
                ? 'text-green-900 font-bold' 
                : 'text-gray-900'
          }`}>
            {player2Display}
          </span>
          {match.status === 'completed' && match.player2Score && match.player2Score.length > 0 && !(match as any).isBye && (
            <span className={`text-sm font-bold ${
              isPlayer2Winner ? 'text-green-900' : 'text-gray-600'
            }`}>
              {match.player2Score.filter(s => s > 0).join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Schedule Info */}
      {(match.scheduledDate || match.scheduledTime || match.venue) && (
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600 space-y-1">
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
  );
}

