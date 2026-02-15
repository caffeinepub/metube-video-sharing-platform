import { useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetVideo,
  useGetComments,
  useLikeVideo,
  useGetCallerUserProfile,
  useIncrementViewCount,
  useCreateVideoPurchaseCheckoutSession,
  useHasVideoPurchaseEntitlement,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ThumbsUp, Eye, Calendar, Download, Loader2 } from 'lucide-react';
import CommentSection from '../components/CommentSection';
import AddToPlaylistDialog from '../components/AddToPlaylistDialog';
import { SubscriptionStatus } from '../backend';
import { toast } from 'sonner';

interface VideoPlayerPageProps {
  videoId: bigint;
  onBackToHome: () => void;
  onChannelClick: (ownerPrincipal: string) => void;
}

export default function VideoPlayerPage({
  videoId,
  onBackToHome,
  onChannelClick,
}: VideoPlayerPageProps) {
  const { identity } = useInternetIdentity();
  const { data: video, isLoading: videoLoading } = useGetVideo(videoId);
  const { data: comments, isLoading: commentsLoading } = useGetComments(videoId);
  const { data: userProfile } = useGetCallerUserProfile();
  const likeVideo = useLikeVideo();
  const incrementViewCount = useIncrementViewCount();
  const createPurchaseSession = useCreateVideoPurchaseCheckoutSession();
  const { data: hasEntitlement, isLoading: entitlementLoading } = useHasVideoPurchaseEntitlement(videoId);

  const isAuthenticated = !!identity;
  const hasActiveSubscription = userProfile?.subscriptionStatus === SubscriptionStatus.active;

  useEffect(() => {
    if (videoId) {
      incrementViewCount.mutate(videoId);
    }
  }, [videoId]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like videos');
      return;
    }
    if (!hasActiveSubscription) {
      toast.error('Premium subscription required to like videos');
      return;
    }
    likeVideo.mutate(videoId);
  };

  const handleDownloadPurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to purchase downloads');
      return;
    }

    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/download-payment-success?video_id=${videoId}`;
      const cancelUrl = `${baseUrl}/download-payment-failure?video_id=${videoId}`;

      const session = await createPurchaseSession.mutateAsync({
        videoId,
        successUrl,
        cancelUrl,
      });

      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }

      window.location.href = session.url;
    } catch (error: any) {
      // Error already handled by mutation
    }
  };

  const handleDownload = async () => {
    if (!video) return;

    try {
      const bytes = await video.videoBlob.getBytes();
      const blob = new Blob([bytes], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error: any) {
      toast.error(`Download failed: ${error.message}`);
    }
  };

  if (videoLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" size="icon" onClick={onBackToHome} className="mb-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-4">
          <Skeleton className="w-full aspect-video rounded-lg" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" size="icon" onClick={onBackToHome} className="mb-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Video not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const videoUrl = video.videoBlob.getDirectURL();

  return (
    <div className="max-w-6xl mx-auto">
      <Button variant="ghost" size="icon" onClick={onBackToHome} className="mb-4">
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="space-y-6">
        {/* Video Player */}
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={videoUrl}
            controls
            className="w-full h-full"
            controlsList="nodownload"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Video Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{Number(video.viewCount).toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(Number(video.uploadDate) / 1000000).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {video.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              onClick={handleLike}
              disabled={likeVideo.isPending || !isAuthenticated || !hasActiveSubscription}
              variant="outline"
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              {Number(video.likeCount).toLocaleString()}
            </Button>
            <AddToPlaylistDialog videoId={videoId} />
          </div>

          {/* Uploader */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div
                className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors"
                onClick={() => onChannelClick(video.uploader.toString())}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {video.uploader.toString().slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">
                    {video.uploader.toString().slice(0, 10)}...
                  </p>
                  <p className="text-sm text-muted-foreground">View Channel</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm whitespace-pre-wrap">{video.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Download Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Download this video</h3>
                  <p className="text-sm text-muted-foreground">
                    Purchase once for $0.63 and download anytime
                  </p>
                </div>
                <div>
                  {entitlementLoading ? (
                    <Button disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </Button>
                  ) : hasEntitlement ? (
                    <Button onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  ) : (
                    <Button
                      onClick={handleDownloadPurchase}
                      disabled={createPurchaseSession.isPending}
                    >
                      {createPurchaseSession.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Buy for $0.63
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments */}
        <CommentSection
          videoId={videoId}
          comments={comments || []}
          isLoading={commentsLoading}
          videoUploader={video.uploader}
        />
      </div>
    </div>
  );
}
