import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useAddComment,
  useGetCallerUserProfile,
  useDeleteComment,
  usePinComment,
  useUnpinComment,
  useIsCallerAdmin,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Crown, MoreVertical, Pin, Trash2 } from 'lucide-react';
import { SubscriptionStatus, type Comment, type VideoId, type User } from '../backend';
import { toast } from 'sonner';

interface CommentSectionProps {
  videoId: VideoId;
  comments: Comment[];
  isLoading: boolean;
  videoUploader: User;
}

export default function CommentSection({
  videoId,
  comments,
  isLoading,
  videoUploader,
}: CommentSectionProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const pinComment = usePinComment();
  const unpinComment = useUnpinComment();

  const [commentText, setCommentText] = useState('');

  const isAuthenticated = !!identity;
  const hasActiveSubscription = userProfile?.subscriptionStatus === SubscriptionStatus.active;
  const canModerate = isAuthenticated && (
    identity?.getPrincipal().toString() === videoUploader.toString() || (isAdmin === true)
  );

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      return;
    }
    if (!hasActiveSubscription) {
      toast.error('Premium subscription required to comment');
      return;
    }
    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      await addComment.mutateAsync({ videoId, content: commentText });
      setCommentText('');
    } catch (error: any) {
      // Error already handled by mutation
    }
  };

  const handleDeleteComment = async (commentId: bigint) => {
    try {
      await deleteComment.mutateAsync({ commentId, videoId });
    } catch (error: any) {
      // Error already handled by mutation
    }
  };

  const handlePinComment = async (commentId: bigint, isPinned: boolean) => {
    try {
      if (isPinned) {
        await unpinComment.mutateAsync({ commentId, videoId });
      } else {
        await pinComment.mutateAsync({ commentId, videoId });
      }
    } catch (error: any) {
      // Error already handled by mutation
    }
  };

  // Sort comments: pinned first, then by timestamp
  const sortedComments = [...comments].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return Number(b.timestamp - a.timestamp);
  });

  const pinnedComments = sortedComments.filter((c) => c.pinned);
  const unpinnedComments = sortedComments.filter((c) => !c.pinned);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        {isAuthenticated ? (
          hasActiveSubscription ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={addComment.isPending || !commentText.trim()}
              >
                {addComment.isPending ? 'Posting...' : 'Comment'}
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Premium subscription required to comment
              </p>
            </div>
          )
        ) : (
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Please log in to comment
            </p>
          </div>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-4">
            {/* Pinned Comments */}
            {pinnedComments.length > 0 && (
              <div className="space-y-4 pb-4 border-b">
                {pinnedComments.map((comment) => (
                  <CommentItem
                    key={comment.id.toString()}
                    comment={comment}
                    canModerate={canModerate}
                    onDelete={handleDeleteComment}
                    onPin={handlePinComment}
                  />
                ))}
              </div>
            )}

            {/* Unpinned Comments */}
            {unpinnedComments.map((comment) => (
              <CommentItem
                key={comment.id.toString()}
                comment={comment}
                canModerate={canModerate}
                onDelete={handleDeleteComment}
                onPin={handlePinComment}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CommentItemProps {
  comment: Comment;
  canModerate: boolean;
  onDelete: (commentId: bigint) => void;
  onPin: (commentId: bigint, isPinned: boolean) => void;
}

function CommentItem({ comment, canModerate, onDelete, onPin }: CommentItemProps) {
  return (
    <div className="space-y-2 p-3 rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">
            {comment.user.toString().slice(0, 10)}...
          </p>
          <Badge variant="secondary" className="text-xs">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
          {comment.pinned && (
            <Badge variant="default" className="text-xs">
              <Pin className="h-3 w-3 mr-1" />
              Pinned
            </Badge>
          )}
        </div>
        {canModerate && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPin(comment.id, comment.pinned)}>
                <Pin className="mr-2 h-4 w-4" />
                {comment.pinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(comment.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
      <p className="text-xs text-muted-foreground">
        {new Date(Number(comment.timestamp) / 1000000).toLocaleString()}
      </p>
    </div>
  );
}
