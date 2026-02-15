import { useState } from 'react';
import { useSetStripeConfiguration, useSetPayoutDestination, useIsCallerAdmin } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CreditCard } from 'lucide-react';

export default function StripeSetupModal() {
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('US,CA,GB,AU,DE,FR,IT,ES,NL,SE');
  const [payoutDestination, setPayoutDestination] = useState('');
  const [showPayoutSection, setShowPayoutSection] = useState(false);
  
  const setStripeConfig = useSetStripeConfiguration();
  const setPayoutDest = useSetPayoutDestination();
  const { data: isAdmin } = useIsCallerAdmin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretKey.trim()) {
      const allowedCountries = countries.split(',').map(c => c.trim()).filter(c => c);
      setStripeConfig.mutate({
        secretKey: secretKey.trim(),
        allowedCountries,
      }, {
        onSuccess: () => {
          setShowPayoutSection(true);
        },
      });
    }
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutDestination.trim()) {
      setPayoutDest.mutate(payoutDestination.trim());
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Configure Stripe Payment</DialogTitle>
          <DialogDescription>
            Set up Stripe to enable subscription payments for your platform.
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            You need a Stripe account and secret key. Get yours at{' '}
            <a 
              href="https://stripe.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline"
            >
              stripe.com
            </a>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretKey">Stripe Secret Key *</Label>
            <Input
              id="secretKey"
              type="password"
              placeholder="sk_test_..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              required
              autoFocus
              disabled={setStripeConfig.isSuccess}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="countries">Allowed Countries (comma-separated)</Label>
            <Input
              id="countries"
              type="text"
              placeholder="US,CA,GB,AU,DE,FR"
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              disabled={setStripeConfig.isSuccess}
            />
            <p className="text-xs text-muted-foreground">
              ISO 3166-1 alpha-2 country codes
            </p>
          </div>

          {!setStripeConfig.isSuccess && (
            <Button
              type="submit"
              className="w-full"
              disabled={!secretKey.trim() || setStripeConfig.isPending}
            >
              {setStripeConfig.isPending ? 'Configuring...' : 'Configure Stripe'}
            </Button>
          )}
        </form>

        {(setStripeConfig.isSuccess || showPayoutSection) && (
          <>
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payout Destination (Optional)
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Configure where payments should be routed. This is optional - payment flows will work without it.
                  Enter your Stripe connected account ID or destination identifier.
                </p>
              </div>

              <form onSubmit={handlePayoutSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payoutDestination">Payout Destination ID</Label>
                  <Input
                    id="payoutDestination"
                    type="text"
                    placeholder="acct_..."
                    value={payoutDestination}
                    onChange={(e) => setPayoutDestination(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: Stripe connected account ID (acct_...)
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={!payoutDestination.trim() || setPayoutDest.isPending}
                >
                  {setPayoutDest.isPending ? 'Saving...' : 'Save Payout Destination'}
                </Button>
              </form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
