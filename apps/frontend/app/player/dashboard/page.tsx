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
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Award,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Zap,
  Star,
  Play
} from 'lucide-react';
import Link from 'next/link';
import { SKILL_LEVEL_DESCRIPTIONS } from '@repo/schemas';

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
  registrationStatus?: string;
  paymentStatus?: string;
  category?: string;
}

interface Match {
  _id: string;
  matchType: string;
  tournamentName?: string;
  round?: string;
  player1Name: string;
  player2Name: string;
  scheduledDate: string;
  court: string;
  status: string;
  player1Score: number[];
  player2Score: number[];
}

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  totalTournaments: number;
  tournamentMatches: number;
  tournamentWins: number;
  tournamentLosses: number;
  tournamentWinRate: number;
  practiceMatches: number;
  practiceWins: number;
  practiceLosses: number;
  practiceWinRate: number;
  activeTournaments: number;
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
  const [availableTournaments, setAvailableTournaments] = useState<Tournament[]>([]);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalTournaments: 0,
    tournamentMatches: 0,
    tournamentWins: 0,
    tournamentLosses: 0,
    tournamentWinRate: 0,
    practiceMatches: 0,
    practiceWins: 0,
    practiceLosses: 0,
    practiceWinRate: 0,
    activeTournaments: 0
  });
  const [skillLevel, setSkillLevel] = useState('');
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
        
        setAvailableTournaments(data.availableTournaments || []);
        setMyTournaments(data.myTournaments || []);
        setMatches(data.upcomingMatches || []);
        setSkillLevel(data.player?.skillLevel || '');
        
        if (data.player?.stats) {
          setPlayerStats(data.player.stats);
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

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'from-gray-500 to-gray-600';
      case 'intermediate':
        return 'from-blue-500 to-blue-600';
      case 'advanced':
        return 'from-purple-500 to-purple-600';
      case 'expert':
        return 'from-orange-500 to-orange-600';
      case 'elite':
        return 'from-red-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-primary text-2xl font-bold">Welcome back, {user?.name}!</h1>
              <p className="text-muted-foreground mt-2">Track your progress and join tournaments</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="glass-card flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-primary transition-all hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Stats Grid - 6 cards */}
        <motion.div
          variants={item}
          className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        >
          <StatCard
            title="Tournament Matches"
            value={playerStats.tournamentMatches}
            icon={Trophy}
            color="from-blue-500 to-cyan-500"
            href="/player/stats?type=tournament"
          />
          <StatCard
            title="Practice Matches"
            value={playerStats.practiceMatches}
            icon={Play}
            color="from-green-500 to-emerald-500"
            href="/player/stats?type=practice"
          />
          <StatCard
            title="Tournament Win Rate"
            value={`${playerStats.tournamentWinRate.toFixed(0)}%`}
            icon={TrendingUp}
            color="from-purple-500 to-pink-500"
            href="/player/stats?type=tournament"
          />
          <StatCard
            title="Practice Win Rate"
            value={`${playerStats.practiceWinRate.toFixed(0)}%`}
            icon={Activity}
            color="from-orange-500 to-amber-500"
            href="/player/stats?type=practice"
          />
          <StatCard
            title="Active Tournaments"
            value={playerStats.activeTournaments}
            icon={Zap}
            color="from-indigo-500 to-blue-500"
            href="#my-tournaments"
          />
          <SkillLevelCard
            level={skillLevel}
            color={getSkillLevelColor(skillLevel)}
            href="/profile"
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              title="Browse Tournaments"
              description="Discover new tournaments"
              icon={Trophy}
              color="from-blue-500 to-cyan-500"
              href="/tournaments"
            />
            <QuickActionCard
              title="Practice Matches"
              description="Create & track practice"
              icon={Target}
              color="from-orange-500 to-red-500"
              href="/practice-matches"
            />
            <QuickActionCard
              title="My Matches"
              description="View match history"
              icon={Calendar}
              color="from-green-500 to-emerald-500"
              href="/player/matches"
            />
            <QuickActionCard
              title="My Stats"
              description="Track performance"
              icon={TrendingUp}
              color="from-purple-500 to-pink-500"
              href="/player/stats"
            />
          </div>
        </motion.div>

        {/* My Tournaments Section */}
        {myTournaments.length > 0 && (
          <motion.div variants={item} className="mb-8" id="my-tournaments">
            <div className="glass-card-intense p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-primary text-xl font-semibold flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    My Tournaments
                  </h3>
                  <p className="text-muted-foreground text-sm">Tournaments you're registered for</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myTournaments.map((tournament, index) => (
                  <motion.div
                    key={tournament._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => router.push(`/tournaments/${tournament._id}`)}
                    className="glass-card group p-4 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <h4 className="text-primary font-semibold text-sm line-clamp-2 flex-1">
                        {tournament.name}
                      </h4>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ml-2 ${getStatusColor(tournament.status)}`}>
                        {tournament.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Trophy className="h-3 w-3" />
                        <span className="capitalize">{tournament.sport}</span>
                        {tournament.category && (
                          <>
                            <span className="text-tertiary">•</span>
                            <span className="capitalize">{tournament.category}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(tournament.startDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{tournament.venue}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        tournament.registrationStatus === 'approved' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {tournament.registrationStatus === 'approved' ? (
                          <><CheckCircle2 className="h-3 w-3 inline mr-1" /> Approved</>
                        ) : (
                          <><Clock className="h-3 w-3 inline mr-1" /> Pending</>
                        )}
                      </span>
                      {tournament.paymentStatus && (
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          tournament.paymentStatus === 'paid'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                        }`}>
                          {tournament.paymentStatus}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

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
                  matches.slice(0, 5).map((match, index) => (
                    <motion.div
                      key={match._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-card group p-4 transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-3 flex items-center gap-3 flex-wrap">
                            {match.matchType === 'practice' ? (
                              <span className="rounded-full px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30">
                                <Play className="h-3 w-3 inline mr-1" />
                                Practice Match
                              </span>
                            ) : (
                              <>
                                <h4 className="text-primary text-sm font-semibold group-hover:text-green-400 transition-colors">
                                  {match.tournamentName}
                                </h4>
                                {match.round && (
                                  <span className="text-xs text-tertiary">• {match.round}</span>
                                )}
                              </>
                            )}
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
                  <p className="text-muted-foreground text-sm">Available for registration</p>
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
                {availableTournaments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20">
                      <Trophy className="h-10 w-10 text-green-400" />
                    </div>
                    <h3 className="text-primary mb-2 text-xl font-semibold">No Tournaments Available</h3>
                    <p className="text-muted-foreground">Check back later for new tournaments</p>
                  </div>
                ) : (
                  availableTournaments.slice(0, 5).map((tournament, index) => (
                    <motion.div
                      key={tournament._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => router.push(`/tournaments/${tournament._id}`)}
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

function SkillLevelCard({
  level,
  color,
  href,
}: {
  level: string;
  color: string;
  href: string;
}) {
  const router = useRouter();
  const description = SKILL_LEVEL_DESCRIPTIONS[level as keyof typeof SKILL_LEVEL_DESCRIPTIONS] || '';

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
          <Star className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Value */}
      <div className="text-primary mb-1 text-2xl font-bold capitalize">{level || 'Not Set'}</div>

      {/* Title */}
      <div className="text-muted-foreground text-sm font-medium">Skill Level</div>
      
      {/* Description */}
      {/* {description && (
        <div className="text-tertiary text-xs mt-2 line-clamp-2">{description}</div>
      )} */}
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
      {/* <ArrowRight className="text-tertiary absolute right-4 top-4 h-5 w-5 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" /> */}
    </motion.button>
  );
}
