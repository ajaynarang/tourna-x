'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Trophy,
  Filter,
  Download,
} from 'lucide-react';

interface Participant {
  _id: string;
  userId: string;
  tournamentId: string;
  tournamentName: string;
  name: string;
  phone: string;
  email?: string;
  category: string;
  gender: string;
  isApproved: boolean;
  paymentStatus: 'pending' | 'paid';
  registeredAt: string;
}

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchTerm, statusFilter, paymentFilter]);

  const fetchParticipants = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/participants');
      const result = await response.json();
      
      if (result.success) {
        setParticipants(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterParticipants = () => {
    let filtered = participants;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm) ||
        p.tournamentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p =>
        statusFilter === 'approved' ? p.isApproved : !p.isApproved
      );
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(p => p.paymentStatus === paymentFilter);
    }

    setFilteredParticipants(filtered);
  };

  const handleApprove = async (participantId: string) => {
    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      });

      if (response.ok) {
        fetchParticipants();
      }
    } catch (error) {
      console.error('Error approving participant:', error);
    }
  };

  const handleReject = async (participantId: string) => {
    if (!confirm('Are you sure you want to reject this participant?')) return;

    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchParticipants();
      }
    } catch (error) {
      console.error('Error rejecting participant:', error);
    }
  };

  const handlePaymentUpdate = async (participantId: string, status: 'pending' | 'paid') => {
    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: status }),
      });

      if (response.ok) {
        fetchParticipants();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const pendingCount = participants.filter(p => !p.isApproved).length;
  const approvedCount = participants.filter(p => p.isApproved).length;
  const pendingPaymentCount = participants.filter(p => p.paymentStatus === 'pending').length;

  return (
    <div className="relative z-10 min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-primary text-3xl font-bold">Participant Management</h1>
          <p className="text-secondary mt-1">Manage all tournament participants</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <div className="glass-card-intense p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-primary text-2xl font-bold">{approvedCount}</div>
                <div className="text-secondary text-sm">Approved</div>
              </div>
            </div>
          </div>

          <div className="glass-card-intense p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-primary text-2xl font-bold">{pendingCount}</div>
                <div className="text-secondary text-sm">Pending Approval</div>
              </div>
            </div>
          </div>

          <div className="glass-card-intense p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-primary text-2xl font-bold">{pendingPaymentCount}</div>
                <div className="text-secondary text-sm">Pending Payment</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="glass-card flex flex-1 items-center gap-3 px-4 py-3">
            <Search className="text-tertiary h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, phone, or tournament..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-primary flex-1 bg-transparent outline-none placeholder:text-tertiary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-card rounded-lg px-4 py-3 text-primary outline-none"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="glass-card rounded-lg px-4 py-3 text-primary outline-none"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Participants List */}
        <div className="glass-card-intense p-6">
          {filteredParticipants.length > 0 ? (
            <div className="space-y-3">
              {filteredParticipants.map((participant, index) => (
                <motion.div
                  key={participant._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <ParticipantCard
                    participant={participant}
                    onApprove={() => handleApprove(participant._id)}
                    onReject={() => handleReject(participant._id)}
                    onPaymentUpdate={(status) => handlePaymentUpdate(participant._id, status)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20">
                <Users className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-primary mb-2 text-lg font-semibold">
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'No participants found'
                  : 'No participants yet'}
              </h3>
              <p className="text-secondary text-sm">
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Participants will appear here once tournaments are published'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ParticipantCard({
  participant,
  onApprove,
  onReject,
  onPaymentUpdate,
}: {
  participant: Participant;
  onApprove: () => void;
  onReject: () => void;
  onPaymentUpdate: (status: 'pending' | 'paid') => void;
}) {
  return (
    <div className="glass-card flex flex-col gap-4 p-4 transition-all hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500">
          <span className="text-lg font-bold text-white">
            {participant.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-primary truncate font-semibold">{participant.name}</h3>
          <div className="text-tertiary mt-1 flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {participant.phone}
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {participant.tournamentName}
            </span>
          </div>
          <div className="text-tertiary mt-1 flex flex-wrap items-center gap-3 text-xs">
            <span>{participant.category}</span>
            <span>•</span>
            <span>{participant.gender}</span>
            <span>•</span>
            <span>{new Date(participant.registeredAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Approval Status */}
        {participant.isApproved ? (
          <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-400">
            <CheckCircle className="h-4 w-4" />
            Approved
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-sm font-medium text-orange-400">
            <Clock className="h-4 w-4" />
            Pending
          </div>
        )}

        {/* Payment Status */}
        <button
          onClick={() => onPaymentUpdate(participant.paymentStatus === 'paid' ? 'pending' : 'paid')}
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            participant.paymentStatus === 'paid'
              ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
              : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
          }`}
        >
          {participant.paymentStatus === 'paid' ? 'Paid' : 'Not Paid'}
        </button>

        {/* Actions */}
        {!participant.isApproved && (
          <div className="flex items-center gap-2">
            <button
              onClick={onApprove}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/20 text-green-400 transition-all hover:bg-green-500/30"
              title="Approve"
            >
              <CheckCircle className="h-5 w-5" />
            </button>
            <button
              onClick={onReject}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/20 text-red-400 transition-all hover:bg-red-500/30"
              title="Reject"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
