'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { Input } from '@repo/ui';
import { 
  ArrowLeft,
  Bell,
  BellOff,
  Settings,
  Check,
  X,
  Eye,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Info,
  Trophy,
  Calendar,
  Users,
  Loader2,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface Notification {
  _id: string;
  userId: string;
  type: 'registration_approved' | 'registration_rejected' | 'match_scheduled' | 'match_starting' | 'match_result' | 'tournament_update';
  title: string;
  message: string;
  isRead: boolean;
  tournamentId?: string;
  matchId?: string;
  createdAt: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  tournamentUpdates: boolean;
  matchReminders: boolean;
  registrationUpdates: boolean;
  resultNotifications: boolean;
}

export default function PlayerNotifications() {
  return (
    <AuthGuard requiredRoles={['player']}>
      <PlayerNotificationsContent />
    </AuthGuard>
  );
}

function PlayerNotificationsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    tournamentUpdates: true,
    matchReminders: true,
    registrationUpdates: true,
    resultNotifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/notifications');
      const result = await response.json();
      
      if (result.success) {
        setNotifications(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings');
      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      
      if (response.ok) {
        setSettings(prev => ({ ...prev, ...newSettings }));
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      registration_approved: CheckCircle,
      registration_rejected: X,
      match_scheduled: Calendar,
      match_starting: Bell,
      match_result: Trophy,
      tournament_update: Info,
    };
    
    return iconMap[type as keyof typeof iconMap] || Bell;
  };

  const getNotificationColor = (type: string) => {
    const colorMap = {
      registration_approved: 'bg-green-100 text-green-600',
      registration_rejected: 'bg-red-100 text-red-600',
      match_scheduled: 'bg-blue-100 text-blue-600',
      match_starting: 'bg-yellow-100 text-yellow-600',
      match_result: 'bg-purple-100 text-purple-600',
      tournament_update: 'bg-cyan-100 text-cyan-600',
    };
    
    return colorMap[type as keyof typeof colorMap] || 'bg-gray-100 text-gray-600';
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter === 'unread') {
      filtered = filtered.filter(notification => !notification.isRead);
    } else if (filter === 'read') {
      filtered = filtered.filter(notification => notification.isRead);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600 text-lg">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white px-3 py-1">
                      {unreadCount} New
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600">
                  Stay updated with your tournament activities
                </p>
              </div>
            </div>
            <Button 
              onClick={fetchNotifications} 
              variant="outline" 
              size="lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Card className="mb-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-2">
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveTab('notifications')}
                variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                size="lg"
                className="flex-1"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <Button
                onClick={() => setActiveTab('settings')}
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                size="lg"
                className="flex-1"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Controls */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All ({notifications.length})</option>
                      <option value="unread">Unread ({unreadCount})</option>
                      <option value="read">Read ({notifications.length - unreadCount})</option>
                    </select>

                    {unreadCount > 0 && (
                      <Button
                        onClick={markAllAsRead}
                        variant="outline"
                        size="lg"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark All Read
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                      <Bell className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      {searchTerm || filter !== 'all' 
                        ? 'No notifications match your current filters.'
                        : 'You have no notifications at the moment. Check back later for updates!'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const colorClass = getNotificationColor(notification.type);
                  
                  return (
                    <Card 
                      key={notification._id} 
                      className={`border-0 shadow-lg hover:shadow-xl transition-all ${
                        !notification.isRead 
                          ? 'bg-blue-50/50 border-l-4 border-l-blue-500' 
                          : 'bg-white/80'
                      } backdrop-blur-sm`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${colorClass}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className={`font-semibold text-lg ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-4">
                              {notification.message}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <span className="text-sm text-gray-500">
                                {new Date(notification.createdAt).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                {!notification.isRead && (
                                  <Button
                                    onClick={() => markAsRead(notification._id)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Mark Read
                                  </Button>
                                )}
                                
                                {notification.tournamentId && (
                                  <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Link href={`/tournaments/${notification.tournamentId}`}>
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </Link>
                                  </Button>
                                )}
                                
                                <Button
                                  onClick={() => deleteNotification(notification._id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Notification Channels */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Notification Channels
                </CardTitle>
                <CardDescription>Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive updates via email</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => updateSettings({ emailNotifications: !settings.emailNotifications })}
                    variant={settings.emailNotifications ? 'default' : 'outline'}
                    size="sm"
                    disabled={isSaving}
                  >
                    {settings.emailNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">SMS Notifications</h4>
                      <p className="text-sm text-gray-600">Get text message alerts</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => updateSettings({ smsNotifications: !settings.smsNotifications })}
                    variant={settings.smsNotifications ? 'default' : 'outline'}
                    size="sm"
                    disabled={isSaving}
                  >
                    {settings.smsNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Push Notifications</h4>
                      <p className="text-sm text-gray-600">Browser push notifications</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => updateSettings({ pushNotifications: !settings.pushNotifications })}
                    variant={settings.pushNotifications ? 'default' : 'outline'}
                    size="sm"
                    disabled={isSaving}
                  >
                    {settings.pushNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Types */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Select which notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Tournament Updates</h4>
                      <p className="text-sm text-gray-600">Updates about your tournaments</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => updateSettings({ tournamentUpdates: !settings.tournamentUpdates })}
                    variant={settings.tournamentUpdates ? 'default' : 'outline'}
                    size="sm"
                    disabled={isSaving}
                  >
                    {settings.tournamentUpdates ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Match Reminders</h4>
                      <p className="text-sm text-gray-600">Pre-match notifications</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => updateSettings({ matchReminders: !settings.matchReminders })}
                    variant={settings.matchReminders ? 'default' : 'outline'}
                    size="sm"
                    disabled={isSaving}
                  >
                    {settings.matchReminders ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Registration Updates</h4>
                      <p className="text-sm text-gray-600">Registration status changes</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => updateSettings({ registrationUpdates: !settings.registrationUpdates })}
                    variant={settings.registrationUpdates ? 'default' : 'outline'}
                    size="sm"
                    disabled={isSaving}
                  >
                    {settings.registrationUpdates ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Trophy className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Match Results</h4>
                      <p className="text-sm text-gray-600">When results are available</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => updateSettings({ resultNotifications: !settings.resultNotifications })}
                    variant={settings.resultNotifications ? 'default' : 'outline'}
                    size="sm"
                    disabled={isSaving}
                  >
                    {settings.resultNotifications ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

