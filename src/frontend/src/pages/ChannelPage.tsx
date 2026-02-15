import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetChannel,
  useGetUserVideos,
  useCreateChannel,
  useUpdateChannelAbout,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import VideoCard from '../components/VideoCard';

interface ChannelPageProps {
  ownerPrincipal: string;
  onVideoClick: (videoId: bigint) => void;
  onBackToHome: () => void;
}

export default function ChannelPage({
  ownerPrincipal,
  onVideoClick,
  onBackToHome,
}: ChannelPageProps) {
  const { identity } = useInternetIdentity();
  const { data: channel, isLoading: channelLoading } = useGetChannel(ownerPrincipal);
  const { data: videos, isLoading: videosLoading } = useGetUserVideos(ownerPrincipal);
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannelAbout();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');

  const isOwnChannel = identity?.getPrincipal().toString() === ownerPrincipal;

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      return;
    }
    try {
      await createChannel.mutateAsync({
        channelName: channelName.trim(),
        description: channelDescription.trim(),
      });
      setChannelName('');
      setChannelDescription('');
    } catch (error: any) {
      // Error already handled by mutation
    }
  };

  const handleUpdateChannel = async () => {
    if (!channelName.trim()) {
      return;
    }
    try {
      await updateChannel.mutateAsync({
        channelName: channelName.trim(),
        newAbout: channelDescription.trim(),
      });
      setEditDialogOpen(false);
    } catch (error: any) {
      // Error already handled by mutation
    }
  };

  const openEditDialog = () => {
    if (channel) {
      setChannelName(channel.channelName);
      setChannelDescription(channel.description);
    }
    setEditDialogOpen(true);
  };

  if (channelLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" size="icon" onClick={onBackToHome} className="mb-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-4">
          <Skeleton className="w-full h-48 rounded-lg" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" size="icon" onClick={onBackToHome} className="mb-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              This user hasn't created a channel yet
            </p>
            {isOwnChannel && (
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <Label htmlFor="channelName">Channel Name</Label>
                  <Input
                    id="channelName"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="Enter channel name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="channelDescription">Description</Label>
                  <Textarea
                    id="channelDescription"
                    value={channelDescription}
                    onChange={(e) => setChannelDescription(e.target.value)}
                    placeholder="Enter channel description"
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleCreateChannel}
                  disabled={createChannel.isPending || !channelName.trim()}
                >
                  {createChannel.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Channel'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const bannerUrl = '/assets/generated/placeholder-channel-banner.dim_2048x512.png';
  const avatarUrl = '/assets/generated/placeholder-channel-avatar.dim_512x512.png';

  return (
    <div className="max-w-7xl mx-auto">
      <Button variant="ghost" size="icon" onClick={onBackToHome} className="mb-4">
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Channel Banner */}
      <div className="w-full h-48 bg-muted rounded-lg overflow-hidden mb-6">
        <img
          src={bannerUrl}
          alt="Channel banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Channel Info */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-32 h-32 rounded-full bg-muted overflow-hidden flex-shrink-0">
          <img
            src={avatarUrl}
            alt="Channel avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold">{channel.channelName}</h1>
            {isOwnChannel && (
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={openEditDialog}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Channel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Channel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="editChannelName">Channel Name</Label>
                      <Input
                        id="editChannelName"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        placeholder="Enter channel name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editChannelDescription">About</Label>
                      <Textarea
                        id="editChannelDescription"
                        value={channelDescription}
                        onChange={(e) => setChannelDescription(e.target.value)}
                        placeholder="Enter channel description"
                        rows={5}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={handleUpdateChannel}
                      disabled={updateChannel.isPending || !channelName.trim()}
                      className="w-full"
                    >
                      {updateChannel.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <p className="text-muted-foreground mb-4">{channel.description}</p>
          <p className="text-sm text-muted-foreground">
            Joined {new Date(Number(channel.createdDate) / 1000000).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Videos */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Videos</h2>
        {videosLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="w-full aspect-video" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id.toString()}
                video={video}
                onVideoClick={onVideoClick}
                onChannelClick={() => {}}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No videos yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
