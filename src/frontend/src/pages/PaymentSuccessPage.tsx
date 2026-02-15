import { useEffect, useState } from 'react';
import { useGetStripeSessionStatus, useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertCircle, Crown } from 'lucide-react';
import { SubscriptionStatus } from '../backend';

interface PaymentSuccessPageProps {
  sessionId: string | null;
  onNavigateHome: () => void;
}

export default function PaymentSuccessPage({ sessionId, onNavigateHome }: PaymentSuccessPageProps) {
  const getSessionStatus = useGetStripeSessionStatus();
  const { data: userProfile, refetch: refetchProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setVerificationStatus('error');
        setErrorMessage('No session ID provided');
        return;
      }

      try {
        const status = await getSessionStatus.mutateAsync(sessionId);
        
        if (status.__kind__ === 'completed') {
          // Update user profile with active subscription
          const updatedProfile = {
            name: userProfile?.name || 'User',
            subscriptionStatus: SubscriptionStatus.active,
          };
          
          // Invalidate queries to refresh data
          await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
          await queryClient.invalidateQueries({ queryKey: ['hasActiveSubscription'] });
          await refetchProfile();
          
          setVerificationStatus('success');
        } else {
          setVerificationStatus('error');
          setErrorMessage('Payment verification failed');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setVerificationStatus('error');
        setErrorMessage(error.message || 'Failed to verify payment');
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (verificationStatus === 'verifying') {
    return (
      <div className="container py-16 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-16 pb-16 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Verifying your payment...</p>
            <p className="text-sm text-muted-foreground">Please wait while we confirm your subscription.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="container py-16 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Payment Verification Failed</CardTitle>
            <CardDescription className="text-center">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={onNavigateHome}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-16 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Payment Successful!</CardTitle>
          <CardDescription className="text-center">
            Welcome to MeTube Premium
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-primary/10 border-primary">
            <Crown className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              Your Premium subscription is now active!
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold">You now have access to:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Upload unlimited videos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Like videos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Comment on videos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Premium badge on your profile
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={onNavigateHome} size="lg">
            Start Exploring
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
