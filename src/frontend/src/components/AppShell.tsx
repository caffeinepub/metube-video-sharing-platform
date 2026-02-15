import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import type { Page } from '../App';

interface AppShellProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigateHome: () => void;
  onNavigateUpload: () => void;
  onNavigateSubscription: () => void;
  onNavigateToPlaylists: () => void;
  onNavigateToCreatorStudio: () => void;
  onNavigateToAiStudio: () => void;
  onNavigateToYourChannel: () => void;
  onNavigateDiscover: () => void;
  onNavigateToYouTubeMe: () => void;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  searchQuery: string;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export default function AppShell({
  children,
  currentPage,
  onNavigateHome,
  onNavigateUpload,
  onNavigateSubscription,
  onNavigateToPlaylists,
  onNavigateToCreatorStudio,
  onNavigateToAiStudio,
  onNavigateToYourChannel,
  onNavigateDiscover,
  onNavigateToYouTubeMe,
  onSearch,
  onClearSearch,
  searchQuery,
  sidebarOpen,
  onSidebarToggle,
}: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentPage={currentPage}
        onNavigateHome={onNavigateHome}
        onNavigateUpload={onNavigateUpload}
        onNavigateSubscription={onNavigateSubscription}
        onSearch={onSearch}
        onClearSearch={onClearSearch}
        searchQuery={searchQuery}
        onSidebarToggle={onSidebarToggle}
      />
      <div className="flex flex-1">
        <Sidebar
          currentPage={currentPage}
          onNavigateHome={onNavigateHome}
          onNavigateUpload={onNavigateUpload}
          onNavigateSubscription={onNavigateSubscription}
          onNavigateToPlaylists={onNavigateToPlaylists}
          onNavigateToCreatorStudio={onNavigateToCreatorStudio}
          onNavigateToAiStudio={onNavigateToAiStudio}
          onNavigateToYourChannel={onNavigateToYourChannel}
          onNavigateDiscover={onNavigateDiscover}
          isOpen={sidebarOpen}
          onClose={onSidebarToggle}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      <Footer onNavigateToYouTubeMe={onNavigateToYouTubeMe} />
    </div>
  );
}
