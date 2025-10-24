'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Phone,
  Mail,
  Home,
  DollarSign,
  Trophy,
  User,
  UserPlus,
  AlertCircle,
  Eye,
  MoreVertical,
  Download,
  Send
} from 'lucide-react';
import Link from 'next/link';

interface Participant {
  _id: string;
  tournamentId: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  age: number;
  gender: string;
  society: string;
  block?: string;
  flatNumber?: string;
  category: string;
  ageGroup?: string;
  partnerName?: string;
  partnerPhone?: string;
  partnerAge?: number;
  partnerGender?: string;
  paymentStatus: string;
  paymentMethod?: string;
  transactionId?: string;
  isApproved: boolean;
  isEligible: boolean;
  rejectionReason?: string;
  registeredAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  entryFee: number;
  maxParticipants: number;
  participantCount: number;
  status: string;
}

export default function ParticipantManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tournamentId, setTournamentId] = useState<string>('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
    filterParticipants();
  }, [participants, searchTerm, statusFilter, categoryFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tournament details
      const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`);
      const tournamentResult = await tournamentResponse.json();
      
      if (tournamentResult.success) {
        setTournament(tournamentResult.data);
      }

      // Fetch participants
      const participantsResponse = await fetch(`/api/participants?tournamentId=${tournamentId}`);
      const participantsResult = await participantsResponse.json();
      
      if (participantsResult.success) {
        setParticipants(participantsResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterParticipants = () => {
    let filtered = participants;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(participant =>
        participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.phone.includes(searchTerm) ||
        participant.partnerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filtered = filtered.filter(p => !p.isApproved && !p.rejectionReason);
      } else if (statusFilter === 'approved') {
        filtered = filtered.filter(p => p.isApproved);
      } else if (statusFilter === 'rejected') {
        filtered = filtered.filter(p => !p.isApproved && p.rejectionReason);
      }
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    setFilteredParticipants(filtered);
  };

  const handleApprove = async (participantId: string) => {
    try {
      const response = await fetch(`/api/participants/${participantId}/approve`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error approving participant:', error);
    }
  };

  const handleReject = async (participantId: string, reason: string) => {
    try {
      const response = await fetch(`/api/participants/${participantId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();
      
      if (result.success) {
        fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error rejecting participant:', error);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedParticipants.length === 0) return;
    
    setIsProcessing(true);
    try {
      const promises = selectedParticipants.map(id => 
        fetch(`/api/participants/${id}/approve`, { method: 'POST' })
      );
      
      await Promise.all(promises);
      setSelectedParticipants([]);
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error bulk approving participants:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async (reason: string) => {
    if (selectedParticipants.length === 0) return;
    
    setIsProcessing(true);
    try {
      const promises = selectedParticipants.map(id => 
        fetch(`/api/participants/${id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        })
      );
      
      await Promise.all(promises);
      setSelectedParticipants([]);
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error bulk rejecting participants:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleParticipantSelection = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const getStatusBadge = (participant: Participant) => {
    if (participant.isApproved) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    } else if (participant.rejectionReason) {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {paymentStatus}
      </Badge>
    );
  };

  const getStats = () => {
    const total = participants.length;
    const approved = participants.filter(p => p.isApproved).length;
    const pending = participants.filter(p => !p.isApproved && !p.rejectionReason).length;
    const rejected = participants.filter(p => !p.isApproved && p.rejectionReason).length;
    
    return { total, approved, pending, rejected };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tournament Not Found</h2>
          <p className="text-gray-600 mb-6">The tournament you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/admin/tournaments">Back to Tournaments</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Participant Management
              </h1>
              <p className="text-gray-600">
                {tournament.name} - Manage registrations and approvals
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
                <option value="mixed">Mixed</option>
              </select>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedParticipants.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedParticipants.length} participant(s) selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleBulkApprove}
                      disabled={isProcessing}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve All
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) handleBulkReject(reason);
                      }}
                      disabled={isProcessing}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Participants List */}
        {filteredParticipants.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'No participants found' 
                  : 'No participants yet'
                }
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Participants will appear here once they register'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredParticipants.map((participant) => (
              <Card key={participant._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(participant._id)}
                          onChange={() => toggleParticipantSelection(participant._id)}
                          className="rounded"
                        />
                        <h3 className="text-lg font-semibold">{participant.name}</h3>
                        {getStatusBadge(participant)}
                        {getPaymentBadge(participant.paymentStatus)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {participant.phone}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {participant.age} years, {participant.gender}
                        </div>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-2" />
                          {participant.society}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 mr-2" />
                          {participant.category} {participant.ageGroup && `(${participant.ageGroup})`}
                        </div>
                        {participant.partnerName && (
                          <div className="flex items-center">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Partner: {participant.partnerName}
                          </div>
                        )}
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          {participant.paymentMethod} {participant.transactionId && `(${participant.transactionId})`}
                        </div>
                      </div>
                      
                      {participant.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700">
                            <strong>Rejection Reason:</strong> {participant.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!participant.isApproved && !participant.rejectionReason && (
                        <>
                          <Button
                            onClick={() => handleApprove(participant._id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) handleReject(participant._id, reason);
                            }}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
