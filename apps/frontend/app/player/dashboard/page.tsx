'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  Phone,
  Mail,
  Home,
  Plus,
  Eye,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Award,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle
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
  allowedSociety?: string;
}

interface Match {
  _id: string;
  tournamentName: string;
  round: string;
  player1Name: string;
  player2Name: string;
  scheduledDate: string;
  court: string;
  status: string;
  player1Score: number[];
  player2Score: number[];
}

interface Participant {
  _id: string;
  tournamentId: string;
  tournamentName: string;
  category: string;
  paymentStatus: string;
  isApproved: boolean;
  registeredAt: string;
}

export default function PlayerDashboard() {
  return (
    <AuthGuard requiredRoles={['player']}>
      <PlayerDashboardContent />
    </AuthGuard>
  );
}

function PlayerDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participations, setParticipations] = useState<Participant[]>([]);
  const [playerStats, setPlayerStats] = useState({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalTournaments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const dashboardResponse = await fetch('/api/player/dashboard');
      const dashboardResult = await dashboardResponse.json();
      
      if (dashboardResult.success && dashboardResult.data) {
        const data = dashboardResult.data;
        
        setTournaments(data.availableTournaments || []);
        setMatches(data.upcomingMatches || []);
        setParticipations(data.recentParticipations || []);
        
        if (data.player) {
          setPlayerStats(data.player.stats || {
            totalMatches: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalTournaments: 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'registration_open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isEligibleForTournament = (tournament: Tournament) => {
    if (tournament.tournamentType === 'open') return true;
    if (tournament.tournamentType === 'society_only' && tournament.allowedSociety) {
      return user?.society === tournament.allowedSociety;
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative z-10 min-h-screen p-8">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={item} className="mb-8">
          <div className="flex justify-end">
            <button
              onClick={fetchDashboardData}
              className="glass-card flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-primary transition-all hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={item}
          className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            title="Total Matches"
            value={playerStats.totalMatches}
            icon={Activity}
            color="from-blue-500 to-cyan-500"
            href="/player/matches"
          />
          <StatCard
            title="Win Rate"
            value={`${playerStats.winRate.toFixed(0)}%`}
            icon={TrendingUp}
            color="from-green-500 to-emerald-500"
            href="/player/stats"
          />
          <StatCard
            title="Victories"
            value={playerStats.wins}
            icon={CheckCircle2}
            color="from-purple-500 to-pink-500"
            href="/player/matches"
          />
          <StatCard
            title="Tournaments"
            value={playerStats.totalTournaments}
            icon={Trophy}
            color="from-orange-500 to-amber-500"
            href="/tournaments"
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-primary text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <QuickActionCard
              title="Browse Tournaments"
              description="Discover tournaments"
              icon={Trophy}
              color="from-blue-500 to-cyan-500"
              href="/tournaments"
            />
            <QuickActionCard
              title="My Matches"
              description="Track your matches"
              icon={Calendar}
              color="from-green-500 to-emerald-500"
              href="/player/matches"
            />
            <QuickActionCard
              title="My Profile"
              description="Manage profile"
              icon={Users}
              color="from-purple-500 to-pink-500"
              href="/profile"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upcoming Matches */}
          <motion.div variants={item}>
            <div className="glass-card-intense p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-primary text-xl font-semibold">Upcoming Matches</h3>
                  <p className="text-muted-foreground text-sm">Your scheduled matches</p>
                </div>
                <Link
                  href="/player/matches"
                  className="text-tertiary hover:text-primary flex items-center gap-2 text-sm transition-colors"
                >
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-4">
                {matches.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20">
                      <Calendar className="h-10 w-10 text-green-400" />
                    </div>
                    <h3 className="text-primary mb-2 text-xl font-semibold">No Upcoming Matches</h3>
                    <p className="text-muted-foreground mb-6">Register for tournaments to see your matches here</p>
                    <button
                      onClick={() => router.push('/tournaments')}
                      className="bg-primary inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-transform hover:scale-105"
                    >
                      <Trophy className="h-5 w-5" />
                      Browse Tournaments
                    </button>
                  </div>
                ) : (
                  matches.map((match, index) => (
                    <motion.div
                      key={match._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-card group p-4 transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-3 flex items-center gap-3">
                            <h4 className="text-primary text-lg font-semibold group-hover:text-green-400 transition-colors">
                              {match.tournamentName}
                            </h4>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(match.status)}`}>
                              {match.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="text-muted-foreground space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>vs. <strong>{match.player2Name}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(match.scheduledDate).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}</span>
                            </div>
                            {match.court && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>Court {match.court}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="text-tertiary ml-4 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Available Tournaments */}
          <motion.div variants={item}>
            <div className="glass-card-intense p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-primary text-xl font-semibold">Open Tournaments</h3>
                  <p className="text-muted-foreground text-sm">Join these tournaments</p>
                </div>
                <Link
                  href="/tournaments"
                  className="text-tertiary hover:text-primary flex items-center gap-2 text-sm transition-colors"
                >
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-4">
                {tournaments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20">
                      <Trophy className="h-10 w-10 text-green-400" />
                    </div>
                    <h3 className="text-primary mb-2 text-xl font-semibold">No Tournaments Available</h3>
                    <p className="text-muted-foreground">Check back later for new tournaments</p>
                  </div>
                ) : (
                  tournaments.slice(0, 3).map((tournament, index) => (
                    <motion.div
                      key={tournament._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-card group p-4 transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-3 flex items-center gap-3">
                            <h4 className="text-primary text-lg font-semibold group-hover:text-green-400 transition-colors">
                              {tournament.name}
                            </h4>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(tournament.status)}`}>
                              {tournament.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="text-muted-foreground space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4" />
                              <span className="capitalize">{tournament.sport}</span>
                              <span className="text-tertiary">•</span>
                              <span>₹{tournament.entryFee}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(tournament.startDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{tournament.venue}</span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="text-tertiary ml-4 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Participations */}
        <motion.div variants={item}>
          <div className="glass-card-intense p-6">
            <div className="mb-6">
              <h3 className="text-primary text-xl font-semibold">My Registrations</h3>
              <p className="text-muted-foreground text-sm">Recent tournament registrations and their status</p>
            </div>
            
            <div className="space-y-4">
              {participations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20">
                    <Users className="h-10 w-10 text-green-400" />
                  </div>
                  <h3 className="text-primary mb-2 text-xl font-semibold">No Registrations Yet</h3>
                  <p className="text-muted-foreground mb-6">Register for tournaments to see your participations here</p>
                  <button
                    onClick={() => router.push('/tournaments')}
                    className="bg-primary inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-transform hover:scale-105"
                  >
                    <Trophy className="h-5 w-5" />
                    Browse Tournaments
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {participations.map((participation, index) => (
                    <motion.div
                      key={participation._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-card p-4 transition-all hover:scale-[1.02]"
                    >
                      <div className="mb-3">
                        <h4 className="text-primary font-semibold text-sm line-clamp-2">
                          {participation.tournamentName}
                        </h4>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getPaymentStatusColor(participation.paymentStatus)}`}>
                            {participation.paymentStatus}
                          </span>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                            participation.isApproved 
                              ? 'bg-green-500/10 text-green-400' 
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {participation.isApproved ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> Pending</>
                            )}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <strong>Category:</strong> {participation.category}
                        </div>
                        <div className="text-xs text-tertiary">
                          Registered: {new Date(participation.registeredAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  href: string;
}) {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push(href)}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card-intense group relative overflow-hidden p-6 text-left"
    >
      {/* Icon */}
      <div className="mb-4 flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} transition-transform group-hover:scale-110`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Value */}
      <div className="text-primary mb-1 text-3xl font-bold">{value}</div>

      {/* Title */}
      <div className="text-muted-foreground text-sm font-medium">{title}</div>
    </motion.button>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  description: string;
  icon: any;
  color: string;
  href: string;
}) {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push(href)}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card group relative overflow-hidden p-6 text-left transition-all hover:scale-[1.02]"
    >
      <div className="flex items-center justify-between">
        <div className="text-left">
          <div className="text-muted-foreground text-sm mb-1">{description}</div>
          <div className="text-primary text-lg font-semibold">{title}</div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} transition-transform group-hover:scale-110`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <ArrowRight className="text-tertiary absolute right-4 top-4 h-5 w-5 transition-transform group-hover:translate-x-1" />
    </motion.button>
  );
}
