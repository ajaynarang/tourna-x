'use client';

import { useState, useEffect } from 'react';
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
  Trophy,
  Edit,
  Save,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function PlayerProfile() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    society: user?.society || '',
    block: user?.block || '',
    flatNumber: user?.flatNumber || '',
    age: user?.age || '',
    gender: user?.gender || 'male'
  });

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to update the profile
      console.log('Saving profile:', profileData);
      setIsEditing(false);
      // Show success message
    } catch (error) {
      console.error('Error saving profile:', error);
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
      age: user?.age || '',
      gender: user?.gender || 'male'
    });
    setIsEditing(false);
  };

  return (
    <div className="relative z-10 min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/player/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  My Profile
                </h1>
                <p className="text-gray-600">
                  Manage your personal information and preferences
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your basic profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {profileData.name.charAt(0) || 'P'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {profileData.name || 'Player'}
                    </h3>
                    <p className="text-sm text-gray-600">Tournament Player</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900">
                        <User className="h-4 w-4" />
                        {profileData.name || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900">
                        <Phone className="h-4 w-4" />
                        {profileData.phone || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900">
                        <Mail className="h-4 w-4" />
                        {profileData.email || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={profileData.age}
                        onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900">
                        <Calendar className="h-4 w-4" />
                        {profileData.age || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        value={profileData.gender}
                        onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900">
                        <User className="h-4 w-4" />
                        {profileData.gender || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="mt-6 bg-gradient-to-br from-white to-green-50 border-green-200">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Society
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.society}
                        onChange={(e) => setProfileData(prev => ({ ...prev, society: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-900">
                        <Home className="h-4 w-4" />
                        {profileData.society || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Block
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.block}
                        onChange={(e) => setProfileData(prev => ({ ...prev, block: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <div className="text-gray-900">
                        {profileData.block || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Flat Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.flatNumber}
                        onChange={(e) => setProfileData(prev => ({ ...prev, flatNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <div className="text-gray-900">
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
            <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">15</div>
                  <div className="text-sm text-gray-600">Total Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">73%</div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">#12</div>
                  <div className="text-sm text-gray-600">Ranking</div>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="bg-gradient-to-br from-white to-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={logout} 
                  variant="outline" 
                  className="w-full text-red-600 border-red-300 hover:bg-red-50"
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
