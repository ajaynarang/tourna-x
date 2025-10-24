'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { motion } from 'framer-motion';
import {
  Trophy,
  Calendar,
  Users,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Edit,
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  format: string;
  status: string;
  participantCount: number;
  maxParticipants: number;
  startDate: string;
  hasFixtures: boolean;
}

export default function AdminFixturesPage() {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <AdminFixturesContent />
    </AuthGuard>
  );
}

function AdminFixturesContent() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tournaments');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Fetch participant counts and fixture status for each tournament
        const tournamentsWithCounts = await Promise.all(
          data.data.map(async (tournament: any) => {
            try {
              // Get participant count
              const participantsRes = await fetch(`/api/tournaments/${tournament._id}/participants`);
              const participantsData = await participantsRes.json();
              const participantCount = participantsData.success && Array.isArray(participantsData.data) 
                ? participantsData.data.length 
                : 0;

              // Check if fixtures exist
              const matchesRes = await fetch(`/api/matches?tournamentId=${tournament._id}`);
              const matchesData = await matchesRes.json();
              const hasFixtures = matchesData.success && Array.isArray(matchesData.data) && matchesData.data.length > 0;

              return {
                ...tournament,
                participantCount,
                hasFixtures,
              };
            } catch (error) {
              console.error(`Error fetching data for tournament ${tournament._id}:`, error);
              return {
                ...tournament,
                participantCount: 0,
                hasFixtures: false,
              };
            }
          })
        );

        setTournaments(tournamentsWithCounts);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFixtures = async (tournamentId: string) => {
    if (!confirm('Generate fixtures for this tournament? This will create all matches based on registered participants.')) {
      return;
    }

    setGeneratingFor(tournamentId);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/fixtures/generate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert(`Fixtures generated successfully! ${data.matchesCreated} matches created.`);
        fetchTournaments();
        router.push(`/admin/tournaments/${tournamentId}/fixtures`);
      } else {
        alert(data.error || 'Failed to generate fixtures');
      }
    } catch (error) {
      console.error('Error generating fixtures:', error);
      alert('Failed to generate fixtures');
    } finally {
      setGeneratingFor(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  // Show tournaments that don't have fixtures yet (including draft/published/registration_open)
  const readyForFixtures = tournaments.filter(t => !t.hasFixtures);

  // Show tournaments that already have fixtures
  const hasFixtures = tournaments.filter(t => t.hasFixtures);

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-primary mb-2 text-3xl font-bold">Fixture Management</h1>
          <p className="text-muted-foreground">Generate and manage tournament fixtures</p>
        </motion.div>

        {/* Ready for Fixtures */}
        {readyForFixtures.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-primary mb-4 flex items-center gap-2 text-xl font-semibold">
              <Zap className="h-6 w-6 text-green-500" />
              Ready to Generate Fixtures
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {readyForFixtures.map((tournament) => (
                <motion.div
                  key={tournament._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card-intense rounded-xl p-6"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-primary mb-1 font-semibold">{tournament.name}</h3>
                      <p className="text-tertiary text-sm">{tournament.sport}</p>
                    </div>
                    <Trophy className="h-6 w-6 text-green-400" />
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Format:</span>
                      <span className="text-primary font-medium capitalize">{tournament.format}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Participants:</span>
                      <span className={`font-medium ${tournament.participantCount < 2 ? 'text-red-500' : 'text-primary'}`}>
                        {tournament.participantCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-primary font-medium capitalize">{tournament.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="text-primary font-medium">
                        {new Date(tournament.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {tournament.participantCount < 2 && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3 text-xs text-yellow-500">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>At least 2 participants required to generate fixtures</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleGenerateFixtures(tournament._id)}
                    disabled={generatingFor === tournament._id || tournament.participantCount < 2}
                    className="bg-primary w-full rounded-lg px-4 py-2 font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatingFor === tournament._id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Zap className="h-4 w-4" />
                        Generate Fixtures
                      </span>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tournaments with Fixtures */}
        {hasFixtures.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-primary mb-4 flex items-center gap-2 text-xl font-semibold">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Tournaments with Fixtures
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {hasFixtures.map((tournament) => (
                <motion.div
                  key={tournament._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card-intense rounded-xl p-6"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-primary mb-1 font-semibold">{tournament.name}</h3>
                      <p className="text-tertiary text-sm">{tournament.sport}</p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Format:</span>
                      <span className="text-primary font-medium capitalize">{tournament.format}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                        <CheckCircle className="h-3 w-3" />
                        Fixtures Ready
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/tournaments/${tournament._id}/fixtures`}
                      className="glass-card flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-all hover:bg-white/10"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </span>
                    </Link>
                    <Link
                      href={`/admin/scoring/${tournament._id}`}
                      className="bg-primary flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium text-white transition-all hover:opacity-90"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Edit className="h-4 w-4" />
                        Score
                      </span>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* No Tournaments */}
        {tournaments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-12 text-center"
          >
            <Trophy className="text-muted-foreground mx-auto h-16 w-16" />
            <h3 className="text-primary mt-4 text-lg font-semibold">No Tournaments Found</h3>
            <p className="text-muted-foreground mt-2">
              Create a tournament and register participants to generate fixtures
            </p>
            <Link
              href="/admin/tournaments/create"
              className="bg-primary mt-6 inline-block rounded-lg px-6 py-2 font-medium text-white transition-all hover:opacity-90"
            >
              Create Tournament
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
