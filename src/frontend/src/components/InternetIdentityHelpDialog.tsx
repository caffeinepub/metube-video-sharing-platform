import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Fingerprint, Smartphone, Monitor } from 'lucide-react';

interface InternetIdentityHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

export default function InternetIdentityHelpDialog({
  open,
  onOpenChange,
  onContinue,
}: InternetIdentityHelpDialogProps) {
  const handleContinue = () => {
    onOpenChange(false);
    onContinue();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Sign In to MeTube
          </DialogTitle>
          <DialogDescription>
            How to sign in or sign up for metube.xyz
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription className="text-sm space-y-3">
              <p className="font-medium">
                MeTube uses <strong>Internet Identity</strong> for secure sign-in.
              </p>
              <p>
                There is <strong>no email, password, or username</strong> required.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm font-medium">To sign in, you will use:</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Fingerprint className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                <div>
                  <strong>Face ID or Touch ID</strong> (iPhone, iPad, Mac)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                <div>
                  <strong>Android biometrics</strong> (fingerprint or face unlock)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Monitor className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                <div>
                  <strong>Windows Hello</strong> or a <strong>security key</strong>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              Your device will securely authenticate you. No passwords to remember or forget.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            className="w-full sm:w-auto"
          >
            Continue to Internet Identity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
