'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Clock,
  Target,
  TrendingUp,
  Sparkles
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
  const router = useRouter();
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
        return 'bg-green-500 text-white';
      case 'ongoing':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600 text-lg">Discovering tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {user && (
              <div className="flex gap-2">
                <Button asChild size="lg" variant="outline">
                  <Link href="/player/dashboard">
                    <Trophy className="h-5 w-5 mr-2" />
                    My Dashboard
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search tournaments by name, venue, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base border-2 focus:border-blue-400"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <div className="flex flex-wrap gap-2">
                  <Select value={filters.sport} onValueChange={(value) => setFilters({ ...filters, sport: value })}>
                    <SelectTrigger className="w-40 h-12">
                      <SelectValue placeholder="Sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sports</SelectItem>
                      <SelectItem value="badminton">Badminton</SelectItem>
                      <SelectItem value="tennis">Tennis</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger className="w-48 h-12">
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
                    <SelectTrigger className="w-40 h-12">
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
            </div>

            {/* Active Filters Summary */}
            {(searchTerm || Object.values(filters).some(f => f !== 'all')) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing <strong className="text-blue-600">{filteredTournaments.length}</strong> of <strong>{tournaments.length}</strong> tournaments
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({ sport: 'all', status: 'all', tournamentType: 'all' });
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTournaments.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                    <Trophy className="h-16 w-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No tournaments found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchTerm || Object.values(filters).some(f => f !== 'all')
                      ? 'Try adjusting your search criteria or filters to find more tournaments'
                      : 'No tournaments are currently available. Check back later for new opportunities!'
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
                      Clear All Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredTournaments.map((tournament) => {
              const eligible = isEligibleForTournament(tournament);
              const registrationOpen = canRegister(tournament);
              const isFull = tournament.participantCount >= tournament.maxParticipants;
              
              return (
                <Card 
                  key={tournament._id} 
                  className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm group cursor-pointer"
                  onClick={() => router.push(`/tournaments/${tournament._id}`)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {tournament.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getStatusColor(tournament.status)}>
                            {getStatusText(tournament.status)}
                          </Badge>
                          {tournament.tournamentType === 'society_only' && (
                            <Badge variant="outline" className="border-purple-300 text-purple-700">
                              Society Only
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Key Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Trophy className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Sport</div>
                          <div className="font-semibold text-sm text-gray-900 capitalize">{tournament.sport}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Entry Fee</div>
                          <div className="font-semibold text-sm text-gray-900">₹{tournament.entryFee}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 col-span-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Tournament Dates</div>
                          <div className="font-semibold text-sm text-gray-900">
                            {new Date(tournament.startDate).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                            {tournament.startDate !== tournament.endDate && (
                              <> - {new Date(tournament.endDate).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}</>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 col-span-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <MapPin className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Venue</div>
                          <div className="font-semibold text-sm text-gray-900">{tournament.venue}</div>
                          <div className="text-xs text-gray-500">{tournament.location}</div>
                        </div>
                      </div>
                    </div>

                    {/* Capacity Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>Participants</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {tournament.participantCount}/{tournament.maxParticipants}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full transition-all ${
                            isFull ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(tournament.participantCount / tournament.maxParticipants) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Categories */}
                    {tournament.categories && tournament.categories.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Categories:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tournament.categories.slice(0, 3).map((category) => (
                            <Badge key={category} variant="secondary" className="text-xs px-2 py-1">
                              {category}
                            </Badge>
                          ))}
                          {tournament.categories.length > 3 && (
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              +{tournament.categories.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Eligibility Check */}
                    {tournament.tournamentType === 'society_only' && tournament.allowedSociety && (
                      <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                        eligible 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {eligible ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            You're eligible
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            {tournament.allowedSociety} only
                          </>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/tournaments/${tournament._id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                      
                      {registrationOpen && (
                        <Button size="sm" asChild className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                          <Link href={`/tournaments/${tournament._id}`}>
                            <Sparkles className="h-4 w-4 mr-1" />
                            Register
                          </Link>
                        </Button>
                      )}
                      
                      {isFull && tournament.status === 'registration_open' && (
                        <div className="flex-1 flex items-center justify-center text-sm text-red-600 font-medium">
                          <XCircle className="h-4 w-4 mr-1" />
                          Full
                        </div>
                      )}
                      
                      {tournament.status === 'ongoing' && (
                        <div className="flex-1 flex items-center justify-center text-sm text-blue-600 font-medium">
                          <Clock className="h-4 w-4 mr-1" />
                          Ongoing
                        </div>
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
