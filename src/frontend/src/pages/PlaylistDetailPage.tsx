import { useGetPlaylist, useGetAllVideos } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Lock } from 'lucide-react';
import VideoCard from '../components/VideoCard';

interface PlaylistDetailPageProps {
  playlistId: bigint;
  onVideoClick: (videoId: bigint) => void;
  onBackToPlaylists: () => void;
}

export default function PlaylistDetailPage({
  playlistId,
  onVideoClick,
  onBackToPlaylists,
}: PlaylistDetailPageProps) {
  const { data: playlist, isLoading: playlistLoading } = useGetPlaylist(playlistId);
  const { data: allVideos, isLoading: videosLoading } = useGetAllVideos();

  const isLoading = playlistLoading || videosLoading;

  if (isLoading) {
    return (
      <div className="container py-8 px-4">
        <Button variant="ghost" onClick={onBackToPlaylists} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Playlists
        </Button>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="container py-16 px-4">
        <Button variant="ghost" onClick={onBackToPlaylists} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Playlists
        </Button>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Playlist not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter videos that are in this playlist
  const playlistVideos = allVideos?.filter((video) =>
    playlist.videoIds.some((id) => id.toString() === video.id.toString())
  ) || [];

  return (
    <div className="container py-8 px-4">
      <Button variant="ghost" onClick={onBackToPlaylists} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Playlists
      </Button>

      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{playlist.name}</h1>
            {playlist.isPrivate && (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <p className="text-muted-foreground">
            {playlist.videoIds.length} {playlist.videoIds.length === 1 ? 'video' : 'videos'}
          </p>
        </div>

        {playlistVideos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No videos in this playlist yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlistVideos.map((video) => (
              <VideoCard
                key={video.id.toString()}
                video={video}
                onVideoClick={onVideoClick}
                onChannelClick={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
