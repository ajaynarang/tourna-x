'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';
import { AuthGuard } from '@/components/auth-guard';
import { usePageTitle } from '@/hooks/use-page-title';
import { CheckCircle, XCircle, Clock, User, Mail, Phone, Building, Loader2 } from 'lucide-react';

interface AdminRequest {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  society?: string;
  block?: string;
  flatNumber?: string;
  adminRequestedAt: string;
  createdAt: string;
}

export default function AdminRequestsPage() {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <AdminRequestsContent />
    </AuthGuard>
  );
}

function AdminRequestsContent() {
  usePageTitle();
  
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/admin-requests');
      const data = await response.json();

      if (data.success) {
        setRequests(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch admin requests');
      }
    } catch (err) {
      setError('Failed to fetch admin requests');
      console.error('Error fetching admin requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      setProcessingId(requestId);
      setError('');

      const response = await fetch(`/api/admin/admin-requests/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove the processed request from the list
        setRequests((prev) => prev.filter((req) => req._id !== requestId));
      } else {
        setError(data.error || `Failed to ${action} request`);
      }
    } catch (err) {
      setError(`Failed to ${action} request`);
      console.error(`Error ${action}ing request:`, err);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Requests
          </CardTitle>
          <CardDescription>
            {requests.length} {requests.length === 1 ? 'request' : 'requests'} waiting for review
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              All Caught Up!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are no pending admin access requests at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {request.name}
                          </h3>
                          <Badge variant="outline" className="mt-1">
                            Requested{' '}
                            {new Date(request.adminRequestedAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="h-4 w-4" />
                        <span>{request.phone}</span>
                      </div>
                      {request.email && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4" />
                          <span>{request.email}</span>
                        </div>
                      )}
                      {request.society && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Building className="h-4 w-4" />
                          <span>
                            {request.society}
                            {request.block && `, ${request.block}`}
                            {request.flatNumber && ` - ${request.flatNumber}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Member Since */}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Member since {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleAction(request._id, 'approve')}
                      disabled={processingId === request._id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingId === request._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleAction(request._id, 'deny')}
                      disabled={processingId === request._id}
                      variant="destructive"
                    >
                      {processingId === request._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Deny
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

