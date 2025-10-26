'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  CheckCircle2,
  Play,
  Users
} from 'lucide-react';
import Link from 'next/link';

interface StatsData {
  type: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  streakType: string;
  longestStreak: number;
  recentForm: string[];
  categoryStats: CategoryStat[];
  totalTournaments?: number;
  titles?: number;
  runnerUps?: number;
}

interface CategoryStat {
  category: string;
  played: number;
  won: number;
  lost: number;
  winRate: number;
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
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'tournament' | 'practice' | 'overall'>('overall');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'tournament' || typeParam === 'practice' || typeParam === 'overall') {
      setActiveTab(typeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPlayerStats();
  }, [activeTab]);

  const fetchPlayerStats = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/player/stats?type=${activeTab}`);
      const result = await response.json();

      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'tournament' | 'practice' | 'overall') => {
    setActiveTab(tab);
    router.push(`/player/stats?type=${tab}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-muted-foreground">Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">Failed to Load Stats</h2>
          <p className="text-muted-foreground mb-6">Unable to fetch your statistics.</p>
          <button
            onClick={() => router.push('/player/dashboard')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium"
          >
            Back to Dashboard
          </button>
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
          <h1 className="text-primary text-3xl font-bold mt-4">Player Statistics</h1>
          <p className="text-muted-foreground mt-2">Track your performance across all matches</p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={item} className="mb-8">
          <div className="glass-card-intense p-2">
            <div className="flex gap-2">
              <button
                onClick={() => handleTabChange('overall')}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'overall'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-tertiary hover:text-primary hover:bg-white/5'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Overall
              </button>
              <button
                onClick={() => handleTabChange('tournament')}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'tournament'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-tertiary hover:text-primary hover:bg-white/5'
                }`}
              >
                <Trophy className="h-4 w-4 inline mr-2" />
                Tournament
              </button>
              <button
                onClick={() => handleTabChange('practice')}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'practice'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-tertiary hover:text-primary hover:bg-white/5'
                }`}
              >
                <Play className="h-4 w-4 inline mr-2" />
                Practice
              </button>
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
            value={`${stats.winRate.toFixed(1)}%`}
            icon={TrendingUp}
            color="from-purple-500 to-pink-500"
          />
          {activeTab === 'tournament' && stats.totalTournaments !== undefined ? (
            <StatCard
              title="Tournaments"
              value={stats.totalTournaments}
              icon={Trophy}
              color="from-orange-500 to-amber-500"
            />
          ) : (
            <StatCard
              title="Losses"
              value={stats.losses}
              icon={Target}
              color="from-red-500 to-red-600"
            />
          )}
        </motion.div>

        {/* Streak Stats */}
        <motion.div variants={item} className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card-intense p-6">
            <div className="mb-4">
              <h3 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                Current Streak
              </h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-400 mb-2">{stats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">
                {stats.currentStreak > 0 ? stats.streakType === 'W' ? 'Consecutive Wins' : 'Consecutive Losses' : 'No Active Streak'}
              </div>
              {stats.currentStreak >= 3 && (
                <span className="mt-3 inline-block rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
                  🔥 On Fire!
                </span>
              )}
            </div>
          </div>

          <div className="glass-card-intense p-6">
            <div className="mb-4">
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
            <div className="mb-4">
              <h3 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-400" />
                Recent Form
              </h3>
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              {stats.recentForm.length === 0 ? (
                <span className="text-sm text-muted-foreground">No matches yet</span>
              ) : (
                stats.recentForm.map((result, i) => (
                  <span
                    key={i}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      result === 'W' ? 'bg-green-500/20 text-green-400 border-2 border-green-500/30' :
                      'bg-red-500/20 text-red-400 border-2 border-red-500/30'
                    }`}
                  >
                    {result}
                  </span>
                ))
              )}
            </div>
            <div className="text-center mt-3 text-xs text-muted-foreground">
              Last {stats.recentForm.length} matches
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
                  <span className="text-sm font-bold text-green-400">{stats.wins} ({stats.totalMatches > 0 ? ((stats.wins / stats.totalMatches) * 100).toFixed(1) : 0}%)</span>
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
                  <span className="text-sm font-bold text-red-400">{stats.losses} ({stats.totalMatches > 0 ? ((stats.losses / stats.totalMatches) * 100).toFixed(1) : 0}%)</span>
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

        {/* Category Breakdown */}
        <motion.div variants={item} className="mb-8">
          <div className="glass-card-intense p-6">
            <div className="mb-6">
              <h3 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Performance by Category
              </h3>
              <p className="text-muted-foreground text-sm">Singles, Doubles, and Mixed stats</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.categoryStats.map((categoryStat, index) => (
                <motion.div
                  key={categoryStat.category}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-4"
                >
                  <h4 className="text-primary font-semibold capitalize mb-4 text-center">
                    {categoryStat.category}
                  </h4>
                  
                  {categoryStat.played === 0 ? (
                    <div className="text-center py-4 text-tertiary text-sm">
                      No matches played
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Played</span>
                        <span className="text-primary font-semibold">{categoryStat.played}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Won</span>
                        <span className="text-green-400 font-semibold">{categoryStat.won}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Lost</span>
                        <span className="text-red-400 font-semibold">{categoryStat.lost}</span>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Win Rate</span>
                          <span className="text-primary font-bold">{categoryStat.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${categoryStat.winRate}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
                            className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tournament-specific stats */}
        {activeTab === 'tournament' && stats.totalTournaments !== undefined && (
          <motion.div variants={item} className="mb-8">
            <div className="glass-card-intense p-6">
              <div className="mb-6">
                <h3 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  Tournament Achievements
                </h3>
                <p className="text-muted-foreground text-sm">Your tournament performance</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 glass-card">
                  <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-primary mb-1">{stats.totalTournaments}</div>
                  <div className="text-sm text-muted-foreground">Tournaments Played</div>
                </div>
                
                <div className="text-center p-6 glass-card">
                  <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-primary mb-1">{stats.titles || 0}</div>
                  <div className="text-sm text-muted-foreground">Championships</div>
                </div>
                
                <div className="text-center p-6 glass-card">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-primary mb-1">{stats.runnerUps || 0}</div>
                  <div className="text-sm text-muted-foreground">Runner-ups</div>
                </div>
              </div>
            </div>
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
