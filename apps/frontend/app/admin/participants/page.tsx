'use client';

import { useState } from 'react';
import { useTournaments } from '@/hooks/use-tournaments';
import { useParticipants, useUpdateParticipant } from '@/hooks/use-participants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Input } from '@repo/ui';
import { Badge } from '@repo/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Phone,
  Mail,
  User,
  Filter,
  Download
} from 'lucide-react';

export default function AdminParticipantsPage() {
  const { data: tournaments } = useTournaments();
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const { data: participants, isLoading } = useParticipants(selectedTournament);
  const updateMutation = useUpdateParticipant();

  const filteredParticipants = participants?.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || participant.paymentStatus === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleApproveParticipant = async (participantId: string) => {
    try {
      await updateMutation.mutateAsync({
        id: participantId,
        data: { isApproved: true }
      });
    } catch (error) {
      console.error('Failed to approve participant:', error);
    }
  };

  const handleRejectParticipant = async (participantId: string) => {
    try {
      await updateMutation.mutateAsync({
        id: participantId,
        data: { isApproved: false }
      });
    } catch (error) {
      console.error('Failed to reject participant:', error);
    }
  };

  const handlePaymentStatusChange = async (participantId: string, status: 'pending' | 'paid') => {
    try {
      await updateMutation.mutateAsync({
        id: participantId,
        data: { paymentStatus: status }
      });
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getApprovalBadge = (isApproved: boolean) => {
    if (isApproved) {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  };

  const exportToCSV = () => {
    if (!filteredParticipants.length) return;

    const headers = [
      'Name', 'Phone', 'Email', 'Age', 'Gender', 'Partner Name', 'Partner Phone',
      'Payment Status', 'Approved', 'Registered At'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredParticipants.map(participant => [
        participant.name,
        participant.phone,
        participant.email || '',
        participant.age,
        participant.gender || '',
        participant.partnerName || '',
        participant.partnerPhone || '',
        participant.paymentStatus,
        participant.isApproved ? 'Yes' : 'No',
        new Date(participant.registeredAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants-${selectedTournament}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary rounded-lg">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Manage Participants</h1>
                <p className="text-sm text-gray-500">Approve registrations and manage participants</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!filteredParticipants.length}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tournament</label>
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments?.map((tournament) => (
                      <SelectItem key={tournament._id} value={tournament._id || ''}>
                        {tournament.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Payment Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants List */}
        <Card>
          <CardHeader>
            <CardTitle>Participants ({filteredParticipants.length})</CardTitle>
            <CardDescription>
              Manage participant registrations and approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredParticipants.length > 0 ? (
              <div className="space-y-4">
                {filteredParticipants.map((participant) => (
                  <div key={participant._id} className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{participant.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {participant.phone}
                            </div>
                            {participant.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {participant.email}
                              </div>
                            )}
                            <div>Age: {participant.age}</div>
                            {participant.gender && <div>Gender: {participant.gender}</div>}
                          </div>
                          {participant.partnerName && (
                            <div className="text-sm text-gray-600 mt-1">
                              Partner: {participant.partnerName} ({participant.partnerPhone})
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(participant.paymentStatus)}
                          {getApprovalBadge(participant.isApproved)}
                        </div>

                        <div className="flex items-center space-x-2">
                          {!participant.isApproved && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveParticipant(participant._id!)}
                                disabled={updateMutation.isPending}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectParticipant(participant._id!)}
                                disabled={updateMutation.isPending}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}

                          <Select
                            value={participant.paymentStatus}
                            onValueChange={(value) => handlePaymentStatusChange(participant._id!, value as 'pending' | 'paid')}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
                <p className="text-gray-500">
                  {selectedTournament ? 'No participants match your filters.' : 'Select a tournament to view participants.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
