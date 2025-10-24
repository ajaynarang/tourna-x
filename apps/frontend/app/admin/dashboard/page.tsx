'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/auth-guard';
import { 
  Trophy, 
  Users, 
  Calendar,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  Dumbbell,
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  participantCount: number;
  maxParticipants: number;
}

interface Stats {
  activeTournaments: number;
  totalParticipants: number;
  pendingApprovals: number;
  upcomingMatches: number;
}

export default function AdminDashboard() {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <AdminDashboardContent />
    </AuthGuard>
  );
}

function AdminDashboardContent() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [stats, setStats] = useState<Stats>({
    activeTournaments: 0,
    totalParticipants: 0,
    pendingApprovals: 0,
    upcomingMatches: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tournaments
      const tournamentsResponse = await fetch('/api/tournaments');
      const tournamentsData = await tournamentsResponse.json();
      const allTournaments = tournamentsData.data || [];
      
      // Fetch participants
      const participantsResponse = await fetch('/api/participants');
      const participantsData = await participantsResponse.json();
      const allParticipants = participantsData.data || [];

      // Get active tournaments (published, registration_open, ongoing)
      const activeTournaments = allTournaments.filter((t: Tournament) => 
        ['published', 'registration_open', 'ongoing'].includes(t.status)
      );
      
      setTournaments(activeTournaments.slice(0, 3)); // Show only 3 most recent

      // Calculate stats
      setStats({
        activeTournaments: activeTournaments.length,
        totalParticipants: allParticipants.length,
        pendingApprovals: allParticipants.filter((p: any) => !p.isApproved).length,
        upcomingMatches: allTournaments.filter((t: Tournament) => t.status === 'ongoing').length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
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
        className="mx-auto max-w-7xl"
      >
        {/* Quick Actions */}
        <motion.div variants={item} className="mb-8 flex flex-col lg:flex-row gap-4">
        <button
            onClick={() => router.push('/admin/practice-matches')}
            className="glass-card-intense group flex w-full items-center justify-between p-6 transition-all hover:scale-[1.02] sm:w-auto"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl 
              bg-primary">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-primary text-lg font-semibold">Practice Match</h3>
                <p className="text-tertiary text-sm">Record daily practice sessions</p>
              </div>
            </div>
            <ArrowRight className="text-tertiary h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => router.push('/admin/tournaments/create')}
            className="glass-card-intense group flex w-full items-center justify-between p-6 transition-all hover:scale-[1.02] sm:w-auto"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-blue-500">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-primary text-lg font-semibold">Create Tournament</h3>
                <p className="text-tertiary text-sm">Start organizing a new event</p>
              </div>
            </div>
            <ArrowRight className="text-tertiary h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={item}
          className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            title="Active Tournaments"
            value={stats.activeTournaments}
            icon={Trophy}
            color="from-green-500 to-emerald-500"
            href="/admin/tournaments"
          />
          <StatCard
            title="Total Participants"
            value={stats.totalParticipants}
            icon={Users}
            color="from-blue-500 to-cyan-500"
            href="/admin/participants"
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={Clock}
            color="from-orange-500 to-amber-500"
            href="/admin/participants"
            alert={stats.pendingApprovals > 0}
          />
          <StatCard
            title="Ongoing Matches"
            value={stats.upcomingMatches}
            icon={Calendar}
            color="from-purple-500 to-pink-500"
            href="/admin/fixtures"
          />
        </motion.div>

        {/* Recent Tournaments */}
        {tournaments.length > 0 && (
          <motion.div variants={item}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-primary text-xl font-semibold">Active Tournaments</h2>
              <Link
                href="/admin/tournaments"
                className="text-tertiary hover:text-primary flex items-center gap-2 text-sm transition-colors"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {tournaments.map((tournament, index) => (
                <motion.div
                  key={tournament._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TournamentCard tournament={tournament} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {tournaments.length === 0 && (
          <motion.div variants={item} className="glass-card-intense p-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20">
              <Trophy className="h-10 w-10 text-green-400" />
            </div>
            <h3 className="text-primary mb-2 text-xl font-semibold">No Active Tournaments</h3>
            <p className="text-muted-foreground mb-6">Get started by creating your first tournament</p>
            <button
              onClick={() => router.push('/admin/tournaments/create')}
              className="bg-primary mx-auto inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-transform hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              Create Tournament
            </button>
          </motion.div>
        )}
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
  alert = false,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  href: string;
  alert?: boolean;
}) {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push(href)}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card-intense group relative overflow-hidden p-6 text-left"
    >
      {/* Alert Indicator */}
      {alert && (
        <div className="absolute right-4 top-4">
          <div className="relative">
            <div className="h-3 w-3 animate-pulse rounded-full bg-orange-500"></div>
            <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-orange-500 opacity-75"></div>
          </div>
        </div>
      )}

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

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const router = useRouter();
  const progress = (tournament.participantCount / tournament.maxParticipants) * 100;

  const getStatusConfig = (status: string) => {
    const configs = {
      published: { label: 'Open for Registration', color: 'text-green-400', bg: 'bg-green-500/10' },
      registration_open: { label: 'Registration Open', color: 'text-green-400', bg: 'bg-green-500/10' },
      ongoing: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10' },
      completed: { label: 'Completed', color: 'text-gray-400', bg: 'bg-gray-500/10' },
    };
    return configs[status as keyof typeof configs] || configs.published;
  };

  const statusConfig = getStatusConfig(tournament.status);

  return (
    <button
      onClick={() => router.push(`/admin/tournaments/${tournament._id}/participants`)}
      className="glass-card group w-full p-6 text-left transition-all hover:scale-[1.01]"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-primary text-lg font-semibold group-hover:text-green-400 transition-colors">
              {tournament.name}
            </h3>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
              {statusConfig.label}
            </span>
          </div>

          <div className="text-muted-foreground mb-4 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              {tournament.sport}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(tournament.startDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
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
        </div>

        <ArrowRight className="text-tertiary ml-4 h-5 w-5 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}
