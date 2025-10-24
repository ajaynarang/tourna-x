'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  ArrowLeft,
  Trophy,
  Users,
  Calendar,
  MapPin,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Award,
  Target,
  BarChart3,
  RefreshCw,
  Archive,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  format: string;
  status: string;
  startDate: string;
  endDate: string;
  venue: string;
  location: string;
  participantCount: number;
  maxParticipants: number;
  categories: string[];
  ageGroups?: string[];
  prizes: {
    winner: number;
    runnerUp: number;
    semiFinalist: number;
  };
  createdAt: string;
}

interface TournamentResult {
  tournamentId: string;
  category: string;
  ageGroup?: string;
  winner: {
    name: string;
    id: string;
  };
  runnerUp: {
    name: string;
    id: string;
  };
  semiFinalists?: {
    name: string;
    id: string;
  }[];
  totalMatches: number;
  completedMatches: number;
}

export default function TournamentArchivePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'tournaments' | 'results'>('tournaments');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch completed tournaments
      const tournamentsResponse = await fetch('/api/tournaments?status=completed');
      const tournamentsResult = await tournamentsResponse.json();
      
      if (tournamentsResult.success) {
        setTournaments(tournamentsResult.data);
      }

      // Fetch tournament results
      const resultsResponse = await fetch('/api/tournaments/results');
      const resultsResult = await resultsResponse.json();
      
      if (resultsResult.success) {
        setResults(resultsResult.data);
      }
    } catch (error) {
      console.error('Error fetching archive data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredTournaments = () => {
    let filtered = tournaments;

    if (searchTerm) {
      filtered = filtered.filter(tournament =>
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.venue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sportFilter !== 'all') {
      filtered = filtered.filter(tournament => tournament.sport === sportFilter);
    }

    if (yearFilter !== 'all') {
      filtered = filtered.filter(tournament => 
        new Date(tournament.startDate).getFullYear().toString() === yearFilter
      );
    }

    return filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  };

  const getFilteredResults = () => {
    let filtered = results;

    if (searchTerm) {
      filtered = filtered.filter(result => {
        const tournament = tournaments.find(t => t._id === result.tournamentId);
        return tournament?.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (sportFilter !== 'all') {
      filtered = filtered.filter(result => {
        const tournament = tournaments.find(t => t._id === result.tournamentId);
        return tournament?.sport === sportFilter;
      });
    }

    return filtered;
  };

  const getYears = () => {
    const years = [...new Set(tournaments.map(t => new Date(t.startDate).getFullYear()))];
    return years.sort((a, b) => b - a);
  };

  const getSports = () => {
    return [...new Set(tournaments.map(t => t.sport))];
  };

  const getTournamentStats = () => {
    const totalTournaments = tournaments.length;
    const totalParticipants = tournaments.reduce((sum, t) => sum + t.participantCount, 0);
    const totalPrizeMoney = tournaments.reduce((sum, t) => 
      sum + t.prizes.winner + t.prizes.runnerUp + t.prizes.semiFinalist, 0
    );
    const averageParticipants = totalTournaments > 0 ? Math.round(totalParticipants / totalTournaments) : 0;

    return {
      totalTournaments,
      totalParticipants,
      totalPrizeMoney,
      averageParticipants,
    };
  };

  const renderTournamentsView = () => {
    const filteredTournaments = getFilteredTournaments();
    const stats = getTournamentStats();

    return (
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-intense p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Trophy className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-tertiary">Total Tournaments</p>
                <p className="text-2xl font-bold text-primary">{stats.totalTournaments}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-intense p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-tertiary">Total Participants</p>
                <p className="text-2xl font-bold text-primary">{stats.totalParticipants}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-intense p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Award className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-tertiary">Prize Money</p>
                <p className="text-2xl font-bold text-primary">₹{stats.totalPrizeMoney.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card-intense p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-tertiary">Avg Participants</p>
                <p className="text-2xl font-bold text-primary">{stats.averageParticipants}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament, index) => (
            <motion.div
              key={tournament._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card-intense hover:shadow-lg transition-all duration-300 hover:scale-105 group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary line-clamp-2 group-hover:text-primary/80 transition-colors">
                      {tournament.name}
                    </h3>
                    <p className="text-tertiary text-sm mt-1">
                      {tournament.sport.charAt(0).toUpperCase() + tournament.sport.slice(1)} Tournament
                    </p>
                  </div>
                  <Badge className="bg-green-500/10 border-green-500/30 text-green-400">
                    Completed
                  </Badge>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-tertiary">
                    <MapPin className="h-4 w-4 mr-2" />
                    {tournament.venue}, {tournament.location}
                  </div>
                  
                  <div className="flex items-center text-sm text-tertiary">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center text-sm text-tertiary">
                    <Users className="h-4 w-4 mr-2" />
                    {tournament.participantCount} participants
                  </div>
                  
                  <div className="flex items-center text-sm text-tertiary">
                    <Trophy className="h-4 w-4 mr-2" />
                    {tournament.categories.join(', ')} • {tournament.format}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {tournament.categories.map((category) => (
                    <Badge key={category} variant="outline" className="capitalize bg-white/5 border-white/10">
                      {category}
                    </Badge>
                  ))}
                  {tournament.ageGroups?.map((ageGroup) => (
                    <Badge key={ageGroup} variant="outline" className="bg-white/5 border-white/10">
                      {ageGroup}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-tertiary">
                    Prize Pool: ₹{(tournament.prizes.winner + tournament.prizes.runnerUp + tournament.prizes.semiFinalist).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="bg-white/5 border-white/10 hover:bg-white/10"
                    >
                      <Link href={`/tournaments/${tournament._id}/results`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Results
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="bg-primary hover:bg-primary/80"
                    >
                      <Link href={`/tournaments/${tournament._id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderResultsView = () => {
    const filteredResults = getFilteredResults();

    return (
      <div className="space-y-6">
        {/* Results List */}
        <div className="glass-card-intense p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-primary">Tournament Results</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredResults.map((result, index) => {
              const tournament = tournaments.find(t => t._id === result.tournamentId);
              
              return (
                <motion.div
                  key={`${result.tournamentId}-${result.category}-${result.ageGroup}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-6 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h4 className="text-lg font-semibold text-primary group-hover:text-primary/80 transition-colors">
                          {tournament?.name} - {result.category}
                        </h4>
                        {result.ageGroup && (
                          <Badge variant="outline" className="bg-white/5 border-white/10">
                            {result.ageGroup}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-tertiary">
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 mr-2" />
                          Winner: {result.winner.name}
                        </div>
                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-2" />
                          Runner-up: {result.runnerUp.name}
                        </div>
                        <div className="flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          {result.completedMatches}/{result.totalMatches} matches
                        </div>
                      </div>

                      {result.semiFinalists && result.semiFinalists.length > 0 && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg">
                          <p className="text-sm text-tertiary mb-2">Semi-finalists:</p>
                          <div className="flex flex-wrap gap-2">
                            {result.semiFinalists.map((sf, i) => (
                              <Badge key={i} variant="outline" className="bg-white/5 border-white/10">
                                {sf.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="bg-white/5 border-white/10 hover:bg-white/10"
                      >
                        <Link href={`/tournaments/${result.tournamentId}/results`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="relative z-10 min-h-screen p-8 flex items-center justify-center">
        <div className="glass-card-intense p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-tertiary">Loading tournament archive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href={user?.roles?.includes('admin') ? '/admin/dashboard' : '/player/dashboard'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold gradient-title">
              Tournament Archive
            </h1>
            <p className="text-tertiary">
              Browse completed tournaments and view results
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="glass-card-intense p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary">Archive View</h3>
              <p className="text-tertiary text-sm">Switch between tournament list and results view</p>
            </div>
            <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <Button
                onClick={() => setViewMode('tournaments')}
                variant={viewMode === 'tournaments' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none bg-transparent hover:bg-white/10"
              >
                <Archive className="h-4 w-4 mr-1" />
                Tournaments
              </Button>
              <Button
                onClick={() => setViewMode('results')}
                variant={viewMode === 'results' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none bg-transparent hover:bg-white/10"
              >
                <Trophy className="h-4 w-4 mr-1" />
                Results
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card-intense p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tertiary" />
                <input
                  type="text"
                  placeholder="Search tournaments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary placeholder:text-tertiary"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="px-3 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
              >
                <option value="all">All Sports</option>
                {getSports().map(sport => (
                  <option key={sport} value={sport}>{sport.charAt(0).toUpperCase() + sport.slice(1)}</option>
                ))}
              </select>
              
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
              >
                <option value="all">All Years</option>
                {getYears().map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
              
              <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'tournaments' ? renderTournamentsView() : renderResultsView()}
    </div>
  );
}

