import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useCreateCheckoutSession, useIsStripeConfigured } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Crown, Upload, ThumbsUp, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { SubscriptionStatus } from '../backend';
import type { ShoppingItem } from '../backend';

export default function SubscriptionPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isStripeConfigured, isLoading: stripeConfigLoading } = useIsStripeConfigured();
  const createCheckoutSession = useCreateCheckoutSession();
  const [isProcessing, setIsProcessing] = useState(false);

  const isAuthenticated = !!identity;
  const hasActiveSubscription = userProfile?.subscriptionStatus === SubscriptionStatus.active;

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      alert('Please log in to subscribe');
      return;
    }

    setIsProcessing(true);
    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;

      const items: ShoppingItem[] = [
        {
          productName: 'MeTube Premium Subscription',
          productDescription: 'Monthly subscription with full access to upload, like, and comment on videos',
          priceInCents: BigInt(2000), // $20.00
          currency: 'usd',
          quantity: BigInt(1),
        },
      ];

      const session = await createCheckoutSession.mutateAsync({
        items,
        successUrl,
        cancelUrl,
      });

      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }

      // Redirect to Stripe checkout
      window.location.href = session.url;
    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
    }
  };

  if (stripeConfigLoading) {
    return (
      <div className="container py-16 px-4">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isStripeConfigured) {
    return (
      <div className="container py-16 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Payment system is not configured yet. Please contact the administrator.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/assets/generated/premium-crown.dim_32x32.png" 
              alt="Premium" 
              className="h-12 w-12"
            />
          </div>
          <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
          <p className="text-xl text-muted-foreground">
            Unlock full access to MeTube's features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Basic viewing access</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Watch all videos</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Search videos</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Browse video gallery</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Premium
              </CardTitle>
              <CardDescription>Full platform access</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$20</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span className="font-medium">Everything in Free, plus:</span>
                </div>
                <div className="flex items-start gap-2">
                  <Upload className="h-5 w-5 text-primary mt-0.5" />
                  <span>Upload unlimited videos</span>
                </div>
                <div className="flex items-start gap-2">
                  <ThumbsUp className="h-5 w-5 text-primary mt-0.5" />
                  <span>Like videos</span>
                </div>
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <span>Comment on videos</span>
                </div>
                <div className="flex items-start gap-2">
                  <img 
                    src="/assets/generated/subscription-badge.dim_64x64.png" 
                    alt="Badge" 
                    className="h-5 w-5 mt-0.5"
                  />
                  <span>Premium badge</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {hasActiveSubscription ? (
                <Button variant="default" className="w-full" disabled>
                  <Check className="mr-2 h-4 w-4" />
                  Active Subscription
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={handleSubscribe}
                  disabled={!isAuthenticated || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Subscribe Now
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {!isAuthenticated && (
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to subscribe to Premium.
            </AlertDescription>
          </Alert>
        )}

        <div className="max-w-2xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Secure Payment</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <img 
                src="/assets/generated/payment-card.dim_200x150.png" 
                alt="Secure Payment" 
                className="h-16"
              />
              <p className="text-sm text-muted-foreground">
                All payments are securely processed through Stripe. Your payment information is encrypted and never stored on our servers.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
