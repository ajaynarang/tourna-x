'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { 
  Search,
  Trophy,
  Calendar,
  Users,
  MapPin,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Sparkles,
  LogIn,
  Target,
  AlertCircle,
  DollarSign,
  UserCheck
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
  tournamentType: string;
  allowedSociety?: string;
  createdAt: string;
  // Registration status (populated for logged-in users)
  registrationStatus?: {
    registered: boolean;
    isApproved?: boolean;
    paymentStatus?: string;
    category?: string;
    registeredAt?: string;
  };
}

export default function TournamentsPage() {
  const { user } = useAuth();
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
        // Show only published tournaments for public/players
        const published = result.data.filter((t: Tournament) => t.isPublished);
        
        // If user is logged in, fetch registration status for each tournament
        if (user) {
          const tournamentsWithStatus = await Promise.all(
            published.map(async (tournament: Tournament) => {
              try {
                const statusResponse = await fetch(`/api/tournaments/${tournament._id}/check-registration`);
                const statusResult = await statusResponse.json();
                
                if (statusResult.success && statusResult.registered) {
                  return {
                    ...tournament,
                    registrationStatus: {
                      registered: true,
                      isApproved: statusResult.registration.isApproved,
                      paymentStatus: statusResult.registration.paymentStatus,
                      category: statusResult.registration.category,
                      registeredAt: statusResult.registration.registeredAt
                    }
                  };
                }
                return tournament;
              } catch (error) {
                console.error(`Error fetching registration status for tournament ${tournament._id}:`, error);
                return tournament;
              }
            })
          );
          setTournaments(tournamentsWithStatus);
        } else {
          setTournaments(published || []);
        }
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
        t.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.venue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    setFilteredTournaments(filtered);
  };

  const isEligibleForTournament = (tournament: Tournament) => {
    if (tournament.tournamentType === 'open') return true;
    if (tournament.tournamentType === 'society_only' && tournament.allowedSociety) {
      return (user as any)?.society === tournament.allowedSociety;
    }
    return false;
  };

  const canRegister = (tournament: Tournament) => {
    if (!user) return false;
    return (
      tournament.status === 'registration_open' &&
      tournament.participantCount < tournament.maxParticipants &&
      isEligibleForTournament(tournament)
    );
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
      <div>
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-primary text-3xl font-bold">Tournaments</h1>
            <p className="text-muted-foreground mt-2">Browse and register for tournaments</p>
          </div>
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
            <option value="registration_open">Registration Open</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
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
                  user={user}
                  isEligible={isEligibleForTournament(tournament)}
                  canRegister={canRegister(tournament)}
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
              {searchTerm || statusFilter !== 'all' ? 'No tournaments found' : 'No tournaments available'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Check back later for new tournaments'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TournamentCard({
  tournament,
  user,
  isEligible,
  canRegister,
}: {
  tournament: Tournament;
  user: any;
  isEligible: boolean;
  canRegister: boolean;
}) {
  const router = useRouter();

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

  const statusConfig = getStatusConfig(tournament.status);
  const StatusIcon = statusConfig.icon;
  const progress = (tournament.participantCount / tournament.maxParticipants) * 100;
  const isFull = tournament.participantCount >= tournament.maxParticipants;

  return (
    <div className="glass-card group relative p-6 transition-all hover:scale-[1.02]">
      {/* Status Badge */}
      <div className="mb-4 flex items-center justify-between">
        <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
          <StatusIcon className="h-3 w-3" />
          {statusConfig.label}
        </span>

        {/* Eligibility Badge for Society-Only Tournaments */}
        {tournament.tournamentType === 'society_only' && tournament.allowedSociety && user && (
          <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            isEligible 
              ? 'text-green-400 bg-green-500/10' 
              : 'text-orange-400 bg-orange-500/10'
          }`}>
            {isEligible ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Eligible
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Not Eligible
              </>
            )}
          </span>
        )}
      </div>

      {/* Tournament Info */}
      <button
        onClick={() => router.push(`/tournaments/${tournament._id}`)}
        className="w-full text-left"
      >
        <h3 className="text-primary mb-3 text-lg font-semibold group-hover:text-green-400 transition-colors">
          {tournament.name}
        </h3>

        <div className="text-muted-foreground space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="capitalize">{tournament.sport}</span>
            <span className="text-tertiary">•</span>
            <span className="capitalize">{tournament.format}</span>
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

          {/* Entry Fee */}
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Entry Fee: ₹{tournament.entryFee}</span>
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
              className={`h-full rounded-full ${
                isFull 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : 'bg-gradient-to-r from-green-500 to-blue-500'
              }`}
            />
          </div>
        </div>
      </button>

      {/* Registration Status Badge (if registered) */}
      {tournament.registrationStatus?.registered && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-tertiary">Registration Status:</span>
              <span className={`flex items-center gap-1 font-medium ${
                tournament.registrationStatus.isApproved 
                  ? 'text-green-400' 
                  : 'text-yellow-400'
              }`}>
                {tournament.registrationStatus.isApproved ? (
                  <>
                    <UserCheck className="h-3 w-3" />
                    Approved
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    Pending Approval
                  </>
                )}
              </span>
            </div>
            
            {tournament.entryFee > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-tertiary">Payment Status:</span>
                <span className={`flex items-center gap-1 font-medium ${
                  tournament.registrationStatus.paymentStatus === 'paid' 
                    ? 'text-green-400' 
                    : 'text-yellow-400'
                }`}>
                  <DollarSign className="h-3 w-3" />
                  {tournament.registrationStatus.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-tertiary">Category:</span>
              <span className="text-primary font-medium capitalize">
                {tournament.registrationStatus.category}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex items-center gap-2 pt-4 border-t border-white/10">
        <button
          onClick={() => router.push(`/tournaments/${tournament._id}`)}
          className="glass-card flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:bg-white/10"
        >
          <Eye className="h-4 w-4" />
          View Details
        </button>

        {/* Registration Button Logic */}
        {tournament.registrationStatus?.registered ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-green-400">
            <CheckCircle className="h-4 w-4" />
            Registered
          </div>
        ) : tournament.status === 'registration_open' && !isFull ? (
          <>
            {user ? (
              canRegister ? (
                <button
                  onClick={() => router.push(`/tournaments/${tournament._id}`)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all hover:from-blue-700 hover:to-indigo-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Register
                </button>
              ) : !isEligible ? (
                <div className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-orange-400">
                  <XCircle className="h-4 w-4" />
                  Not Eligible
                </div>
              ) : null
            ) : (
              <button
                onClick={() => router.push(`/login?redirect=/tournaments/${tournament._id}`)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white transition-all hover:from-green-700 hover:to-emerald-700"
              >
                <LogIn className="h-4 w-4" />
                Login to Register
              </button>
            )}
          </>
        ) : isFull && tournament.status === 'registration_open' ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-red-400">
            <XCircle className="h-4 w-4" />
            Tournament Full
          </div>
        ) : tournament.status === 'ongoing' ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-blue-400">
            <Clock className="h-4 w-4" />
            Ongoing
          </div>
        ) : tournament.status === 'completed' ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-gray-400">
            <CheckCircle className="h-4 w-4" />
            Completed
          </div>
        ) : null}
      </div>
    </div>
  );
}
