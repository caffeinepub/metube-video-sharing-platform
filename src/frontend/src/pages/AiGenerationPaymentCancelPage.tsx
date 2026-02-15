import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AiGenerationPaymentCancelPageProps {
  onNavigateToAiStudio: () => void;
  onNavigateHome: () => void;
}

export default function AiGenerationPaymentCancelPage({
  onNavigateToAiStudio,
  onNavigateHome,
}: AiGenerationPaymentCancelPageProps) {
  return (
    <div className="container max-w-2xl py-16">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-6 w-6 text-muted-foreground" />
            Payment Cancelled
          </CardTitle>
          <CardDescription>Your MeTube AI Studios upgrade was not completed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              No charges were made to your account. You can try purchasing MeTube AI Studios access again whenever you're ready.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={onNavigateToAiStudio} className="flex-1">
              <Sparkles className="mr-2 h-4 w-4" />
              Back to MeTube AI Studios
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
