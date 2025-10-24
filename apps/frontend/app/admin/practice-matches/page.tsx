'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  Dumbbell,
  Plus,
  Clock,
  Users,
  MapPin,
  Calendar,
  Filter,
  RefreshCw,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Trophy,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PracticeMatch {
  _id: string;
  category: string;
  player1Name: string;
  player2Name: string;
  player1Phone?: string;
  player2Phone?: string;
  player1IsGuest: boolean;
  player2IsGuest: boolean;
  status: string;
  court?: string;
  venue?: string;
  notes?: string;
  createdAt: string;
  games?: any[];
  winnerId?: string;
  winnerName?: string;
}

export default function PracticeMatchesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<PracticeMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'singles' | 'doubles' | 'mixed'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [filter, categoryFilter]);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await fetch(`/api/practice-matches?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setMatches(data.data);
      }
    } catch (error) {
      console.error('Error fetching practice matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this practice match?')) return;

    try {
      const response = await fetch(`/api/practice-matches/${matchId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMatches();
      } else {
        alert('Failed to delete match');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Failed to delete match');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return Clock;
      case 'in_progress':
        return AlertCircle;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      singles: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      doubles: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      mixed: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/10 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="glass-card-intense border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Practice Matches</h1>
                <p className="text-sm text-gray-400">Record and track daily practice sessions</p>
              </div>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Practice Match
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Filters:</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <div className="flex gap-2">
                {['all', 'scheduled', 'in_progress', 'completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === status
                        ? 'bg-purple-500 text-white'
                        : 'glass-card text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="flex gap-2">
                {['all', 'singles', 'doubles', 'mixed'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      categoryFilter === category
                        ? 'bg-pink-500 text-white'
                        : 'glass-card text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchMatches}
                className="border-white/10 hover:bg-white/5"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Matches Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : matches.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <Dumbbell className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No practice matches yet</h3>
            <p className="text-gray-400 mb-6">Get started by creating your first practice match</p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Practice Match
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => {
              const StatusIcon = getStatusIcon(match.status);
              
              return (
                <Card key={match._id} className="glass-card border-white/10 overflow-hidden hover:border-purple-500/30 transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={getCategoryBadge(match.category)}>
                        {match.category}
                      </Badge>
                      <Badge className={getStatusColor(match.status)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {match.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Player 1 */}
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                          {match.player1IsGuest ? (
                            <UserX className="h-5 w-5 text-blue-400" />
                          ) : (
                            <UserCheck className="h-5 w-5 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {match.player1Name}
                          </p>
                          {match.player1IsGuest && match.player1Phone && (
                            <p className="text-xs text-gray-500">Guest • {match.player1Phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="text-xs text-gray-500">vs</div>
                      </div>

                      {/* Player 2 */}
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
                          {match.player2IsGuest ? (
                            <UserX className="h-5 w-5 text-pink-400" />
                          ) : (
                            <UserCheck className="h-5 w-5 text-pink-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {match.player2Name}
                          </p>
                          {match.player2IsGuest && match.player2Phone && (
                            <p className="text-xs text-gray-500">Guest • {match.player2Phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Match Details */}
                    {match.court && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Target className="h-4 w-4" />
                        <span>{match.court}</span>
                      </div>
                    )}

                    {match.venue && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{match.venue}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(match.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Winner Info */}
                    {match.status === 'completed' && match.winnerName && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2 text-sm">
                          <Trophy className="h-4 w-4 text-yellow-400" />
                          <span className="text-gray-400">Winner:</span>
                          <span className="text-white font-medium">{match.winnerName}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3">
                      {match.status !== 'completed' && match.status !== 'cancelled' && (
                        <Link
                          href={`/admin/practice-matches/${match._id}`}
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/30"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            {match.status === 'in_progress' ? 'Continue' : 'Start'}
                          </Button>
                        </Link>
                      )}

                      {match.status === 'completed' && (
                        <Link
                          href={`/admin/practice-matches/${match._id}`}
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-white/10 hover:bg-white/5"
                          >
                            View Details
                          </Button>
                        </Link>
                      )}

                      {match.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMatch(match._id)}
                          className="border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Match Dialog */}
      {isCreateDialogOpen && (
        <CreatePracticeMatchDialog
          onClose={() => setIsCreateDialogOpen(false)}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            fetchMatches();
          }}
        />
      )}
    </div>
  );
}

// Create Practice Match Dialog Component
function CreatePracticeMatchDialog({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: 'singles',
    player1: { type: 'registered', userId: '', name: '', phone: '', isGuest: false },
    player2: { type: 'registered', userId: '', name: '', phone: '', isGuest: false },
    court: '',
    venue: '',
    notes: '',
  });
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filteredUsers1 = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm1.toLowerCase()) ||
    user.phone?.includes(searchTerm1)
  );

  const filteredUsers2 = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm2.toLowerCase()) ||
    user.phone?.includes(searchTerm2)
  );

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/practice-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-card-intense border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Create Practice Match</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8 gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step
                    ? 'w-8 bg-purple-500'
                    : s < step
                    ? 'w-2 bg-purple-500/50'
                    : 'w-2 bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Category */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Select Match Type</h3>
              <div className="grid gap-3">
                {['singles', 'doubles', 'mixed'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`p-4 rounded-lg text-left transition-all ${
                      formData.category === cat
                        ? 'bg-purple-500/20 border-2 border-purple-500'
                        : 'glass-card border-2 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <p className="text-white font-medium">{cat.charAt(0).toUpperCase() + cat.slice(1)}</p>
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setStep(2)}
                className="w-full bg-purple-500 hover:bg-purple-600 mt-6"
              >
                Next
              </Button>
            </div>
          )}

          {/* Step 2: Player 1 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Select Player 1</h3>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setFormData({ ...formData, player1: { ...formData.player1, type: 'registered', isGuest: false } })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.player1.type === 'registered'
                      ? 'bg-purple-500 text-white'
                      : 'glass-card text-gray-400'
                  }`}
                >
                  Registered Player
                </button>
                <button
                  onClick={() => setFormData({ ...formData, player1: { ...formData.player1, type: 'guest', isGuest: true, userId: '' } })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.player1.type === 'guest'
                      ? 'bg-purple-500 text-white'
                      : 'glass-card text-gray-400'
                  }`}
                >
                  Guest Player
                </button>
              </div>

              {formData.player1.type === 'registered' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm1}
                    onChange={(e) => setSearchTerm1(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredUsers1.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => setFormData({
                          ...formData,
                          player1: {
                            ...formData.player1,
                            userId: user._id,
                            name: user.name,
                            phone: user.phone,
                          }
                        })}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          formData.player1.userId === user._id
                            ? 'bg-purple-500/20 border-2 border-purple-500'
                            : 'glass-card border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.phone}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Player Name"
                    value={formData.player1.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      player1: { ...formData.player1, name: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.player1.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      player1: { ...formData.player1, phone: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={
                    formData.player1.type === 'registered'
                      ? !formData.player1.userId
                      : !formData.player1.name || !formData.player1.phone
                  }
                  className="flex-1 bg-purple-500 hover:bg-purple-600"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Player 2 */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Select Player 2</h3>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setFormData({ ...formData, player2: { ...formData.player2, type: 'registered', isGuest: false } })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.player2.type === 'registered'
                      ? 'bg-pink-500 text-white'
                      : 'glass-card text-gray-400'
                  }`}
                >
                  Registered Player
                </button>
                <button
                  onClick={() => setFormData({ ...formData, player2: { ...formData.player2, type: 'guest', isGuest: true, userId: '' } })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.player2.type === 'guest'
                      ? 'bg-pink-500 text-white'
                      : 'glass-card text-gray-400'
                  }`}
                >
                  Guest Player
                </button>
              </div>

              {formData.player2.type === 'registered' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm2}
                    onChange={(e) => setSearchTerm2(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredUsers2.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => setFormData({
                          ...formData,
                          player2: {
                            ...formData.player2,
                            userId: user._id,
                            name: user.name,
                            phone: user.phone,
                          }
                        })}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          formData.player2.userId === user._id
                            ? 'bg-pink-500/20 border-2 border-pink-500'
                            : 'glass-card border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.phone}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Player Name"
                    value={formData.player2.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      player2: { ...formData.player2, name: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.player2.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      player2: { ...formData.player2, phone: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 border-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={
                    formData.player2.type === 'registered'
                      ? !formData.player2.userId
                      : !formData.player2.name || !formData.player2.phone
                  }
                  className="flex-1 bg-pink-500 hover:bg-pink-600"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Match Details */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Match Details (Optional)</h3>
              
              <input
                type="text"
                placeholder="Court (e.g., Court 1)"
                value={formData.court}
                onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />

              <input
                type="text"
                placeholder="Venue (e.g., Sports Complex)"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 rounded-lg glass-card border border-white/10 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="flex-1 border-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isLoading ? 'Creating...' : 'Create Match'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

