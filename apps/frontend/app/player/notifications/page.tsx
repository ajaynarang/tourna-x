'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
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
      practice_match_created: Users,
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
      practice_match_created: 'bg-orange-100 text-orange-600',
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
        className="mx-auto max-w-5xl"
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
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-primary text-3xl font-bold">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">Stay updated with your tournament activities</p>
            </div>
            <button
              onClick={fetchNotifications}
              className="glass-card flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-primary transition-all hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={item} className="mb-6">
          <div className="glass-card-intense p-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-tertiary hover:text-primary hover:bg-white/10'
                }`}
              >
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-all ${
                  activeTab === 'settings'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-tertiary hover:text-primary hover:bg-white/10'
                }`}
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>
          </div>
        </motion.div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Controls */}
            <motion.div variants={item}>
              <div className="glass-card-intense p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="glass-card rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="all">All ({notifications.length})</option>
                      <option value="unread">Unread ({unreadCount})</option>
                      <option value="read">Read ({notifications.length - unreadCount})</option>
                    </select>

                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="glass-card flex items-center gap-2 rounded-lg px-4 py-3 font-medium text-primary transition-all hover:bg-white/10"
                      >
                        <Check className="h-4 w-4" />
                        Mark All Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Notifications List */}
            <motion.div variants={item} className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="glass-card-intense p-12 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20">
                    <Bell className="h-10 w-10 text-green-400" />
                  </div>
                  <h3 className="text-primary mb-2 text-xl font-semibold">No Notifications</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {searchTerm || filter !== 'all' 
                      ? 'No notifications match your current filters.'
                      : 'You have no notifications at the moment. Check back later for updates!'
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
                      transition={{ delay: index * 0.1 }}
                      className={`glass-card p-6 transition-all hover:scale-[1.01] ${
                        !notification.isRead 
                          ? 'border-l-4 border-l-blue-500' 
                          : ''
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${colorClass}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className={`font-semibold text-lg ${!notification.isRead ? 'text-primary' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              )}
                            </div>
                            
                            <p className="text-muted-foreground mb-4">
                              {notification.message}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <span className="text-sm text-tertiary">
                                {new Date(notification.createdAt).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                {!notification.isRead && (
                                  <button
                                    onClick={() => markAsRead(notification._id)}
                                    className="glass-card flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-all hover:bg-white/10"
                                  >
                                    <Check className="h-4 w-4" />
                                    Mark Read
                                  </button>
                                )}
                                
                                {notification.tournamentId && (
                                  <button
                                    onClick={() => router.push(`/tournaments/${notification.tournamentId}`)}
                                    className="glass-card flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-all hover:bg-white/10"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => deleteNotification(notification._id)}
                                  className="glass-card flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Notification Channels */}
            <motion.div variants={item}>
              <div className="glass-card-intense p-6">
                <div className="mb-6">
                  <h3 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                    Notification Channels
                  </h3>
                  <p className="text-muted-foreground text-sm">Choose how you want to receive notifications</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Mail className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Email Notifications</h4>
                        <p className="text-sm text-muted-foreground">Receive updates via email</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({ emailNotifications: !settings.emailNotifications })}
                      disabled={isSaving}
                      className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        settings.emailNotifications 
                          ? 'bg-primary text-white' 
                          : 'glass-card text-tertiary hover:text-primary hover:bg-white/10'
                      }`}
                    >
                      {settings.emailNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    </button>
                  </div>
                
                  <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Phone className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">SMS Notifications</h4>
                        <p className="text-sm text-muted-foreground">Get text message alerts</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({ smsNotifications: !settings.smsNotifications })}
                      disabled={isSaving}
                      className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        settings.smsNotifications 
                          ? 'bg-primary text-white' 
                          : 'glass-card text-tertiary hover:text-primary hover:bg-white/10'
                      }`}
                    >
                      {settings.smsNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Push Notifications</h4>
                        <p className="text-sm text-muted-foreground">Browser push notifications</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({ pushNotifications: !settings.pushNotifications })}
                      disabled={isSaving}
                      className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        settings.pushNotifications 
                          ? 'bg-primary text-white' 
                          : 'glass-card text-tertiary hover:text-primary hover:bg-white/10'
                      }`}
                    >
                      {settings.pushNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Notification Types */}
            <motion.div variants={item}>
              <div className="glass-card-intense p-6">
                <div className="mb-6">
                  <h3 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-400" />
                    Notification Preferences
                  </h3>
                  <p className="text-muted-foreground text-sm">Select which notifications you want to receive</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Trophy className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Tournament Updates</h4>
                        <p className="text-sm text-muted-foreground">Updates about your tournaments</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({ tournamentUpdates: !settings.tournamentUpdates })}
                      disabled={isSaving}
                      className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        settings.tournamentUpdates 
                          ? 'bg-primary text-white' 
                          : 'glass-card text-tertiary hover:text-primary hover:bg-white/10'
                      }`}
                    >
                      {settings.tournamentUpdates ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Match Reminders</h4>
                        <p className="text-sm text-muted-foreground">Pre-match notifications</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({ matchReminders: !settings.matchReminders })}
                      disabled={isSaving}
                      className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        settings.matchReminders 
                          ? 'bg-primary text-white' 
                          : 'glass-card text-tertiary hover:text-primary hover:bg-white/10'
                      }`}
                    >
                      {settings.matchReminders ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Users className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Registration Updates</h4>
                        <p className="text-sm text-muted-foreground">Registration status changes</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({ registrationUpdates: !settings.registrationUpdates })}
                      disabled={isSaving}
                      className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        settings.registrationUpdates 
                          ? 'bg-primary text-white' 
                          : 'glass-card text-tertiary hover:text-primary hover:bg-white/10'
                      }`}
                    >
                      {settings.registrationUpdates ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Trophy className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Match Results</h4>
                        <p className="text-sm text-muted-foreground">When results are available</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({ resultNotifications: !settings.resultNotifications })}
                      disabled={isSaving}
                      className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        settings.resultNotifications 
                          ? 'bg-primary text-white' 
                          : 'glass-card text-tertiary hover:text-primary hover:bg-white/10'
                      }`}
                    >
                      {settings.resultNotifications ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

