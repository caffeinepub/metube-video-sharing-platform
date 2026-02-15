import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, Eye } from 'lucide-react';
import type { Video } from '../backend';

interface VideoCardProps {
  video: Video;
  onVideoClick: (videoId: bigint) => void;
  onChannelClick: (ownerPrincipal: string) => void;
}

export default function VideoCard({ video, onVideoClick, onChannelClick }: VideoCardProps) {
  const thumbnailUrl = video.thumbnail
    ? video.thumbnail.getDirectURL()
    : '/assets/generated/placeholder-video-thumbnail.dim_1280x720.png';

  return (
    <Card className="overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer">
      <div onClick={() => onVideoClick(video.id)}>
        <div className="aspect-video bg-muted relative overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <CardContent className="p-4">
        <h3
          className="font-semibold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-primary"
          onClick={() => onVideoClick(video.id)}
        >
          {video.title}
        </h3>
        <p
          className="text-sm text-muted-foreground mb-2 cursor-pointer hover:text-foreground"
          onClick={() => onChannelClick(video.uploader.toString())}
        >
          {video.uploader.toString().slice(0, 10)}...
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{Number(video.viewCount).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            <span>{Number(video.likeCount).toLocaleString()}</span>
          </div>
        </div>
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {video.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
