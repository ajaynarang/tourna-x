'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { Input } from '@repo/ui';
import { Label } from '@repo/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  My Profile
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage your personal information and view your stats
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleCancel} variant="outline" size="lg" disabled={isSaving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} size="lg" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} size="lg">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-3xl font-bold">
                      {profileData.name.charAt(0) || 'P'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {profileData.name || 'Player'}
                    </h3>
                    <p className="text-sm text-gray-600">Tournament Player</p>
                    {profileData.society && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center">
                        <Home className="h-3 w-3 mr-1" />
                        {profileData.society}
                      </p>
                    )}
                  </div>
                </div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your basic profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Full Name *
                    </Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="h-11"
                        placeholder="Enter your full name"
                        required
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900 h-11 px-3 bg-gray-50 rounded-md border border-gray-200">
                        <User className="h-4 w-4 text-gray-500" />
                        {profileData.name || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                      Phone Number *
                    </Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="h-11"
                        placeholder="+91 9876543210"
                        required
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900 h-11 px-3 bg-gray-50 rounded-md border border-gray-200">
                        <Phone className="h-4 w-4 text-gray-500" />
                        {profileData.phone || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      Email Address
                    </Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="h-11"
                        placeholder="your@email.com"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900 h-11 px-3 bg-gray-50 rounded-md border border-gray-200">
                        <Mail className="h-4 w-4 text-gray-500" />
                        {profileData.email || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-semibold text-gray-700">
                      Age
                    </Label>
                    {isEditing ? (
                      <Input
                        id="age"
                        type="number"
                        value={profileData.age}
                        onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                        className="h-11"
                        placeholder="25"
                        min="1"
                        max="100"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900 h-11 px-3 bg-gray-50 rounded-md border border-gray-200">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {profileData.age || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">
                      Gender
                    </Label>
                    {isEditing ? (
                      <Select 
                        value={profileData.gender} 
                        onValueChange={(value: 'male' | 'female' | 'other') => setProfileData(prev => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900 h-11 px-3 bg-gray-50 rounded-md border border-gray-200">
                        <User className="h-4 w-4 text-gray-500" />
                        {profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-green-600" />
                  Address Information
                </CardTitle>
                <CardDescription>
                  Your residential details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="society" className="text-sm font-semibold text-gray-700">
                      Society/Apartment
                    </Label>
                    {isEditing ? (
                      <Input
                        id="society"
                        type="text"
                        value={profileData.society}
                        onChange={(e) => setProfileData(prev => ({ ...prev, society: e.target.value }))}
                        className="h-11"
                        placeholder="Green Valley Apartments"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900 h-11 px-3 bg-gray-50 rounded-md border border-gray-200">
                        <Home className="h-4 w-4 text-gray-500" />
                        {profileData.society || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="block" className="text-sm font-semibold text-gray-700">
                      Block/Tower
                    </Label>
                    {isEditing ? (
                      <Input
                        id="block"
                        type="text"
                        value={profileData.block}
                        onChange={(e) => setProfileData(prev => ({ ...prev, block: e.target.value }))}
                        className="h-11"
                        placeholder="Block A"
                      />
                    ) : (
                      <div className="text-gray-900 h-11 px-3 bg-gray-50 rounded-md border border-gray-200 flex items-center">
                        {profileData.block || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flatNumber" className="text-sm font-semibold text-gray-700">
                      Flat Number
                    </Label>
                    {isEditing ? (
                      <Input
                        id="flatNumber"
                        type="text"
                        value={profileData.flatNumber}
                        onChange={(e) => setProfileData(prev => ({ ...prev, flatNumber: e.target.value }))}
                        className="h-11"
                        placeholder="101"
                      />
                    ) : (
                      <div className="text-gray-900 h-11 px-3 bg-gray-50 rounded-md border border-gray-200 flex items-center">
                        {profileData.flatNumber || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-600" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{playerStats.totalMatches}</div>
                  <div className="text-sm text-gray-600">Total Matches</div>
                </div>
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{playerStats.winRate.toFixed(0)}%</div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                </div>
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">#{playerStats.ranking}</div>
                  <div className="text-sm text-gray-600">Ranking</div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{playerStats.wins} Wins</div>
                    <div className="text-xs text-gray-600">Total victories</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{playerStats.totalTournaments} Tournaments</div>
                    <div className="text-xs text-gray-600">Participated</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-red-600">Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={logout} 
                  variant="outline" 
                  size="lg"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
