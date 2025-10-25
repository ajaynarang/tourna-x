'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { motion, AnimatePresence } from 'framer-motion';
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
  Settings,
  ChevronRight,
  Info,
  Shuffle,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui';
import { useToast } from '@/hooks/use-toast';

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
  categories: string[];
  ageGroups?: Array<{ name: string; minAge?: number; maxAge?: number }>;
}

interface Participant {
  _id: string;
  userId: string;
  name: string;
  category: string;
  ageGroup?: string;
  skillLevel?: string;
  partnerName?: string;
}

interface FixtureConfig {
  seedingMethod: 'random' | 'skill' | 'manual';
  groupByCategory: boolean;
  groupByAgeGroup: boolean;
  scheduleMatches: boolean;
  startDate?: string;
  startTime?: string;
  matchDuration: number; // minutes
  breakBetweenMatches: number; // minutes
  courtsAvailable: number;
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
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [fixtureConfig, setFixtureConfig] = useState<FixtureConfig>({
    seedingMethod: 'skill',
    groupByCategory: true,
    groupByAgeGroup: true,
    scheduleMatches: false,
    matchDuration: 30,
    breakBetweenMatches: 10,
    courtsAvailable: 1,
  });
  const [previewData, setPreviewData] = useState<any>(null);

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
                ? participantsData.data.filter((p: any) => p.isApproved).length
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
      toast({
        title: "Error",
        description: "Failed to load tournaments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureFixtures = async (tournament: Tournament) => {
    setSelectedTournament(tournament);
    
    // Fetch participants for this tournament
    try {
      const response = await fetch(`/api/tournaments/${tournament._id}/participants`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const approvedParticipants = data.data.filter((p: any) => p.isApproved);
        setParticipants(approvedParticipants);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
    
    setShowConfigModal(true);
  };

  const handlePreviewFixtures = () => {
    if (!selectedTournament) return;

    // Group participants by category and age group
    const grouped: Record<string, Participant[]> = {};
    
    participants.forEach(participant => {
      const key = `${participant.category}${participant.ageGroup ? `-${participant.ageGroup}` : ''}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(participant);
    });

    // Calculate matches for each group
    const preview: any = {};
    let totalMatches = 0;

    Object.entries(grouped).forEach(([key, groupParticipants]) => {
      let matchCount = 0;
      
      if (selectedTournament.format === 'knockout') {
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(groupParticipants.length)));
        matchCount = bracketSize - 1; // Total matches in knockout
      } else {
        // Round robin: n * (n-1) / 2
        matchCount = (groupParticipants.length * (groupParticipants.length - 1)) / 2;
      }

      preview[key] = {
        participants: groupParticipants.length,
        matches: matchCount,
        rounds: selectedTournament.format === 'knockout' 
          ? Math.ceil(Math.log2(groupParticipants.length))
          : 1,
      };
      
      totalMatches += matchCount;
    });

    setPreviewData({ groups: preview, totalMatches });
    setShowConfigModal(false);
    setShowPreviewModal(true);
  };

  const handleGenerateFixtures = async () => {
    if (!selectedTournament) return;

    setGeneratingFor(selectedTournament._id);
    setShowPreviewModal(false);
    
    try {
      const response = await fetch(`/api/tournaments/${selectedTournament._id}/fixtures/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fixtureConfig),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Fixtures Generated Successfully!",
          description: `${data.matchesCreated} matches created for ${selectedTournament.name}.`,
        });
        fetchTournaments();
        router.push(`/admin/tournaments/${selectedTournament._id}/fixtures`);
      } else {
        toast({
          title: "Failed to Generate Fixtures",
          description: data.error || 'An error occurred while generating fixtures.',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating fixtures:', error);
      toast({
        title: "Failed to Generate Fixtures",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingFor(null);
      setSelectedTournament(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  // Show tournaments that don't have fixtures yet
  const readyForFixtures = tournaments.filter(t => !t.hasFixtures && t.participantCount >= 2);

  // Show tournaments that already have fixtures
  const hasFixtures = tournaments.filter(t => t.hasFixtures);

  // Show tournaments not ready
  const notReady = tournaments.filter(t => !t.hasFixtures && t.participantCount < 2);

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
          <p className="text-muted-foreground">Configure and generate tournament fixtures with intelligent seeding</p>
        </motion.div>

        <Tabs defaultValue="ready" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="ready" className="gap-2">
              <Zap className="h-4 w-4" />
              Ready ({readyForFixtures.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Active ({hasFixtures.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({notReady.length})
            </TabsTrigger>
          </TabsList>

          {/* Ready for Fixtures */}
          <TabsContent value="ready" className="space-y-4">
            {readyForFixtures.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {readyForFixtures.map((tournament) => (
                  <TournamentCard
                    key={tournament._id}
                    tournament={tournament}
                    onConfigure={handleConfigureFixtures}
                    isGenerating={generatingFor === tournament._id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Zap}
                title="No Tournaments Ready"
                description="Tournaments need at least 2 approved participants to generate fixtures"
              />
            )}
          </TabsContent>

          {/* Active Fixtures */}
          <TabsContent value="active" className="space-y-4">
            {hasFixtures.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {hasFixtures.map((tournament) => (
                  <ActiveTournamentCard
                    key={tournament._id}
                    tournament={tournament}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Trophy}
                title="No Active Fixtures"
                description="Generate fixtures for tournaments to see them here"
              />
            )}
          </TabsContent>

          {/* Pending Tournaments */}
          <TabsContent value="pending" className="space-y-4">
            {notReady.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {notReady.map((tournament) => (
                  <PendingTournamentCard
                    key={tournament._id}
                    tournament={tournament}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="All Tournaments Ready!"
                description="All tournaments have enough participants"
              />
            )}
          </TabsContent>
        </Tabs>

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

      {/* Configuration Modal */}
      <AlertDialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-500" />
              Configure Fixture Generation
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mt-2">
                <p className="font-medium text-primary">{selectedTournament?.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTournament?.format === 'knockout' ? 'Knockout' : 'Round Robin'} • {participants.length} participants
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-6 py-4">
            {/* Seeding Method */}
            <div>
              <label className="text-primary mb-3 block text-sm font-semibold">
                Seeding Method
                <span className="text-muted-foreground ml-2 text-xs font-normal">How should players be seeded?</span>
              </label>
              <div className="grid gap-3">
                <button
                  onClick={() => setFixtureConfig({ ...fixtureConfig, seedingMethod: 'skill' })}
                  className={`glass-card rounded-lg p-4 text-left transition-all ${
                    fixtureConfig.seedingMethod === 'skill'
                      ? 'ring-2 ring-green-500 bg-green-500/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-primary font-medium">Skill-Based Seeding (Recommended)</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Seeds players based on skill level. Stronger players won't face each other early.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFixtureConfig({ ...fixtureConfig, seedingMethod: 'random' })}
                  className={`glass-card rounded-lg p-4 text-left transition-all ${
                    fixtureConfig.seedingMethod === 'random'
                      ? 'ring-2 ring-green-500 bg-green-500/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Shuffle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-primary font-medium">Random Seeding</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Completely random draw. Fair for recreational tournaments.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Grouping Options */}
            <div>
              <label className="text-primary mb-3 block text-sm font-semibold">
                Fixture Organization
              </label>
              <div className="space-y-3">
                {/* Category separation is always enforced */}
                <div className="glass-card-intense flex items-center gap-3 rounded-lg p-4">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-primary font-medium text-sm">Separate by Category (Required)</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Singles, Doubles, and Mixed will have separate fixtures
                    </p>
                  </div>
                </div>

                {selectedTournament?.ageGroups && selectedTournament.ageGroups.length > 0 && (
                  <label className="glass-card flex items-center gap-3 rounded-lg p-4 cursor-pointer hover:bg-white/5 transition-all">
                    <input
                      type="checkbox"
                      checked={fixtureConfig.groupByAgeGroup}
                      onChange={(e) => setFixtureConfig({ ...fixtureConfig, groupByAgeGroup: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-green-600 focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <p className="text-primary font-medium text-sm">Separate by Age Group</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Create separate fixtures for each age group
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Participant Breakdown */}
            <div className="glass-card-intense rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-400" />
                <p className="text-primary text-sm font-semibold">Participant Breakdown</p>
              </div>
              <div className="space-y-2">
                {Array.from(new Set(participants.map(p => p.category))).map(category => {
                  const categoryParticipants = participants.filter(p => p.category === category);
                  const isDoubles = category === 'doubles' || category === 'mixed';
                  const countLabel = isDoubles ? 'teams' : 'players';
                  return (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{category}:</span>
                      <Badge variant="outline">{categoryParticipants.length} {countLabel}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Advanced Options (collapsed by default) */}
            <details className="glass-card rounded-lg">
              <summary className="cursor-pointer p-4 text-primary font-medium text-sm hover:bg-white/5 rounded-lg transition-all">
                Advanced Scheduling Options (Optional)
              </summary>
              <div className="p-4 pt-0 space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={fixtureConfig.scheduleMatches}
                    onChange={(e) => setFixtureConfig({ ...fixtureConfig, scheduleMatches: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-green-600 focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-primary text-sm">Auto-schedule match times</span>
                </label>

                {fixtureConfig.scheduleMatches && (
                  <div className="ml-7 space-y-3 border-l-2 border-green-500/20 pl-4">
                    <div>
                      <label className="text-primary mb-1.5 block text-xs font-medium">Match Duration (minutes)</label>
                      <input
                        type="number"
                        value={fixtureConfig.matchDuration}
                        onChange={(e) => setFixtureConfig({ ...fixtureConfig, matchDuration: parseInt(e.target.value) || 30 })}
                        className="glass-card w-full rounded-lg px-3 py-2 text-sm text-primary outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                        min="15"
                        max="120"
                      />
                    </div>
                    <div>
                      <label className="text-primary mb-1.5 block text-xs font-medium">Break Between Matches (minutes)</label>
                      <input
                        type="number"
                        value={fixtureConfig.breakBetweenMatches}
                        onChange={(e) => setFixtureConfig({ ...fixtureConfig, breakBetweenMatches: parseInt(e.target.value) || 10 })}
                        className="glass-card w-full rounded-lg px-3 py-2 text-sm text-primary outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                        min="0"
                        max="60"
                      />
                    </div>
                    <div>
                      <label className="text-primary mb-1.5 block text-xs font-medium">Courts Available</label>
                      <input
                        type="number"
                        value={fixtureConfig.courtsAvailable}
                        onChange={(e) => setFixtureConfig({ ...fixtureConfig, courtsAvailable: parseInt(e.target.value) || 1 })}
                        className="glass-card w-full rounded-lg px-3 py-2 text-sm text-primary outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                        min="1"
                        max="20"
                      />
                    </div>
                  </div>
                )}
              </div>
            </details>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handlePreviewFixtures} className="gap-2">
              Preview Fixtures
              <ChevronRight className="h-4 w-4" />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      <AlertDialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-500" />
              Fixture Preview
            </AlertDialogTitle>
            <AlertDialogDescription>
              Review the fixture structure before generating
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Summary */}
            <div className="glass-card-intense rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Total Matches</p>
                  <p className="text-primary text-2xl font-bold">{previewData?.totalMatches || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Format</p>
                  <p className="text-primary text-lg font-semibold capitalize">
                    {selectedTournament?.format}
                  </p>
                </div>
              </div>
            </div>

            {/* Groups Breakdown */}
            <div>
              <h4 className="text-primary mb-3 text-sm font-semibold">Fixture Groups</h4>
              <div className="space-y-2">
                {previewData && Object.entries(previewData.groups).map(([key, data]: [string, any]) => {
                  const category = key.split('-')[0] || key;
                  const isDoubles = category === 'doubles' || category === 'mixed';
                  const countLabel = isDoubles ? 'teams' : 'players';
                  
                  return (
                    <div key={key} className="glass-card rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-primary font-medium capitalize">{key.replace('-', ' • ')}</p>
                        <Badge variant="outline">{data.participants} {countLabel}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{data.matches} matches</span>
                        {selectedTournament?.format === 'knockout' && (
                          <span>• {data.rounds} rounds</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Configuration Summary */}
            <div className="glass-card-intense rounded-lg p-4">
              <h4 className="text-primary mb-3 text-sm font-semibold">Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Seeding:</span>
                  <span className="text-primary font-medium capitalize">{fixtureConfig.seedingMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category Separation:</span>
                  <Badge className="bg-green-500/10 text-green-500">
                    Always Enabled
                  </Badge>
                </div>
                {selectedTournament?.ageGroups && selectedTournament.ageGroups.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Age Group Separation:</span>
                    <Badge variant={fixtureConfig.groupByAgeGroup ? "default" : "outline"}>
                      {fixtureConfig.groupByAgeGroup ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 rounded-lg bg-yellow-500/10 p-4 text-yellow-500">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">This action cannot be undone</p>
                <p className="text-yellow-500/80">
                  Generating fixtures will create {previewData?.totalMatches} matches. 
                  Make sure all participants are confirmed before proceeding.
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowPreviewModal(false);
              setShowConfigModal(true);
            }}>
              Back to Config
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateFixtures} className="bg-green-600 hover:bg-green-700">
              Generate Fixtures
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Tournament Card Component
function TournamentCard({ 
  tournament, 
  onConfigure, 
  isGenerating 
}: { 
  tournament: Tournament;
  onConfigure: (tournament: Tournament) => void;
  isGenerating: boolean;
}) {
  return (
    <motion.div
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
          <Badge variant="outline" className="font-medium">
            {tournament.participantCount}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Categories:</span>
          <span className="text-primary text-xs font-medium">
            {tournament.categories?.length || 0} types
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Start Date:</span>
          <span className="text-primary font-medium">
            {new Date(tournament.startDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <Button
        onClick={() => onConfigure(tournament)}
        disabled={isGenerating}
        className="w-full gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Settings className="h-4 w-4" />
            Configure & Generate
          </>
        )}
      </Button>
    </motion.div>
  );
}

// Active Tournament Card
function ActiveTournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <motion.div
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
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Fixtures Ready
          </Badge>
        </div>
      </div>

      <div className="flex gap-2">
        <Link href={`/admin/tournaments/${tournament._id}/fixtures`} className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <Eye className="h-4 w-4" />
            View
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// Pending Tournament Card
function PendingTournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card-intense rounded-xl p-6 opacity-75"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-primary mb-1 font-semibold">{tournament.name}</h3>
          <p className="text-tertiary text-sm">{tournament.sport}</p>
        </div>
        <Clock className="h-6 w-6 text-yellow-400" />
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Participants:</span>
          <span className="text-yellow-500 font-medium">
            {tournament.participantCount} (Need 2+)
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3 text-xs text-yellow-500">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>Need at least 2 approved participants</span>
      </div>

      <Link href={`/admin/participants?tournament=${tournament._id}`} className="mt-3 block">
        <Button variant="outline" className="w-full gap-2">
          <Users className="h-4 w-4" />
          Manage Participants
        </Button>
      </Link>
    </motion.div>
  );
}

// Empty State Component
function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: any; 
  title: string; 
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-12 text-center"
    >
      <Icon className="text-muted-foreground mx-auto h-16 w-16" />
      <h3 className="text-primary mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2">{description}</p>
    </motion.div>
  );
}
