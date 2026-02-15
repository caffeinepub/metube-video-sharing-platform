import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetGenerationStats, useUpdateGenerationStats, useCreateAiStudioCheckoutSession, useIsAiStudioPurchased } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Clock, Zap, AlertCircle, Crown, Image } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { generateVideo, type GeneratedVideo } from '../utils/aiVideoGenerator';
import { containsBlockedContent, getContentPolicyMessage } from '../utils/contentPolicy';
import { fetchImageFromUrl } from '../utils/fetchImageFromUrl';
import ImagesPicturesSection from '../components/ai-studio/ImagesPicturesSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AiStudioPageProps {
  onNavigateToUpload: (video: GeneratedVideo, metadata: { title: string; description: string; tags: string[] }) => void;
}

export default function AiStudioPage({ onNavigateToUpload }: AiStudioPageProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: generationStats, isLoading: statsLoading } = useGetGenerationStats();
  const { data: isPurchased, isLoading: purchaseLoading } = useIsAiStudioPurchased();
  const updateStats = useUpdateGenerationStats();
  const createCheckout = useCreateAiStudioCheckoutSession();

  const [quote, setQuote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState('5');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'images'>('video');

  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>MeTube AI Studios</CardTitle>
            <CardDescription>Please log in to access AI generation features</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isPaid = isPurchased === true;
  const remainingSeconds = generationStats ? Number(generationStats.remainingMillis) / 1000 : 0;
  const totalSeconds = generationStats ? Number(generationStats.totalAllowanceMillis) / 1000 : 3600;
  const usedSeconds = generationStats ? Number(generationStats.usedMillis) / 1000 : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const handleGenerate = async () => {
    if (!quote.trim()) {
      toast.error('Please enter a quote');
      return;
    }

    if (containsBlockedContent(quote)) {
      toast.error(getContentPolicyMessage());
      return;
    }

    const durationNum = parseInt(duration);
    if (durationNum > remainingSeconds) {
      toast.error('Insufficient generation time remaining');
      return;
    }

    setIsGenerating(true);
    try {
      // Fetch background image if URL provided
      let backgroundImage;
      if (imageUrl.trim()) {
        try {
          backgroundImage = await fetchImageFromUrl(imageUrl.trim());
        } catch (error: any) {
          toast.error(`Failed to load background image: ${error.message}`);
          setIsGenerating(false);
          return;
        }
      }

      // Determine resolution
      const resolutionMap = {
        '1080p': { width: 1920, height: 1080 },
        '720p': { width: 1280, height: 720 },
      };

      const video = await generateVideo({
        title: 'AI Generated Quote',
        text: quote,
        duration: durationNum,
        resolution: resolutionMap[resolution],
        backgroundImage,
      });

      await updateStats.mutateAsync(BigInt(durationNum * 1000));

      const metadata = {
        title: `AI Generated: ${quote.substring(0, 50)}${quote.length > 50 ? '...' : ''}`,
        description: `Generated with MeTube AI Studios\n\nQuote: "${quote}"`,
        tags: ['AI Generated', 'MeTube AI Studios', 'Quote'],
      };

      toast.success('Video generated successfully!');
      onNavigateToUpload(video, metadata);
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/ai-generation-success`;
      const cancelUrl = `${baseUrl}/ai-generation-cancel`;

      const session = await createCheckout.mutateAsync({ successUrl, cancelUrl });

      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }

      window.location.href = session.url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout');
    }
  };

  const presetQuotes = [
    "The only way to do great work is to love what you do.",
    "Innovation distinguishes between a leader and a follower.",
    "Stay hungry, stay foolish.",
    "The future belongs to those who believe in the beauty of their dreams.",
  ];

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            MeTube AI Studios
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate AI-powered videos and images
          </p>
        </div>
        {isPaid && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Crown className="h-4 w-4" />
            2-Hour Tier
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="video">
            <Sparkles className="mr-2 h-4 w-4" />
            Video Generation
          </TabsTrigger>
          <TabsTrigger value="images">
            <Image className="mr-2 h-4 w-4" />
            Images & Pictures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="video" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Generation Allowance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Remaining: {formatTime(remainingSeconds)}</span>
                  <span>Total: {formatTime(totalSeconds)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(remainingSeconds / totalSeconds) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used: {formatTime(usedSeconds)} / {formatTime(totalSeconds)}
                </p>
              </div>

              {!isPaid && remainingSeconds > 0 && (
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    You're on the free tier (1 hour). Upgrade to the 2-hour tier for more generation time!
                  </AlertDescription>
                </Alert>
              )}

              {!isPaid && (
                <Button
                  onClick={handleUpgrade}
                  disabled={createCheckout.isPending}
                  className="w-full"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  {createCheckout.isPending ? 'Processing...' : 'Upgrade to 2-Hour Tier ($34)'}
                </Button>
              )}

              {remainingSeconds <= 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You've used all your generation time. {!isPaid && 'Upgrade to get 2 more hours!'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generate Video</CardTitle>
              <CardDescription>
                Create a quote video with optional custom background (1080p or 720p)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Content Policy:</strong> Pornographic and explicit content is strictly prohibited.
                  Videos containing banned keywords will be rejected.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="quote">Quote *</Label>
                <Textarea
                  id="quote"
                  placeholder="Enter your inspirational quote..."
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  rows={3}
                />
                <div className="flex flex-wrap gap-2">
                  {presetQuotes.map((preset, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuote(preset)}
                    >
                      Preset {idx + 1}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Background Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for default gradient background
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="3"
                    max={Math.floor(remainingSeconds)}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Select value={resolution} onValueChange={(val) => setResolution(val as '720p' | '1080p')}>
                    <SelectTrigger id="resolution">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                      <SelectItem value="720p">720p (1280x720)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || remainingSeconds <= 0 || !quote.trim()}
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate Video'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <ImagesPicturesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
