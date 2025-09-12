'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
// Progress component will be implemented separately
import { 
  Trophy, 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Brain,
  Zap,
  Target,
  BarChart3,
  AlertTriangle,
  Sparkles,
  Activity,
  Award,
  MessageSquare,
  Settings,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  maxParticipants: number;
  entryFee: number;
  isPublished: boolean;
}

interface Participant {
  _id: string;
  name: string;
  phone: string;
  tournamentName: string;
  paymentStatus: string;
  isApproved: boolean;
  registeredAt: string;
}

interface AIInsight {
  type: 'success' | 'warning' | 'info' | 'recommendation';
  title: string;
  description: string;
  action?: string;
  icon: React.ComponentType<any>;
}

interface AnalyticsData {
  registrationTrend: number[];
  revenueProjection: number;
  participantEngagement: number;
  tournamentPerformance: {
    name: string;
    engagement: number;
    revenue: number;
  }[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [stats, setStats] = useState({
    totalTournaments: 0,
    activeTournaments: 0,
    totalParticipants: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    upcomingMatches: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tournaments
      const tournamentsResponse = await fetch('/api/tournaments');
      const tournamentsData = await tournamentsResponse.json();
      setTournaments(tournamentsData.slice(0, 5)); // Show only recent 5

      // Fetch participants
      const participantsResponse = await fetch('/api/participants');
      const participantsData = await participantsResponse.json();
      setParticipants(participantsData.slice(0, 5)); // Show only recent 5

      // Calculate enhanced stats
      const totalTournaments = tournamentsData.length;
      const activeTournaments = tournamentsData.filter((t: Tournament) => 
        ['published', 'registration_open', 'ongoing'].includes(t.status)
      ).length;
      const totalParticipants = participantsData.length;
      const totalRevenue = tournamentsData.reduce((sum: number, t: Tournament) => 
        sum + (t.participantCount * t.entryFee), 0
      );
      const pendingApprovals = participantsData.filter((p: Participant) => !p.isApproved).length;
      const upcomingMatches = tournamentsData.filter((t: Tournament) => 
        t.status === 'ongoing'
      ).length;

      setStats({
        totalTournaments,
        activeTournaments,
        totalParticipants,
        totalRevenue,
        pendingApprovals,
        upcomingMatches,
      });

      // Generate AI Insights
      generateAIInsights(tournamentsData, participantsData);
      
      // Generate Analytics Data
      generateAnalyticsData(tournamentsData, participantsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsights = (tournaments: Tournament[], participants: Participant[]) => {
    const insights: AIInsight[] = [];
    
    // Registration trend analysis
    const recentRegistrations = participants.filter(p => 
      new Date(p.registeredAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    if (recentRegistrations > 10) {
      insights.push({
        type: 'success',
        title: 'High Registration Activity',
        description: `${recentRegistrations} new registrations in the last 7 days. Great momentum!`,
        icon: TrendingUp,
        action: 'View Details'
      });
    }

    // Payment optimization
    const unpaidParticipants = participants.filter(p => p.paymentStatus === 'pending').length;
    if (unpaidParticipants > 5) {
      insights.push({
        type: 'warning',
        title: 'Payment Collection Needed',
        description: `${unpaidParticipants} participants haven't paid yet. Consider sending reminders.`,
        icon: AlertTriangle,
        action: 'Send Reminders'
      });
    }

    // Tournament performance
    const lowEngagementTournaments = tournaments.filter(t => t.participantCount < 10).length;
    if (lowEngagementTournaments > 0) {
      insights.push({
        type: 'recommendation',
        title: 'Boost Tournament Engagement',
        description: `${lowEngagementTournaments} tournaments have low participation. Consider promotional strategies.`,
        icon: Target,
        action: 'View Strategies'
      });
    }

    // Revenue optimization
    const avgRevenuePerTournament = tournaments.reduce((sum, t) => sum + (t.participantCount * t.entryFee), 0) / tournaments.length;
    if (avgRevenuePerTournament > 5000) {
      insights.push({
        type: 'success',
        title: 'Strong Revenue Performance',
        description: `Average revenue per tournament is ₹${avgRevenuePerTournament.toFixed(0)}. Excellent!`,
        icon: Award,
        action: 'View Analytics'
      });
    }

    setAiInsights(insights);
  };

  const generateAnalyticsData = (tournaments: Tournament[], participants: Participant[]) => {
    // Mock analytics data - in real app, this would come from AI analysis
    const analyticsData: AnalyticsData = {
      registrationTrend: [12, 19, 15, 25, 22, 30, 28], // Last 7 days
      revenueProjection: tournaments.reduce((sum, t) => sum + (t.participantCount * t.entryFee), 0) * 1.2,
      participantEngagement: 85,
      tournamentPerformance: tournaments.slice(0, 3).map(t => ({
        name: t.name,
        engagement: Math.min(100, (t.participantCount / t.maxParticipants) * 100),
        revenue: t.participantCount * t.entryFee
      }))
    };
    
    setAnalytics(analyticsData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'registration_open':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Header with AI Badge */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Welcome back, {user?.name || 'Admin'}!
                </h1>
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">AI Powered</span>
                </div>
              </div>
              <p className="text-gray-600">
                Your intelligent tournament management dashboard with real-time insights.
              </p>
            </div>
            <Button 
              onClick={() => fetchDashboardData()} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* AI Insights Section */}
        {aiInsights.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiInsights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <Card key={index} className={`border-l-4 ${
                    insight.type === 'success' ? 'border-l-green-500 bg-green-50' :
                    insight.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                    insight.type === 'recommendation' ? 'border-l-blue-500 bg-blue-50' :
                    'border-l-gray-500 bg-gray-50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          insight.type === 'success' ? 'bg-green-100' :
                          insight.type === 'warning' ? 'bg-yellow-100' :
                          insight.type === 'recommendation' ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            insight.type === 'success' ? 'text-green-600' :
                            insight.type === 'warning' ? 'text-yellow-600' :
                            insight.type === 'recommendation' ? 'text-blue-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                          {insight.action && (
                            <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                              {insight.action} →
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700">Tournaments</p>
                  <p className="text-xl font-bold text-blue-900">{stats.totalTournaments}</p>
                  <p className="text-xs text-blue-600">{stats.activeTournaments} active</p>
                </div>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <Trophy className="h-5 w-5 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Participants</p>
                  <p className="text-xl font-bold text-green-900">{stats.totalParticipants}</p>
                  <p className="text-xs text-green-600">{stats.pendingApprovals} pending</p>
                </div>
                <div className="p-2 bg-green-200 rounded-lg">
                  <Users className="h-5 w-5 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-700">Revenue</p>
                  <p className="text-xl font-bold text-purple-900">₹{stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-purple-600">Total earned</p>
                </div>
                <div className="p-2 bg-purple-200 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-700">Engagement</p>
                  <p className="text-xl font-bold text-orange-900">{analytics?.participantEngagement || 0}%</p>
                  <p className="text-xs text-orange-600">Avg. participation</p>
                </div>
                <div className="p-2 bg-orange-200 rounded-lg">
                  <Activity className="h-5 w-5 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-indigo-700">Matches</p>
                  <p className="text-xl font-bold text-indigo-900">{stats.upcomingMatches}</p>
                  <p className="text-xs text-indigo-600">Scheduled</p>
                </div>
                <div className="p-2 bg-indigo-200 rounded-lg">
                  <Calendar className="h-5 w-5 text-indigo-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-pink-700">AI Score</p>
                  <p className="text-xl font-bold text-pink-900">92</p>
                  <p className="text-xs text-pink-600">Performance</p>
                </div>
                <div className="p-2 bg-pink-200 rounded-lg">
                  <Zap className="h-5 w-5 text-pink-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        {analytics && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Performance Analytics</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Registration Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Last 7 days</span>
                      <span className="font-semibold">{analytics.registrationTrend.reduce((a, b) => a + b, 0)} total</span>
                    </div>
                    <div className="flex items-end gap-1 h-16">
                      {analytics.registrationTrend.map((value, index) => (
                        <div
                          key={index}
                          className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                          style={{ height: `${(value / Math.max(...analytics.registrationTrend)) * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>


              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.tournamentPerformance.map((tournament, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium truncate">{tournament.name}</div>
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${tournament.engagement}%` }}></div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 ml-2">
                          ₹{tournament.revenue}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tournaments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Tournaments</CardTitle>
                <CardDescription>Your latest tournament activities</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/admin/tournaments">
                  <Plus className="h-4 w-4 mr-2" />
                  New Tournament
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tournaments.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tournaments yet</p>
                    <Button asChild className="mt-4">
                      <Link href="/admin/tournaments/create">Create Your First Tournament</Link>
                    </Button>
                  </div>
                ) : (
                  tournaments.map((tournament) => (
                    <div key={tournament._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{tournament.name}</h3>
                          <Badge className={getStatusColor(tournament.status)}>
                            {tournament.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(tournament.startDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {tournament.participantCount} participants
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            ₹{tournament.entryFee}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/tournaments/${tournament._id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/tournaments/${tournament._id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Participants */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Participants</CardTitle>
                <CardDescription>Latest tournament registrations</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/admin/participants">
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No participants yet</p>
                  </div>
                ) : (
                  participants.map((participant) => (
                    <div key={participant._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{participant.name}</h3>
                          <Badge className={getPaymentStatusColor(participant.paymentStatus)}>
                            {participant.paymentStatus}
                          </Badge>
                          {participant.isApproved ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{participant.phone}</span>
                          <span>{participant.tournamentName}</span>
                          <span>{new Date(participant.registeredAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Actions */}
        <Card className="mt-8 bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-600" />
              <CardTitle>Quick Actions & AI Tools</CardTitle>
            </div>
            <CardDescription>Streamline your tournament management with intelligent automation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col bg-white hover:bg-blue-50 border-blue-200">
                <Link href="/admin/tournaments/create">
                  <Trophy className="h-6 w-6 mb-2 text-blue-600" />
                  <span className="text-sm font-medium">Create Tournament</span>
                  <span className="text-xs text-gray-500">AI-assisted setup</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col bg-white hover:bg-green-50 border-green-200">
                <Link href="/admin/participants">
                  <Users className="h-6 w-6 mb-2 text-green-600" />
                  <span className="text-sm font-medium">Manage Participants</span>
                  <span className="text-xs text-gray-500">Smart approvals</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col bg-white hover:bg-purple-50 border-purple-200">
                <Link href="/admin/fixtures">
                  <Calendar className="h-6 w-6 mb-2 text-purple-600" />
                  <span className="text-sm font-medium">Generate Fixtures</span>
                  <span className="text-xs text-gray-500">Auto-scheduling</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col bg-white hover:bg-orange-50 border-orange-200">
                <Link href="/admin/scoring">
                  <TrendingUp className="h-6 w-6 mb-2 text-orange-600" />
                  <span className="text-sm font-medium">Live Scoring</span>
                  <span className="text-xs text-gray-500">Real-time updates</span>
                </Link>
              </Button>
            </div>
            
            {/* AI-Powered Tools Row */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">AI-Powered Tools</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button variant="outline" className="h-16 flex-col bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 hover:bg-purple-100">
                  <MessageSquare className="h-5 w-5 mb-1 text-purple-600" />
                  <span className="text-xs font-medium">Auto Notifications</span>
                  <span className="text-xs text-gray-500">Smart reminders</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:bg-green-100">
                  <Target className="h-5 w-5 mb-1 text-green-600" />
                  <span className="text-xs font-medium">Match Predictions</span>
                  <span className="text-xs text-gray-500">AI insights</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:bg-orange-100">
                  <Zap className="h-5 w-5 mb-1 text-orange-600" />
                  <span className="text-xs font-medium">Performance Boost</span>
                  <span className="text-xs text-gray-500">Optimize events</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}