'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { Input } from '@repo/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users,
  DollarSign,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  categories: string[];
  ageGroups?: string[];
  status: string;
  startDate: string;
  endDate: string;
  venue: string;
  location: string;
  entryFee: number;
  maxParticipants: number;
  tournamentType: string;
  allowedSociety?: string;
  isPublished: boolean;
  participantCount: number;
}

export default function TournamentsPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    sport: 'all',
    status: 'all',
    tournamentType: 'all',
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    filterTournaments();
  }, [tournaments, searchTerm, filters]);

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tournaments');
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setTournaments(result.data.filter((t: Tournament) => t.isPublished));
      } else {
        console.error('Failed to fetch tournaments:', result.error);
        setTournaments([]);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTournaments = () => {
    let filtered = tournaments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tournament =>
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sport filter
    if (filters.sport !== 'all') {
      filtered = filtered.filter(tournament => tournament.sport === filters.sport);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(tournament => tournament.status === filters.status);
    }

    // Tournament type filter
    if (filters.tournamentType !== 'all') {
      filtered = filtered.filter(tournament => tournament.tournamentType === filters.tournamentType);
    }

    setFilteredTournaments(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'registration_open':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'Registration Open';
      case 'published':
        return 'Published';
      case 'ongoing':
        return 'Ongoing';
      case 'completed':
        return 'Completed';
      default:
        return status.replace('_', ' ');
    }
  };

  const isEligibleForTournament = (tournament: Tournament) => {
    if (tournament.tournamentType === 'open') return true;
    if (tournament.tournamentType === 'society_only' && tournament.allowedSociety) {
      return user?.society === tournament.allowedSociety;
    }
    return false;
  };

  const canRegister = (tournament: Tournament) => {
    return tournament.status === 'registration_open' && 
           tournament.participantCount < tournament.maxParticipants &&
           isEligibleForTournament(tournament);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Tournament Directory
              </h1>
              <p className="text-gray-600 mt-2">
                Discover and join tournaments in your area
              </p>
            </div>
            {user && (
              <div className="mt-4 lg:mt-0">
                <Button asChild>
                  <Link href="/register">
                    <Plus className="h-4 w-4 mr-2" />
                    Register for Tournament
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tournaments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={filters.sport} onValueChange={(value) => setFilters({ ...filters, sport: value })}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    <SelectItem value="badminton">Badminton</SelectItem>
                    <SelectItem value="tennis">Tennis</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="registration_open">Registration Open</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.tournamentType} onValueChange={(value) => setFilters({ ...filters, tournamentType: value })}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="society_only">Society Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing {filteredTournaments.length} of {tournaments.length} tournaments
          </p>
        </div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTournaments.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-12 text-center">
                  <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No tournaments found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || Object.values(filters).some(f => f !== 'all')
                      ? 'Try adjusting your search or filters'
                      : 'No tournaments are currently available'
                    }
                  </p>
                  {(searchTerm || Object.values(filters).some(f => f !== 'all')) && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setFilters({ sport: 'all', status: 'all', tournamentType: 'all' });
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredTournaments.map((tournament) => (
              <Card key={tournament._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{tournament.name}</CardTitle>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getStatusColor(tournament.status)}>
                          {getStatusText(tournament.status)}
                        </Badge>
                        {tournament.tournamentType === 'society_only' && (
                          <Badge variant="outline">
                            Society Only
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Trophy className="h-4 w-4 mr-2" />
                      <span className="capitalize">{tournament.sport}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                      {tournament.startDate !== tournament.endDate && (
                        <span> - {new Date(tournament.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{tournament.venue}, {tournament.location}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>₹{tournament.entryFee} entry fee</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{tournament.participantCount}/{tournament.maxParticipants} participants</span>
                    </div>
                  </div>

                  {/* Categories */}
                  {tournament.categories && tournament.categories.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Categories:</p>
                      <div className="flex flex-wrap gap-1">
                        {tournament.categories.map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eligibility Check */}
                  {tournament.tournamentType === 'society_only' && tournament.allowedSociety && (
                    <div className="mb-4">
                      {isEligibleForTournament(tournament) ? (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          You are eligible for this tournament
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-red-600">
                          <XCircle className="h-4 w-4 mr-1" />
                          Only for {tournament.allowedSociety} residents
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/tournaments/${tournament._id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </Button>
                    
                    {canRegister(tournament) && (
                      <Button size="sm" asChild className="flex-1">
                        <Link href={`/register?tournament=${tournament._id}`}>
                          <Plus className="h-4 w-4 mr-1" />
                          Register
                        </Link>
                      </Button>
                    )}
                    
                    {tournament.status === 'registration_open' && tournament.participantCount >= tournament.maxParticipants && (
                      <div className="flex items-center text-sm text-red-600">
                        <XCircle className="h-4 w-4 mr-1" />
                        Full
                      </div>
                    )}
                    
                    {tournament.status === 'ongoing' && (
                      <div className="flex items-center text-sm text-blue-600">
                        <Clock className="h-4 w-4 mr-1" />
                        Ongoing
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}