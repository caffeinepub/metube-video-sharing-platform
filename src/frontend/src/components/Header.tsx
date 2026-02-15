import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, Menu, LogIn, LogOut, Crown } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { SubscriptionStatus } from '../backend';
import type { Page } from '../App';
import InternetIdentityHelpDialog from './InternetIdentityHelpDialog';

interface HeaderProps {
  currentPage: Page;
  onNavigateHome: () => void;
  onNavigateUpload: () => void;
  onNavigateSubscription: () => void;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  searchQuery: string;
  onSidebarToggle: () => void;
}

export default function Header({
  currentPage,
  onNavigateHome,
  onNavigateUpload,
  onNavigateSubscription,
  onSearch,
  onClearSearch,
  searchQuery,
  onSidebarToggle,
}: HeaderProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const hasActiveSubscription = userProfile?.subscriptionStatus === SubscriptionStatus.active;

  const handleAuthClick = () => {
    if (isAuthenticated) {
      handleLogout();
    } else {
      setShowHelpDialog(true);
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleContinueToLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmedQuery = localSearchQuery.trim();
    if (trimmedQuery === '') {
      onClearSearch();
    } else {
      onSearch(trimmedQuery);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onSidebarToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <img
                src="/assets/generated/metube-xyz-logo.dim_200x80.png"
                alt="metube.xyz"
                className="h-8"
              />
            </button>
          </div>

          <form
            onSubmit={handleSearch}
            className="hidden flex-1 max-w-2xl mx-8 md:flex"
          >
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search videos..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                {hasActiveSubscription ? (
                  <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
                    <img 
                      src="/assets/generated/premium-crown.dim_32x32.png" 
                      alt="Premium" 
                      className="h-4 w-4"
                    />
                    Premium
                  </Badge>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onNavigateSubscription}
                    className="hidden sm:flex"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Subscribe
                  </Button>
                )}
                
                {hasActiveSubscription && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNavigateUpload}
                    className="hidden sm:flex"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                )}
              </>
            )}

            <Button
              onClick={handleAuthClick}
              disabled={disabled}
              size="sm"
              variant={isAuthenticated ? 'outline' : 'default'}
            >
              {loginStatus === 'logging-in' ? (
                'Logging in...'
              ) : isAuthenticated ? (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <InternetIdentityHelpDialog
        open={showHelpDialog}
        onOpenChange={setShowHelpDialog}
        onContinue={handleContinueToLogin}
      />
    </>
  );
}
