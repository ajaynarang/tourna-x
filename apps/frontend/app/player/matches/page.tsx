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
  Trophy,
  Users,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Match {
  _id: string;
  tournamentName: string;
  round: string;
  player1Name: string;
  player2Name: string;
  scheduledTime: string;
  court: string;
  status: string;
  player1Score: number[];
  player2Score: number[];
  tournamentId: string;
}

export default function PlayerMatches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

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
          tournamentName: 'Summer Badminton Championship',
          round: 'Quarter Final',
          player1Name: user?.name || 'You',
          player2Name: 'John Smith',
          scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          court: 'Court 1',
          status: 'scheduled',
          player1Score: [],
          player2Score: [],
          tournamentId: 'tournament-1'
        },
        {
          _id: '2',
          tournamentName: 'Spring Tennis Open',
          round: 'Semi Final',
          player1Name: user?.name || 'You',
          player2Name: 'Sarah Johnson',
          scheduledTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          court: 'Court 3',
          status: 'scheduled',
          player1Score: [],
          player2Score: [],
          tournamentId: 'tournament-2'
        },
        {
          _id: '3',
          tournamentName: 'Winter Championship',
          round: 'Final',
          player1Name: user?.name || 'You',
          player2Name: 'Mike Wilson',
          scheduledTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          court: 'Court 2',
          status: 'completed',
          player1Score: [21, 19],
          player2Score: [18, 21],
          tournamentId: 'tournament-3'
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
    if (filter === 'upcoming') return match.status === 'scheduled';
    if (filter === 'completed') return match.status === 'completed';
    return true;
  });

  const formatScore = (player1Score: number[], player2Score: number[]) => {
    if (player1Score.length === 0 || player2Score.length === 0) {
      return 'TBD';
    }
    return `${player1Score.join('-')} vs ${player2Score.join('-')}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner"></div>
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
                <Link href="/player/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  My Matches
                </h1>
                <p className="text-gray-600">
                  Track your tournament matches and performance
                </p>
              </div>
            </div>
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

        {/* Filter Tabs */}
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
              All Matches ({matches.length})
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'upcoming'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upcoming ({matches.filter(m => m.status === 'scheduled').length})
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

        {/* Matches List */}
        <div className="space-y-6">
          {filteredMatches.length === 0 ? (
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Found</h3>
                <p className="text-gray-600 mb-4">
                  {filter === 'upcoming' 
                    ? "You don't have any upcoming matches scheduled."
                    : filter === 'completed'
                    ? "You haven't completed any matches yet."
                    : "You don't have any matches yet."
                  }
                </p>
                <Button asChild>
                  <Link href="/tournaments">
                    <Trophy className="h-4 w-4 mr-2" />
                    Browse Tournaments
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredMatches.map((match) => {
              const StatusIcon = getStatusIcon(match.status);
              const isUpcoming = match.status === 'scheduled';
              const isCompleted = match.status === 'completed';
              
              return (
                <Card key={match._id} className={`${
                  isUpcoming ? 'bg-gradient-to-br from-white to-blue-50 border-blue-200' :
                  isCompleted ? 'bg-gradient-to-br from-white to-green-50 border-green-200' :
                  'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {match.tournamentName}
                          </h3>
                          <Badge className={getStatusColor(match.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {match.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Round:</strong> {match.round}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      {/* Match Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span><strong>Opponent:</strong> {match.player2Name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span><strong>Date:</strong> {new Date(match.scheduledTime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span><strong>Time:</strong> {new Date(match.scheduledTime).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span><strong>Court:</strong> {match.court}</span>
                        </div>
                      </div>

                      {/* Score Section */}
                      <div className="space-y-3">
                        {isCompleted ? (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Final Score</h4>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900 mb-1">
                                {formatScore(match.player1Score, match.player2Score)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {match.player1Score.reduce((a, b) => a + b, 0) > match.player2Score.reduce((a, b) => a + b, 0) 
                                  ? '🏆 You Won!' 
                                  : '😔 You Lost'
                                }
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Match Status</h4>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-700 mb-1">
                                {isUpcoming ? 'Scheduled' : 'In Progress'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {isUpcoming ? 'Match will start soon' : 'Live match'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/tournaments/${match.tournamentId}`}>
                          <Trophy className="h-4 w-4 mr-2" />
                          View Tournament
                        </Link>
                      </Button>
                      {isUpcoming && (
                        <Button variant="outline" size="sm" disabled>
                          <Clock className="h-4 w-4 mr-2" />
                          Match Not Started
                        </Button>
                      )}
                      {isCompleted && (
                        <Button variant="outline" size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      )}
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
