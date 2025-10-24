'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/auth-guard';
import { 
  Plus,
  Search,
  Trophy,
  Calendar,
  Users,
  MapPin,
  MoreVertical,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Copy,
  Archive,
  Play,
  Pause,
  RotateCcw,
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
}

export default function AdminTournamentsPage() {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <AdminTournamentsContent />
    </AuthGuard>
  );
}

function AdminTournamentsContent() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    filterTournaments();
  }, [tournaments, searchTerm, statusFilter]);

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tournaments');
      const result = await response.json();
      
      if (result.success) {
        setTournaments(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTournaments = () => {
    let filtered = tournaments;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    setFilteredTournaments(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;

    try {
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTournaments();
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
    }
  };

  const handleStateChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tournaments/${id}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_status',
          data: { status: newStatus }
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchTournaments();
      } else {
        alert(result.error || 'Failed to change status');
      }
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Failed to change tournament status');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/tournaments/${id}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'duplicate'
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchTournaments();
        router.push(`/admin/tournaments/${result.data._id}/participants`);
      } else {
        alert(result.error || 'Failed to duplicate tournament');
      }
    } catch (error) {
      console.error('Error duplicating tournament:', error);
      alert('Failed to duplicate tournament');
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this tournament?')) return;

    try {
      const response = await fetch(`/api/tournaments/${id}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive'
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchTournaments();
      } else {
        alert(result.error || 'Failed to archive tournament');
      }
    } catch (error) {
      console.error('Error archiving tournament:', error);
      alert('Failed to archive tournament');
    }
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
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-primary text-3xl font-bold">Tournaments</h1>
            <p className="text-secondary mt-1">Manage all your tournaments</p>
          </div>
          <button
            onClick={() => router.push('/admin/tournaments/create')}
            className="bg-primary flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            Create Tournament
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="glass-card flex flex-1 items-center gap-3 px-4 py-3">
            <Search className="text-tertiary h-5 w-5" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-primary flex-1 bg-transparent outline-none placeholder:text-tertiary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-card rounded-lg px-4 py-3 text-primary outline-none"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="registration_open">Registration Open</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Tournaments Grid */}
        {filteredTournaments.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredTournaments.map((tournament, index) => (
              <motion.div
                key={tournament._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TournamentCard
                  tournament={tournament}
                  onDelete={() => handleDelete(tournament._id)}
                  onStateChange={(newStatus) => handleStateChange(tournament._id, newStatus)}
                  onDuplicate={() => handleDuplicate(tournament._id)}
                  onArchive={() => handleArchive(tournament._id)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="glass-card-intense p-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20">
              <Trophy className="h-10 w-10 text-green-400" />
            </div>
            <h3 className="text-primary mb-2 text-xl font-semibold">
              {searchTerm || statusFilter !== 'all' ? 'No tournaments found' : 'No tournaments yet'}
            </h3>
            <p className="text-secondary mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first tournament to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => router.push('/admin/tournaments/create')}
                className="bg-primary inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-transform hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                Create Tournament
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TournamentCard({
  tournament,
  onDelete,
  onStateChange,
  onDuplicate,
  onArchive,
}: {
  tournament: Tournament;
  onDelete: () => void;
  onStateChange: (newStatus: string) => void;
  onDuplicate: () => void;
  onArchive: () => void;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showStateMenu, setShowStateMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const stateMenuRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (stateMenuRef.current && !stateMenuRef.current.contains(event.target as Node)) {
        setShowStateMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Clock },
      published: { label: 'Published', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
      registration_open: { label: 'Open', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
      ongoing: { label: 'Ongoing', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Trophy },
      completed: { label: 'Completed', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: CheckCircle },
      cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const getAvailableTransitions = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      draft: ['published', 'cancelled'],
      published: ['registration_open', 'draft', 'cancelled'],
      registration_open: ['ongoing', 'published', 'cancelled'],
      ongoing: ['completed', 'cancelled'],
      completed: [],
      cancelled: ['draft'],
    };
    return transitions[currentStatus] || [];
  };

  const getTransitionLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Make Draft',
      published: 'Publish',
      registration_open: 'Open Registration',
      ongoing: 'Start Tournament',
      completed: 'Complete',
      cancelled: 'Cancel',
    };
    return labels[status] || status;
  };

  const getTransitionIcon = (status: string) => {
    const icons: Record<string, any> = {
      draft: RotateCcw,
      published: Play,
      registration_open: Play,
      ongoing: Play,
      completed: CheckCircle,
      cancelled: XCircle,
    };
    return icons[status] || Play;
  };

  const statusConfig = getStatusConfig(tournament.status);
  const StatusIcon = statusConfig.icon;
  const progress = (tournament.participantCount / tournament.maxParticipants) * 100;

  return (
    <div className="glass-card group relative p-6 transition-all hover:scale-[1.02]">
      {/* Status Badge */}
      <div className="mb-4 flex items-center justify-between">
        <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
          <StatusIcon className="h-3 w-3" />
          {statusConfig.label}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* State Change Dropdown */}
          {getAvailableTransitions(tournament.status).length > 0 && (
            <div className="relative" ref={stateMenuRef}>
              <button
                onClick={() => setShowStateMenu(!showStateMenu)}
                className="glass-card rounded-lg p-2 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10"
                title="Change Status"
              >
                <Play className="text-tertiary h-4 w-4" />
              </button>

              {showStateMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
                  {getAvailableTransitions(tournament.status).map((status) => {
                    const TransitionIcon = getTransitionIcon(status);
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          setShowStateMenu(false);
                          onStateChange(status);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                      >
                        <TransitionIcon className="h-4 w-4" />
                        {getTransitionLabel(status)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Main Actions Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="glass-card rounded-lg p-2 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10"
            >
              <MoreVertical className="text-tertiary h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    router.push(`/admin/tournaments/${tournament._id}/participants`);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>

                {['draft', 'published'].includes(tournament.status) && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      router.push(`/admin/tournaments/${tournament._id}/edit`);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Tournament
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>

                {!['completed', 'cancelled'].includes(tournament.status) && (
                  <>
                    <div className="h-px bg-gray-700"></div>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onArchive();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-orange-400 transition-colors hover:bg-gray-800 hover:text-orange-300"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                  </>
                )}

                {tournament.status === 'draft' && (
                  <>
                    <div className="h-px bg-gray-700"></div>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-400 transition-colors hover:bg-gray-800 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tournament Info */}
      <button
        onClick={() => router.push(`/admin/tournaments/${tournament._id}/participants`)}
        className="w-full text-left"
      >
        <h3 className="text-primary mb-3 text-lg font-semibold group-hover:text-green-400 transition-colors">
          {tournament.name}
        </h3>

        <div className="text-secondary space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>{tournament.sport}</span>
            <span className="text-tertiary">•</span>
            <span>{tournament.format}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{tournament.venue}, {tournament.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(tournament.startDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Participants Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-tertiary">Participants</span>
            <span className="text-primary font-medium">
              {tournament.participantCount} / {tournament.maxParticipants}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500"
            />
          </div>
        </div>
      </button>
    </div>
  );
}
