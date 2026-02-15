import { useEffect, useState } from 'react';
import { useVerifyAndGrantAiAccess } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, XCircle, Sparkles, Clock, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AiGenerationPaymentSuccessPageProps {
  sessionId: string | null;
  onNavigateToAiStudio: () => void;
  onNavigateHome: () => void;
}

export default function AiGenerationPaymentSuccessPage({
  sessionId,
  onNavigateToAiStudio,
  onNavigateHome,
}: AiGenerationPaymentSuccessPageProps) {
  const verifyAndGrant = useVerifyAndGrantAiAccess();
  const [verificationState, setVerificationState] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!sessionId) {
      setVerificationState('error');
      setErrorMessage('No session ID provided');
      return;
    }

    const verify = async () => {
      try {
        await verifyAndGrant.mutateAsync(sessionId);
        setVerificationState('success');
      } catch (error: any) {
        console.error('Verification error:', error);
        setVerificationState('error');
        setErrorMessage(error.message || 'Failed to verify payment');
      }
    };

    verify();
  }, [sessionId]);

  if (verificationState === 'verifying') {
    return (
      <div className="container max-w-2xl py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Verifying Payment
            </CardTitle>
            <CardDescription>Please wait while we confirm your purchase...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (verificationState === 'error') {
    return (
      <div className="container max-w-2xl py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              Verification Failed
            </CardTitle>
            <CardDescription>There was an issue verifying your payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={onNavigateToAiStudio} variant="outline">
                Back to MeTube AI Studios
              </Button>
              <Button onClick={onNavigateHome}>Go Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-16">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
            Payment Successful!
          </CardTitle>
          <CardDescription>Your MeTube AI Studios upgrade is now active</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              You now have access to the 2-hour generation tier!
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold">Your New Features:</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <strong>2 Hours of Generation Time</strong>
                  <p className="text-sm text-muted-foreground">
                    Create up to 2 hours of AI-generated video content
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <strong>1080p Resolution Support</strong>
                  <p className="text-sm text-muted-foreground">
                    Generate videos in full HD quality
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <strong>Custom Backgrounds</strong>
                  <p className="text-sm text-muted-foreground">
                    Use your own images as video backgrounds
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={onNavigateToAiStudio} className="flex-1">
              <Sparkles className="mr-2 h-4 w-4" />
              Go to MeTube AI Studios
            </Button>
            <Button onClick={onNavigateHome} variant="outline">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
