'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
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
  Star
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
  roles: string[];
  createdAt: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
        setProfile(profileResult.user);
        setFormData(profileResult.user);
      }

      // Fetch user stats if player
      // TODO: Implement stats display
      // if (user?.roles?.includes('player')) {
      //   const statsResponse = await fetch('/api/player/stats');
      //   const statsResult = await statsResponse.json();
      //   
      //   if (statsResult.success) {
      //     // Store stats in state
      //   }
      // }
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

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="glass-card-intense p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Account Settings</h3>
        <div className="space-y-4">
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

          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-primary mb-1">Phone Authentication</h4>
                <p className="text-sm text-tertiary">
                  Your account is secured with phone number and OTP authentication. 
                  No password is required for login.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card-intense p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Session Management</h3>
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
        {/* Tab Navigation */}
        <div className="glass-card-intense p-6">
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <Button
              onClick={() => setActiveTab('profile')}
              variant={activeTab === 'profile' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 rounded-r-none  hover:bg-white/10"
            >
              <User className="h-4 w-4 mr-1" />
              Profile
            </Button>
            <Button
              onClick={() => setActiveTab('settings')}
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 rounded-l-none hover:bg-white/10"
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'settings' && renderSettingsTab()}
    </div>
  );
}

