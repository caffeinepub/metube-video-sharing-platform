import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

interface PaymentFailurePageProps {
  onNavigateHome: () => void;
}

export default function PaymentFailurePage({ onNavigateHome }: PaymentFailurePageProps) {
  return (
    <div className="container py-16 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Payment Cancelled</CardTitle>
          <CardDescription className="text-center">
            Your payment was not completed
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You can try again anytime to unlock Premium features.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={onNavigateHome}>
            Return to Home
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
