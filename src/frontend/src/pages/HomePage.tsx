import { useGetAllVideos, useSearchVideos } from '../hooks/useQueries';
import VideoCard from '../components/VideoCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Search as SearchIcon, Sparkles, MessageSquare } from 'lucide-react';

interface HomePageProps {
  onVideoClick: (videoId: bigint) => void;
  onChannelClick: (ownerPrincipal: string) => void;
  searchQuery: string;
  searchMode: boolean;
  onNavigateToAiStudio: () => void;
  onNavigateToAiChatRoom: () => void;
}

export default function HomePage({ 
  onVideoClick, 
  onChannelClick, 
  searchQuery, 
  searchMode,
  onNavigateToAiStudio,
  onNavigateToAiChatRoom,
}: HomePageProps) {
  const { data: allVideos, isLoading: allVideosLoading } = useGetAllVideos();
  const { data: searchResults, isLoading: searchLoading } = useSearchVideos(searchQuery);

  const isLoading = searchMode ? searchLoading : allVideosLoading;
  const videos = searchMode ? searchResults : allVideos;

  if (isLoading) {
    return (
      <div className="container py-8 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    if (searchMode) {
      return (
        <div className="container py-16 px-4">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-muted p-6">
              <SearchIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold">No results found</h2>
            <p className="text-muted-foreground max-w-md">
              Try different keywords or check your spelling.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="container py-16 px-4">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="rounded-full bg-muted p-6">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold">No videos yet</h2>
          <p className="text-muted-foreground max-w-md">
            Be the first to share a video! Upload your content and start
            building the community.
          </p>
        </div>
      </div>
    );
  }

  // Sort videos by upload date (newest first)
  const sortedVideos = [...videos].sort(
    (a, b) => Number(b.uploadDate - a.uploadDate)
  );

  return (
    <div className="container py-8 px-4">
      {/* Entry points section - only show when not in search mode */}
      {!searchMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">MeTube AI Studios</CardTitle>
              </div>
              <CardDescription className="text-base">
                Create stunning AI-generated videos with custom backgrounds and quotes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onNavigateToAiStudio} className="w-full" size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Open AI Studios
              </Button>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/40 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">AI Chat Room</CardTitle>
              </div>
              <CardDescription className="text-base">
                Chat with AI and other users in our free community chat room
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onNavigateToAiChatRoom} variant="secondary" className="w-full" size="lg">
                <MessageSquare className="mr-2 h-5 w-5" />
                Join Chat Room
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {searchMode && (
        <h1 className="text-2xl font-bold mb-6">
          Search results for "{searchQuery}"
        </h1>
      )}
      {!searchMode && (
        <h1 className="text-3xl font-bold mb-6">Latest Videos</h1>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedVideos.map((video) => (
          <VideoCard
            key={video.id.toString()}
            video={video}
            onVideoClick={onVideoClick}
            onChannelClick={onChannelClick}
          />
        ))}
      </div>
    </div>
  );
}
