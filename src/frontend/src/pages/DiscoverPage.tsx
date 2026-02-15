import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageSquare, Compass, Video } from 'lucide-react';

interface DiscoverPageProps {
  onNavigateToAiStudio: () => void;
  onNavigateToAiChatRoom: () => void;
}

export default function DiscoverPage({ onNavigateToAiStudio, onNavigateToAiChatRoom }: DiscoverPageProps) {
  const handleYouTubeMeClick = () => {
    window.open('https://YouTubeMe.co', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="container py-8 px-4 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Compass className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Discover</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Explore AI-powered features and connect with the community
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/40 transition-all hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">MeTube AI Studios</CardTitle>
            </div>
            <CardDescription className="text-base mt-2">
              Create stunning AI-generated videos and images with custom backgrounds, quotes, and effects. 
              Perfect for content creators looking to produce unique content quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onNavigateToAiStudio} className="w-full" size="lg">
              <Sparkles className="mr-2 h-5 w-5" />
              Open AI Studios
            </Button>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/40 transition-all hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <MessageSquare className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">AI Chat Room</CardTitle>
            </div>
            <CardDescription className="text-base mt-2">
              Join our free community chat room and have conversations with AI. 
              Get instant responses, ask questions, and connect with other users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onNavigateToAiChatRoom} variant="secondary" className="w-full" size="lg">
              <MessageSquare className="mr-2 h-5 w-5" />
              Join Chat Room
            </Button>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent hover:border-secondary/40 transition-all hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-secondary/10">
                <Video className="h-8 w-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-2xl">YouTubeMe.co</CardTitle>
            </div>
            <CardDescription className="text-base mt-2">
              Experience metube.xyz through a familiar YouTube-like interface. 
              Connected platform with seamless integration and enhanced features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleYouTubeMeClick} variant="outline" className="w-full" size="lg">
              <Video className="mr-2 h-5 w-5" />
              Visit YouTubeMe.co
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 p-6 rounded-lg bg-muted/50 border border-border">
        <h2 className="text-xl font-semibold mb-3">What's New</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>AI Studios now supports image generation and promo creation with free on-device processing</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Save and manage your generated images in your personal library</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>YouTubeMe.co - New connected platform for enhanced viewing experience</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Free AI Chat Room available to all authenticated users</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
