'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Trophy,
  Send,
  Calendar,
  MapPin,
  DollarSign,
  Eye,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  venue: string;
  location: string;
  startDate: string;
  status: string;
  isPublished: boolean;
  maxParticipants: number;
  participantCount: number;
  entryFee: number;
}

interface Participant {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  category: string;
  gender: string;
  isApproved: boolean;
  paymentStatus: 'pending' | 'paid';
  registeredAt: string;
}

export default function TournamentParticipantsPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params?.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch tournament details
      const tournamentRes = await fetch(`/api/tournaments/${tournamentId}`);
      const tournamentData = await tournamentRes.json();
      if (tournamentData.success) {
        setTournament(tournamentData.data);
      }

      // Fetch participants
      const participantsRes = await fetch(`/api/participants?tournamentId=${tournamentId}`);
      const participantsData = await participantsRes.json();
      if (participantsData.success) {
        setParticipants(participantsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (participantId: string) => {
    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      });

      if (response.ok) {
        fetchData();
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
        fetchData();
      }
    } catch (error) {
      console.error('Error rejecting participant:', error);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Publish this tournament? Participants will be able to register.')) return;

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isPublished: true, 
          status: 'published'
        }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error publishing tournament:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-primary text-xl font-semibold">Tournament not found</h2>
          <Link href="/admin/tournaments" className="text-tertiary mt-4 inline-block text-sm">
            Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  const pendingCount = participants.filter(p => !p.isApproved).length;
  const approvedCount = participants.filter(p => p.isApproved).length;

  return (
    <div className="relative z-10 min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/tournaments"
            className="text-tertiary hover:text-primary mb-4 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tournaments
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-primary text-3xl font-bold">{tournament.name}</h1>
              <div className="text-secondary mt-2 flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  {tournament.sport}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {tournament.venue}, {tournament.location}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(tournament.startDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {!tournament.isPublished && (
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="bg-primary flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-transform hover:scale-105 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Publish Tournament
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <div className="glass-card-intense p-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-primary text-2xl font-bold">{approvedCount}</div>
                <div className="text-secondary text-sm">Approved</div>
              </div>
            </div>
          </div>

          <div className="glass-card-intense p-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-primary text-2xl font-bold">{pendingCount}</div>
                <div className="text-secondary text-sm">Pending</div>
              </div>
            </div>
          </div>

          <div className="glass-card-intense p-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-primary text-2xl font-bold">
                  {participants.length} / {tournament.maxParticipants}
                </div>
                <div className="text-secondary text-sm">Total Registrations</div>
              </div>
            </div>
          </div>
        </div>

        {/* Participants List */}
        <div className="glass-card-intense p-6">
          <h2 className="text-primary mb-6 text-xl font-semibold">Participants</h2>

          {participants.length > 0 ? (
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <motion.div
                  key={participant._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ParticipantCard
                    participant={participant}
                    onApprove={() => handleApprove(participant._id)}
                    onReject={() => handleReject(participant._id)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20">
                <Users className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-primary mb-2 text-lg font-semibold">No participants yet</h3>
              <p className="text-secondary text-sm">
                {tournament.isPublished
                  ? 'Waiting for participants to register'
                  : 'Publish the tournament to start accepting registrations'}
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
}: {
  participant: Participant;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="glass-card flex items-center justify-between p-4 transition-all hover:bg-white/5">
      <div className="flex flex-1 items-center gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500">
          <span className="text-lg font-bold text-white">
            {participant.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-primary font-semibold">{participant.name}</h3>
          <div className="text-tertiary mt-1 flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {participant.phone}
            </span>
            <span>{participant.category}</span>
            <span>{participant.gender}</span>
            <span className={participant.paymentStatus === 'paid' ? 'text-green-400' : 'text-orange-400'}>
              {participant.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
            </span>
          </div>
        </div>

        {/* Status */}
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
      </div>

      {/* Actions */}
      {!participant.isApproved && (
        <div className="ml-4 flex items-center gap-2">
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
  );
}
