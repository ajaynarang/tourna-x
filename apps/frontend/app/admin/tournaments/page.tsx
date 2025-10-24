'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Trophy,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  venue: string;
  location: string;
  startDate: string;
  endDate: string;
  categories: string[];
  format: string;
  entryFee: number;
  maxParticipants: number;
  participantCount: number;
  status: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTournamentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sportFilter, setSportFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    filterTournaments();
  }, [tournaments, searchTerm, statusFilter, sportFilter]);

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tournaments');
      const result = await response.json();
      
      if (result.success) {
        setTournaments(result.data);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
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

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tournament => tournament.status === statusFilter);
    }

    // Sport filter
    if (sportFilter !== 'all') {
      filtered = filtered.filter(tournament => tournament.sport === sportFilter);
    }

    setFilteredTournaments(filtered);
  };

  const handlePublish = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/publish`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        fetchTournaments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error publishing tournament:', error);
    }
  };

  const handleOpenRegistration = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/open-registration`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        fetchTournaments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error opening registration:', error);
    }
  };

  const handleDelete = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        fetchTournaments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-500/10 border-gray-500/30 text-gray-400', icon: Edit },
      published: { color: 'bg-blue-500/10 border-blue-500/30 text-blue-400', icon: Eye },
      registration_open: { color: 'bg-green-500/10 border-green-500/30 text-green-400', icon: Users },
      ongoing: { color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', icon: Play },
      completed: { color: 'bg-purple-500/10 border-purple-500/30 text-purple-400', icon: CheckCircle },
      cancelled: { color: 'bg-red-500/10 border-red-500/30 text-red-400', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getStatusActions = (tournament: Tournament) => {
    const actions = [];

    switch (tournament.status) {
      case 'draft':
        actions.push(
          <Button
            key="publish"
            onClick={() => handlePublish(tournament._id)}
            size="sm"
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-1" />
            Publish
          </Button>
        );
        break;
      
      case 'published':
        actions.push(
          <Button
            key="open-registration"
            onClick={() => handleOpenRegistration(tournament._id)}
            size="sm"
            variant="outline"
          >
            <Users className="h-4 w-4 mr-1" />
            Open Registration
          </Button>
        );
        break;
      
      case 'registration_open':
        actions.push(
          <Button
            key="manage-participants"
            asChild
            size="sm"
            variant="outline"
          >
            <Link href={`/admin/tournaments/${tournament._id}/participants`}>
              <Users className="h-4 w-4 mr-1" />
              Manage Participants
            </Link>
          </Button>
        );
        break;
      
      case 'ongoing':
        actions.push(
          <Button
            key="live-scoring"
            asChild
            size="sm"
            variant="outline"
          >
            <Link href={`/admin/scoring?tournament=${tournament._id}`}>
              <Play className="h-4 w-4 mr-1" />
              Live Scoring
            </Link>
          </Button>
        );
        break;
    }

    actions.push(
      <Button
        key="edit"
        asChild
        size="sm"
        variant="outline"
      >
        <Link href={`/admin/tournaments/${tournament._id}/edit`}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Link>
      </Button>
    );

    actions.push(
      <Button
        key="delete"
        onClick={() => handleDelete(tournament._id)}
        size="sm"
        variant="outline"
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
    );

    return actions;
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTournaments.map((tournament) => (
        <div key={tournament._id} className="glass-card-intense hover:shadow-lg transition-all duration-300 hover:scale-105 group">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-primary line-clamp-2 group-hover:text-primary/80 transition-colors">{tournament.name}</h3>
                <p className="text-tertiary text-sm mt-1">
                  {tournament.sport.charAt(0).toUpperCase() + tournament.sport.slice(1)} Tournament
                </p>
              </div>
              {getStatusBadge(tournament.status)}
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
                {tournament.participantCount} / {tournament.maxParticipants} participants
              </div>
              
              <div className="flex items-center text-sm text-tertiary">
                <DollarSign className="h-4 w-4 mr-2" />
                Entry Fee: ₹{tournament.entryFee}
              </div>
              
              <div className="flex items-center text-sm text-tertiary">
                <Trophy className="h-4 w-4 mr-2" />
                {tournament.categories.join(', ')} • {tournament.format}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {getStatusActions(tournament).slice(0, 2)}
              {getStatusActions(tournament).length > 2 && (
                <Button size="sm" variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredTournaments.map((tournament) => (
        <div key={tournament._id} className="glass-card-intense hover:shadow-md transition-all duration-300 group">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-lg font-semibold text-primary group-hover:text-primary/80 transition-colors">{tournament.name}</h3>
                  {getStatusBadge(tournament.status)}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-tertiary">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {tournament.venue}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(tournament.startDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {tournament.participantCount}/{tournament.maxParticipants}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    ₹{tournament.entryFee}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusActions(tournament)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="relative z-10 min-h-screen p-8 flex items-center justify-center">
        <div className="glass-card-intense p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-tertiary">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold gradient-title">
                Tournament Management
              </h1>
              <p className="text-tertiary">
                Manage all your tournaments and track their progress
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/tournaments/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Tournament
              </Link>
            </Button>
          </div>

          {/* Filters and Search */}
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="registration_open">Registration Open</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
                
                <select
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  className="px-3 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                >
                  <option value="all">All Sports</option>
                  <option value="badminton">Badminton</option>
                  <option value="tennis">Tennis</option>
                </select>
                
                <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <Button
                    onClick={() => setViewMode('grid')}
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-r-none bg-transparent hover:bg-white/10"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode('list')}
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-l-none bg-transparent hover:bg-white/10"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tournaments List */}
        {filteredTournaments.length === 0 ? (
          <div className="glass-card-intense p-12 text-center">
            <Trophy className="h-16 w-16 text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">
              {searchTerm || statusFilter !== 'all' || sportFilter !== 'all' 
                ? 'No tournaments found' 
                : 'No tournaments yet'
              }
            </h3>
            <p className="text-tertiary mb-6">
              {searchTerm || statusFilter !== 'all' || sportFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first tournament to get started'
              }
            </p>
            {(!searchTerm && statusFilter === 'all' && sportFilter === 'all') && (
              <Button asChild>
                <Link href="/admin/tournaments/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tournament
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-tertiary">
                Showing {filteredTournaments.length} of {tournaments.length} tournaments
              </p>
            </div>
            
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </>
        )}
    </div>
  );
}