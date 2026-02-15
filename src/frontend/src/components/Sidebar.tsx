import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Home, Upload, Crown, ListVideo, Clapperboard, User, Sparkles, Compass } from 'lucide-react';
import { SubscriptionStatus } from '../backend';
import type { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  onNavigateHome: () => void;
  onNavigateUpload: () => void;
  onNavigateSubscription: () => void;
  onNavigateToPlaylists: () => void;
  onNavigateToCreatorStudio: () => void;
  onNavigateToAiStudio: () => void;
  onNavigateToYourChannel: () => void;
  onNavigateDiscover: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  currentPage,
  onNavigateHome,
  onNavigateUpload,
  onNavigateSubscription,
  onNavigateToPlaylists,
  onNavigateToCreatorStudio,
  onNavigateToAiStudio,
  onNavigateToYourChannel,
  onNavigateDiscover,
  isOpen,
  onClose,
}: SidebarProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const isAuthenticated = !!identity;
  const hasActiveSubscription = userProfile?.subscriptionStatus === SubscriptionStatus.active;

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      onClick: onNavigateHome,
      show: true,
      active: currentPage === 'home',
    },
    {
      label: 'Discover',
      icon: Compass,
      onClick: onNavigateDiscover,
      show: true,
      active: currentPage === 'discover',
    },
    {
      label: 'Subscriptions',
      icon: Crown,
      onClick: onNavigateSubscription,
      show: true,
      active: currentPage === 'subscription',
    },
    {
      label: 'Creator Studio',
      icon: Clapperboard,
      onClick: onNavigateToCreatorStudio,
      show: isAuthenticated,
      active: currentPage === 'creator-studio',
    },
    {
      label: 'MeTube AI Studios',
      icon: Sparkles,
      onClick: onNavigateToAiStudio,
      show: isAuthenticated,
      active: currentPage === 'ai-studio',
    },
    {
      label: 'Upload',
      icon: Upload,
      onClick: onNavigateUpload,
      show: isAuthenticated && hasActiveSubscription,
      active: currentPage === 'upload',
    },
    {
      label: 'Playlists',
      icon: ListVideo,
      onClick: onNavigateToPlaylists,
      show: isAuthenticated,
      active: currentPage === 'playlists' || currentPage === 'playlist-detail',
    },
    {
      label: 'Your Channel',
      icon: User,
      onClick: onNavigateToYourChannel,
      show: isAuthenticated,
      active: currentPage === 'channel',
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border/40 bg-background transition-transform duration-300 md:sticky md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-1 p-4">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <Button
                key={item.label}
                variant={item.active ? 'secondary' : 'ghost'}
                className="justify-start"
                onClick={item.onClick}
              >
                <item.icon className="mr-2 h-5 w-5" />
                {item.label}
              </Button>
            ))}
        </nav>
      </aside>
    </>
  );
}
