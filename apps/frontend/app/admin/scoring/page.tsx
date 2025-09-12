'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  Calculator,
  Clock,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  RefreshCw,
  Filter,
  Plus,
  Save,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target
} from 'lucide-react';
import Link from 'next/link';

interface Match {
  _id: string;
  tournamentId: string;
  tournamentName: string;
  round: string;
  matchNumber: number;
  player1Name: string;
  player2Name: string;
  scheduledTime: string;
  court: string;
  status: string;
  player1Score: number[];
  player2Score: number[];
  currentSet: number;
  maxSets: number;
}

export default function AdminScoring() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'scheduled' | 'completed'>('in_progress');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [scoreData, setScoreData] = useState({
    player1Score: [] as number[],
    player2Score: [] as number[],
    currentSet: 1,
    isMatchComplete: false
  });

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for now - replace with actual API call
      const mockMatches: Match[] = [
        {
          _id: '1',
          tournamentId: 'tournament-1',
          tournamentName: 'Summer Badminton Championship',
          round: 'Quarter Final',
          matchNumber: 1,
          player1Name: 'John Smith',
          player2Name: 'Sarah Johnson',
          scheduledTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          court: 'Court 1',
          status: 'in_progress',
          player1Score: [21, 15],
          player2Score: [18, 12],
          currentSet: 3,
          maxSets: 3
        },
        {
          _id: '2',
          tournamentId: 'tournament-1',
          tournamentName: 'Summer Badminton Championship',
          round: 'Quarter Final',
          matchNumber: 2,
          player1Name: 'Mike Wilson',
          player2Name: 'Emma Davis',
          scheduledTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          court: 'Court 2',
          status: 'scheduled',
          player1Score: [],
          player2Score: [],
          currentSet: 1,
          maxSets: 3
        },
        {
          _id: '3',
          tournamentId: 'tournament-1',
          tournamentName: 'Summer Badminton Championship',
          round: 'Semi Final',
          matchNumber: 1,
          player1Name: 'Alex Brown',
          player2Name: 'Lisa Garcia',
          scheduledTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          court: 'Court 1',
          status: 'completed',
          player1Score: [21, 19],
          player2Score: [18, 21],
          currentSet: 3,
          maxSets: 3
        }
      ];

      setMatches(mockMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return Clock;
      case 'in_progress':
        return AlertCircle;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  const formatScore = (player1Score: number[], player2Score: number[]) => {
    if (player1Score.length === 0 || player2Score.length === 0) {
      return 'TBD';
    }
    return `${player1Score.join('-')} vs ${player2Score.join('-')}`;
  };

  const openScoringModal = (match: Match) => {
    setSelectedMatch(match);
    setScoreData({
      player1Score: [...match.player1Score],
      player2Score: [...match.player2Score],
      currentSet: match.currentSet,
      isMatchComplete: match.status === 'completed'
    });
    setIsScoringModalOpen(true);
  };

  const updateScore = (player: 'player1' | 'player2', points: number) => {
    if (scoreData.isMatchComplete) return;
    
    setScoreData(prev => {
      const newScore = { ...prev };
      if (player === 'player1') {
        newScore.player1Score[newScore.currentSet - 1] = points;
      } else {
        newScore.player2Score[newScore.currentSet - 1] = points;
      }
      return newScore;
    });
  };

  const nextSet = () => {
    if (scoreData.currentSet < (selectedMatch?.maxSets || 3)) {
      setScoreData(prev => ({
        ...prev,
        currentSet: prev.currentSet + 1,
        player1Score: [...prev.player1Score, 0],
        player2Score: [...prev.player2Score, 0]
      }));
    }
  };

  const completeMatch = async () => {
    try {
      // API call to complete match
      console.log('Completing match:', selectedMatch?._id, scoreData);
      
      // Update local state
      setMatches(prev => prev.map(m => 
        m._id === selectedMatch?._id 
          ? { ...m, ...scoreData, status: 'completed' }
          : m
      ));
      
      setIsScoringModalOpen(false);
    } catch (error) {
      console.error('Error completing match:', error);
    }
  };

  const startMatch = async (matchId: string) => {
    try {
      // API call to start match
      console.log('Starting match:', matchId);
      
      // Update local state
      setMatches(prev => prev.map(m => 
        m._id === matchId 
          ? { ...m, status: 'in_progress', player1Score: [0], player2Score: [0] }
          : m
      ));
    } catch (error) {
      console.error('Error starting match:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Live Scoring
                </h1>
                <p className="text-gray-600">
                  Manage live match scoring and results
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => fetchMatches()} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({matches.length})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'in_progress'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Live ({matches.filter(m => m.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setFilter('scheduled')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'scheduled'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Scheduled ({matches.filter(m => m.status === 'scheduled').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed ({matches.filter(m => m.status === 'completed').length})
            </button>
          </div>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.length === 0 ? (
            <div className="col-span-full">
              <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
                <CardContent className="p-8 text-center">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Found</h3>
                  <p className="text-gray-600 mb-4">
                    {filter === 'in_progress' 
                      ? 'No matches are currently in progress.' 
                      : filter === 'scheduled'
                      ? 'No matches are scheduled for scoring.'
                      : 'No matches found for the selected filter.'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredMatches.map((match) => {
              const StatusIcon = getStatusIcon(match.status);
              const isUpcoming = match.status === 'scheduled';
              const isInProgress = match.status === 'in_progress';
              const isCompleted = match.status === 'completed';
              
              return (
                <Card key={match._id} className={`${
                  isUpcoming ? 'bg-gradient-to-br from-white to-blue-50 border-blue-200' :
                  isInProgress ? 'bg-gradient-to-br from-white to-yellow-50 border-yellow-200' :
                  isCompleted ? 'bg-gradient-to-br from-white to-green-50 border-green-200' :
                  'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{match.tournamentName}</CardTitle>
                          <Badge className={getStatusColor(match.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {match.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {match.round} • Match #{match.matchNumber}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{match.player1Name} vs {match.player2Name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(match.scheduledTime).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{match.court}</span>
                      </div>
                    </div>

                    {/* Score Display */}
                    <div className="mb-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2 text-center">Score</h4>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {formatScore(match.player1Score, match.player2Score)}
                          </div>
                          {isInProgress && (
                            <div className="text-sm text-yellow-600 font-semibold">
                              Set {match.currentSet} of {match.maxSets}
                            </div>
                          )}
                          {isCompleted && (
                            <div className="text-sm text-green-600 font-semibold">
                              Match Complete
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      {isUpcoming && (
                        <Button 
                          onClick={() => startMatch(match._id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Start Match
                        </Button>
                      )}
                      {isInProgress && (
                        <Button 
                          onClick={() => openScoringModal(match)}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          Live Score
                        </Button>
                      )}
                      {isCompleted && (
                        <Button 
                          onClick={() => openScoringModal(match)}
                          variant="outline" 
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          View Result
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Scoring Modal */}
        {isScoringModalOpen && selectedMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Live Scoring - {selectedMatch.tournamentName}
                </h2>
                <Button 
                  onClick={() => setIsScoringModalOpen(false)}
                  variant="outline" 
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Current Score Display */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 text-center">
                    Set {scoreData.currentSet} of {selectedMatch.maxSets}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {scoreData.player1Score[scoreData.currentSet - 1] || 0}
                      </div>
                      <div className="text-sm text-gray-600">{selectedMatch.player1Name}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {scoreData.player2Score[scoreData.currentSet - 1] || 0}
                      </div>
                      <div className="text-sm text-gray-600">{selectedMatch.player2Name}</div>
                    </div>
                  </div>
                </div>

                {/* Score Controls */}
                {!scoreData.isMatchComplete && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">{selectedMatch.player1Name}</h4>
                        <div className="flex items-center space-x-2">
                          <Button 
                            onClick={() => updateScore('player1', (scoreData.player1Score[scoreData.currentSet - 1] || 0) + 1)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            +1
                          </Button>
                          <Button 
                            onClick={() => updateScore('player1', Math.max(0, (scoreData.player1Score[scoreData.currentSet - 1] || 0) - 1))}
                            variant="outline"
                            size="sm"
                          >
                            -1
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">{selectedMatch.player2Name}</h4>
                        <div className="flex items-center space-x-2">
                          <Button 
                            onClick={() => updateScore('player2', (scoreData.player2Score[scoreData.currentSet - 1] || 0) + 1)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            +1
                          </Button>
                          <Button 
                            onClick={() => updateScore('player2', Math.max(0, (scoreData.player2Score[scoreData.currentSet - 1] || 0) - 1))}
                            variant="outline"
                            size="sm"
                          >
                            -1
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-4">
                      {scoreData.currentSet < selectedMatch.maxSets && (
                        <Button 
                          onClick={nextSet}
                          variant="outline"
                        >
                          Next Set
                        </Button>
                      )}
                      <Button 
                        onClick={completeMatch}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Complete Match
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
