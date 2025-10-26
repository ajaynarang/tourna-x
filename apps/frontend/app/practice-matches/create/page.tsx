'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@repo/ui';
import { 
  ArrowLeft,
  Users,
  XCircle,
  CheckCircle,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function CreatePracticeMatchPage() {
  const router = useRouter();
  const { user, currentRole } = useAuth();
  const isAdmin = currentRole === 'admin';
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: 'singles',
    team1Player1: { type: 'registered', userId: '', name: '', phone: '', gender: '', isGuest: false },
    team1Player2: { type: 'registered', userId: '', name: '', phone: '', gender: '', isGuest: false },
    team2Player1: { type: 'registered', userId: '', name: '', phone: '', gender: '', isGuest: false },
    team2Player2: { type: 'registered', userId: '', name: '', phone: '', gender: '', isGuest: false },
    court: '',
    venue: '',
    notes: '',
    scoringFormat: {
      pointsPerGame: 21,
      gamesPerMatch: 3,
      winBy: 2,
      maxPoints: 30,
    },
  });
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerms, setSearchTerms] = useState({
    team1Player1: '',
    team1Player2: '',
    team2Player1: '',
    team2Player2: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Admins use admin endpoint, players use public endpoint
      const endpoint = isAdmin ? '/api/admin/users' : '/api/users';
      const response = await fetch(endpoint);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const getFilteredUsers = (searchTerm: string, excludeUserIds: string[] = []) => {
    let filtered = users.filter(user => 
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)) &&
      !excludeUserIds.includes(user._id)
    );

    // For mixed doubles, apply gender filtering
    if (formData.category === 'mixed' && step > 1) {
      const playerKeys = ['team1Player1', 'team1Player2', 'team2Player1', 'team2Player2'];
      const currentKey = playerKeys[step - 2];
      
      // Get genders of selected players
      const selectedGenders = playerKeys
        .filter(key => formData[key as keyof typeof formData] && typeof formData[key as keyof typeof formData] === 'object')
        .map(key => (formData[key as keyof typeof formData] as any).gender)
        .filter(Boolean);
      
      // For team partners, ensure opposite gender
      if (currentKey === 'team1Player2' && formData.team1Player1.gender) {
        filtered = filtered.filter(user => user.gender && user.gender !== formData.team1Player1.gender);
      } else if (currentKey === 'team2Player2' && formData.team2Player1.gender) {
        filtered = filtered.filter(user => user.gender && user.gender !== formData.team2Player1.gender);
      }
    }

    return filtered;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    // Players must be participants, admins can create any match
    if (!isAdmin) {
      const currentUserId = user?._id?.toString();
      const participantIds = [
        formData.team1Player1.userId,
        formData.team2Player1.userId,
        formData.category !== 'singles' ? formData.team1Player2.userId : null,
        formData.category !== 'singles' ? formData.team2Player2.userId : null,
      ].filter((id): id is string => Boolean(id));

      if (!currentUserId || !participantIds.includes(currentUserId)) {
        alert('You must be one of the participants in the practice match');
        setIsLoading(false);
        return;
      }
    }
    
    try {
      // Build the request body based on category
      let body: any = {
        category: formData.category,
        court: formData.court,
        venue: formData.venue,
        notes: formData.notes,
        scoringFormat: formData.scoringFormat,
      };

      if (formData.category === 'singles') {
        body.player1 = formData.team1Player1;
        body.player2 = formData.team2Player1;
      } else {
        // Doubles or Mixed
        body.player1 = formData.team1Player1;
        body.player2 = formData.team2Player1;
        body.player3 = formData.team1Player2;
        body.player4 = formData.team2Player2;
      }

      const response = await fetch('/api/practice-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // Navigate back to practice matches list
        router.push('/practice-matches');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create practice match');
      }
    } catch (error) {
      console.error('Error creating practice match:', error);
      alert('Failed to create practice match');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.category;
      case 2:
        return formData.team1Player1.name && formData.team1Player1.phone;
      case 3:
        if (formData.category === 'singles') return true;
        return formData.team1Player2.name && formData.team1Player2.phone;
      case 4:
        return formData.team2Player1.name && formData.team2Player1.phone;
      case 5:
        if (formData.category === 'singles') return true;
        return formData.team2Player2.name && formData.team2Player2.phone;
      case 6:
        return true;
      case 7:
        return true;
      default:
        return false;
    }
  };

  const totalSteps = formData.category === 'singles' ? 5 : 7;

  const renderPlayerSelection = (
    playerKey: 'team1Player1' | 'team1Player2' | 'team2Player1' | 'team2Player2',
    title: string
  ) => {
    const player = formData[playerKey];
    const searchTerm = searchTerms[playerKey];
    const excludeIds = Object.keys(searchTerms)
      .filter(key => key !== playerKey)
      .map(key => formData[key as keyof typeof formData] as any)
      .filter(p => p && p.userId)
      .map(p => p.userId);
    
    const filteredUsers = getFilteredUsers(searchTerm, excludeIds);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400">Select player details for this match</p>
        </div>
        
        <div className="flex gap-3 mb-6">
          <Button
            variant="ghost"
            onClick={() => setFormData({ 
              ...formData, 
              [playerKey]: { ...player, type: 'registered', isGuest: false } 
            })}
            className={`flex-1 py-4 rounded-xl text-sm font-medium transition-all ${
              player.type === 'registered'
                ? 'border-2 border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Registered Player
          </Button>
          <Button
            variant="outline"
            onClick={() => setFormData({ 
              ...formData, 
              [playerKey]: { ...player, type: 'guest', isGuest: true, userId: '' } 
            })}
            className={`flex-1 py-4 rounded-xl text-sm font-medium transition-all ${
              player.type === 'guest'
                ? 'border-2 border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Guest Player
          </Button>
        </div>

        {player.type === 'registered' ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerms({ ...searchTerms, [playerKey]: e.target.value })}
              className="w-full px-6 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-lg"
            />
            <div className="max-h-80 overflow-y-auto space-y-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No users found</p>
                  <p className="text-sm">Try adjusting your search terms</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        [playerKey]: {
                          ...player,
                          userId: user._id,
                          name: user.name,
                          phone: user.phone,
                          gender: user.gender || '',
                        }
                      });
                    }}
                    className={`w-full p-2 rounded-xl text-left transition-all ${
                      player.userId === user._id
                        ? 'bg-blue-500/10 border-2 border-blue-500'
                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-500/50'
                    }`}
                  >
                    <p className="text-gray-900 dark:text-white font-semibold text-lg">{user.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.phone}</p>
                    {user.gender && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Player Name"
              value={player.name}
              onChange={(e) => setFormData({
                ...formData,
                [playerKey]: { ...player, name: e.target.value }
              })}
              className="w-full px-6 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-lg"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={player.phone}
              onChange={(e) => setFormData({
                ...formData,
                [playerKey]: { ...player, phone: e.target.value }
              })}
              className="w-full px-6 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-lg"
            />
            {formData.category === 'mixed' && (
              <select
                value={player.gender}
                onChange={(e) => setFormData({
                  ...formData,
                  [playerKey]: { ...player, gender: e.target.value }
                })}
                className="w-full px-6 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-lg"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <AuthGuard requiredRoles={['admin', 'player']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/practice-matches">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create Practice Match</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Step {step} of {totalSteps}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6 gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 === step
                  ? 'w-12 bg-gradient-to-r from-blue-600 to-purple-600'
                  : i + 1 < step
                  ? 'w-2 bg-blue-600'
                  : 'w-2 bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
          {/* Step 1: Category */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 text-lg">Choose the format for your practice match</p>
              </div>
              <div className="grid gap-4">
                {[
                  { id: 'singles', label: 'Singles', description: '1 vs 1 match', icon: Users },
                  { id: 'doubles', label: 'Doubles', description: '2 vs 2 match (same gender)', icon: Users },
                  { id: 'mixed', label: 'Mixed Doubles', description: 'Male + Female vs Male + Female', icon: Users }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`p-2 rounded-xl text-left transition-all ${
                      formData.category === cat.id
                        ? 'bg-blue-500/10 border-2 border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <cat.icon className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-gray-900 dark:text-white font-semibold text-xl">{cat.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{cat.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player Selection Steps */}
          {step === 2 && renderPlayerSelection('team1Player1', `Select Team 1 Player ${formData.category === 'singles' ? '' : '1'}`)}
          {step === 3 && formData.category !== 'singles' && renderPlayerSelection('team1Player2', 'Select Team 1 Player 2')}
          {step === (formData.category === 'singles' ? 3 : 4) && renderPlayerSelection('team2Player1', `Select Team 2 Player ${formData.category === 'singles' ? '' : '1'}`)}
          {step === 5 && formData.category !== 'singles' && renderPlayerSelection('team2Player2', 'Select Team 2 Player 2')}

          {/* Scoring Format Step */}
          {step === (formData.category === 'singles' ? 4 : 6) && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Scoring Format</h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">Configure the scoring rules for this match</p>
              </div>
              
              <div>
                <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Points per Game</label>
                <div className="grid grid-cols-3 gap-4">
                  {[11, 15, 21].map((points) => (
                    <button
                      key={points}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        scoringFormat: { ...formData.scoringFormat, pointsPerGame: points }
                      })}
                      className={`p-2 rounded-xl text-center font-semibold transition-all text-lg ${
                        formData.scoringFormat.pointsPerGame === points
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {points}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Games per Match</label>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 3].map((games) => (
                    <button
                      key={games}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        scoringFormat: { ...formData.scoringFormat, gamesPerMatch: games }
                      })}
                      className={`p-2 rounded-xl text-center font-semibold transition-all text-lg ${
                        formData.scoringFormat.gamesPerMatch === games
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {games === 1 ? 'Single Game' : 'Best of 3'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Win by (Deuce Rule)</label>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2].map((winBy) => (
                    <button
                      key={winBy}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        scoringFormat: { ...formData.scoringFormat, winBy }
                      })}
                      className={`p-2 rounded-xl text-center font-semibold transition-all text-lg ${
                        formData.scoringFormat.winBy === winBy
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {winBy === 1 ? 'Win by 1' : 'Win by 2'}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                  {formData.scoringFormat.winBy === 1 
                    ? 'First to reach target points wins' 
                    : 'Must win by 2 points (deuce at 20-20 for 21-point games)'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Match Details Step */}
          {step === (formData.category === 'singles' ? 5 : 7) && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Match Details</h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">Add optional details for your practice match</p>
              </div>
              
              <div>
                <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Court</label>
                <input
                  type="text"
                  placeholder="Court number or name"
                  value={formData.court}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  className="w-full px-6 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-lg"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Venue</label>
                <input
                  type="text"
                  placeholder="Venue name"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-6 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-lg"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Notes</label>
                <textarea
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-6 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-lg"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-12">
            {step > 1 && (
              <Button
                type="button"
                onClick={() => {
                  // Skip team2Player2 step if category is singles
                  if (step === 4 && formData.category === 'singles') {
                    setStep(3);
                  } else if (step === 3 && formData.category === 'singles') {
                    setStep(2);
                  } else {
                    setStep(step - 1);
                  }
                }}
                variant="outline"
                className="flex-1 border-gray-300 dark:border-gray-700 text-lg"
              >
                Back
              </Button>
            )}
            <Button
              variant="default"
              onClick={() => {
                if (step === totalSteps) {
                  handleSubmit();
                } else {
                  // Skip team1Player2 step if category is singles
                  if (step === 2 && formData.category === 'singles') {
                    setStep(3);
                  } else {
                    setStep(step + 1);
                  }
                }
              }}
              disabled={!canProceed() || isLoading}
              className="flex-1 font-medium shadow-lg text-lg"
            >
              {step === totalSteps ? (isLoading ? 'Creating...' : 'Create Match') : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
