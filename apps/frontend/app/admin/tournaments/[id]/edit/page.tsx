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
    winner: Array<{
      type: 'money' | 'trophy' | 'medal' | 'certificate' | 'voucher' | 'merchandise' | 'other';
      value: number;
      description: string;
      currency: string;
    }>;
    runnerUp: Array<{
      type: 'money' | 'trophy' | 'medal' | 'certificate' | 'voucher' | 'merchandise' | 'other';
      value: number;
      description: string;
      currency: string;
    }>;
    semiFinalist: Array<{
      type: 'money' | 'trophy' | 'medal' | 'certificate' | 'voucher' | 'merchandise' | 'other';
      value: number;
      description: string;
      currency: string;
    }>;
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
    winner: Array<{
      type: string;
      value: number;
      description: string;
      currency: string;
    }>;
    runnerUp: Array<{
      type: string;
      value: number;
      description: string;
      currency: string;
    }>;
    semiFinalist: Array<{
      type: string;
      value: number;
      description: string;
      currency: string;
    }>;
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
      winner: [],
      runnerUp: [],
      semiFinalist: [],
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
            startDate: (tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : '') as string,
            endDate: (tournament.endDate ? new Date(tournament.endDate).toISOString().split('T')[0] : '') as string,
            categories: tournament.categories || [],
            gender: tournament.gender || [],
            format: tournament.format || 'knockout',
            entryFee: tournament.entryFee || 0,
            maxParticipants: tournament.maxParticipants || 32,
            registrationDeadline: (tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toISOString().split('T')[0] : '') as string,
            tournamentType: tournament.tournamentType || 'open',
            allowedSociety: tournament.allowedSociety || '',
            rules: tournament.rules || '',
            prizes: tournament.prizes || {
              winner: [],
              runnerUp: [],
              semiFinalist: [],
            },
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
            className="glass-card flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium  transition-transform hover:scale-105"
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
                  Playing Format <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {['singles', 'doubles', 'mixed'].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleArrayItem('categories', category)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        formData.categories.includes(category)
                          ? 'bg-green-500 text-white'
                          : 'glass-card text-secondary hover:text-primary'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-primary mb-3 block text-sm font-medium">
                  Gender <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {['men', 'women', 'mixed'].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => toggleArrayItem('gender', gender)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        formData.gender.includes(gender)
                          ? 'bg-blue-500 text-white'
                          : 'glass-card text-secondary hover:text-primary'
                      }`}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-primary mb-3 block text-sm font-medium">
                  Tournament Format <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: 'knockout', label: 'Knockout' },
                    { value: 'round_robin', label: 'Round Robin' },
                  ].map((format) => (
                    <button
                      key={format.value}
                      type="button"
                      onClick={() => updateField('format', format.value)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        formData.format === format.value
                          ? 'bg-purple-500 text-white'
                          : 'glass-card text-secondary hover:text-primary'
                      }`}
                    >
                      {format.label}
                    </button>
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

          {/* Tournament Type */}
          <div className="glass-card-intense p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Tournament Type</h2>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    updateField('tournamentType', 'open');
                    updateField('allowedSociety', '');
                  }}
                  className={`rounded-lg p-4 text-left transition-all ${
                    formData.tournamentType === 'open'
                      ? 'bg-green-500/20 ring-2 ring-green-500'
                      : 'glass-card hover:bg-white/5'
                  }`}
                >
                  <div className="text-primary mb-1 font-semibold">Open Tournament</div>
                  <div className="text-tertiary text-sm">Anyone can register</div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('tournamentType', 'society_only')}
                  className={`rounded-lg p-4 text-left transition-all ${
                    formData.tournamentType === 'society_only'
                      ? 'bg-blue-500/20 ring-2 ring-blue-500'
                      : 'glass-card hover:bg-white/5'
                  }`}
                >
                  <div className="text-primary mb-1 font-semibold">Society Only</div>
                  <div className="text-tertiary text-sm">Restricted to society members</div>
                </button>
              </div>

              {formData.tournamentType === 'society_only' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <FormField
                    label="Society Name"
                    required
                    value={formData.allowedSociety}
                    onChange={(e) => updateField('allowedSociety', e.target.value)}
                    placeholder="e.g., Green Valley Apartments"
                  />
                </motion.div>
              )}
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
                  Prize Details
                </label>
                <div className="space-y-6">
                  {[
                    { key: 'winner' as const, label: 'Winner', icon: '🏆' },
                    { key: 'runnerUp' as const, label: 'Runner Up', icon: '🥈' },
                    { key: 'semiFinalist' as const, label: 'Semi Finalist', icon: '🥉' },
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="glass-card rounded-lg p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{icon}</span>
                          <span className="text-primary font-medium">{label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newPrize = { type: 'money', value: 0, description: '', currency: 'INR' };
                            updateField('prizes', {
                              ...formData.prizes,
                              [key]: [...formData.prizes[key as keyof typeof formData.prizes], newPrize]
                            });
                          }}
                          className="text-primary hover:text-green-400 text-sm font-medium transition-colors"
                        >
                          + Add Prize
                        </button>
                      </div>
                      
                      {formData.prizes[key as keyof typeof formData.prizes].length === 0 ? (
                        <div className="text-secondary text-center py-4 text-sm">
                          No prizes added yet. Click "Add Prize" to get started.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.prizes[key as keyof typeof formData.prizes].map((prize, index) => (
                            <div key={index} className="glass-card rounded-lg p-3">
                              <div className="grid gap-3 sm:grid-cols-4">
                                <div>
                                  <label className="text-secondary mb-1 block text-xs">Prize Type</label>
                                  <select
                                    value={prize.type}
                                    onChange={(e) => {
                                      const updatedPrizes = [...formData.prizes[key as keyof typeof formData.prizes]];
                                      updatedPrizes[index] = { ...prize, type: e.target.value as any };
                                      updateField('prizes', {
                                        ...formData.prizes,
                                        [key]: updatedPrizes
                                      });
                                    }}
                                    className="glass-card w-full rounded-lg px-2 py-1 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50 text-sm"
                                  >
                                    <option value="money">💰 Money</option>
                                    <option value="trophy">🏆 Trophy</option>
                                    <option value="medal">🥇 Medal</option>
                                    <option value="certificate">📜 Certificate</option>
                                    <option value="voucher">🎫 Gift Voucher</option>
                                    <option value="merchandise">🎁 Merchandise</option>
                                    <option value="other">📦 Other</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-secondary mb-1 block text-xs">
                                    {prize.type === 'money' ? 'Amount' : 'Quantity'}
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={prize.value}
                                    onChange={(e) => {
                                      const updatedPrizes = [...formData.prizes[key as keyof typeof formData.prizes]];
                                      updatedPrizes[index] = { ...prize, value: parseInt(e.target.value) || 0 };
                                      updateField('prizes', {
                                        ...formData.prizes,
                                        [key]: updatedPrizes
                                      });
                                    }}
                                    className="glass-card w-full rounded-lg px-2 py-1 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none transition-all focus:ring-2 focus:ring-green-500/50 text-sm"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="text-secondary mb-1 block text-xs">Description</label>
                                  <input
                                    type="text"
                                    value={prize.description}
                                    onChange={(e) => {
                                      const updatedPrizes = [...formData.prizes[key as keyof typeof formData.prizes]];
                                      updatedPrizes[index] = { ...prize, description: e.target.value };
                                      updateField('prizes', {
                                        ...formData.prizes,
                                        [key]: updatedPrizes
                                      });
                                    }}
                                    className="glass-card w-full rounded-lg px-2 py-1 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none transition-all focus:ring-2 focus:ring-green-500/50 text-sm"
                                    placeholder={prize.type === 'money' ? 'e.g., Cash Prize' : 'e.g., Gold Trophy'}
                                  />
                                </div>
                                <div className="flex items-end gap-2">
                                  {prize.type === 'money' && (
                                    <div className="flex-1">
                                      <label className="text-secondary mb-1 block text-xs">Currency</label>
                                      <select
                                        value={prize.currency}
                                        onChange={(e) => {
                                          const updatedPrizes = [...formData.prizes[key as keyof typeof formData.prizes]];
                                          updatedPrizes[index] = { ...prize, currency: e.target.value };
                                          updateField('prizes', {
                                            ...formData.prizes,
                                            [key]: updatedPrizes
                                          });
                                        }}
                                        className="glass-card w-full rounded-lg px-2 py-1 text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-green-500/50 text-sm"
                                      >
                                        <option value="INR">₹ INR</option>
                                        <option value="USD">$ USD</option>
                                        <option value="EUR">€ EUR</option>
                                      </select>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedPrizes = formData.prizes[key as keyof typeof formData.prizes].filter((_, i) => i !== index);
                                      updateField('prizes', {
                                        ...formData.prizes,
                                        [key]: updatedPrizes
                                      });
                                    }}
                                    className="text-red-400 hover:text-red-300 p-1 transition-colors"
                                    title="Remove prize"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
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
