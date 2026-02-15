import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetUserPlaylists, useAddVideoToPlaylist, useCreatePlaylist } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Check, AlertCircle, ListPlus } from 'lucide-react';
import type { VideoId } from '../backend';

interface AddToPlaylistDialogProps {
  videoId: VideoId;
}

export default function AddToPlaylistDialog({
  videoId,
}: AddToPlaylistDialogProps) {
  const { identity } = useInternetIdentity();
  const { data: playlists, isLoading } = useGetUserPlaylists(
    identity?.getPrincipal() || null
  );
  const addVideoToPlaylist = useAddVideoToPlaylist();
  const createPlaylist = useCreatePlaylist();
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedPlaylists, setAddedPlaylists] = useState<Set<string>>(new Set());

  const isAuthenticated = !!identity;

  const handleAddToPlaylist = async (playlistId: bigint) => {
    try {
      await addVideoToPlaylist.mutateAsync({ playlistId, videoId });
      setAddedPlaylists(prev => new Set(prev).add(playlistId.toString()));
    } catch (error) {
      console.error('Failed to add video to playlist:', error);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const playlistId = await createPlaylist.mutateAsync({
        name: newPlaylistName.trim(),
        isPrivate: false,
      });
      await addVideoToPlaylist.mutateAsync({ playlistId, videoId });
      setNewPlaylistName('');
      setShowCreateForm(false);
      setAddedPlaylists(prev => new Set(prev).add(playlistId.toString()));
    } catch (error) {
      console.error('Failed to create playlist:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <ListPlus className="mr-2 h-4 w-4" />
            Save
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Playlist</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to save videos to playlists.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ListPlus className="mr-2 h-4 w-4" />
          Save
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Playlist</DialogTitle>
          <DialogDescription>
            Choose a playlist or create a new one.
          </DialogDescription>
        </DialogHeader>

        {showCreateForm ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-playlist-name">Playlist Name *</Label>
              <Input
                id="new-playlist-name"
                placeholder="Enter playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateAndAdd}
                disabled={!newPlaylistName.trim() || createPlaylist.isPending}
                className="flex-1"
              >
                {createPlaylist.isPending ? 'Creating...' : 'Create & Add'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPlaylistName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[300px] py-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading playlists...
                </p>
              ) : !playlists || playlists.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No playlists yet. Create one to get started!
                </p>
              ) : (
                <div className="space-y-2">
                  {playlists.map((playlist) => {
                    const isAdded = addedPlaylists.has(playlist.id.toString());
                    return (
                      <Button
                        key={playlist.id.toString()}
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        disabled={addVideoToPlaylist.isPending || isAdded}
                      >
                        <span className="truncate">{playlist.name}</span>
                        {isAdded && <Check className="h-4 w-4 text-green-500" />}
                      </Button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Playlist
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
