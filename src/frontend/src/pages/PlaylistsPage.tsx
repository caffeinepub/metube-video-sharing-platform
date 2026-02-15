import { useGetUserPlaylists, useCreatePlaylist } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Plus, List, AlertCircle, Lock } from 'lucide-react';
import { useState } from 'react';

interface PlaylistsPageProps {
  onPlaylistClick: (playlistId: bigint) => void;
  onBackToHome: () => void;
}

export default function PlaylistsPage({
  onPlaylistClick,
  onBackToHome,
}: PlaylistsPageProps) {
  const { identity } = useInternetIdentity();
  const { data: playlists, isLoading } = useGetUserPlaylists(
    identity?.getPrincipal() || null
  );
  const createPlaylist = useCreatePlaylist();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const isAuthenticated = !!identity;

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) return;

    try {
      await createPlaylist.mutateAsync({ name: playlistName.trim(), isPrivate });
      setPlaylistName('');
      setIsPrivate(false);
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create playlist:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-16 px-4">
        <Button variant="ghost" onClick={onBackToHome} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please log in to view and manage your playlists.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8 px-4">
        <Button variant="ghost" onClick={onBackToHome} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <Button variant="ghost" onClick={onBackToHome} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Playlists</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
                <DialogDescription>
                  Add a new playlist to organize your videos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="playlist-name">Playlist Name *</Label>
                  <Input
                    id="playlist-name"
                    placeholder="Enter playlist name"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-private"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is-private" className="text-sm font-normal cursor-pointer">
                    Make this playlist private
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={!playlistName.trim() || createPlaylist.isPending}
                >
                  {createPlaylist.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {!playlists || playlists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-muted p-6">
                  <List className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your first playlist to organize your favorite videos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <Card
                key={playlist.id.toString()}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onPlaylistClick(playlist.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{playlist.name}</span>
                    {playlist.isPrivate && (
                      <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {playlist.videoIds.length} {playlist.videoIds.length === 1 ? 'video' : 'videos'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
