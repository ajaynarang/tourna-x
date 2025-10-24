'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/player/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                  Statistics & Achievements
                </h1>
                <p className="text-gray-600 mt-1">
                  Track your progress and unlock achievements
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-6 w-6 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalMatches}</div>
              <div className="text-sm text-blue-100">Total Matches</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="h-6 w-6 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.wins}</div>
              <div className="text-sm text-green-100">Victories</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-6 w-6 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.winRate.toFixed(0)}%</div>
              <div className="text-sm text-purple-100">Win Rate</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-6 w-6 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalTournaments}</div>
              <div className="text-sm text-orange-100">Tournaments</div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-orange-600 mb-2">{stats.currentStreak}</div>
                <div className="text-sm text-gray-600">Consecutive Wins</div>
                {stats.currentStreak > 0 && (
                  <Badge className="mt-3 bg-orange-100 text-orange-800">
                    🔥 On Fire!
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Longest Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-yellow-600 mb-2">{stats.longestStreak}</div>
                <div className="text-sm text-gray-600">Best Performance</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">{stats.totalPoints}</div>
                <div className="text-sm text-gray-600">Career Points</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Performance Overview
            </CardTitle>
            <CardDescription>Your win/loss distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Wins Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Wins</span>
                  <span className="text-sm font-bold text-green-600">{stats.wins}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                    style={{ width: `${stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Losses Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Losses</span>
                  <span className="text-sm font-bold text-red-600">{stats.losses}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
                    style={{ width: `${stats.totalMatches > 0 ? (stats.losses / stats.totalMatches) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Section */}
        <div className="space-y-6">
          {/* Unlocked Achievements */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    Unlocked Achievements
                  </CardTitle>
                  <CardDescription>
                    {unlockedAchievements.length} of {achievements.length} achievements unlocked
                  </CardDescription>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 text-lg px-4 py-2">
                  🏆 {unlockedAchievements.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {unlockedAchievements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No achievements unlocked yet. Keep playing to earn your first achievement!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlockedAchievements.map((achievement) => {
                    const Icon = achievement.icon;
                    return (
                      <div 
                        key={achievement.id}
                        className="p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-2 border-yellow-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-3 bg-gradient-to-br ${achievement.color} rounded-xl shadow-lg`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{achievement.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Unlocked
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-600" />
                  In Progress
                </CardTitle>
                <CardDescription>Keep playing to unlock these achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lockedAchievements.map((achievement) => {
                    const Icon = achievement.icon;
                    const progressPercent = (achievement.progress / achievement.maxProgress) * 100;
                    
                    return (
                      <div 
                        key={achievement.id}
                        className="p-4 rounded-xl bg-gray-50 border-2 border-gray-200"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-3 bg-gray-200 rounded-xl">
                            <Icon className="h-6 w-6 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{achievement.title}</h4>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-gray-900">
                              {achievement.progress} / {achievement.maxProgress}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 bg-gradient-to-r ${achievement.color} rounded-full transition-all`}
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

