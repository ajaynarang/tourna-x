'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  ArrowLeft,
  Bell,
  BellOff,
  Settings,
  Check,
  X,
  Eye,
  Trash2,
  Filter,
  Search,
  RefreshCw,
  Mail,
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Info,
  Trophy,
  Calendar,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Notification {
  _id: string;
  userId: string;
  type: 'registration_approved' | 'registration_rejected' | 'match_scheduled' | 'match_starting' | 'match_result' | 'tournament_update' | 'practice_match_created';
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

export default function NotificationsPage() {
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
        setNotifications(result.data);
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
      practice_match_created: Users,
    };
    
    return iconMap[type as keyof typeof iconMap] || Bell;
  };

  const getNotificationColor = (type: string) => {
    const colorMap = {
      registration_approved: 'text-green-400',
      registration_rejected: 'text-red-400',
      match_scheduled: 'text-blue-400',
      match_starting: 'text-yellow-400',
      match_result: 'text-purple-400',
      tournament_update: 'text-cyan-400',
      practice_match_created: 'text-orange-400',
    };
    
    return colorMap[type as keyof typeof colorMap] || 'text-primary';
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

  const renderNotificationsTab = () => {
    const filteredNotifications = getFilteredNotifications();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="glass-card-intense p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-primary">Notifications</h3>
              <p className="text-tertiary text-xs sm:text-sm">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  size="sm"
                  variant="outline"
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-xs sm:text-sm"
                >
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Mark All Read</span>
                  <span className="sm:hidden">Mark All</span>
                </Button>
              )}
              <Button
                onClick={fetchNotifications}
                size="sm"
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card-intense p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-tertiary" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary placeholder:text-tertiary text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary text-sm"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 md:space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="glass-card-intense p-8 md:p-12 text-center">
              <Bell className="h-12 w-12 md:h-16 md:w-16 text-tertiary mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-semibold text-primary mb-2">No Notifications</h3>
              <p className="text-tertiary text-sm">
                {searchTerm || filter !== 'all' 
                  ? 'No notifications match your current filters.'
                  : 'You have no notifications at the moment.'
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);
              
              return (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card-intense p-4 md:p-6 hover:shadow-lg transition-all duration-300 group ${
                    !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className={`p-1.5 md:p-2 rounded-lg bg-white/5 ${colorClass} flex-shrink-0`}>
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h4 className={`font-semibold text-sm md:text-base ${!notification.isRead ? 'text-primary' : 'text-tertiary'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      
                      <p className="text-xs md:text-sm text-tertiary mb-3">
                        {notification.message}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-xs text-tertiary">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        
                        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                          {!notification.isRead && (
                            <Button
                              onClick={() => markAsRead(notification._id)}
                              size="sm"
                              variant="outline"
                              className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-8"
                            >
                              <Check className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              <span className="hidden sm:inline">Mark Read</span>
                              <span className="sm:hidden">Read</span>
                            </Button>
                          )}
                          
                          {notification.tournamentId && (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-8"
                            >
                              <Link href={`/tournaments/${notification.tournamentId}`}>
                                <Eye className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                                <span className="hidden md:inline">View</span>
                              </Link>
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => deleteNotification(notification._id)}
                            size="sm"
                            variant="outline"
                            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 h-8"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Notification Channels */}
      <div className="glass-card-intense p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-primary mb-4">Notification Channels</h3>
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Mail className="h-4 w-4 md:h-5 md:w-5 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-primary text-sm md:text-base">Email Notifications</h4>
                <p className="text-xs md:text-sm text-tertiary truncate">Receive notifications via email</p>
              </div>
            </div>
            <Button
              onClick={() => updateSettings({ emailNotifications: !settings.emailNotifications })}
              variant={settings.emailNotifications ? 'default' : 'outline'}
              size="sm"
              disabled={isSaving}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              {settings.emailNotifications ? <Bell className="h-3 w-3 md:h-4 md:w-4" /> : <BellOff className="h-3 w-3 md:h-4 md:w-4" />}
            </Button>
          </div>
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Phone className="h-4 w-4 md:h-5 md:w-5 text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-primary text-sm md:text-base">SMS Notifications</h4>
                <p className="text-xs md:text-sm text-tertiary truncate">Receive notifications via SMS</p>
              </div>
            </div>
            <Button
              onClick={() => updateSettings({ smsNotifications: !settings.smsNotifications })}
              variant={settings.smsNotifications ? 'default' : 'outline'}
              size="sm"
              disabled={isSaving}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              {settings.smsNotifications ? <Bell className="h-3 w-3 md:h-4 md:w-4" /> : <BellOff className="h-3 w-3 md:h-4 md:w-4" />}
            </Button>
          </div>
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-primary text-sm md:text-base">Push Notifications</h4>
                <p className="text-xs md:text-sm text-tertiary truncate">Receive push notifications in browser</p>
              </div>
            </div>
            <Button
              onClick={() => updateSettings({ pushNotifications: !settings.pushNotifications })}
              variant={settings.pushNotifications ? 'default' : 'outline'}
              size="sm"
              disabled={isSaving}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              {settings.pushNotifications ? <Bell className="h-3 w-3 md:h-4 md:w-4" /> : <BellOff className="h-3 w-3 md:h-4 md:w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="glass-card-intense p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-primary mb-4">Notification Types</h3>
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-primary text-sm md:text-base">Tournament Updates</h4>
                <p className="text-xs md:text-sm text-tertiary truncate">Updates about tournaments you're registered for</p>
              </div>
            </div>
            <Button
              onClick={() => updateSettings({ tournamentUpdates: !settings.tournamentUpdates })}
              variant={settings.tournamentUpdates ? 'default' : 'outline'}
              size="sm"
              disabled={isSaving}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              {settings.tournamentUpdates ? <Bell className="h-3 w-3 md:h-4 md:w-4" /> : <BellOff className="h-3 w-3 md:h-4 md:w-4" />}
            </Button>
          </div>
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-primary text-sm md:text-base">Match Reminders</h4>
                <p className="text-xs md:text-sm text-tertiary truncate">Reminders before your matches start</p>
              </div>
            </div>
            <Button
              onClick={() => updateSettings({ matchReminders: !settings.matchReminders })}
              variant={settings.matchReminders ? 'default' : 'outline'}
              size="sm"
              disabled={isSaving}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              {settings.matchReminders ? <Bell className="h-3 w-3 md:h-4 md:w-4" /> : <BellOff className="h-3 w-3 md:h-4 md:w-4" />}
            </Button>
          </div>
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-primary text-sm md:text-base">Registration Updates</h4>
                <p className="text-xs md:text-sm text-tertiary truncate">Updates about your registration status</p>
              </div>
            </div>
            <Button
              onClick={() => updateSettings({ registrationUpdates: !settings.registrationUpdates })}
              variant={settings.registrationUpdates ? 'default' : 'outline'}
              size="sm"
              disabled={isSaving}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              {settings.registrationUpdates ? <Bell className="h-3 w-3 md:h-4 md:w-4" /> : <BellOff className="h-3 w-3 md:h-4 md:w-4" />}
            </Button>
          </div>
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Trophy className="h-4 w-4 md:h-5 md:w-5 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-primary text-sm md:text-base">Result Notifications</h4>
                <p className="text-xs md:text-sm text-tertiary truncate">Notifications when match results are available</p>
              </div>
            </div>
            <Button
              onClick={() => updateSettings({ resultNotifications: !settings.resultNotifications })}
              variant={settings.resultNotifications ? 'default' : 'outline'}
              size="sm"
              disabled={isSaving}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              {settings.resultNotifications ? <Bell className="h-3 w-3 md:h-4 md:w-4" /> : <BellOff className="h-3 w-3 md:h-4 md:w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="relative z-10 min-h-screen p-8 flex items-center justify-center">
        <div className="glass-card-intense p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-tertiary">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href={user?.roles?.includes('admin') ? '/admin/dashboard' : '/player/dashboard'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-title">
              Notifications
            </h1>
            <p className="text-tertiary text-sm sm:text-base">
              Manage your notifications and preferences
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card-intense p-3 md:p-6">
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <Button
              onClick={() => setActiveTab('notifications')}
              variant={activeTab === 'notifications' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 rounded-r-none bg-transparent hover:bg-white/10 text-xs sm:text-sm"
            >
              <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden xs:inline">Notifications</span>
              <span className="xs:hidden">Alerts</span>
            </Button>
            <Button
              onClick={() => setActiveTab('settings')}
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 rounded-l-none bg-transparent hover:bg-white/10 text-xs sm:text-sm"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'notifications' && renderNotificationsTab()}
      {activeTab === 'settings' && renderSettingsTab()}
    </div>
  );
}

