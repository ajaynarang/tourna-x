'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Trophy,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Save,
} from 'lucide-react';
import Link from 'next/link';

interface TournamentFormData {
  name: string;
  sport: 'badminton' | 'tennis';
  venue: string;
  location: string;
  startDate: string;
  endDate: string;
  categories: string[];
  gender: string[];
  format: 'knockout' | 'round_robin';
  entryFee: number;
  maxParticipants: number;
  registrationDeadline: string;
  tournamentType: 'society_only' | 'open';
  allowedSociety: string;
  rules: string;
  prizes: {
    winner: number;
    runnerUp: number;
    semiFinalist: number;
  };
}

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  venue: string;
  location: string;
  startDate?: string;
  endDate?: string;
  categories: string[];
  gender: string[];
  format: string;
  entryFee: number;
  maxParticipants: number;
  registrationDeadline?: string;
  tournamentType: string;
  allowedSociety: string;
  rules: string;
  prizes: {
    winner: number;
    runnerUp: number;
    semiFinalist: number;
  };
  status: string;
}

export default function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [tournamentId, setTournamentId] = useState<string>('');
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    sport: 'badminton',
    venue: '',
    location: '',
    startDate: '',
    endDate: '',
    categories: [],
    gender: [],
    format: 'knockout',
    entryFee: 0,
    maxParticipants: 32,
    registrationDeadline: '',
    tournamentType: 'open',
    allowedSociety: '',
    rules: '',
    prizes: {
      winner: 0,
      runnerUp: 0,
      semiFinalist: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setTournamentId(id);
        
        const response = await fetch(`/api/tournaments/${id}`);
        const result = await response.json();
        
        if (result.success) {
          const tournament = result.data;
          setFormData({
            name: tournament.name || '',
            sport: tournament.sport || 'badminton',
            venue: tournament.venue || '',
            location: tournament.location || '',
            startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : '',
            endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().split('T')[0] : '',
            categories: tournament.categories || [],
            gender: tournament.gender || [],
            format: tournament.format || 'knockout',
            entryFee: tournament.entryFee || 0,
            maxParticipants: tournament.maxParticipants || 32,
            registrationDeadline: tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toISOString().split('T')[0] : '',
            tournamentType: tournament.tournamentType || 'open',
            allowedSociety: tournament.allowedSociety || '',
            rules: tournament.rules || '',
            prizes: tournament.prizes || { winner: 0, runnerUp: 0, semiFinalist: 0 },
          });
        } else {
          setError('Failed to load tournament');
        }
      } catch (err) {
        setError('Failed to load tournament');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournament();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_properties',
          data: formData
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/admin/tournaments/${tournamentId}/participants`);
      } else {
        setError(result.error || 'Failed to update tournament');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof TournamentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'categories' | 'gender', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/admin/tournaments"
            className="glass-card flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tournaments
          </Link>
          <div>
            <h1 className="text-primary text-3xl font-bold">Edit Tournament</h1>
            <p className="text-secondary mt-1">Update tournament details</p>
          </div>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {error && (
            <div className="glass-card-intense flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="glass-card-intense p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-blue-500">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Basic Information</h2>
            </div>

            <div className="space-y-4">
              <FormField
                label="Tournament Name"
                required
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Summer Badminton Championship 2024"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-primary mb-2 block text-sm font-medium">
                    Sport <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.sport}
                    onChange={(e) => updateField('sport', e.target.value as 'badminton' | 'tennis')}
                    className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                    required
                  >
                    <option value="badminton">Badminton</option>
                    <option value="tennis">Tennis</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Venue"
                  required
                  value={formData.venue}
                  onChange={(e) => updateField('venue', e.target.value)}
                  placeholder="e.g., Central Sports Complex"
                />

                <FormField
                  label="Location"
                  required
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g., Mumbai, Maharashtra"
                />
              </div>
            </div>
          </div>

          {/* Categories and Format */}
          <div className="glass-card-intense p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Categories & Format</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-primary mb-3 block text-sm font-medium">
                  Categories <span className="text-red-400">*</span>
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {['singles', 'doubles', 'mixed'].map((category) => (
                    <label
                      key={category}
                      className="glass-card flex cursor-pointer items-center gap-3 rounded-lg p-4 transition-all hover:scale-105"
                    >
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => toggleArrayItem('categories', category)}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-primary capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-primary mb-3 block text-sm font-medium">
                  Gender Categories
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {['men', 'women', 'mixed'].map((gender) => (
                    <label
                      key={gender}
                      className="glass-card flex cursor-pointer items-center gap-3 rounded-lg p-4 transition-all hover:scale-105"
                    >
                      <input
                        type="checkbox"
                        checked={formData.gender.includes(gender)}
                        onChange={() => toggleArrayItem('gender', gender)}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-primary capitalize">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-primary mb-2 block text-sm font-medium">
                  Tournament Format <span className="text-red-400">*</span>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: 'knockout', label: 'Knockout', desc: 'Single elimination' },
                    { value: 'round_robin', label: 'Round Robin', desc: 'Everyone plays everyone' },
                  ].map((format) => (
                    <label
                      key={format.value}
                      className="glass-card flex cursor-pointer items-center gap-3 rounded-lg p-4 transition-all hover:scale-105"
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format.value}
                        checked={formData.format === format.value}
                        onChange={(e) => updateField('format', e.target.value)}
                        className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <div className="text-primary font-medium">{format.label}</div>
                        <div className="text-secondary text-sm">{format.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="glass-card-intense p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Schedule</h2>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  label="Start Date"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />

                <FormField
                  label="End Date"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                />

                <FormField
                  label="Registration Deadline"
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => updateField('registrationDeadline', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Fees and Prizes */}
          <div className="glass-card-intense p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Fees & Prizes</h2>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Entry Fee (₹)"
                  type="number"
                  value={formData.entryFee}
                  onChange={(e) => updateField('entryFee', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />

                <FormField
                  label="Max Participants"
                  type="number"
                  required
                  value={formData.maxParticipants}
                  onChange={(e) => updateField('maxParticipants', parseInt(e.target.value) || 32)}
                  min="2"
                />
              </div>

              <div>
                <label className="text-primary mb-3 block text-sm font-medium">
                  Prize Money (₹)
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-secondary mb-1 block text-xs">Winner</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.prizes.winner}
                      onChange={(e) => updateField('prizes', { ...formData.prizes, winner: parseInt(e.target.value) || 0 })}
                      className="glass-card w-full rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-secondary mb-1 block text-xs">Runner Up</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.prizes.runnerUp}
                      onChange={(e) => updateField('prizes', { ...formData.prizes, runnerUp: parseInt(e.target.value) || 0 })}
                      className="glass-card w-full rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-secondary mb-1 block text-xs">Semi Finalist</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.prizes.semiFinalist}
                      onChange={(e) => updateField('prizes', { ...formData.prizes, semiFinalist: parseInt(e.target.value) || 0 })}
                      className="glass-card w-full rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="glass-card-intense p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Rules & Guidelines</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-primary mb-2 block text-sm font-medium">
                  Tournament Rules
                </label>
                <textarea
                  value={formData.rules}
                  onChange={(e) => updateField('rules', e.target.value)}
                  rows={4}
                  className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter tournament rules and guidelines..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/admin/tournaments"
              className="text-tertiary hover:text-primary text-sm transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name || formData.categories.length === 0 || formData.gender.length === 0}
              className="bg-primary flex items-center gap-2 rounded-lg px-8 py-3 font-semibold text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Update Tournament
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

function FormField({
  label,
  type = 'text',
  required = false,
  value,
  onChange,
  placeholder,
  min,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: string;
}) {
  return (
    <div>
      <label className="text-primary mb-2 block text-sm font-medium">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none transition-all focus:ring-2 focus:ring-green-500/50"
      />
    </div>
  );
}
