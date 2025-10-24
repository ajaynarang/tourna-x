'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  Calendar, 
  Clock,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  RefreshCw,
  Filter,
  Search,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Fixture {
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
  winner?: string;
}

export default function AdminFixtures() {
  const { user } = useAuth();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  const [selectedTournament, setSelectedTournament] = useState<string>('all');

  useEffect(() => {
    fetchFixtures();
  }, []);

  const fetchFixtures = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for now - replace with actual API call
      const mockFixtures: Fixture[] = [
        {
          _id: '1',
          tournamentId: 'tournament-1',
          tournamentName: 'Summer Badminton Championship',
          round: 'Quarter Final',
          matchNumber: 1,
          player1Name: 'John Smith',
          player2Name: 'Sarah Johnson',
          scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          court: 'Court 1',
          status: 'scheduled',
          player1Score: [],
          player2Score: []
        },
        {
          _id: '2',
          tournamentId: 'tournament-1',
          tournamentName: 'Summer Badminton Championship',
          round: 'Quarter Final',
          matchNumber: 2,
          player1Name: 'Mike Wilson',
          player2Name: 'Emma Davis',
          scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          court: 'Court 2',
          status: 'in_progress',
          player1Score: [21, 15],
          player2Score: [18, 12]
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
          winner: 'Lisa Garcia'
        },
        {
          _id: '4',
          tournamentId: 'tournament-2',
          tournamentName: 'Spring Tennis Open',
          round: 'First Round',
          matchNumber: 1,
          player1Name: 'David Lee',
          player2Name: 'Maria Rodriguez',
          scheduledTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          court: 'Court 3',
          status: 'scheduled',
          player1Score: [],
          player2Score: []
        }
      ];

      setFixtures(mockFixtures);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
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

  const tournaments = Array.from(new Set(fixtures.map(f => f.tournamentName)));

  const filteredFixtures = fixtures.filter(fixture => {
    const matchesFilter = filter === 'all' || fixture.status === filter;
    const matchesTournament = selectedTournament === 'all' || fixture.tournamentName === selectedTournament;
    return matchesFilter && matchesTournament;
  });

  const formatScore = (player1Score: number[], player2Score: number[]) => {
    if (player1Score.length === 0 || player2Score.length === 0) {
      return 'TBD';
    }
    return `${player1Score.join('-')} vs ${player2Score.join('-')}`;
  };

  const handleUpdateScore = async (fixtureId: string) => {
    // This would open a score update modal or navigate to scoring page
    console.log('Update score for fixture:', fixtureId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen p-8">
      <div className="w-full">
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
                  Tournament Fixtures
                </h1>
                <p className="text-gray-600">
                  Manage match schedules and track tournament progress
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => fetchFixtures()} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Generate Fixtures
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tournaments</option>
              {tournaments.map(tournament => (
                <option key={tournament} value={tournament}>{tournament}</option>
              ))}
            </select>
          </div>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({fixtures.length})
            </button>
            <button
              onClick={() => setFilter('scheduled')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'scheduled'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Scheduled ({fixtures.filter(f => f.status === 'scheduled').length})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'in_progress'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              In Progress ({fixtures.filter(f => f.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed ({fixtures.filter(f => f.status === 'completed').length})
            </button>
          </div>
        </div>

        {/* Fixtures List */}
        <div className="space-y-4">
          {filteredFixtures.length === 0 ? (
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fixtures Found</h3>
                <p className="text-gray-600 mb-4">
                  {selectedTournament !== 'all' 
                    ? 'No fixtures found for the selected tournament.' 
                    : 'No fixtures have been generated yet.'
                  }
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Fixtures
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredFixtures.map((fixture) => {
              const StatusIcon = getStatusIcon(fixture.status);
              const isUpcoming = fixture.status === 'scheduled';
              const isInProgress = fixture.status === 'in_progress';
              const isCompleted = fixture.status === 'completed';
              
              return (
                <Card key={fixture._id} className={`${
                  isUpcoming ? 'bg-gradient-to-br from-white to-blue-50 border-blue-200' :
                  isInProgress ? 'bg-gradient-to-br from-white to-yellow-50 border-yellow-200' :
                  isCompleted ? 'bg-gradient-to-br from-white to-green-50 border-green-200' :
                  'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {fixture.tournamentName}
                          </h3>
                          <Badge className={getStatusColor(fixture.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {fixture.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Round:</strong> {fixture.round} • <strong>Match #{fixture.matchNumber}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      {/* Match Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span><strong>Players:</strong> {fixture.player1Name} vs {fixture.player2Name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span><strong>Date:</strong> {new Date(fixture.scheduledTime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span><strong>Time:</strong> {new Date(fixture.scheduledTime).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span><strong>Court:</strong> {fixture.court}</span>
                        </div>
                      </div>

                      {/* Score Section */}
                      <div className="space-y-3">
                        {isCompleted ? (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Final Result</h4>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900 mb-1">
                                {formatScore(fixture.player1Score, fixture.player2Score)}
                              </div>
                              <div className="text-sm text-green-600 font-semibold">
                                🏆 Winner: {fixture.winner}
                              </div>
                            </div>
                          </div>
                        ) : isInProgress ? (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Live Score</h4>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900 mb-1">
                                {formatScore(fixture.player1Score, fixture.player2Score)}
                              </div>
                              <div className="text-sm text-yellow-600 font-semibold">
                                Match in Progress
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Match Status</h4>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-700 mb-1">
                                Scheduled
                              </div>
                              <div className="text-sm text-gray-600">
                                Match will start soon
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/tournaments/${fixture.tournamentId}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Tournament
                        </Link>
                      </Button>
                      <div className="flex items-center space-x-2">
                        {isInProgress && (
                          <Button 
                            onClick={() => handleUpdateScore(fixture._id)}
                            size="sm"
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Update Score
                          </Button>
                        )}
                        {isUpcoming && (
                          <Button 
                            onClick={() => handleUpdateScore(fixture._id)}
                            variant="outline" 
                            size="sm"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Start Match
                          </Button>
                        )}
                        {isCompleted && (
                          <Button 
                            onClick={() => handleUpdateScore(fixture._id)}
                            variant="outline" 
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
