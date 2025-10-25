'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Trophy,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  Loader2,
  Target,
  Award,
  Edit,
  UserPlus,
  Settings,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  MoreVertical,
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
  format: string;
  description?: string;
  rules?: string;
  prizes?: string | {
    winner: Array<{
      type: string;
      value: number;
      description: string;
      currency: string;
    }>;
    runnerUp: Array<{
      type: string;
      value: number;
      description: string;
      currency: string;
    }>;
    semiFinalist: Array<{
      type: string;
      value: number;
      description: string;
      currency: string;
    }>;
  };
  contactPerson?: string;
  contactPhone?: string;
  participantCount: number;
  registrationDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTournamentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <AdminTournamentDetailsContent params={params} />
    </AuthGuard>
  );
}

function AdminTournamentDetailsContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then(({ id }) => {
      fetchTournament(id);
    });
  }, [params]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchTournament = async (tournamentId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      const result = await response.json();

      if (result.success) {
        setTournament(result.data);
      } else {
        setError(result.error || 'Tournament not found');
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
      setError('Failed to load tournament. Please check if the tournament ID is valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Clock },
      published: { label: 'Published', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
      registration_open: { label: 'Registration Open', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
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

  const handleStateChange = async (newStatus: string) => {
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
        fetchTournament(id as string);
      } else {
        alert(result.error || 'Failed to change status');
      }
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Failed to change tournament status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="relative z-10 min-h-screen p-8">
        <div className="mx-auto max-w-4xl">
          <div className="glass-card-intense flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-red-400">
            <XCircle className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-bold">Tournament Not Found</h2>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  const statusConfig = getStatusConfig(tournament.status);
  const StatusIcon = statusConfig.icon;
  const availableTransitions = getAvailableTransitions(tournament.status);

  return (
    <div className="relative z-10 min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/admin/tournaments"
            className="glass-card flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-transform hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tournaments
          </Link>
          <div className="flex-1">
            <h1 className="text-primary text-3xl font-bold">{tournament.name}</h1>
            <p className="text-muted-foreground mt-1">{tournament.sport.charAt(0).toUpperCase() + tournament.sport.slice(1)} Tournament</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${statusConfig.color} ${statusConfig.bg}`}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </span>
            
            {/* Management Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="glass-card rounded-lg p-2 transition-all hover:bg-white/10"
              >
                <MoreVertical className="text-tertiary h-5 w-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
                  <Link
                    href={`/admin/tournaments/${id}/participants`}
                    onClick={() => setShowMenu(false)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    <UserPlus className="h-4 w-4" />
                    Manage Participants
                  </Link>

                  <Link
                    href={`/admin/tournaments/${id}/fixtures`}
                    onClick={() => setShowMenu(false)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    <Target className="h-4 w-4" />
                    Generate Fixtures
                  </Link>

                  <Link
                    href={`/admin/tournaments/${id}/edit`}
                    onClick={() => setShowMenu(false)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Tournament
                  </Link>

                  <Link
                    href={`/admin/tournaments/${id}/history`}
                    onClick={() => setShowMenu(false)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Match History
                  </Link>

                  <div className="h-px bg-gray-700"></div>
                  
                  <Link
                    href={`/tournaments/${id}`}
                    onClick={() => setShowMenu(false)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    <Info className="h-4 w-4" />
                    View Public Page
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tournament Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-intense mb-8 p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-blue-500">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-primary text-xl font-semibold">Tournament Overview</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Tournament Dates</div>
                <div className="text-primary font-semibold">
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

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <MapPin className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Venue</div>
                <div className="text-primary font-semibold">{tournament.venue}</div>
                <div className="text-tertiary text-xs">{tournament.location}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Entry Fee</div>
                <div className="text-primary font-semibold">₹{tournament.entryFee}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Participants</div>
                <div className="text-primary font-semibold">
                  {tournament.participantCount} / {tournament.maxParticipants}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tournament Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-intense p-6"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Info className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Basic Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-muted-foreground text-sm">Tournament Format</div>
                <div className="text-primary font-semibold capitalize">{tournament.format}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Tournament Type</div>
                <div className="text-primary font-semibold capitalize">
                  {tournament.tournamentType.replace('_', ' ')}
                </div>
              </div>
              {tournament.allowedSociety && (
                <div>
                  <div className="text-muted-foreground text-sm">Allowed Society</div>
                  <div className="text-primary font-semibold">{tournament.allowedSociety}</div>
                </div>
              )}
              {tournament.registrationDeadline && (
                <div>
                  <div className="text-muted-foreground text-sm">Registration Deadline</div>
                  <div className="text-primary font-semibold">
                    {new Date(tournament.registrationDeadline).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-intense p-6"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Categories</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-muted-foreground text-sm mb-2">Available Categories</div>
                <div className="flex flex-wrap gap-2">
                  {tournament.categories.map((category) => (
                    <span
                      key={category}
                      className="glass-card rounded-full px-3 py-1 text-sm font-medium text-primary"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              {tournament.ageGroups && tournament.ageGroups.length > 0 && (
                <div>
                  <div className="text-muted-foreground text-sm mb-2">Age Groups</div>
                  <div className="flex flex-wrap gap-2">
                    {tournament.ageGroups.map((ageGroup) => {
                      const isString = typeof ageGroup === 'string';
                      const name = isString ? ageGroup : ageGroup.name;
                      const minAge = !isString && ageGroup.minAge;
                      const maxAge = !isString && ageGroup.maxAge;
                      
                      let ageRange = '';
                      if (minAge && maxAge) {
                        ageRange = ` (${minAge}-${maxAge} years)`;
                      } else if (minAge) {
                        ageRange = ` (${minAge}+ years)`;
                      } else if (maxAge) {
                        ageRange = ` (up to ${maxAge} years)`;
                      }
                      
                      return (
                        <span
                          key={name}
                          className="glass-card rounded-full px-3 py-1 text-sm font-medium text-primary"
                        >
                          {name}{ageRange}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Additional Information */}
        {(tournament.description || tournament.rules || tournament.prizes) && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Description */}
            {tournament.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card-intense p-6"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-primary text-xl font-semibold">Description</h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">{tournament.description}</p>
              </motion.div>
            )}

            {/* Rules */}
            {tournament.rules && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card-intense p-6"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-primary text-xl font-semibold">Rules & Regulations</h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">{tournament.rules}</p>
              </motion.div>
            )}

            {/* Prizes */}
            {tournament.prizes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card-intense p-6"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-primary text-xl font-semibold">Prizes</h2>
                </div>
                {typeof tournament.prizes === 'string' ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{tournament.prizes}</p>
                ) : (
                  <div className="space-y-4">
                    {tournament.prizes.winner && tournament.prizes.winner.length > 0 && (
                      <div>
                        <h4 className="text-primary mb-2 font-semibold">Winner</h4>
                        <ul className="text-muted-foreground space-y-1">
                          {tournament.prizes.winner.map((prize, index) => (
                            <li key={index}>
                              • {prize.description}: {prize.value} {prize.currency}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tournament.prizes.runnerUp && tournament.prizes.runnerUp.length > 0 && (
                      <div>
                        <h4 className="text-primary mb-2 font-semibold">Runner Up</h4>
                        <ul className="text-muted-foreground space-y-1">
                          {tournament.prizes.runnerUp.map((prize, index) => (
                            <li key={index}>
                              • {prize.description}: {prize.value} {prize.currency}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tournament.prizes.semiFinalist && tournament.prizes.semiFinalist.length > 0 && (
                      <div>
                        <h4 className="text-primary mb-2 font-semibold">Semi Finalist</h4>
                        <ul className="text-muted-foreground space-y-1">
                          {tournament.prizes.semiFinalist.map((prize, index) => (
                            <li key={index}>
                              • {prize.description}: {prize.value} {prize.currency}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Contact Information */}
        {(tournament.contactPerson || tournament.contactPhone) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 glass-card-intense p-6"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Contact Information</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {tournament.contactPerson && (
                <div>
                  <div className="text-muted-foreground text-sm">Contact Person</div>
                  <div className="text-primary font-semibold">{tournament.contactPerson}</div>
                </div>
              )}
              {tournament.contactPhone && (
                <div>
                  <div className="text-muted-foreground text-sm">Contact Phone</div>
                  <div className="text-primary font-semibold">{tournament.contactPhone}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
