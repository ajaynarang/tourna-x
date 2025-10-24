'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Settings,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Zap,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  courts: number;
  startDate: string;
  endDate: string;
}

interface Match {
  _id: string;
  tournamentId: string;
  category: string;
  ageGroup?: string;
  round: string;
  roundNumber: number;
  matchNumber: number;
  player1Name: string;
  player2Name: string;
  status: string;
  court?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  duration?: number;
}

interface Court {
  id: string;
  name: string;
  matches: Match[];
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function SchedulingPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [tournamentId, setTournamentId] = useState<string>('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'auto' | 'manual'>('auto');
  const [draggedMatch, setDraggedMatch] = useState<Match | null>(null);

  useEffect(() => {
    params.then(p => {
      setTournamentId(p.id);
    });
  }, [params]);

  useEffect(() => {
    if (tournamentId) {
      fetchData();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (selectedDate) {
      initializeCourts();
    }
  }, [selectedDate, matches]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tournament details
      const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`);
      const tournamentResult = await tournamentResponse.json();
      
      if (tournamentResult.success) {
        setTournament(tournamentResult.data);
        setSelectedDate(tournamentResult.data.startDate);
      }

      // Fetch matches
      const matchesResponse = await fetch(`/api/matches?tournamentId=${tournamentId}`);
      const matchesResult = await matchesResponse.json();
      
      if (matchesResult.success) {
        setMatches(matchesResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeCourts = () => {
    if (!tournament) return;

    const newCourts: Court[] = [];
    for (let i = 1; i <= tournament.courts; i++) {
      newCourts.push({
        id: `court-${i}`,
        name: `Court ${i}`,
        matches: matches.filter(match => 
          match.court === `Court ${i}` && 
          match.scheduledDate === selectedDate
        )
      });
    }
    setCourts(newCourts);
  };

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    const matchDuration = 60; // 60 minutes per match

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += matchDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeString,
          available: true
        });
      }
    }
    return slots;
  };

  const autoSchedule = async () => {
    try {
      setIsSaving(true);
      
      // Simple auto-scheduling algorithm
      const unscheduledMatches = matches.filter(match => !match.scheduledDate);
      const timeSlots = generateTimeSlots();
      
      let currentSlot = 0;
      let currentCourt = 0;
      
      for (const match of unscheduledMatches) {
        if (currentSlot >= timeSlots.length) break;
        
        const courtName = `Court ${(currentCourt % tournament!.courts) + 1}`;
        const timeSlot = timeSlots[currentSlot];
        
        // Update match with schedule
        await fetch(`/api/matches/${match._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            court: courtName,
            scheduledDate: selectedDate,
            scheduledTime: timeSlot.time,
            duration: 60
          })
        });
        
        currentCourt++;
        if (currentCourt >= tournament!.courts) {
          currentCourt = 0;
          currentSlot++;
        }
      }
      
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error auto-scheduling:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (match: Match) => {
    setDraggedMatch(match);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, courtId: string, timeSlot?: string) => {
    e.preventDefault();
    
    if (!draggedMatch) return;
    
    try {
      const courtName = courts.find(c => c.id === courtId)?.name;
      
      await fetch(`/api/matches/${draggedMatch._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          court: courtName,
          scheduledDate: selectedDate,
          scheduledTime: timeSlot || draggedMatch.scheduledTime,
          duration: 60
        })
      });
      
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating match schedule:', error);
    } finally {
      setDraggedMatch(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-500/10 border-blue-500/30 text-blue-400', icon: Clock },
      in_progress: { color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', icon: Settings },
      completed: { color: 'bg-green-500/10 border-green-500/30 text-green-400', icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const renderAutoSchedule = () => (
    <div className="space-y-6">
      <div className="glass-card-intense p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-primary">Auto Scheduling</h3>
            <p className="text-tertiary text-sm">Automatically assign matches to courts and time slots</p>
          </div>
          <Button
            onClick={autoSchedule}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/80"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Auto Schedule
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-primary">Total Matches</span>
            </div>
            <span className="text-2xl font-bold text-primary">{matches.length}</span>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-400" />
              <span className="font-medium text-primary">Scheduled</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              {matches.filter(m => m.scheduledDate).length}
            </span>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="font-medium text-primary">Unscheduled</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              {matches.filter(m => !m.scheduledDate).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderManualSchedule = () => {
    const timeSlots = generateTimeSlots();
    
    return (
      <div className="space-y-6">
        {/* Unscheduled Matches */}
        <div className="glass-card-intense p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">Unscheduled Matches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.filter(match => !match.scheduledDate).map((match) => (
              <motion.div
                key={match._id}
                draggable
                onDragStart={() => handleDragStart(match)}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-4 cursor-move hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-tertiary">Match {match.matchNumber}</span>
                  {getStatusBadge(match.status)}
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-primary font-medium">{match.player1Name}</div>
                  <div className="text-xs text-tertiary text-center">vs</div>
                  <div className="text-sm text-primary font-medium">{match.player2Name}</div>
                </div>
                
                <div className="mt-2 text-xs text-tertiary">
                  {match.category} {match.ageGroup && `(${match.ageGroup})`}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Court Schedule */}
        <div className="space-y-4">
          {courts.map((court) => (
            <div key={court.id} className="glass-card-intense p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">{court.name}</h3>
                <span className="text-sm text-tertiary">
                  {court.matches.length} matches scheduled
                </span>
              </div>
              
              <div className="grid grid-cols-8 gap-2">
                {timeSlots.map((slot) => {
                  const matchAtSlot = court.matches.find(m => m.scheduledTime === slot.time);
                  
                  return (
                    <div
                      key={slot.time}
                      className="glass-card p-2 min-h-[60px] flex flex-col items-center justify-center"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, court.id, slot.time)}
                    >
                      <div className="text-xs text-tertiary mb-1">{slot.time}</div>
                      {matchAtSlot ? (
                        <div className="text-xs text-primary text-center">
                          <div className="font-medium">{matchAtSlot.player1Name}</div>
                          <div className="text-tertiary">vs</div>
                          <div className="font-medium">{matchAtSlot.player2Name}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-tertiary">Available</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="relative z-10 min-h-screen p-8 flex items-center justify-center">
        <div className="glass-card-intense p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-tertiary">Loading scheduling...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="relative z-10 min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">Tournament Not Found</h2>
          <p className="text-tertiary mb-6">The tournament you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/admin/tournaments">Back to Tournaments</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/tournaments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tournaments
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold gradient-title">
              Match Scheduling
            </h1>
            <p className="text-tertiary">
              {tournament.name} - Schedule matches across courts
            </p>
          </div>
        </div>

        {/* Tournament Info & Controls */}
        <div className="glass-card-intense p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">{tournament.name}</h2>
              <div className="flex items-center gap-4 text-sm text-tertiary mt-1">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {tournament.courts} courts available
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {matches.length} matches
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-primary"
              />
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="glass-card-intense p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary">Scheduling Mode</h3>
              <p className="text-tertiary text-sm">Choose between automatic or manual scheduling</p>
            </div>
            <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <Button
                onClick={() => setViewMode('auto')}
                variant={viewMode === 'auto' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none bg-transparent hover:bg-white/10"
              >
                <Zap className="h-4 w-4 mr-1" />
                Auto
              </Button>
              <Button
                onClick={() => setViewMode('manual')}
                variant={viewMode === 'manual' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none bg-transparent hover:bg-white/10"
              >
                <Settings className="h-4 w-4 mr-1" />
                Manual
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduling Interface */}
      {viewMode === 'auto' ? renderAutoSchedule() : renderManualSchedule()}
    </div>
  );
}

