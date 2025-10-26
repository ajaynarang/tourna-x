'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RefreshCw, Shield, Target, Trophy, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { toast } from 'sonner';

export default function FeatureFlagsPage() {
  const { user } = useAuth();
  const { flags, refetch } = useFeatureFlags();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local state for form
  const [practiceMatches, setPracticeMatches] = useState({
    enabled: true,
    playerEnabled: true,
    adminEnabled: true,
    statsEnabled: true,
  });

  const [tournaments, setTournaments] = useState({
    enabled: true,
    playerEnabled: true,
    adminEnabled: true,
    statsEnabled: true,
  });

  // Load flags into local state when they change
  useEffect(() => {
    if (flags) {
      setPracticeMatches(flags.practiceMatches);
      setTournaments(flags.tournaments);
    }
  }, [flags]);

  const handleSave = async () => {
    if (!user?._id) {
      toast.error('You must be logged in to update feature flags');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          updates: {
            practiceMatches,
            tournaments,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Feature flags updated successfully');
        await refetch();
      } else {
        toast.error(data.error || 'Failed to update feature flags');
      }
    } catch (error) {
      console.error('Error updating feature flags:', error);
      toast.error('Failed to update feature flags');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (flags) {
      setPracticeMatches(flags.practiceMatches);
      setTournaments(flags.tournaments);
      toast.info('Changes reset');
    }
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 p-3">
            <Settings className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">Feature Flags</h1>
            <p className="text-tertiary">
              Control feature visibility for players and admins
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="glass-card flex items-center gap-2 px-4 py-2 transition-all hover:scale-105 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin text-green-400" />
          ) : (
            <Save className="h-4 w-4 text-green-400" />
          )}
          <span className="text-sm font-medium text-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </span>
        </button>

        <button
          onClick={handleReset}
          disabled={saving}
          className="glass-card flex items-center gap-2 px-4 py-2 transition-all hover:scale-105 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-primary">Reset</span>
        </button>
      </motion.div>

      {/* Practice Matches Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card space-y-6 p-6"
      >
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-2">
            <Target className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Practice Matches</h2>
            <p className="text-sm text-tertiary">
              Control access to practice matches and related stats
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Global Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-primary">Enable Practice Matches</p>
              <p className="text-sm text-tertiary">
                Master toggle for entire practice matches feature
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={practiceMatches.enabled}
                onChange={(e) =>
                  setPracticeMatches({ ...practiceMatches, enabled: e.target.checked })
                }
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500"></div>
            </label>
          </div>

          {/* Player Access */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-primary">Player Access</p>
              <p className="text-sm text-tertiary">
                Allow players to create and view practice matches
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={practiceMatches.playerEnabled}
                onChange={(e) =>
                  setPracticeMatches({
                    ...practiceMatches,
                    playerEnabled: e.target.checked,
                  })
                }
                disabled={!practiceMatches.enabled}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500"></div>
            </label>
          </div>

          {/* Admin Access */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-primary">Admin Access</p>
              <p className="text-sm text-tertiary">
                Allow admins to view and manage practice matches
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={practiceMatches.adminEnabled}
                onChange={(e) =>
                  setPracticeMatches({
                    ...practiceMatches,
                    adminEnabled: e.target.checked,
                  })
                }
                disabled={!practiceMatches.enabled}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500"></div>
            </label>
          </div>

          {/* Stats Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-yellow-400" />
              <div>
                <p className="font-medium text-primary">Practice Stats</p>
                <p className="text-sm text-tertiary">
                  Show practice match statistics and analytics
                </p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={practiceMatches.statsEnabled}
                onChange={(e) =>
                  setPracticeMatches({
                    ...practiceMatches,
                    statsEnabled: e.target.checked,
                  })
                }
                disabled={!practiceMatches.enabled}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-yellow-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-500"></div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Tournaments Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card space-y-6 p-6"
      >
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 p-2">
            <Trophy className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Tournaments</h2>
            <p className="text-sm text-tertiary">
              Control access to tournaments and related stats
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Global Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-primary">Enable Tournaments</p>
              <p className="text-sm text-tertiary">
                Master toggle for entire tournaments feature
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={tournaments.enabled}
                onChange={(e) =>
                  setTournaments({ ...tournaments, enabled: e.target.checked })
                }
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500"></div>
            </label>
          </div>

          {/* Player Access */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-primary">Player Access</p>
              <p className="text-sm text-tertiary">
                Allow players to browse and register for tournaments
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={tournaments.playerEnabled}
                onChange={(e) =>
                  setTournaments({
                    ...tournaments,
                    playerEnabled: e.target.checked,
                  })
                }
                disabled={!tournaments.enabled}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500"></div>
            </label>
          </div>

          {/* Admin Access */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-primary">Admin Access</p>
              <p className="text-sm text-tertiary">
                Allow admins to create and manage tournaments
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={tournaments.adminEnabled}
                onChange={(e) =>
                  setTournaments({
                    ...tournaments,
                    adminEnabled: e.target.checked,
                  })
                }
                disabled={!tournaments.enabled}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500"></div>
            </label>
          </div>

          {/* Stats Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-yellow-400" />
              <div>
                <p className="font-medium text-primary">Tournament Stats</p>
                <p className="text-sm text-tertiary">
                  Show tournament statistics and analytics
                </p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={tournaments.statsEnabled}
                onChange={(e) =>
                  setTournaments({
                    ...tournaments,
                    statsEnabled: e.target.checked,
                  })
                }
                disabled={!tournaments.enabled}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-yellow-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-500"></div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card flex items-start gap-3 p-4"
      >
        <Shield className="h-5 w-5 flex-shrink-0 text-blue-400" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">
            About Feature Flags
          </p>
          <p className="text-sm text-tertiary">
            Feature flags allow you to control which features are visible to players
            and admins. When a feature is disabled globally, it will be hidden from
            all users. Role-specific toggles allow fine-grained control over who can
            access each feature. Stats toggles control whether statistics for that
            feature are displayed.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

