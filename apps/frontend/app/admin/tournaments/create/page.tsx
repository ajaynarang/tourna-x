'use client';

import { useState } from 'react';
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

const initialFormData: TournamentFormData = {
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
};

export default function CreateTournamentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<TournamentFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'draft',
          isPublished: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/admin/tournaments/${result.data._id}/participants`);
      } else {
        setError(result.error || 'Failed to create tournament');
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

  return (
    <div className="relative z-10 min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl"
      >
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/tournaments"
            className="text-tertiary hover:text-primary mb-4 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tournaments
          </Link>
          <h1 className="text-primary text-3xl font-bold">Create Tournament</h1>
          <p className="text-muted-foreground mt-2">Set up a new badminton or tennis tournament</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-500/10 p-4 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
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
                    className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                    required
                  >
                    <option value="badminton">Badminton</option>
                    <option value="tennis">Tennis</option>
                  </select>
                </div>

                <div>
                  <label className="text-primary mb-2 block text-sm font-medium">
                    Format <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.format}
                    onChange={(e) => updateField('format', e.target.value as 'knockout' | 'round_robin')}
                    className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-green-500/50"
                    required
                  >
                    <option value="knockout">Knockout</option>
                    <option value="round_robin">Round Robin</option>
                  </select>
                </div>
              </div>

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

          {/* Dates & Registration */}
          <div className="glass-card-intense p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Dates & Registration</h2>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <FormField
                label="Registration Deadline"
                type="date"
                required
                value={formData.registrationDeadline}
                onChange={(e) => updateField('registrationDeadline', e.target.value)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Max Participants"
                  type="number"
                  required
                  value={formData.maxParticipants}
                  onChange={(e) => updateField('maxParticipants', parseInt(e.target.value) || 0)}
                  min="2"
                />

                <FormField
                  label="Entry Fee (₹)"
                  type="number"
                  required
                  value={formData.entryFee}
                  onChange={(e) => updateField('entryFee', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="glass-card-intense p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-primary text-xl font-semibold">Categories</h2>
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
                          : 'glass-card text-muted-foreground hover:text-primary'
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
                          : 'glass-card text-muted-foreground hover:text-primary'
                      }`}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </button>
                  ))}
                </div>
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
              <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="text-primary mb-2 block text-sm font-medium">
                  Entry Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.entryFee}
                  onChange={(e) => updateField('entryFee', parseInt(e.target.value) || 0)}
                  className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-primary mb-2 block text-sm font-medium">
                  Max Participants *
                </label>
                <input
                  type="number"
                  min="2"
                  max="1000"
                  value={formData.maxParticipants}
                  onChange={(e) => updateField('maxParticipants', parseInt(e.target.value) || 32)}
                  className="glass-card w-full rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
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
                      <div className="text-muted-foreground text-center py-4 text-sm">
                        No prizes added yet. Click "Add Prize" to get started.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.prizes[key as keyof typeof formData.prizes].map((prize, index) => (
                          <div key={index} className="glass-card rounded-lg p-3">
                            <div className="grid gap-3 sm:grid-cols-4">
                              <div>
                                <label className="text-muted-foreground mb-1 block text-xs">Prize Type</label>
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
                                <label className="text-muted-foreground mb-1 block text-xs">
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
                                <label className="text-muted-foreground mb-1 block text-xs">Description</label>
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
                                    <label className="text-muted-foreground mb-1 block text-xs">Currency</label>
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

          {/* Submit */}
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
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Create Tournament
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
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
  value: string | number;
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
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        className="glass-card w-full rounded-lg px-4 py-3 text-primary outline-none transition-all focus:ring-2 focus:ring-green-500/50"
      />
    </div>
  );
}
