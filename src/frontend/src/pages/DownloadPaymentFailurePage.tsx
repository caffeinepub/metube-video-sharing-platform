import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import type { VideoId } from '../backend';

interface DownloadPaymentFailurePageProps {
  videoId: VideoId | null;
  onNavigateHome: () => void;
  onNavigateToVideo: (videoId: VideoId) => void;
}

export default function DownloadPaymentFailurePage({
  videoId,
  onNavigateHome,
  onNavigateToVideo,
}: DownloadPaymentFailurePageProps) {
  const handleBackToVideo = () => {
    if (videoId !== null) {
      onNavigateToVideo(videoId);
    } else {
      onNavigateHome();
    }
  };

  return (
    <div className="container py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <XCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Payment Cancelled</CardTitle>
            <CardDescription>
              Your payment was cancelled. No charges were made.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              You can try again anytime from the video page.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {videoId !== null && (
                <Button onClick={handleBackToVideo} size="lg">
                  Back to Video
                </Button>
              )}
              <Button
                variant={videoId !== null ? 'outline' : 'default'}
                onClick={onNavigateHome}
                size="lg"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
