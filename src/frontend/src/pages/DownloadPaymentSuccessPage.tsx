import { useEffect, useState } from 'react';
import { useVerifyAndGrantVideoPurchase } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, XCircle, Download } from 'lucide-react';
import type { VideoId } from '../backend';

interface DownloadPaymentSuccessPageProps {
  sessionId: string | null;
  videoId: VideoId | null;
  onNavigateHome: () => void;
  onNavigateToVideo: (videoId: VideoId) => void;
}

export default function DownloadPaymentSuccessPage({
  sessionId,
  videoId,
  onNavigateHome,
  onNavigateToVideo,
}: DownloadPaymentSuccessPageProps) {
  const verifyPurchase = useVerifyAndGrantVideoPurchase();
  const [verificationState, setVerificationState] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const verify = async () => {
      if (!sessionId || videoId === null) {
        setVerificationState('error');
        return;
      }

      try {
        await verifyPurchase.mutateAsync({ sessionId, videoId });
        setVerificationState('success');
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationState('error');
      }
    };

    verify();
  }, [sessionId, videoId]);

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
            {verificationState === 'verifying' && (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <CardTitle>Verifying Payment</CardTitle>
                <CardDescription>
                  Please wait while we verify your purchase...
                </CardDescription>
              </>
            )}

            {verificationState === 'success' && (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle>Payment Successful!</CardTitle>
                <CardDescription>
                  Your download access has been granted.
                </CardDescription>
              </>
            )}

            {verificationState === 'error' && (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle>Verification Failed</CardTitle>
                <CardDescription>
                  We couldn't verify your payment. Please contact support if you were charged.
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {verificationState === 'success' && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Download className="h-4 w-4" />
                  Download Access Granted
                </div>
                <p className="text-sm text-muted-foreground">
                  You can now download this video anytime from the video page.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {verificationState === 'success' && videoId !== null && (
                <Button onClick={handleBackToVideo} size="lg">
                  Go to Video
                </Button>
              )}
              <Button
                variant={verificationState === 'success' ? 'outline' : 'default'}
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
