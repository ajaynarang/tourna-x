'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { 
  ArrowLeft,
  User,
  Phone,
  Mail,
  Home,
  Calendar,
  Trophy,
  Edit,
  Save,
  X,
  CheckCircle,
  TrendingUp,
  Award,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function PlayerProfile() {
  return (
    <AuthGuard requiredRoles={['player']}>
      <PlayerProfileContent />
    </AuthGuard>
  );
}

function PlayerProfileContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    society: '',
    block: '',
    flatNumber: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other'
  });
  const [playerStats, setPlayerStats] = useState({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalTournaments: 0,
    ranking: 0
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        society: user.society || '',
        block: user.block || '',
        flatNumber: user.flatNumber || '',
        age: user.age?.toString() || '',
        gender: (user.gender as 'male' | 'female' | 'other') || 'male'
      });

      // Fetch player stats
      fetchPlayerStats();
    }
  }, [user]);

  const fetchPlayerStats = async () => {
    try {
      const response = await fetch('/api/player/dashboard');
      const result = await response.json();

      if (result.success && result.data?.player?.stats) {
        setPlayerStats({
          ...result.data.player.stats,
          ranking: 12 // Mock ranking for now
        });
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/player/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profileData,
          age: profileData.age ? parseInt(profileData.age) : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        
        // Refresh user data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      society: user?.society || '',
      block: user?.block || '',
      flatNumber: user?.flatNumber || '',
      age: user?.age?.toString() || '',
      gender: (user?.gender as 'male' | 'female' | 'other') || 'male'
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

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
        className="mx-auto max-w-7xl"
      >
        {/* Header */}
        <motion.div variants={item} className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/player/dashboard"
                className="text-secondary hover:text-primary flex items-center gap-2 text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
            <div>
              <h1 className="text-primary text-3xl font-bold">My Profile</h1>
              <p className="text-secondary mt-1">Manage your personal information and view your stats</p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="glass-card flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-primary transition-all hover:bg-white/10 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-primary flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-transform hover:scale-105"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div variants={item} className="mb-6">
            <div className="glass-card-intense border-green-500/20 bg-green-500/10 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-green-400">{success}</span>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div variants={item} className="mb-6">
            <div className="glass-card-intense border-red-500/20 bg-red-500/10 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-red-400" />
                <span className="text-red-400">{error}</span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <motion.div variants={item}>
              <div className="glass-card-intense p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-3xl font-bold">
                      {profileData.name.charAt(0) || 'P'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary">
                      {profileData.name || 'Player'}
                    </h3>
                    <p className="text-sm text-secondary">Tournament Player</p>
                    {profileData.society && (
                      <p className="text-sm text-tertiary mt-1 flex items-center">
                        <Home className="h-3 w-3 mr-1" />
                        {profileData.society}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-400" />
                    Personal Information
                  </h4>
                  <p className="text-secondary text-sm">Your basic profile details</p>
                </div>
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-primary">
                      Full Name *
                    </label>
                    {isEditing ? (
                      <input
                        id="name"
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Enter your full name"
                        required
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-primary h-12 px-4 glass-card rounded-lg">
                        <User className="h-4 w-4 text-tertiary" />
                        {profileData.name || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-semibold text-primary">
                      Phone Number *
                    </label>
                    {isEditing ? (
                      <input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                        placeholder="+91 9876543210"
                        required
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-primary h-12 px-4 glass-card rounded-lg">
                        <Phone className="h-4 w-4 text-tertiary" />
                        {profileData.phone || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-primary">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                        placeholder="your@email.com"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-primary h-12 px-4 glass-card rounded-lg">
                        <Mail className="h-4 w-4 text-tertiary" />
                        {profileData.email || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="age" className="text-sm font-semibold text-primary">
                      Age
                    </label>
                    {isEditing ? (
                      <input
                        id="age"
                        type="number"
                        value={profileData.age}
                        onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                        className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                        placeholder="25"
                        min="1"
                        max="100"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-primary h-12 px-4 glass-card rounded-lg">
                        <Calendar className="h-4 w-4 text-tertiary" />
                        {profileData.age || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="gender" className="text-sm font-semibold text-primary">
                      Gender
                    </label>
                    {isEditing ? (
                      <select 
                        value={profileData.gender} 
                        onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                        className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 text-primary h-12 px-4 glass-card rounded-lg">
                        <User className="h-4 w-4 text-tertiary" />
                        {profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Address Information */}
            <motion.div variants={item}>
              <div className="glass-card-intense p-6">
                <div className="mb-6">
                  <h4 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                    <Home className="h-5 w-5 text-green-400" />
                    Address Information
                  </h4>
                  <p className="text-secondary text-sm">Your residential details</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="society" className="text-sm font-semibold text-primary">
                      Society/Apartment
                    </label>
                    {isEditing ? (
                      <input
                        id="society"
                        type="text"
                        value={profileData.society}
                        onChange={(e) => setProfileData(prev => ({ ...prev, society: e.target.value }))}
                        className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Green Valley Apartments"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-primary h-12 px-4 glass-card rounded-lg">
                        <Home className="h-4 w-4 text-tertiary" />
                        {profileData.society || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="block" className="text-sm font-semibold text-primary">
                      Block/Tower
                    </label>
                    {isEditing ? (
                      <input
                        id="block"
                        type="text"
                        value={profileData.block}
                        onChange={(e) => setProfileData(prev => ({ ...prev, block: e.target.value }))}
                        className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Block A"
                      />
                    ) : (
                      <div className="text-primary h-12 px-4 glass-card rounded-lg flex items-center">
                        {profileData.block || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="flatNumber" className="text-sm font-semibold text-primary">
                      Flat Number
                    </label>
                    {isEditing ? (
                      <input
                        id="flatNumber"
                        type="text"
                        value={profileData.flatNumber}
                        onChange={(e) => setProfileData(prev => ({ ...prev, flatNumber: e.target.value }))}
                        className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
                        placeholder="101"
                      />
                    ) : (
                      <div className="text-primary h-12 px-4 glass-card rounded-lg flex items-center">
                        {profileData.flatNumber || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <motion.div variants={item}>
              <div className="glass-card-intense p-6">
                <div className="mb-6">
                  <h4 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-purple-400" />
                    Performance
                  </h4>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center p-4 glass-card rounded-lg">
                    <div className="text-3xl font-bold text-purple-400">{playerStats.totalMatches}</div>
                    <div className="text-sm text-secondary">Total Matches</div>
                  </div>
                  <div className="text-center p-4 glass-card rounded-lg">
                    <div className="text-3xl font-bold text-green-400">{playerStats.winRate.toFixed(0)}%</div>
                    <div className="text-sm text-secondary">Win Rate</div>
                  </div>
                  <div className="text-center p-4 glass-card rounded-lg">
                    <div className="text-3xl font-bold text-blue-400">#{playerStats.ranking}</div>
                    <div className="text-sm text-secondary">Ranking</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div variants={item}>
              <div className="glass-card-intense p-6">
                <div className="mb-6">
                  <h4 className="text-primary text-lg font-semibold mb-2 flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-400" />
                    Achievements
                  </h4>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 glass-card rounded-lg">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Trophy className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-primary">{playerStats.wins} Wins</div>
                      <div className="text-xs text-secondary">Total victories</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 glass-card rounded-lg">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-primary">{playerStats.totalTournaments} Tournaments</div>
                      <div className="text-xs text-secondary">Participated</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Account Actions */}
            <motion.div variants={item}>
              <div className="glass-card-intense p-6">
                <div className="mb-6">
                  <h4 className="text-red-400 text-lg font-semibold">Account Actions</h4>
                </div>
                
                <button 
                  onClick={logout} 
                  className="glass-card w-full rounded-lg px-4 py-3 font-medium text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
