'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { Loader2 } from 'lucide-react';

export default function TournamentParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <TournamentParticipantsRedirect params={params} />
    </AuthGuard>
  );
}

function TournamentParticipantsRedirect({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  useEffect(() => {
    const redirectToMainParticipants = async () => {
      const { id } = await params;
      // Redirect to main participants page with tournament pre-selected
      router.replace(`/admin/participants?tournament=${id}`);
    };

    redirectToMainParticipants();
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to participants management...</p>
      </div>
    </div>
  );
}