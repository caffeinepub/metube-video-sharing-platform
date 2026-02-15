import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Video, Sparkles, Users } from 'lucide-react';

export default function YouTubeMePage() {
  return (
    <div className="container py-8 px-4 max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">YouTubeMe.co</h1>
          <p className="text-xl text-muted-foreground">
            Your Connected YouTube-Like Experience
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              What is YouTubeMe.co?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              YouTubeMe.co is a connected companion experience for metube.xyz, designed to provide
              a familiar YouTube-like interface while leveraging the power of decentralized video
              hosting and AI-powered content creation.
            </p>
            <p className="text-muted-foreground">
              Think of it as your personal video platform that seamlessly integrates with the
              MeTube ecosystem, offering enhanced features and a streamlined viewing experience.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong>Seamless Integration:</strong> Access all your metube.xyz content
                  through a familiar YouTube-style interface
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong>AI-Powered Creation:</strong> Use MeTube AI Studios to generate
                  videos and images directly within the platform
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong>Community Features:</strong> Connect with other creators and viewers
                  through integrated chat and social features
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong>Decentralized Storage:</strong> Your content is stored securely on
                  the Internet Computer blockchain
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              How It Connects to metube.xyz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              YouTubeMe.co acts as an alternative frontend for the metube.xyz platform. All your
              videos, playlists, and account data remain synchronized between both platforms,
              giving you the flexibility to choose your preferred viewing experience.
            </p>
            <p className="text-muted-foreground">
              Whether you're uploading content, managing your channel, or exploring AI-generated
              videos, YouTubeMe.co provides a streamlined interface that complements the full
              feature set available on metube.xyz.
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-lg font-semibold">
              Ready to explore YouTubeMe.co?
            </p>
            <Button size="lg" asChild>
              <a
                href="https://YouTubeMe.co"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Visit YouTubeMe.co
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <p className="text-sm text-muted-foreground">
              Opens in a new tab
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
