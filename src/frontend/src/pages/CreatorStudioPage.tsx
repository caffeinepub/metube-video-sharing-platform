import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetUserVideos } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Eye, ThumbsUp, Calendar } from 'lucide-react';
import type { Video } from '../backend';

interface CreatorStudioPageProps {
  onVideoClick: (videoId: bigint) => void;
  onEditVideo: (videoId: bigint) => void;
  onBackToHome: () => void;
}

export default function CreatorStudioPage({
  onVideoClick,
  onEditVideo,
  onBackToHome,
}: CreatorStudioPageProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: videos, isLoading } = useGetUserVideos(
    identity?.getPrincipal().toString() || null
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBackToHome}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Creator Studio</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Please log in to access Creator Studio
            </p>
            <p className="text-sm text-muted-foreground">
              Creator Studio lets you manage your videos, view analytics, and customize your channel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBackToHome}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Creator Studio</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="w-40 h-24 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos && videos.length > 0 ? (
        <div className="space-y-4">
          {videos.map((video) => (
            <Card key={video.id.toString()} className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div
                    className="w-40 h-24 bg-muted rounded overflow-hidden flex-shrink-0 cursor-pointer"
                    onClick={() => onVideoClick(video.id)}
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail.getDirectURL()}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src="/assets/generated/placeholder-video-thumbnail.dim_1280x720.png"
                          alt="No thumbnail"
                          className="w-full h-full object-cover opacity-50"
                        />
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-semibold mb-2 cursor-pointer hover:text-primary truncate"
                      onClick={() => onVideoClick(video.id)}
                    >
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {video.description}
                    </p>

                    {/* Metrics */}
                    <div className="flex flex-wrap gap-4 mb-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{Number(video.viewCount).toLocaleString()} views</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{Number(video.likeCount).toLocaleString()} likes</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(Number(video.uploadDate) / 1000000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {video.tags.slice(0, 5).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {video.tags.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{video.tags.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onEditVideo(video.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onVideoClick(video.id)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven't uploaded any videos yet
            </p>
            <p className="text-sm text-muted-foreground">
              Upload your first video to start building your channel!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
