'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateTournament } from '@/hooks/use-tournaments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Input } from '@repo/ui';
import { Label } from '@repo/ui';
import { Textarea } from '@repo/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';
import { Trophy, Calendar, MapPin, DollarSign, Users, Award, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FormData {
  name: string;
  sport: 'badminton' | 'tennis';
  category: 'singles' | 'doubles' | 'mixed';
  format: 'knockout' | 'round_robin';
  startDate: string;
  endDate: string;
  venue: string;
  entryFee: string;
  maxParticipants: string;
  rules: string;
  prizeWinner: string;
  prizeRunnerUp: string;
  prizeSemiFinalist: string;
}

export default function CreateTournamentPage() {
  const router = useRouter();
  const createMutation = useCreateTournament();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    sport: 'badminton',
    category: 'singles',
    format: 'knockout',
    startDate: new Date().toISOString().split('T')[0] || '',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    venue: '',
    entryFee: '0',
    maxParticipants: '64',
    rules: '',
    prizeWinner: '0',
    prizeRunnerUp: '0',
    prizeSemiFinalist: '0',
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const tournamentData = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        entryFee: parseFloat(formData.entryFee),
        maxParticipants: parseInt(formData.maxParticipants),
        prizeWinner: parseFloat(formData.prizeWinner),
        prizeRunnerUp: parseFloat(formData.prizeRunnerUp),
        prizeSemiFinalist: parseFloat(formData.prizeSemiFinalist),
        createdBy: 'admin', // This should come from auth context
        status: 'draft' as const,
        categories: [formData.category],
        location: formData.venue,
        prizes: {
          winner: parseFloat(formData.prizeWinner),
          runnerUp: parseFloat(formData.prizeRunnerUp),
          semiFinalist: parseFloat(formData.prizeSemiFinalist),
        },
        tournamentType: 'open' as const,
        isPublished: false,
      };

      await createMutation.mutateAsync(tournamentData);
      router.push('/admin/tournaments');
    } catch (err) {
      setError('Failed to create tournament. Please try again.');
    }
  };

  const getSportIcon = (sport: string) => {
    return sport === 'badminton' ? '🏸' : '🎾';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/tournaments">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tournaments
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary rounded-lg">
                  <Trophy className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Create Tournament</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Set up the basic details for your tournament
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Summer Badminton Championship"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sport">Sport *</Label>
                  <Select value={formData.sport} onValueChange={(value) => handleInputChange('sport', value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="badminton">
                        <div className="flex items-center gap-2">
                          <span>🏸</span>
                          <span>Badminton</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="tennis">
                        <div className="flex items-center gap-2">
                          <span>🎾</span>
                          <span>Tennis</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="singles">Singles</SelectItem>
                      <SelectItem value="doubles">Doubles</SelectItem>
                      <SelectItem value="mixed">Mixed Doubles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Format *</Label>
                  <Select value={formData.format} onValueChange={(value) => handleInputChange('format', value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="knockout">Knockout</SelectItem>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Venue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule & Venue
              </CardTitle>
              <CardDescription>
                Set the tournament dates and location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="venue">Venue *</Label>
                  <Input
                    id="venue"
                    placeholder="e.g., Sports Complex, Court 1-4"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration & Fees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Registration & Fees
              </CardTitle>
              <CardDescription>
                Configure participant limits and entry fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Max Participants *</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    min="2"
                    max="1000"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryFee">Entry Fee (₹) *</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.entryFee}
                    onChange={(e) => handleInputChange('entryFee', e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prizes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Prize Money
              </CardTitle>
              <CardDescription>
                Set prize amounts for winners (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="prizeWinner">Winner (₹)</Label>
                  <Input
                    id="prizeWinner"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prizeWinner}
                    onChange={(e) => handleInputChange('prizeWinner', e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prizeRunnerUp">Runner-up (₹)</Label>
                  <Input
                    id="prizeRunnerUp"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prizeRunnerUp}
                    onChange={(e) => handleInputChange('prizeRunnerUp', e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prizeSemiFinalist">Semi-finalist (₹)</Label>
                  <Input
                    id="prizeSemiFinalist"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prizeSemiFinalist}
                    onChange={(e) => handleInputChange('prizeSemiFinalist', e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Rules</CardTitle>
              <CardDescription>
                Add any specific rules or guidelines for participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="rules">Rules & Guidelines</Label>
                <Textarea
                  id="rules"
                  placeholder="e.g., Standard rules apply. Bring your own equipment. No late entries..."
                  value={formData.rules}
                  onChange={(e) => handleInputChange('rules', e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" asChild>
              <Link href="/admin/tournaments">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-12 px-8"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Tournament'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
