'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  maxParticipants: number;
}

interface Participant {
  _id: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
  };
  category: string;
  gender: string;
  isApproved: boolean;
  paymentStatus: 'pending' | 'paid' | 'na';
  registeredAt: string;
  partnerName?: string;
  emergencyContact?: string;
}

interface Player {
  _id: string;
  name: string;
  phone: string;
  email?: string;
}

export default function TournamentParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <TournamentParticipantsContent params={params} />
    </AuthGuard>
  );
}

function TournamentParticipantsContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [tournamentId, setTournamentId] = useState<string>('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setTournamentId(id);
      fetchData(id);
    });
  }, [params]);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchTerm, statusFilter]);

  const fetchData = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Fetch tournament details
      const tournamentRes = await fetch(`/api/tournaments/${id}`);
      const tournamentData = await tournamentRes.json();
      if (tournamentData.success) {
        setTournament(tournamentData.data);
      }

      // Fetch participants
      const participantsRes = await fetch(`/api/tournaments/${id}/participants`);
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userId.phone.includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
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
        fetchData(tournamentId);
      }
    } catch (error) {
      console.error('Error approving participant:', error);
    }
  };

  const handleReject = async (participantId: string) => {
    try {
      const response = await fetch(`/api/participants/${participantId}/reject`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        fetchData(tournamentId);
      }
    } catch (error) {
      console.error('Error rejecting participant:', error);
    }
  };

  const handleRemove = async (participantId: string, participantName: string) => {
    if (!confirm(`Are you sure you want to remove ${participantName} from this tournament?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchData(tournamentId);
      } else {
        alert(data.error || 'Failed to remove participant');
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Failed to remove participant');
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedPlayer) return;

    setIsAdding(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/add-participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayer,
          isApproved: true, // Admin-added participants are auto-approved
          paymentStatus: 'na', // Payment not required for admin-added participants
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        setSelectedPlayer('');
        fetchData(tournamentId);
      } else {
        alert(data.error || 'Failed to add participant');
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      alert('Failed to add participant');
    } finally {
      setIsAdding(false);
    }
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
              <p className="text-muted-foreground">{tournament?.name}</p>
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
                <p className="text-primary mt-1 text-2xl font-bold">{participants.length}</p>
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
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or category..."
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
                    <th className="text-muted-foreground px-6 py-4 text-left text-sm font-medium">Participant</th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-sm font-medium">Contact</th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-sm font-medium">Category</th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-sm font-medium">Gender</th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-sm font-medium">Status</th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-sm font-medium">Payment</th>
                    <th className="text-muted-foreground px-6 py-4 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredParticipants.map((participant) => (
                    <tr key={participant._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-primary font-medium">{participant.userId.name}</p>
                          <p className="text-tertiary text-sm">
                            Registered {new Date(participant.registeredAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground text-sm">{participant.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground text-sm capitalize">{participant.gender}</span>
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
                          {!participant.isApproved ? (
                            <>
                              <button
                                onClick={() => handleApprove(participant._id)}
                                className="rounded-lg p-2 text-green-500 transition-colors hover:bg-green-500/10"
                                title="Approve"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleReject(participant._id)}
                                className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10"
                                title="Reject"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRemove(participant._id, participant.userId.name)}
                              className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10"
                              title="Remove from tournament"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
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
            className="glass-card-intense w-full max-w-md rounded-2xl p-6"
          >
            <h3 className="text-primary mb-4 text-xl font-bold">Add Participant</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Select a player from your registered players list to add them to this tournament.
            </p>

            <div className="mb-6">
              <label className="text-primary mb-2 block text-sm font-medium">
                Select Player <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
              >
                <option value="">Choose a player...</option>
                {players
                  .filter(player => !participants.find(p => p.userId._id === player._id))
                  .map((player) => (
                    <option key={player._id} value={player._id}>
                      {player.name} - {player.phone}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedPlayer('');
                }}
                className="glass-card flex-1 rounded-lg px-4 py-2 font-medium text-muted-foreground transition-all hover:bg-white/10"
                disabled={isAdding}
              >
                Cancel
              </button>
              <button
                onClick={handleAddParticipant}
                disabled={!selectedPlayer || isAdding}
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
