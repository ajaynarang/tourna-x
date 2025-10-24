'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  ArrowLeft,
  TrendingUp,
  Users,
  Trophy,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Award,
  Clock,
  DollarSign,
  Activity,
  Download,
  RefreshCw,
  Filter,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface AnalyticsData {
  overview: {
    totalTournaments: number;
    totalParticipants: number;
    totalMatches: number;
    totalRevenue: number;
    averageParticipantsPerTournament: number;
    averageMatchesPerTournament: number;
    completionRate: number;
  };
  trends: {
    monthlyTournaments: { month: string; count: number }[];
    monthlyParticipants: { month: string; count: number }[];
    monthlyRevenue: { month: string; amount: number }[];
  };
  categories: {
    category: string;
    count: number;
    participants: number;
    revenue: number;
  }[];
  topPlayers: {
    name: string;
    tournaments: number;
    wins: number;
    winRate: number;
    totalPoints: number;
  }[];
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
    tournamentId?: string;
  }[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('tournaments');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      const result = await response.json();
      
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOverviewCards = () => {
    if (!analytics) return null;

    const cards = [
      {
        title: 'Total Tournaments',
        value: analytics.overview.totalTournaments,
        icon: Trophy,
        color: 'blue',
        trend: '+12%',
        trendUp: true,
      },
      {
        title: 'Total Participants',
        value: analytics.overview.totalParticipants,
        icon: Users,
        color: 'green',
        trend: '+8%',
        trendUp: true,
      },
      {
        title: 'Total Matches',
        value: analytics.overview.totalMatches,
        icon: Activity,
        color: 'purple',
        trend: '+15%',
        trendUp: true,
      },
      {
        title: 'Total Revenue',
        value: `₹${analytics.overview.totalRevenue.toLocaleString()}`,
        icon: DollarSign,
        color: 'yellow',
        trend: '+22%',
        trendUp: true,
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card-intense p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${card.color}-500/20`}>
                <card.icon className={`h-6 w-6 text-${card.color}-400`} />
              </div>
              <div className={`flex items-center gap-1 text-sm ${card.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                <TrendingUp className="h-4 w-4" />
                <span>{card.trend}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-tertiary mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-primary">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderTrendsChart = () => {
    if (!analytics) return null;

    const data = analytics.trends[`monthly${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}` as keyof typeof analytics.trends];
    
    return (
      <div className="glass-card-intense p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary">Trends Over Time</h3>
            <p className="text-tertiary text-sm">Monthly {selectedMetric} trends</p>
          </div>
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <Button
              onClick={() => setSelectedMetric('tournaments')}
              variant={selectedMetric === 'tournaments' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none bg-transparent hover:bg-white/10"
            >
              <Trophy className="h-4 w-4 mr-1" />
              Tournaments
            </Button>
            <Button
              onClick={() => setSelectedMetric('participants')}
              variant={selectedMetric === 'participants' ? 'default' : 'ghost'}
              size="sm"
              className="bg-transparent hover:bg-white/10"
            >
              <Users className="h-4 w-4 mr-1" />
              Participants
            </Button>
            <Button
              onClick={() => setSelectedMetric('revenue')}
              variant={selectedMetric === 'revenue' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none bg-transparent hover:bg-white/10"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Revenue
            </Button>
          </div>
        </div>
        
        <div className="h-64 flex items-end justify-between gap-2">
          {data.map((item, index) => {
            const maxValue = Math.max(...data.map(d => 'count' in d ? d.count : d.amount));
            const height = ('count' in item ? item.count : item.amount) / maxValue * 100;
            
            return (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex-1 bg-gradient-to-t from-blue-500/20 to-blue-500/40 rounded-t-lg min-h-[20px] flex items-end justify-center"
              >
                <div className="text-xs text-tertiary mb-2 transform -rotate-90 whitespace-nowrap">
                  {'count' in item ? item.count : item.amount}
                </div>
              </motion.div>
            );
          })}
        </div>
        
        <div className="flex justify-between mt-4 text-xs text-tertiary">
          {data.map((item, index) => (
            <span key={index}>{item.month}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!analytics) return null;

    return (
      <div className="glass-card-intense p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-primary">Category Breakdown</h3>
          <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
        
        <div className="space-y-4">
          {analytics.categories.map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-primary capitalize">{category.category}</h4>
                    <Badge variant="outline" className="bg-white/5 border-white/10">
                      {category.count} tournaments
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-tertiary">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {category.participants} participants
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      ₹{category.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((category.count / analytics.overview.totalTournaments) * 100)}%
                  </div>
                  <div className="text-xs text-tertiary">of total</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderTopPlayers = () => {
    if (!analytics) return null;

    return (
      <div className="glass-card-intense p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-primary">Top Players</h3>
          <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
        
        <div className="space-y-4">
          {analytics.topPlayers.map((player, index) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">#{index + 1}</span>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-primary group-hover:text-primary/80 transition-colors">
                      {player.name}
                    </h4>
                    <p className="text-sm text-tertiary">
                      {player.tournaments} tournaments • {player.wins} wins
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-primary">{player.winRate}%</div>
                    <div className="text-tertiary">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-primary">{player.totalPoints}</div>
                    <div className="text-tertiary">Points</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecentActivity = () => {
    if (!analytics) return null;

    return (
      <div className="glass-card-intense p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-primary">Recent Activity</h3>
          <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
        
        <div className="space-y-4">
          {analytics.recentActivity.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-3 glass-card hover:shadow-lg transition-all duration-300"
            >
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-400" />
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-primary">{activity.description}</p>
                <p className="text-xs text-tertiary">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
              
              {activity.tournamentId && (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <Link href={`/admin/tournaments/${activity.tournamentId}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="relative z-10 min-h-screen p-8 flex items-center justify-center">
        <div className="glass-card-intense p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-tertiary">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="relative z-10 min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">Analytics Not Available</h2>
          <p className="text-tertiary mb-6">Unable to load analytics data.</p>
          <Button asChild>
            <Link href="/admin/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold gradient-title">
              Analytics Dashboard
            </h1>
            <p className="text-tertiary">
              Comprehensive insights into tournament performance and trends
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="glass-card-intense p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary">Analytics Controls</h3>
              <p className="text-tertiary text-sm">Customize your analytics view</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
              >
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
                <option value="all">All Time</option>
              </select>
              
              <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10">
                <Download className="h-4 w-4 mr-1" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mb-8">
        {renderOverviewCards()}
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {renderTrendsChart()}
        {renderCategoryBreakdown()}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTopPlayers()}
        {renderRecentActivity()}
      </div>
    </div>
  );
}

