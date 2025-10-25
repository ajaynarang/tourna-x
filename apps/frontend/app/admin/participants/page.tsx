'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Filter,
  Download,
  UserPlus,
  MoreVertical,
  Trash2,
  Check,
  X,
  Loader2,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  categories: string[];
  ageGroups: Array<{
    name: string;
    minAge?: number;
    maxAge?: number;
  }>;
  allowMultipleAgeGroups: boolean;
  maxParticipants: number;
  hasFixtures?: boolean; // Track if fixtures have been generated
}

interface Participant {
  _id: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    age?: number;
    gender?: string;
  };
  tournamentId: string;
  tournamentName: string;
  category: string;
  gender: string;
  ageGroups?: string[];
  isApproved: boolean;
  paymentStatus: 'pending' | 'paid' | 'na';
  registeredAt: string;
  partnerId?: string;
  partnerName?: string;
  partnerPhone?: string;
  partnerAge?: number;
  partnerGender?: string;
  emergencyContact?: string;
}

interface Player {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  age?: number;
  society?: string;
}

export default function AdminParticipantsPage() {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <AdminParticipantsContent />
    </AuthGuard>
  );
}

function AdminParticipantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [availablePartners, setAvailablePartners] = useState<Player[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Check for tournament parameter in URL
    const tournamentParam = searchParams.get('tournament');
    if (tournamentParam) {
      setSelectedTournament(tournamentParam);
    }
  }, [searchParams]);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchTerm, statusFilter, selectedTournament]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tournaments
      const tournamentsRes = await fetch('/api/tournaments');
      const tournamentsData = await tournamentsRes.json();
      if (tournamentsData.success) {
        const tournamentsList = tournamentsData.data || [];
        
        // Check if fixtures exist for each tournament
        const tournamentsWithFixtureStatus = await Promise.all(
          tournamentsList.map(async (tournament: Tournament) => {
            try {
              const fixturesRes = await fetch(`/api/tournaments/${tournament._id}/fixtures`);
              const fixturesData = await fixturesRes.json();
              return {
                ...tournament,
                hasFixtures: fixturesData.success && fixturesData.data && fixturesData.data.length > 0
              };
            } catch (error) {
              console.error(`Error checking fixtures for tournament ${tournament._id}:`, error);
              return { ...tournament, hasFixtures: false };
            }
          })
        );
        
        setTournaments(tournamentsWithFixtureStatus);
      }

      // Fetch all participants
      const participantsRes = await fetch('/api/participants');
      const participantsData = await participantsRes.json();
      if (participantsData.success && Array.isArray(participantsData.data)) {
        setParticipants(participantsData.data);
      }

      // Fetch all players for the add modal
      const playersRes = await fetch('/api/admin/players');
      const playersData = await playersRes.json();
      if (playersData.success && Array.isArray(playersData.data)) {
        setPlayers(playersData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterParticipants = () => {
    let filtered = participants;

    // Tournament filter
    if (selectedTournament !== 'all') {
      filtered = filtered.filter(p => p.tournamentId === selectedTournament);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userId.phone.includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tournamentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'approved') {
        filtered = filtered.filter(p => p.isApproved);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(p => !p.isApproved);
      }
    }

    setFilteredParticipants(filtered);
  };

  const handleApprove = async (participantId: string) => {
    try {
      const response = await fetch(`/api/participants/${participantId}/approve`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Error approving participant:', error);
    }
  };

  const handleReject = async (participantId: string) => {
    const participant = participants.find(p => p._id === participantId);
    const tournament = tournaments.find(t => t._id === participant?.tournamentId);
    
    // Extra check in case UI state is stale
    if (tournament?.hasFixtures) {
      alert('Cannot reject participant - fixtures have already been generated for this tournament. Rejecting participants would disrupt the bracket structure.');
      return;
    }
    
    try {
      const response = await fetch(`/api/participants/${participantId}/reject`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to reject participant');
      }
    } catch (error) {
      console.error('Error rejecting participant:', error);
      alert('Failed to reject participant');
    }
  };

  const handleRemove = async (participantId: string, participantName: string) => {
    const participant = participants.find(p => p._id === participantId);
    const tournament = tournaments.find(t => t._id === participant?.tournamentId);
    
    // Extra check in case UI state is stale
    if (tournament?.hasFixtures) {
      alert('Cannot remove participant - fixtures have already been generated for this tournament. Removing participants would disrupt the bracket structure.');
      return;
    }
    
    if (!confirm(`Are you sure you want to remove ${participantName} from this tournament?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to remove participant');
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Failed to remove participant');
    }
  };

  const fetchAvailablePartners = async (category: string, playerId: string) => {
    if (!selectedTournament || selectedTournament === 'all') {
      console.log('No tournament selected');
      return;
    }

    setIsLoadingPartners(true);
    try {
      const selectedPlayerData = players.find(p => p._id === playerId);
      if (!selectedPlayerData) {
        console.log('Player not found:', playerId);
        return;
      }

      const params = new URLSearchParams({
        category: category,
        gender: selectedPlayerData.gender || 'male',
        search: ''
      });

      console.log('Fetching partners with params:', params.toString());
      const response = await fetch(`/api/tournaments/${selectedTournament}/available-players?${params}`);
      const data = await response.json();
      
      console.log('Partners API response:', data);
      
      if (data.success) {
        // Filter out the selected player from partners
        const filteredPartners = data.data.filter((p: Player) => p._id !== playerId);
        console.log('Filtered partners:', filteredPartners);
        setAvailablePartners(filteredPartners);
      } else {
        console.error('API error:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch available partners:', err);
    } finally {
      setIsLoadingPartners(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedTournament || selectedTournament === 'all' || !selectedPlayer || selectedCategory.length === 0) return;

    // Check if any doubles/mixed categories are selected and partner is required
    const hasDoublesOrMixed = selectedCategory.some(cat => cat === 'doubles' || cat === 'mixed');
    if (hasDoublesOrMixed && !selectedPartner) {
      alert('Partner selection is required for doubles and mixed doubles');
      return;
    }

    // Check if tournament has age groups and if age groups are selected
    const tournament = tournaments.find(t => t._id === selectedTournament);
    if (tournament?.ageGroups && tournament.ageGroups.length > 0) {
      if (selectedAgeGroups.length === 0) {
        alert('Please select at least one age group');
        return;
      }
    }

    setIsAdding(true);
    try {
      console.log('Adding participant with:', {
        tournament: selectedTournament,
        player: selectedPlayer,
        categories: selectedCategory,
        ageGroups: selectedAgeGroups,
        partner: selectedPartner
      });

      const addedCategories: string[] = [];
      const skippedCategories: string[] = [];

      // Add participant for each selected category
      for (const category of selectedCategory) {
        const requestBody: any = {
          playerId: selectedPlayer,
          category: category,
          ageGroups: selectedAgeGroups.length > 0 ? selectedAgeGroups : undefined,
          isApproved: true, // Admin-added participants are auto-approved
          paymentStatus: 'na', // Payment not required for admin-added participants
        };

        // Only add partnerId for doubles/mixed categories
        if (category === 'doubles' || category === 'mixed') {
          requestBody.partnerId = selectedPartner;
        }

        console.log(`Adding participant for ${category}:`, requestBody);

        const response = await fetch(`/api/tournaments/${selectedTournament}/add-participant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        console.log(`Response for ${category}:`, data);
        
        if (!data.success) {
          // If player is already registered for this category, continue with other categories
          if (data.error && data.error.includes('already registered for')) {
            console.log(`Skipping ${category} - player already registered`);
            skippedCategories.push(category);
            continue; // Skip this category and continue with others
          } else {
            alert(data.error || `Failed to add participant for ${category}`);
            setIsAdding(false);
            return;
          }
        } else {
          addedCategories.push(category);
        }
      }

      // Success - reset form and close modal
      setShowAddModal(false);
      setSelectedPlayer('');
      setSelectedCategory([]);
      setSelectedAgeGroups([]);
      setSelectedPartner('');
      setAvailablePartners([]);
      // Don't reset selectedTournament as it affects the main filter
      fetchData();
      
      // Show success message with details
      let message = `Successfully added participant to ${addedCategories.length} category(ies): ${addedCategories.join(', ')}`;
      if (skippedCategories.length > 0) {
        message += `\nSkipped ${skippedCategories.length} category(ies) (already registered): ${skippedCategories.join(', ')}`;
      }
      alert(message);
    } catch (error) {
      console.error('Error adding participant:', error);
      alert('Failed to add participant');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newSelectedCategories = selectedCategory.includes(category) 
      ? selectedCategory.filter(cat => cat !== category)
      : [...selectedCategory, category];
    
    setSelectedCategory(newSelectedCategories);
    
    // Reset age groups and partner when category changes
    setSelectedAgeGroups([]);
    setSelectedPartner('');
    setAvailablePartners([]);
    
    // Check if any doubles/mixed categories are selected after toggle
    const hasDoublesOrMixed = newSelectedCategories.some(cat => cat === 'doubles' || cat === 'mixed');
    if (hasDoublesOrMixed) {
      // Use the first doubles/mixed category found for partner fetching
      const doublesOrMixedCategory = newSelectedCategories.find(cat => cat === 'doubles' || cat === 'mixed');
      if (doublesOrMixedCategory) {
        fetchAvailablePartners(doublesOrMixedCategory, selectedPlayer);
      }
    }
  };

  const toggleAgeGroup = (ageGroupName: string) => {
    const tournament = tournaments.find(t => t._id === selectedTournament);
    if (!tournament?.ageGroups) return;

    const isSelected = selectedAgeGroups.includes(ageGroupName);
    const canSelect = tournament.allowMultipleAgeGroups || selectedAgeGroups.length === 0 || isSelected;

    if (!canSelect) return;

    setSelectedAgeGroups(prev => 
      isSelected 
        ? prev.filter(group => group !== ageGroupName)
        : [...prev, ageGroupName]
    );
  };

  const getEligibleAgeGroups = () => {
    const tournament = tournaments.find(t => t._id === selectedTournament);
    const player = players.find(p => p._id === selectedPlayer);
    
    if (!tournament?.ageGroups || !player?.age) return [];
    
    return tournament.ageGroups.filter(ageGroup => {
      const userAge = player.age;
      if (!userAge) return false;
      
      const minAge = ageGroup.minAge;
      const maxAge = ageGroup.maxAge;
      
      if (minAge && userAge < minAge) return false;
      if (maxAge && userAge > maxAge) return false;
      
      return true;
    });
  };

  const getStatusBadge = (participant: Participant) => {
    if (participant.isApproved) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
          <CheckCircle className="h-3 w-3" />
          Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-500">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  const approvedCount = participants.filter(p => p.isApproved).length;
  const pendingCount = participants.filter(p => !p.isApproved).length;
  const totalCount = participants.length;

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin/tournaments"
            className="text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tournaments
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-primary mb-2 text-3xl font-bold">Manage Participants</h1>
              <p className="text-muted-foreground">Manage participants across all tournaments</p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-all hover:opacity-90"
            >
              <UserPlus className="h-5 w-5" />
              Add Participant
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid gap-4 sm:grid-cols-3"
        >
          <div className="glass-card-intense rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Participants</p>
                <p className="text-primary mt-1 text-2xl font-bold">{totalCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="glass-card-intense rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Approved</p>
                <p className="text-primary mt-1 text-2xl font-bold">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="glass-card-intense rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending Approval</p>
                <p className="text-primary mt-1 text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-intense mb-6 rounded-xl p-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Tournament Filter */}
            <div className="flex-1">
              <label className="text-primary mb-2 block text-sm font-medium">
                Tournament Filter
              </label>
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="glass-card w-full rounded-lg px-4 py-2 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
              >
                <option value="all">All Tournaments</option>
                {tournaments.map((tournament) => (
                  <option key={tournament._id} value={tournament._id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, category, or tournament..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-card w-full rounded-lg py-2 pl-10 pr-4 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-card rounded-lg px-4 py-2 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </motion.div>

        {/* Participants List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card-intense rounded-xl overflow-hidden"
        >
          {filteredParticipants.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="text-muted-foreground mx-auto h-12 w-12" />
              <p className="text-muted-foreground mt-4">No participants found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-muted-foreground px-6 py-4 text-left text-sm font-medium">Players</th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-sm font-medium">Contact</th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-sm font-medium">Tournament</th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-sm font-medium">Category & Age Groups</th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-sm font-medium">Status</th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-sm font-medium">Payment</th>
                    <th className="text-muted-foreground px-6 py-4 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredParticipants.map((participant) => (
                    <tr key={participant._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {/* Primary Player */}
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div>
                              <p className="text-primary font-medium">{participant.userId.name}</p>
                              <p className="text-muted-foreground text-xs">
                                Age: {participant.userId.age || 'N/A'} • {participant.userId.gender || 'N/A'}
                                </p>
                            </div>
                          </div>
                          
                          {/* Partner Player (for doubles/mixed) */}
                          {(participant.category === 'doubles' || participant.category === 'mixed') && participant.partnerName && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div>
                                <p className="text-blue-500 font-medium">{participant.partnerName}</p>
                                <p className="text-muted-foreground text-xs">
                                  Age: {participant.partnerAge || 'N/A'} • {participant.partnerGender || 'N/A'}
                                </p>
                              </div>
                            </div>
                          )}
                           <div className="flex items-center gap-2">
                          <p className="ml-4 text-muted-foreground text-xs">
                            Registered {new Date(participant.registeredAt).toLocaleDateString()}
                          </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {/* Primary Player Contact */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-muted-foreground">{participant.userId.phone}</span>
                            </div>
                            {participant.userId.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-muted-foreground">{participant.userId.email}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Partner Contact (for doubles/mixed) */}
                          {(participant.category === 'doubles' || participant.category === 'mixed') && participant.partnerPhone && (
                            <div className="space-y-1 pt-2 border-t border-white/10">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-blue-400" />
                                <span className="text-blue-400">{participant.partnerPhone}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-gray-400" />
                          <span className="text-muted-foreground text-sm">{participant.tournamentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {/* Category */}
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm capitalize">{participant.category}</span>
                          </div>
                          
                          {/* Age Groups */}
                          {participant.ageGroups && participant.ageGroups.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {participant.ageGroups.map((ageGroup: string) => (
                                <span
                                  key={ageGroup}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20"
                                >
                                  {ageGroup}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(participant)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm ${
                            participant.paymentStatus === 'paid'
                              ? 'text-green-500'
                              : participant.paymentStatus === 'na'
                              ? 'text-gray-500'
                              : 'text-yellow-500'
                          }`}
                        >
                          {participant.paymentStatus === 'paid'
                            ? 'Paid'
                            : participant.paymentStatus === 'na'
                            ? 'N/A'
                            : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {(() => {
                            const tournament = tournaments.find(t => t._id === participant.tournamentId);
                            const hasFixtures = tournament?.hasFixtures || false;
                            
                            if (!participant.isApproved) {
                              return (
                                <>
                                  <button
                                    onClick={() => handleApprove(participant._id)}
                                    className="rounded-lg p-2 text-green-500 transition-colors hover:bg-green-500/10"
                                    title="Approve"
                                  >
                                    <Check className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => !hasFixtures && handleReject(participant._id)}
                                    disabled={hasFixtures}
                                    className={`rounded-lg p-2 transition-colors ${
                                      hasFixtures 
                                        ? 'text-gray-400 cursor-not-allowed opacity-50' 
                                        : 'text-red-500 hover:bg-red-500/10'
                                    }`}
                                    title={hasFixtures 
                                      ? 'Cannot reject - fixtures have been generated for this tournament' 
                                      : 'Reject'
                                    }
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                </>
                              );
                            } else {
                              return (
                                <button
                                  onClick={() => !hasFixtures && handleRemove(participant._id, participant.userId.name)}
                                  disabled={hasFixtures}
                                  className={`rounded-lg p-2 transition-colors ${
                                    hasFixtures 
                                      ? 'text-gray-400 cursor-not-allowed opacity-50' 
                                      : 'text-red-500 hover:bg-red-500/10'
                                  }`}
                                  title={hasFixtures 
                                    ? 'Cannot remove - fixtures have been generated for this tournament' 
                                    : 'Remove from tournament'
                                  }
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              );
                            }
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Participant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card-intense w-full max-w-2xl rounded-2xl p-6"
          >
            <h3 className="text-primary mb-4 text-xl font-bold">Add Participant</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Select a tournament, player, and category to add them as a participant.
            </p>

            <div className="space-y-6">
              {/* Tournament Selection */}
              <div>
                <label className="text-primary mb-2 block text-sm font-medium">
                  Select Tournament <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTournament}
                  onChange={(e) => {
                    setSelectedTournament(e.target.value);
                    setSelectedPlayer('');
                    setSelectedCategory([]);
                    setSelectedAgeGroups([]);
                    setSelectedPartner('');
                    setAvailablePartners([]);
                  }}
                  className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                >
                  <option value="">Choose a tournament...</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament._id} value={tournament._id}>
                      {tournament.name} ({tournament.sport})
                    </option>
                  ))}
                </select>
              </div>

              {/* Player Selection */}
              {selectedTournament && selectedTournament !== 'all' && (
                <div>
                  <label className="text-primary mb-2 block text-sm font-medium">
                    Select Player <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => {
                      setSelectedPlayer(e.target.value);
                      setSelectedCategory([]);
                      setSelectedAgeGroups([]);
                      setSelectedPartner('');
                      setAvailablePartners([]);
                    }}
                    className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                  >
                    <option value="">Choose a player...</option>
                    {players
                      .filter(player => !participants.find(p => p.userId._id === player._id && p.tournamentId === selectedTournament))
                      .map((player) => (
                        <option key={player._id} value={player._id}>
                          {player.name} - {player.phone}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Category Selection */}
              {selectedPlayer && (
                <div>
                  <label className="text-primary mb-2 block text-sm font-medium">
                    Select Categories <span className="text-red-500">*</span>
                  </label>
                  <p className="text-muted-foreground mb-3 text-xs">
                    Select one or more categories for this participant
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {tournaments
                      .find(t => t._id === selectedTournament)
                      ?.categories?.map((category: string) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={`rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                            selectedCategory.includes(category)
                              ? 'border-green-500 bg-green-500/10 text-green-500'
                              : 'border-gray-200 dark:border-white/10 text-muted-foreground hover:border-green-500/50'
                          }`}
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Age Group Selection */}
              {selectedPlayer && selectedCategory.length > 0 && (
                <div>
                  <label className="text-primary mb-2 block text-sm font-medium">
                    Age Groups <span className="text-red-500">*</span>
                  </label>
                  <p className="text-muted-foreground mb-3 text-xs">
                    Select the age groups for this participant. Player age: {players.find(p => p._id === selectedPlayer)?.age || 'Not specified'}
                  </p>
                  
                  {getEligibleAgeGroups().length === 0 ? (
                    <div className="rounded-lg bg-yellow-500/10 p-3 text-yellow-600">
                      <p className="text-sm">
                        No age groups available for this player's age ({players.find(p => p._id === selectedPlayer)?.age || 'Not specified'}).
                        Please contact the tournament organizer.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getEligibleAgeGroups().map((ageGroup) => {
                        const isSelected = selectedAgeGroups.includes(ageGroup.name);
                        const tournament = tournaments.find(t => t._id === selectedTournament);
                        const canSelect = tournament?.allowMultipleAgeGroups || selectedAgeGroups.length === 0 || isSelected;
                        
                        return (
                          <div key={ageGroup.name} className="flex items-center justify-between rounded-lg border p-2">
                            <div className="flex-1">
                              <button
                                type="button"
                                onClick={() => toggleAgeGroup(ageGroup.name)}
                                disabled={!canSelect}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-green-500 text-white'
                                    : canSelect
                                    ? 'glass-card text-muted-foreground hover:text-primary'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <span>{ageGroup.name}</span>
                                {ageGroup.minAge && ageGroup.maxAge && (
                                  <span className="text-xs opacity-75">
                                    ({ageGroup.minAge}-{ageGroup.maxAge} years)
                                  </span>
                                )}
                                {ageGroup.minAge && !ageGroup.maxAge && (
                                  <span className="text-xs opacity-75">
                                    ({ageGroup.minAge}+ years)
                                  </span>
                                )}
                                {!ageGroup.minAge && ageGroup.maxAge && (
                                  <span className="text-xs opacity-75">
                                    (up to {ageGroup.maxAge} years)
                                  </span>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Partner Selection for Doubles/Mixed */}
              {selectedPlayer && selectedCategory.length > 0 && (selectedCategory.includes('doubles') || selectedCategory.includes('mixed')) && (
                <div>
                  <label className="text-primary mb-2 block text-sm font-medium">
                    Select Partner <span className="text-red-500">*</span>
                  </label>
                  {isLoadingPartners ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                    </div>
                  ) : (
                    <select
                      value={selectedPartner}
                      onChange={(e) => setSelectedPartner(e.target.value)}
                      className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                    >
                      <option value="">Choose a partner...</option>
                      {availablePartners.map((partner) => (
                        <option key={partner._id} value={partner._id}>
                          {partner.name} - {partner.phone} {partner.gender && `(${partner.gender})`}
                        </option>
                      ))}
                    </select>
                  )}
                  {availablePartners.length === 0 && !isLoadingPartners && (
                    <p className="text-muted-foreground text-sm mt-2">
                      No available partners found for this category.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedPlayer('');
                  setSelectedCategory([]);
                  setSelectedAgeGroups([]);
                  setSelectedPartner('');
                  setAvailablePartners([]);
                  // Don't reset selectedTournament as it affects the main filter
                }}
                className="glass-card flex-1 rounded-lg px-4 py-2 font-medium text-muted-foreground transition-all hover:bg-white/10"
                disabled={isAdding}
              >
                Cancel
              </button>
              <button
                onClick={handleAddParticipant}
                disabled={!selectedTournament || selectedTournament === 'all' || !selectedPlayer || selectedCategory.length === 0 || isAdding || ((selectedCategory.includes('doubles') || selectedCategory.includes('mixed')) && !selectedPartner) || (tournaments.find(t => t._id === selectedTournament)?.ageGroups && (tournaments.find(t => t._id === selectedTournament)?.ageGroups?.length ?? 0) > 0 && selectedAgeGroups.length === 0)}
                className="bg-primary flex-1 rounded-lg px-4 py-2 font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAdding ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </span>
                ) : (
                  'Add Participant'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}