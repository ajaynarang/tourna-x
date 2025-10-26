'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { Input } from '@repo/ui';
import { Label } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';
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
  LogOut,
  Star,
  CheckCircle
} from 'lucide-react';
import { SKILL_LEVEL_DESCRIPTIONS } from '@repo/schemas';
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
  skillLevel?: string;
  passcode?: string;
  roles: string[];
  createdAt: string;
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

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'settings'>('profile');
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [passcodeForm, setPasscodeForm] = useState({ passcode: '', confirmPasscode: '' });
  const [passcodeError, setPasscodeError] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState(false);

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
        setProfile(profileResult.user);
        setFormData(profileResult.user);
      }

      // Fetch user stats if player
      if (user?.roles?.includes('player')) {
        const statsResponse = await fetch('/api/player/dashboard');
        const statsResult = await statsResponse.json();
        
        if (statsResult.success && statsResult.data?.player?.stats) {
          setStats(statsResult.data.player.stats);
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
      
      const response = await fetch('/api/auth/me', {
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

  const handlePasscodeUpdate = async () => {
    setPasscodeError('');
    setPasscodeSuccess(false);

    // Validate passcode
    if (!passcodeForm.passcode || passcodeForm.passcode.length !== 6) {
      setPasscodeError('Passcode must be exactly 6 digits');
      return;
    }

    if (passcodeForm.passcode !== passcodeForm.confirmPasscode) {
      setPasscodeError('Passcodes do not match');
      return;
    }

    // Check for sequential passcode
    const isSequential = (code: string) => {
      const digits = code.split('').map(Number);
      let ascending = true;
      let descending = true;
      
      for (let i = 1; i < digits.length; i++) {
        if (digits[i] !== (digits[i - 1] ?? 0) + 1) ascending = false;
        if (digits[i] !== (digits[i - 1] ?? 0) - 1) descending = false;
      }
      
      return ascending || descending;
    };

    if (isSequential(passcodeForm.passcode)) {
      setPasscodeError('Passcode cannot be sequential (e.g., 123456 or 654321)');
      return;
    }

    try {
      const response = await fetch('/api/auth/update-passcode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeForm.passcode }),
      });

      const result = await response.json();

      if (result.success) {
        setPasscodeSuccess(true);
        setPasscodeForm({ passcode: '', confirmPasscode: '' });
        setTimeout(() => {
          setShowPasscodeDialog(false);
          setPasscodeSuccess(false);
        }, 2000);
      } else {
        setPasscodeError(result.error || 'Failed to update passcode');
      }
    } catch (error) {
      setPasscodeError('Failed to update passcode. Please try again.');
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="glass-card-intense p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 md:h-12 md:w-12 text-primary" />
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
          
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="text-xl md:text-2xl font-bold bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-auto"
                />
              ) : (
                <h1 className="text-xl md:text-2xl font-bold text-primary truncate">{profile?.name}</h1>
              )}
              <Badge className="bg-blue-500/10 border-blue-500/30 text-blue-400 w-fit">
                {profile?.roles.join(', ')}
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-tertiary">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{profile?.phone}</span>
              </span>
              {profile?.email && (
                <span className="flex items-center gap-1 min-w-0">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Joined {new Date(profile?.createdAt || '').toLocaleDateString()}</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            {isEditing ? (
              <>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 hover:bg-white/10 flex-1 md:flex-initial"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="bg-primary hover:bg-primary/80 flex-1 md:flex-initial"
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
                className="bg-white/5 border-white/10 hover:bg-white/10 w-full md:w-auto"
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

          {/* Skill Level Section */}
          {profile?.roles.includes('player') && (
            <div className="mt-6 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-yellow-400" />
                <h4 className="font-semibold text-primary">Skill Level</h4>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Select 
                    value={formData.skillLevel || ''} 
                    onValueChange={(value) => updateFormData('skillLevel', value)}
                  >
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-primary">
                      <SelectValue placeholder="Select your skill level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">
                        <div className="flex flex-col py-1">
                          <span className="font-semibold">Beginner</span>
                          <span className="text-xs text-muted-foreground">
                            {SKILL_LEVEL_DESCRIPTIONS.beginner}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="intermediate">
                        <div className="flex flex-col py-1">
                          <span className="font-semibold">Intermediate</span>
                          <span className="text-xs text-muted-foreground">
                            {SKILL_LEVEL_DESCRIPTIONS.intermediate}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="advanced">
                        <div className="flex flex-col py-1">
                          <span className="font-semibold">Advanced</span>
                          <span className="text-xs text-muted-foreground">
                            {SKILL_LEVEL_DESCRIPTIONS.advanced}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="expert">
                        <div className="flex flex-col py-1">
                          <span className="font-semibold">Expert</span>
                          <span className="text-xs text-muted-foreground">
                            {SKILL_LEVEL_DESCRIPTIONS.expert}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="elite">
                        <div className="flex flex-col py-1">
                          <span className="font-semibold">Elite</span>
                          <span className="text-xs text-muted-foreground">
                            {SKILL_LEVEL_DESCRIPTIONS.elite}
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-tertiary">
                    Select the level that best describes your current playing ability
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-primary font-semibold capitalize mb-1">{profile?.skillLevel || 'Not set'}</p>
                  {profile?.skillLevel && (
                    <p className="text-sm text-tertiary">
                      {SKILL_LEVEL_DESCRIPTIONS[profile.skillLevel as keyof typeof SKILL_LEVEL_DESCRIPTIONS]}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
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
    if (!profile?.roles.includes('player')) {
      return (
        <div className="glass-card-intense p-12 text-center">
          <BarChart3 className="h-16 w-16 text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">Stats Not Available</h3>
          <p className="text-tertiary">Statistics are only available for player accounts.</p>
        </div>
      );
    }

    if (!stats) {
      return (
        <div className="glass-card-intense p-12 text-center">
          <BarChart3 className="h-16 w-16 text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No Stats Yet</h3>
          <p className="text-tertiary">Start playing matches to see your statistics here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Overall Stats */}
        <div className="glass-card-intense p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
            Overall Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-3xl font-bold text-primary">{stats.totalMatches}</p>
              <p className="text-sm text-tertiary mt-1">Total Matches</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-3xl font-bold text-green-400">{stats.wins}</p>
              <p className="text-sm text-tertiary mt-1">Wins</p>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-3xl font-bold text-red-400">{stats.losses}</p>
              <p className="text-sm text-tertiary mt-1">Losses</p>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-3xl font-bold text-blue-400">{stats.winRate.toFixed(1)}%</p>
              <p className="text-sm text-tertiary mt-1">Win Rate</p>
            </div>
          </div>
        </div>

        {/* Tournament Stats */}
        <div className="glass-card-intense p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-purple-400" />
            Tournament Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-3xl font-bold text-primary">{stats.totalTournaments}</p>
              <p className="text-sm text-tertiary mt-1">Tournaments</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-3xl font-bold text-primary">{stats.tournamentMatches}</p>
              <p className="text-sm text-tertiary mt-1">Matches</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-3xl font-bold text-green-400">{stats.tournamentWins}</p>
              <p className="text-sm text-tertiary mt-1">Wins</p>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-3xl font-bold text-blue-400">{stats.tournamentWinRate.toFixed(1)}%</p>
              <p className="text-sm text-tertiary mt-1">Win Rate</p>
            </div>
          </div>
        </div>

        {/* Practice Stats */}
        <div className="glass-card-intense p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-orange-400" />
            Practice Match Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-3xl font-bold text-primary">{stats.practiceMatches}</p>
              <p className="text-sm text-tertiary mt-1">Matches</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-3xl font-bold text-green-400">{stats.practiceWins}</p>
              <p className="text-sm text-tertiary mt-1">Wins</p>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-3xl font-bold text-red-400">{stats.practiceLosses}</p>
              <p className="text-sm text-tertiary mt-1">Losses</p>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-3xl font-bold text-blue-400">{stats.practiceWinRate.toFixed(1)}%</p>
              <p className="text-sm text-tertiary mt-1">Win Rate</p>
            </div>
          </div>
        </div>

        {/* Active Tournaments */}
        {stats.activeTournaments > 0 && (
          <div className="glass-card-intense p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary">Active Tournaments</h3>
                <p className="text-tertiary text-sm">You are currently registered in {stats.activeTournaments} tournament{stats.activeTournaments > 1 ? 's' : ''}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/tournaments">
                  View Tournaments
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Notification Settings */}
      <div className="glass-card-intense p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-primary">Notification Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-primary text-sm md:text-base">Tournament Updates</h4>
              <p className="text-xs md:text-sm text-tertiary">Get notified about tournament changes</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 hover:bg-white/10 ml-2"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-primary text-sm md:text-base">Match Reminders</h4>
              <p className="text-xs md:text-sm text-tertiary">Reminders before your matches</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 hover:bg-white/10 ml-2"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-primary text-sm md:text-base">Registration Updates</h4>
              <p className="text-xs md:text-sm text-tertiary">Updates about your registrations</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 hover:bg-white/10 ml-2"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-primary text-sm md:text-base">Match Results</h4>
              <p className="text-xs md:text-sm text-tertiary">Get notified when results are posted</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 hover:bg-white/10 ml-2"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>

          <div className="pt-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
            >
              <Link href="/notifications">
                <Settings className="h-4 w-4 mr-2" />
                Manage All Notification Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="glass-card-intense p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-primary">Security</h3>
        </div>

        <div className="space-y-4">
          {/* Passcode Management */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-primary mb-1 text-sm md:text-base">Login Passcode</h4>
                <p className="text-xs md:text-sm text-tertiary">
                  Set a 6-digit passcode for quick login. You can use either passcode or OTP to login.
                </p>
              </div>
              <Button
                onClick={() => setShowPasscodeDialog(true)}
                variant="outline"
                size="sm"
                className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 whitespace-nowrap"
              >
                {profile?.passcode ? 'Change' : 'Set'} Passcode
              </Button>
            </div>
          </div>

          {/* Phone Authentication Info */}
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-primary mb-1 text-sm md:text-base">Phone Authentication</h4>
                <p className="text-xs md:text-sm text-tertiary">
                  Your account is secured with phone number. You can login using OTP or your passcode.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="glass-card-intense p-4 md:p-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h4 className="font-medium text-red-400 text-sm md:text-base">Logout</h4>
            <p className="text-xs md:text-sm text-tertiary">Sign out of your account</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
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
    <div className="relative z-10 min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        {/* Tab Navigation */}
        <div className="glass-card-intense p-3 md:p-6">
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <Button
              onClick={() => setActiveTab('profile')}
              variant={activeTab === 'profile' ? 'default' : 'ghost'}
              size="sm"
              className={`flex-1 ${profile?.roles.includes('player') ? 'rounded-none' : 'rounded-r-none'} hover:bg-white/10 text-xs md:text-sm`}
            >
              <User className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
            {profile?.roles.includes('player') && (
              <Button
                onClick={() => setActiveTab('stats')}
                variant={activeTab === 'stats' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1 rounded-none hover:bg-white/10 text-xs md:text-sm"
              >
                <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                <span className="hidden sm:inline">Stats</span>
              </Button>
            )}
            <Button
              onClick={() => setActiveTab('settings')}
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 rounded-l-none hover:bg-white/10 text-xs md:text-sm"
            >
              <Settings className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'stats' && renderStatsTab()}
      {activeTab === 'settings' && renderSettingsTab()}

      {/* Passcode Dialog */}
      {showPasscodeDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card-intense p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">
                {profile?.passcode ? 'Change' : 'Set'} Passcode
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPasscodeDialog(false);
                  setPasscodeForm({ passcode: '', confirmPasscode: '' });
                  setPasscodeError('');
                  setPasscodeSuccess(false);
                }}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPasscode">New Passcode</Label>
                <Input
                  id="newPasscode"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6 digits"
                  value={passcodeForm.passcode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) {
                      setPasscodeForm({ ...passcodeForm, passcode: value });
                      setPasscodeError('');
                    }
                  }}
                  maxLength={6}
                  className="text-center tracking-widest"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPasscode">Confirm Passcode</Label>
                <Input
                  id="confirmNewPasscode"
                  type="text"
                  inputMode="numeric"
                  placeholder="Confirm 6 digits"
                  value={passcodeForm.confirmPasscode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) {
                      setPasscodeForm({ ...passcodeForm, confirmPasscode: value });
                      setPasscodeError('');
                    }
                  }}
                  maxLength={6}
                  className="text-center tracking-widest"
                />
              </div>

              <p className="text-xs text-tertiary">
                Note: Passcode cannot be sequential (e.g., 123456 or 654321)
              </p>

              {passcodeError && (
                <Alert variant="destructive">
                  <AlertDescription>{passcodeError}</AlertDescription>
                </Alert>
              )}

              {passcodeSuccess && (
                <Alert className="bg-green-500/10 border-green-500/30 text-green-400">
                  <AlertDescription className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Passcode updated successfully!
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasscodeDialog(false);
                    setPasscodeForm({ passcode: '', confirmPasscode: '' });
                    setPasscodeError('');
                    setPasscodeSuccess(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasscodeUpdate}
                  disabled={!passcodeForm.passcode || !passcodeForm.confirmPasscode}
                  className="flex-1"
                >
                  {profile?.passcode ? 'Update' : 'Set'} Passcode
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

