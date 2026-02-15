import { Heart } from 'lucide-react';

interface FooterProps {
  onNavigateToYouTubeMe?: () => void;
}

export default function Footer({ onNavigateToYouTubeMe }: FooterProps) {
  const appIdentifier = encodeURIComponent(window.location.hostname || 'metube-xyz');
  const caffeineUrl = `https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`;

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container flex h-16 items-center justify-between px-4">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()}. Built with{' '}
          <Heart className="inline h-4 w-4 text-red-500 fill-red-500" />{' '}
          using{' '}
          <a
            href={caffeineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            caffeine.ai
          </a>
        </p>
        {onNavigateToYouTubeMe && (
          <button
            onClick={onNavigateToYouTubeMe}
            className="text-sm text-primary hover:underline font-medium"
          >
            YouTubeMe.xyz
          </button>
        )}
      </div>
    </footer>
  );
}
