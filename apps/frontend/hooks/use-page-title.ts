import { usePathname } from 'next/navigation';

export function usePageTitle(): { title: string; subtitle?: string } {
  const pathname = usePathname();

  // Admin routes
  if (pathname === '/admin/dashboard') {
    return { title: 'Dashboard', subtitle: 'Tournament management overview' };
  }
  if (pathname === '/admin/tournaments') {
    return { title: 'Tournaments', subtitle: 'Manage all tournaments' };
  }
  if (pathname === '/admin/tournaments/create') {
    return { title: 'Create Tournament', subtitle: 'Set up a new tournament' };
  }
  if (pathname?.startsWith('/admin/tournaments/') && pathname.endsWith('/participants')) {
    return { title: 'Participants', subtitle: 'Manage tournament participants' };
  }
  if (pathname?.startsWith('/admin/tournaments/') && pathname.endsWith('/fixtures')) {
    return { title: 'Fixtures', subtitle: 'Tournament schedule and matches' };
  }
  if (pathname?.startsWith('/admin/tournaments/') && pathname.endsWith('/schedule')) {
    return { title: 'Schedule', subtitle: 'Tournament fixture scheduling' };
  }
  if (pathname?.startsWith('/admin/tournaments/') && pathname.endsWith('/history')) {
    return { title: 'History', subtitle: 'Tournament match history' };
  }
  if (pathname === '/admin/participants') {
    return { title: 'Participants', subtitle: 'Manage all participants' };
  }
  if (pathname === '/admin/fixtures') {
    return { title: 'Fixtures', subtitle: 'View all matches and schedules' };
  }
  if (pathname === '/admin/scoring') {
    return { title: 'Scoring', subtitle: 'Live match scoring' };
  }
  if (pathname?.startsWith('/admin/scoring/')) {
    return { title: 'Match Scoring', subtitle: 'Update match scores' };
  }
  if (pathname === '/admin/analytics') {
    return { title: 'Analytics', subtitle: 'Tournament insights and reports' };
  }

  // Player routes
  if (pathname === '/player/dashboard') {
    return { title: 'Dashboard', subtitle: 'Your tournament overview' };
  }
  if (pathname === '/player/matches') {
    return { title: 'My Matches', subtitle: 'Your upcoming and past matches' };
  }
  if (pathname === '/player/profile') {
    return { title: 'My Profile', subtitle: 'Manage your player profile' };
  }

  // Common routes
  if (pathname === '/tournaments') {
    return { title: 'Tournaments', subtitle: 'Browse available tournaments' };
  }
  if (pathname?.startsWith('/tournaments/') && pathname.endsWith('/register')) {
    return { title: 'Register', subtitle: 'Join this tournament' };
  }
  if (pathname === '/profile') {
    return { title: 'Profile', subtitle: 'Your account settings' };
  }
  if (pathname === '/notifications') {
    return { title: 'Notifications', subtitle: 'Your recent notifications' };
  }

  return { title: '' };
}

