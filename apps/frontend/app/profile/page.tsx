'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  ArrowLeft,
  User,
  Phone,
  Mail,
  Home,
  Calendar,
  Settings,
  Save,
  Edit,
  Camera,
  Shield,
  Users,
  Trophy,
  BarChart3,
  Bell,
  Key,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface UserProfile {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  society?: string;
  block?: string;
  flatNumber?: string;
  age?: number;
  gender?: string;
  roles: string[];
  createdAt: string;
}

interface UserStats {
  totalTournaments: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  titles: number;
  runnerUps: number;
  currentStreak: number;
  longestStreak: number;
  favoriteCategory: string;
  totalPoints: number;
  averageMatchDuration: number;
  societyRanking?: number;
  overallRanking?: number;
  recentForm: string[];
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'settings'>('profile');

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user profile
      const profileResponse = await fetch('/api/auth/me');
      const profileResult = await profileResponse.json();
      
      if (profileResult.success) {
        setProfile(profileResult.data);
        setFormData(profileResult.data);
      }

      // Fetch user stats if player
      if (user?.roles?.includes('player')) {
        const statsResponse = await fetch('/api/player/stats');
        const statsResult = await statsResponse.json();
        
        if (statsResult.success) {
          setStats(statsResult.data);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProfile(result.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateFormData = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="glass-card-intense p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-primary" />
            </div>
            {isEditing && (
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/80"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="text-2xl font-bold bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ) : (
                <h1 className="text-2xl font-bold text-primary">{profile?.name}</h1>
              )}
              <Badge className="bg-blue-500/10 border-blue-500/30 text-blue-400">
                {profile?.roles.join(', ')}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-tertiary">
              <span className="flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                {profile?.phone}
              </span>
              {profile?.email && (
                <span className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {profile.email}
                </span>
              )}
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Joined {new Date(profile?.createdAt || '').toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="bg-primary hover:bg-primary/80"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card-intense p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-tertiary mb-2">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                />
              ) : (
                <p className="text-primary">{profile?.phone}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-tertiary mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                />
              ) : (
                <p className="text-primary">{profile?.email || 'Not provided'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-tertiary mb-2">Age</label>
              {isEditing ? (
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.age || ''}
                  onChange={(e) => updateFormData('age', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                />
              ) : (
                <p className="text-primary">{profile?.age || 'Not provided'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-tertiary mb-2">Gender</label>
              {isEditing ? (
                <select
                  value={formData.gender || ''}
                  onChange={(e) => updateFormData('gender', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-primary">{profile?.gender || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card-intense p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">Society Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-tertiary mb-2">Society</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.society || ''}
                  onChange={(e) => updateFormData('society', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                />
              ) : (
                <p className="text-primary">{profile?.society || 'Not provided'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-tertiary mb-2">Block/Tower</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.block || ''}
                  onChange={(e) => updateFormData('block', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                />
              ) : (
                <p className="text-primary">{profile?.block || 'Not provided'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-tertiary mb-2">Flat Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.flatNumber || ''}
                  onChange={(e) => updateFormData('flatNumber', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                />
              ) : (
                <p className="text-primary">{profile?.flatNumber || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatsTab = () => {
    if (!stats) {
      return (
        <div className="glass-card-intense p-12 text-center">
          <BarChart3 className="h-16 w-16 text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No Statistics Available</h3>
          <p className="text-tertiary">Statistics will appear after you participate in tournaments.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-intense p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Trophy className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-tertiary">Win Rate</p>
                <p className="text-2xl font-bold text-primary">{stats.winRate}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-intense p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-tertiary">Total Matches</p>
                <p className="text-2xl font-bold text-primary">{stats.totalMatches}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-intense p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-tertiary">Titles</p>
                <p className="text-2xl font-bold text-primary">{stats.titles}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card-intense p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-tertiary">Current Streak</p>
                <p className="text-2xl font-bold text-primary">{stats.currentStreak}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card-intense p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-tertiary">Wins</span>
                <span className="text-primary font-semibold">{stats.wins}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tertiary">Losses</span>
                <span className="text-primary font-semibold">{stats.losses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tertiary">Runner-ups</span>
                <span className="text-primary font-semibold">{stats.runnerUps}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tertiary">Total Points</span>
                <span className="text-primary font-semibold">{stats.totalPoints}</span>
              </div>
            </div>
          </div>

          <div className="glass-card-intense p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Recent Form</h3>
            <div className="flex gap-2 mb-4">
              {stats.recentForm.map((result, i) => (
                <span
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    result === 'W' ? 'bg-green-500/20 text-green-400' :
                    result === 'L' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {result}
                </span>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-tertiary">Longest Streak</span>
                <span className="text-primary">{stats.longestStreak}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tertiary">Favorite Category</span>
                <span className="text-primary">{stats.favoriteCategory || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tertiary">Avg Match Duration</span>
                <span className="text-primary">{stats.averageMatchDuration}m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="glass-card-intense p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-primary">Change Password</h4>
              <p className="text-sm text-tertiary">Update your account password</p>
            </div>
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10">
              <Key className="h-4 w-4 mr-1" />
              Change
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-primary">Notifications</h4>
              <p className="text-sm text-tertiary">Manage your notification preferences</p>
            </div>
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10">
              <Bell className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-primary">Privacy</h4>
              <p className="text-sm text-tertiary">Control your privacy settings</p>
            </div>
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10">
              <Shield className="h-4 w-4 mr-1" />
              Manage
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-card-intense p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-400">Logout</h4>
              <p className="text-sm text-tertiary">Sign out of your account</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
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
          <p className="text-tertiary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="relative z-10 min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">Profile Not Found</h2>
          <p className="text-tertiary mb-6">Unable to load your profile information.</p>
          <Button asChild>
            <Link href="/login">Back to Login</Link>
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
            <Link href={profile.roles.includes('admin') ? '/admin/dashboard' : '/player/dashboard'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold gradient-title">
              Profile Management
            </h1>
            <p className="text-tertiary">
              Manage your account settings and view your statistics
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card-intense p-6">
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <Button
              onClick={() => setActiveTab('profile')}
              variant={activeTab === 'profile' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 rounded-r-none bg-transparent hover:bg-white/10"
            >
              <User className="h-4 w-4 mr-1" />
              Profile
            </Button>
            {profile.roles.includes('player') && (
              <Button
                onClick={() => setActiveTab('stats')}
                variant={activeTab === 'stats' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1 bg-transparent hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Statistics
              </Button>
            )}
            <Button
              onClick={() => setActiveTab('settings')}
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 rounded-l-none bg-transparent hover:bg-white/10"
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'stats' && renderStatsTab()}
      {activeTab === 'settings' && renderSettingsTab()}
    </div>
  );
}

