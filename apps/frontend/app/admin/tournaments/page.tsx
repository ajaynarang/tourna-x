'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  Trophy, 
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  endDate: string;
  venue: string;
  entryFee: number;
  tournamentType: string;
  participantCount: number;
  maxParticipants: number;
  isPublished: boolean;
  createdBy: string;
}

export default function AdminTournaments() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'ongoing' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for now - replace with actual API call
      const mockTournaments: Tournament[] = [
        {
          _id: '1',
          name: 'Summer Badminton Championship',
          sport: 'badminton',
          status: 'published',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Sports Complex',
          entryFee: 500,
          tournamentType: 'open',
          participantCount: 24,
          maxParticipants: 32,
          isPublished: true,
          createdBy: 'admin'
        },
        {
          _id: '2',
          name: 'Spring Tennis Open',
          sport: 'tennis',
          status: 'draft',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Tennis Club',
          entryFee: 750,
          tournamentType: 'society_only',
          participantCount: 0,
          maxParticipants: 16,
          isPublished: false,
          createdBy: 'admin'
        },
        {
          _id: '3',
          name: 'Winter Championship',
          sport: 'badminton',
          status: 'ongoing',
          startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Community Center',
          entryFee: 300,
          tournamentType: 'open',
          participantCount: 16,
          maxParticipants: 16,
          isPublished: true,
          createdBy: 'admin'
        }
      ];

      setTournaments(mockTournaments);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return Edit;
      case 'published':
        return CheckCircle;
      case 'ongoing':
        return Clock;
      case 'completed':
        return Trophy;
      case 'cancelled':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesFilter = filter === 'all' || tournament.status === filter;
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.sport.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handlePublish = async (tournamentId: string) => {
    try {
      // API call to publish tournament
      console.log('Publishing tournament:', tournamentId);
      // Update local state
      setTournaments(prev => prev.map(t => 
        t._id === tournamentId ? { ...t, status: 'published', isPublished: true } : t
      ));
    } catch (error) {
      console.error('Error publishing tournament:', error);
    }
  };

  const handleDelete = async (tournamentId: string) => {
    if (confirm('Are you sure you want to delete this tournament?')) {
      try {
        // API call to delete tournament
        console.log('Deleting tournament:', tournamentId);
        setTournaments(prev => prev.filter(t => t._id !== tournamentId));
      } catch (error) {
        console.error('Error deleting tournament:', error);
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-100">
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
                  Tournament Management
                </h1>
                <p className="text-gray-600">
                  Create, manage, and monitor all tournaments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => fetchTournaments()} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button asChild size="sm">
                <Link href="/admin/tournaments/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tournament
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tournaments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
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
              All ({tournaments.length})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'draft'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Draft ({tournaments.filter(t => t.status === 'draft').length})
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'published'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Published ({tournaments.filter(t => t.status === 'published').length})
            </button>
            <button
              onClick={() => setFilter('ongoing')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'ongoing'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ongoing ({tournaments.filter(t => t.status === 'ongoing').length})
            </button>
          </div>
        </div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.length === 0 ? (
            <div className="col-span-full">
              <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tournaments Found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'No tournaments match your search criteria.' : 'Create your first tournament to get started.'}
                  </p>
                  <Button asChild>
                    <Link href="/admin/tournaments/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Tournament
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredTournaments.map((tournament) => {
              const StatusIcon = getStatusIcon(tournament.status);
              const participationRate = (tournament.participantCount / tournament.maxParticipants) * 100;
              
              return (
                <Card key={tournament._id} className={`${
                  tournament.status === 'ongoing' ? 'bg-gradient-to-br from-white to-blue-50 border-blue-200' :
                  tournament.status === 'published' ? 'bg-gradient-to-br from-white to-green-50 border-green-200' :
                  tournament.status === 'draft' ? 'bg-gradient-to-br from-white to-yellow-50 border-yellow-200' :
                  'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{tournament.name}</CardTitle>
                          <Badge className={getStatusColor(tournament.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {tournament.status.toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {tournament.sport.charAt(0).toUpperCase() + tournament.sport.slice(1)} • {tournament.tournamentType.replace('_', ' ')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{tournament.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span>₹{tournament.entryFee}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{tournament.participantCount}/{tournament.maxParticipants} participants</span>
                      </div>
                    </div>

                    {/* Participation Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Participation</span>
                        <span>{participationRate.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            participationRate >= 80 ? 'bg-green-500' :
                            participationRate >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${participationRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/tournaments/${tournament._id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/tournaments/${tournament._id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                      <div className="flex items-center space-x-1">
                        {tournament.status === 'draft' && (
                          <Button 
                            onClick={() => handlePublish(tournament._id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        <Button 
                          onClick={() => handleDelete(tournament._id)}
                          variant="outline" 
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
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
