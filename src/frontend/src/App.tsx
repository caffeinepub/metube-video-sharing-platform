import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsStripeConfigured, useIsCallerAdmin } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import AppShell from './components/AppShell';
import ProfileSetupModal from './components/ProfileSetupModal';
import StripeSetupModal from './components/StripeSetupModal';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import SubscriptionPage from './pages/SubscriptionPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import DownloadPaymentSuccessPage from './pages/DownloadPaymentSuccessPage';
import DownloadPaymentFailurePage from './pages/DownloadPaymentFailurePage';
import ChannelPage from './pages/ChannelPage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import CreatorStudioPage from './pages/CreatorStudioPage';
import VideoEditPage from './pages/VideoEditPage';
import AiStudioPage from './pages/AiStudioPage';
import AiGenerationPaymentSuccessPage from './pages/AiGenerationPaymentSuccessPage';
import AiGenerationPaymentCancelPage from './pages/AiGenerationPaymentCancelPage';
import DiscoverPage from './pages/DiscoverPage';
import AiChatRoomPage from './pages/AiChatRoomPage';
import YouTubeMePage from './pages/YouTubeMePage';
import { useState, useEffect } from 'react';
import type { GeneratedVideo } from './utils/aiVideoGenerator';

export type Page = 'home' | 'upload' | 'video' | 'subscription' | 'payment-success' | 'payment-failure' | 'download-payment-success' | 'download-payment-failure' | 'channel' | 'playlists' | 'playlist-detail' | 'creator-studio' | 'video-edit' | 'ai-studio' | 'ai-generation-success' | 'ai-generation-cancel' | 'discover' | 'ai-chat-room' | 'youtubeme';

export interface AppState {
  currentPage: Page;
  selectedVideoId: bigint | null;
  sessionId: string | null;
  selectedChannelOwner: string | null;
  selectedPlaylistId: bigint | null;
  searchQuery: string;
  searchMode: boolean;
  generatedVideo: GeneratedVideo | null;
  uploadMetadata: { title: string; description: string; tags: string[] } | null;
}

export default function App() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const { data: isStripeConfigured, isLoading: stripeConfigLoading } = useIsStripeConfigured();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  const [appState, setAppState] = useState<AppState>({
    currentPage: 'home',
    selectedVideoId: null,
    sessionId: null,
    selectedChannelOwner: null,
    selectedPlaylistId: null,
    searchQuery: '',
    searchMode: false,
    generatedVideo: null,
    uploadMetadata: null,
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handle URL-based routing for payment callbacks
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    if (path === '/payment-success') {
      const sessionId = params.get('session_id');
      setAppState(prev => ({ ...prev, currentPage: 'payment-success', selectedVideoId: null, sessionId }));
    } else if (path === '/payment-failure') {
      setAppState(prev => ({ ...prev, currentPage: 'payment-failure', selectedVideoId: null, sessionId: null }));
    } else if (path === '/download-payment-success') {
      const sessionId = params.get('session_id');
      const videoIdStr = params.get('video_id');
      const videoId = videoIdStr ? BigInt(videoIdStr) : null;
      setAppState(prev => ({ ...prev, currentPage: 'download-payment-success', selectedVideoId: videoId, sessionId }));
    } else if (path === '/download-payment-failure') {
      const videoIdStr = params.get('video_id');
      const videoId = videoIdStr ? BigInt(videoIdStr) : null;
      setAppState(prev => ({ ...prev, currentPage: 'download-payment-failure', selectedVideoId: videoId, sessionId: null }));
    } else if (path === '/ai-generation-success') {
      const sessionId = params.get('session_id');
      setAppState(prev => ({ ...prev, currentPage: 'ai-generation-success', sessionId }));
    } else if (path === '/ai-generation-cancel') {
      setAppState(prev => ({ ...prev, currentPage: 'ai-generation-cancel', sessionId: null }));
    }
  }, []);

  // Set document title dynamically
  useEffect(() => {
    document.title = 'metube.xyz - Video Sharing Platform';
  }, []);

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setAppState({
      currentPage: 'home',
      selectedVideoId: null,
      sessionId: null,
      selectedChannelOwner: null,
      selectedPlaylistId: null,
      searchQuery: '',
      searchMode: false,
      generatedVideo: null,
      uploadMetadata: null,
    });
    setSidebarOpen(false);
  };

  const navigateToUpload = (generatedVideo?: GeneratedVideo, metadata?: { title: string; description: string; tags: string[] }) => {
    setAppState(prev => ({ 
      ...prev, 
      currentPage: 'upload', 
      selectedVideoId: null, 
      sessionId: null,
      generatedVideo: generatedVideo || null,
      uploadMetadata: metadata || null,
    }));
    setSidebarOpen(false);
  };

  const navigateToVideo = (videoId: bigint) => {
    setAppState(prev => ({ ...prev, currentPage: 'video', selectedVideoId: videoId, sessionId: null }));
    setSidebarOpen(false);
  };

  const navigateToSubscription = () => {
    setAppState(prev => ({ ...prev, currentPage: 'subscription', selectedVideoId: null, sessionId: null }));
    setSidebarOpen(false);
  };

  const navigateToChannel = (ownerPrincipal: string) => {
    setAppState(prev => ({ ...prev, currentPage: 'channel', selectedChannelOwner: ownerPrincipal, selectedVideoId: null }));
    setSidebarOpen(false);
  };

  const navigateToYourChannel = () => {
    if (identity) {
      const ownerPrincipal = identity.getPrincipal().toString();
      navigateToChannel(ownerPrincipal);
    }
  };

  const navigateToPlaylists = () => {
    setAppState(prev => ({ ...prev, currentPage: 'playlists', selectedVideoId: null, selectedPlaylistId: null }));
    setSidebarOpen(false);
  };

  const navigateToPlaylistDetail = (playlistId: bigint) => {
    setAppState(prev => ({ ...prev, currentPage: 'playlist-detail', selectedPlaylistId: playlistId, selectedVideoId: null }));
    setSidebarOpen(false);
  };

  const navigateToCreatorStudio = () => {
    setAppState(prev => ({ ...prev, currentPage: 'creator-studio', selectedVideoId: null }));
    setSidebarOpen(false);
  };

  const navigateToVideoEdit = (videoId: bigint) => {
    setAppState(prev => ({ ...prev, currentPage: 'video-edit', selectedVideoId: videoId }));
    setSidebarOpen(false);
  };

  const navigateToAiStudio = () => {
    setAppState(prev => ({ ...prev, currentPage: 'ai-studio', selectedVideoId: null }));
    setSidebarOpen(false);
  };

  const navigateDiscover = () => {
    setAppState(prev => ({ ...prev, currentPage: 'discover', selectedVideoId: null }));
    setSidebarOpen(false);
  };

  const navigateToAiChatRoom = () => {
    setAppState(prev => ({ ...prev, currentPage: 'ai-chat-room', selectedVideoId: null }));
    setSidebarOpen(false);
  };

  const navigateToYouTubeMe = () => {
    setAppState(prev => ({ ...prev, currentPage: 'youtubeme', selectedVideoId: null }));
    setSidebarOpen(false);
  };

  const handleSearch = (query: string) => {
    setAppState(prev => ({
      ...prev,
      searchQuery: query,
      searchMode: true,
      currentPage: 'home',
    }));
  };

  const handleClearSearch = () => {
    setAppState(prev => ({
      ...prev,
      searchQuery: '',
      searchMode: false,
    }));
  };

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;
  const showStripeSetup = isAdmin && !stripeConfigLoading && isStripeConfigured === false;

  const renderPage = () => {
    switch (appState.currentPage) {
      case 'home':
        return (
          <HomePage
            onVideoClick={navigateToVideo}
            onChannelClick={navigateToChannel}
            searchQuery={appState.searchQuery}
            searchMode={appState.searchMode}
            onNavigateToAiStudio={navigateToAiStudio}
            onNavigateToAiChatRoom={navigateToAiChatRoom}
          />
        );
      case 'upload':
        return (
          <UploadPage
            onUploadComplete={navigateToHome}
            prefilledVideo={appState.generatedVideo ? { blob: appState.generatedVideo.file, url: appState.generatedVideo.previewUrl } : undefined}
            prefilledMetadata={appState.uploadMetadata || undefined}
          />
        );
      case 'video':
        if (appState.selectedVideoId === null) {
          return <div>Video not found</div>;
        }
        return (
          <VideoPlayerPage
            videoId={appState.selectedVideoId}
            onBackToHome={navigateToHome}
            onChannelClick={navigateToChannel}
          />
        );
      case 'subscription':
        return <SubscriptionPage />;
      case 'payment-success':
        return <PaymentSuccessPage sessionId={appState.sessionId} onNavigateHome={navigateToHome} />;
      case 'payment-failure':
        return <PaymentFailurePage onNavigateHome={navigateToHome} />;
      case 'download-payment-success':
        return (
          <DownloadPaymentSuccessPage
            sessionId={appState.sessionId}
            videoId={appState.selectedVideoId}
            onNavigateToVideo={navigateToVideo}
            onNavigateHome={navigateToHome}
          />
        );
      case 'download-payment-failure':
        return (
          <DownloadPaymentFailurePage
            videoId={appState.selectedVideoId}
            onNavigateToVideo={navigateToVideo}
            onNavigateHome={navigateToHome}
          />
        );
      case 'channel':
        if (appState.selectedChannelOwner === null) {
          return <div>Channel not found</div>;
        }
        return (
          <ChannelPage
            ownerPrincipal={appState.selectedChannelOwner}
            onVideoClick={navigateToVideo}
            onBackToHome={navigateToHome}
          />
        );
      case 'playlists':
        return <PlaylistsPage onPlaylistClick={navigateToPlaylistDetail} onBackToHome={navigateToHome} />;
      case 'playlist-detail':
        if (appState.selectedPlaylistId === null) {
          return <div>Playlist not found</div>;
        }
        return (
          <PlaylistDetailPage
            playlistId={appState.selectedPlaylistId}
            onVideoClick={navigateToVideo}
            onBackToPlaylists={navigateToPlaylists}
          />
        );
      case 'creator-studio':
        return (
          <CreatorStudioPage
            onVideoClick={navigateToVideo}
            onEditVideo={navigateToVideoEdit}
            onBackToHome={navigateToHome}
          />
        );
      case 'video-edit':
        if (appState.selectedVideoId === null) {
          return <div>Video not found</div>;
        }
        return (
          <VideoEditPage
            videoId={appState.selectedVideoId}
            onBackToStudio={navigateToCreatorStudio}
            onBackToHome={navigateToHome}
          />
        );
      case 'ai-studio':
        return <AiStudioPage onNavigateToUpload={navigateToUpload} />;
      case 'ai-generation-success':
        return (
          <AiGenerationPaymentSuccessPage
            sessionId={appState.sessionId}
            onNavigateToAiStudio={navigateToAiStudio}
            onNavigateHome={navigateToHome}
          />
        );
      case 'ai-generation-cancel':
        return <AiGenerationPaymentCancelPage onNavigateToAiStudio={navigateToAiStudio} onNavigateHome={navigateToHome} />;
      case 'discover':
        return (
          <DiscoverPage
            onNavigateToAiStudio={navigateToAiStudio}
            onNavigateToAiChatRoom={navigateToAiChatRoom}
          />
        );
      case 'ai-chat-room':
        return <AiChatRoomPage />;
      case 'youtubeme':
        return <YouTubeMePage />;
      default:
        return (
          <HomePage
            onVideoClick={navigateToVideo}
            onChannelClick={navigateToChannel}
            searchQuery={appState.searchQuery}
            searchMode={appState.searchMode}
            onNavigateToAiStudio={navigateToAiStudio}
            onNavigateToAiChatRoom={navigateToAiChatRoom}
          />
        );
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <AppShell
          currentPage={appState.currentPage}
          onNavigateHome={navigateToHome}
          onNavigateUpload={navigateToUpload}
          onNavigateSubscription={navigateToSubscription}
          onNavigateToPlaylists={navigateToPlaylists}
          onNavigateToCreatorStudio={navigateToCreatorStudio}
          onNavigateToAiStudio={navigateToAiStudio}
          onNavigateToYourChannel={navigateToYourChannel}
          onNavigateDiscover={navigateDiscover}
          onNavigateToYouTubeMe={navigateToYouTubeMe}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          searchQuery={appState.searchQuery}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        >
          {renderPage()}
        </AppShell>

        {showProfileSetup && <ProfileSetupModal />}
        {showStripeSetup && <StripeSetupModal />}

        <Toaster />
      </div>
    </ThemeProvider>
  );
}
