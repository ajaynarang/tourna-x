'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { 
  Trophy, 
  TrendingUp,
  Award,
  Target,
  Activity,
  BarChart3,
  ArrowLeft,
  Crown,
  Star,
  Zap,
  Flame,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  totalTournaments: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  color: string;
}

export default function PlayerStats() {
  return (
    <AuthGuard requiredRoles={['player']}>
      <PlayerStatsContent />
    </AuthGuard>
  );
}

function PlayerStatsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats>({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalTournaments: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalPoints: 0
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlayerStats();
  }, []);

  const fetchPlayerStats = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/player/dashboard');
      const result = await response.json();

      if (result.success && result.data?.player?.stats) {
        const playerStats = result.data.player.stats;
        setStats({
          ...playerStats,
          currentStreak: 3,
          longestStreak: 5,
          totalPoints: playerStats.wins * 10
        });

        // Generate achievements based on stats
        generateAchievements(playerStats);
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAchievements = (playerStats: any) => {
    const achievementsList: Achievement[] = [
      {
        id: 'first-match',
        title: 'First Steps',
        description: 'Complete your first match',
        icon: Target,
        unlocked: playerStats.totalMatches >= 1,
        progress: Math.min(playerStats.totalMatches, 1),
        maxProgress: 1,
        color: 'from-blue-500 to-blue-600'
      },
      {
        id: 'veteran',
        title: 'Veteran Player',
        description: 'Play 10 matches',
        icon: Trophy,
        unlocked: playerStats.totalMatches >= 10,
        progress: Math.min(playerStats.totalMatches, 10),
        maxProgress: 10,
        color: 'from-purple-500 to-purple-600'
      },
      {
        id: 'champion',
        title: 'Champion',
        description: 'Win 5 matches',
        icon: Crown,
        unlocked: playerStats.wins >= 5,
        progress: Math.min(playerStats.wins, 5),
        maxProgress: 5,
        color: 'from-yellow-500 to-yellow-600'
      },
      {
        id: 'tournament-seeker',
        title: 'Tournament Seeker',
        description: 'Participate in 3 tournaments',
        icon: Award,
        unlocked: playerStats.totalTournaments >= 3,
        progress: Math.min(playerStats.totalTournaments, 3),
        maxProgress: 3,
        color: 'from-green-500 to-green-600'
      },
      {
        id: 'winning-streak',
        title: 'Hot Streak',
        description: 'Win 3 matches in a row',
        icon: Flame,
        unlocked: stats.currentStreak >= 3,
        progress: Math.min(stats.currentStreak, 3),
        maxProgress: 3,
        color: 'from-orange-500 to-orange-600'
      },
      {
        id: 'perfectionist',
        title: 'Perfectionist',
        description: 'Maintain 75% win rate (min 5 matches)',
        icon: Star,
        unlocked: playerStats.winRate >= 75 && playerStats.totalMatches >= 5,
        progress: Math.min(playerStats.winRate, 75),
        maxProgress: 75,
        color: 'from-pink-500 to-pink-600'
      }
    ];

    setAchievements(achievementsList);
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/player/dashboard"
                className="text-muted-foreground hover:text-primary flex items-center gap-2 text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          variants={item}
          className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            title="Total Matches"
            value={stats.totalMatches}
            icon={Activity}
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Victories"
            value={stats.wins}
            icon={CheckCircle2}
            color="from-green-500 to-emerald-500"
          />
          <StatCard
            title="Win Rate"
            value={`${stats.winRate.toFixed(0)}%`}
            icon={TrendingUp}
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            title="Tournaments"
            value={stats.totalTournaments}
            icon={Trophy}
            color="from-orange-500 to-amber-500"
          />
        </motion.div>

        {/* Additional Stats */}
        <motion.div variants={item} className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card-intense p-6">
            <div className="mb-6">
              <h3 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                Current Streak
              </h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-400 mb-2">{stats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Consecutive Wins</div>
              {stats.currentStreak > 0 && (
                <span className="mt-3 inline-block rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
                  🔥 On Fire!
                </span>
              )}
            </div>
          </div>

          <div className="glass-card-intense p-6">
            <div className="mb-6">
              <h3 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Longest Streak
              </h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-yellow-400 mb-2">{stats.longestStreak}</div>
              <div className="text-sm text-muted-foreground">Best Performance</div>
            </div>
          </div>

          <div className="glass-card-intense p-6">
            <div className="mb-6">
              <h3 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-400" />
                Total Points
              </h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-400 mb-2">{stats.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Career Points</div>
            </div>
          </div>
        </motion.div>

        {/* Performance Chart */}
        <motion.div variants={item} className="mb-8">
          <div className="glass-card-intense p-6">
            <div className="mb-6">
              <h3 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Performance Overview
              </h3>
              <p className="text-muted-foreground text-sm">Your win/loss distribution</p>
            </div>
            
            <div className="space-y-4">
              {/* Wins Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary">Wins</span>
                  <span className="text-sm font-bold text-green-400">{stats.wins}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                  />
                </div>
              </div>

              {/* Losses Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary">Losses</span>
                  <span className="text-sm font-bold text-red-400">{stats.losses}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.totalMatches > 0 ? (stats.losses / stats.totalMatches) * 100 : 0}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Achievements Section */}
        <div className="space-y-6">
          {/* Unlocked Achievements */}
          <motion.div variants={item}>
            <div className="glass-card-intense p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-primary text-xl font-semibold mb-2 flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-400" />
                    Unlocked Achievements
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {unlockedAchievements.length} of {achievements.length} achievements unlocked
                  </p>
                </div>
                <span className="rounded-full bg-yellow-500/10 px-4 py-2 text-lg font-medium text-yellow-400">
                  🏆 {unlockedAchievements.length}
                </span>
              </div>
              
              {unlockedAchievements.length === 0 ? (
                <div className="text-center py-8 text-tertiary">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-tertiary" />
                  <p>No achievements unlocked yet. Keep playing to earn your first achievement!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlockedAchievements.map((achievement, index) => {
                    const Icon = achievement.icon;
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl glass-card border-2 border-yellow-500/20"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-3 bg-gradient-to-br ${achievement.color} rounded-xl shadow-lg`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-primary mb-1">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Unlocked
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <motion.div variants={item}>
              <div className="glass-card-intense p-6">
                <div className="mb-6">
                  <h3 className="text-primary text-xl font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5 text-tertiary" />
                    In Progress
                  </h3>
                  <p className="text-muted-foreground text-sm">Keep playing to unlock these achievements</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lockedAchievements.map((achievement, index) => {
                    const Icon = achievement.icon;
                    const progressPercent = (achievement.progress / achievement.maxProgress) * 100;
                    
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl glass-card border-2 border-white/10"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-3 bg-white/10 rounded-xl">
                            <Icon className="h-6 w-6 text-tertiary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-primary mb-1">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold text-primary">
                              {achievement.progress} / {achievement.maxProgress}
                            </span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className={`h-2 bg-gradient-to-r ${achievement.color} rounded-full`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
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
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <div className="glass-card-intense p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-muted-foreground text-sm mb-1">{title}</div>
          <div className="text-primary text-3xl font-bold">{value}</div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

