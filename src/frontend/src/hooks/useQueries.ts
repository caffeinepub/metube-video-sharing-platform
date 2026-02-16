import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Video, Comment, UserProfile, VideoId, ShoppingItem, StripeConfiguration, StripeSessionStatus, Channel, Playlist, PlaylistId, User, CommentId, AiGenerationStats, ChatMessage, SavedImage } from '../backend';
import { ExternalBlob, SubscriptionStatus } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

// AI Generation Stats Queries
export function useGetGenerationStats() {
  const { actor, isFetching } = useActor();

  return useQuery<AiGenerationStats>({
    queryKey: ['generationStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getGenerationStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateGenerationStats() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (durationMillis: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateGenerationStats(durationMillis);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generationStats'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update generation stats: ${error.message}`);
    },
  });
}

export function useIsAiStudioPurchased() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAiStudioPurchased'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isAiStudioPurchased();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateAiStudioCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      successUrl,
      cancelUrl,
    }: {
      successUrl: string;
      cancelUrl: string;
    }): Promise<{ id: string; url: string }> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createAiStudioCheckoutSession(successUrl, cancelUrl);
      const session = JSON.parse(result) as { id: string; url: string };
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
    onError: (error: Error) => {
      toast.error(`Failed to create checkout session: ${error.message}`);
    },
  });
}

export function useVerifyAndGrantAiAccess() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.verifyAndGrantAiAccess(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isAiStudioPurchased'] });
      queryClient.invalidateQueries({ queryKey: ['generationStats'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('AI Studio access granted!');
    },
    onError: (error: Error) => {
      toast.error(`Verification failed: ${error.message}`);
    },
  });
}

// Saved Images Queries
export function useGetSavedImages() {
  const { actor, isFetching } = useActor();

  return useQuery<SavedImage[]>({
    queryKey: ['savedImages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSavedImages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: SavedImage) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveImage(image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedImages'] });
      toast.success('Image saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save image: ${error.message}`);
    },
  });
}

export function useDeleteSavedImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageUrl: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSavedImage(imageUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedImages'] });
      toast.success('Image deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete image: ${error.message}`);
    },
  });
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Stripe Configuration
export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isStripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isStripeConfigured'] });
      toast.success('Stripe configured successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to configure Stripe: ${error.message}`);
    },
  });
}

export function useSetPayoutDestination() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (destinationId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!destinationId.trim()) {
        throw new Error('Payout destination cannot be empty');
      }
      return actor.setPayoutDestination(destinationId.trim());
    },
    onSuccess: () => {
      toast.success('Payout destination configured successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to configure payout destination: ${error.message}`);
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      items,
      successUrl,
      cancelUrl,
    }: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }): Promise<{ id: string; url: string }> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createCheckoutSession(items, successUrl, cancelUrl);
      const session = JSON.parse(result) as { id: string; url: string };
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
    onError: (error: Error) => {
      toast.error(`Failed to create checkout session: ${error.message}`);
    },
  });
}

export function useGetStripeSessionStatus() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (sessionId: string): Promise<StripeSessionStatus> => {
      if (!actor) throw new Error('Actor not available');
      return actor.getStripeSessionStatus(sessionId);
    },
  });
}

// Video Queries
export function useGetAllVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVideo(videoId: VideoId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Video | null>({
    queryKey: ['video', videoId?.toString()],
    queryFn: async () => {
      if (!actor || !videoId) return null;
      return actor.getVideo(videoId);
    },
    enabled: !!actor && !isFetching && videoId !== null,
  });
}

export function useSearchVideos(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['searchVideos', searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm) return [];
      return actor.searchVideos(searchTerm);
    },
    enabled: !!actor && !isFetching && searchTerm.length > 0,
  });
}

export function useGetUserVideos(userPrincipal: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['userVideos', userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      const principal = Principal.fromText(userPrincipal);
      return actor.getUserVideos(principal);
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
}

export function useUploadVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      videoBlob,
      thumbnail,
      tags,
    }: {
      title: string;
      description: string;
      videoBlob: ExternalBlob;
      thumbnail?: ExternalBlob | null;
      tags?: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadVideo(title, description, videoBlob, thumbnail || null, tags || []);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
      toast.success('Video uploaded successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

// View Count
export function useIncrementViewCount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: VideoId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.incrementViewCount(videoId);
    },
    onSuccess: (_, videoId) => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
    },
  });
}

export function useGetViewCount(videoId: VideoId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['viewCount', videoId?.toString()],
    queryFn: async () => {
      if (!actor || !videoId) return BigInt(0);
      return actor.getViewCount(videoId);
    },
    enabled: !!actor && !isFetching && videoId !== null,
  });
}

// Like Video
export function useLikeVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: VideoId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.likeVideo(videoId);
    },
    onSuccess: (_, videoId) => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
      toast.success('Video liked!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to like video: ${error.message}`);
    },
  });
}

// Comments
export function useGetComments(videoId: VideoId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', videoId?.toString()],
    queryFn: async () => {
      if (!actor || !videoId) return [];
      return actor.getComments(videoId);
    },
    enabled: !!actor && !isFetching && videoId !== null,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, content }: { videoId: VideoId; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(videoId, content);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId.toString()] });
      toast.success('Comment added!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, videoId }: { commentId: CommentId; videoId: VideoId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteComment(commentId);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId.toString()] });
      toast.success('Comment deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete comment: ${error.message}`);
    },
  });
}

export function usePinComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, videoId }: { commentId: CommentId; videoId: VideoId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.pinComment(commentId);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId.toString()] });
      toast.success('Comment pinned');
    },
    onError: (error: Error) => {
      toast.error(`Failed to pin comment: ${error.message}`);
    },
  });
}

export function useUnpinComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, videoId }: { commentId: CommentId; videoId: VideoId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unpinComment(commentId);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId.toString()] });
      toast.success('Comment unpinned');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unpin comment: ${error.message}`);
    },
  });
}

// Channel Management
export function useGetChannel(ownerPrincipal: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Channel | null>({
    queryKey: ['channel', ownerPrincipal],
    queryFn: async () => {
      if (!actor || !ownerPrincipal) return null;
      const principal = Principal.fromText(ownerPrincipal);
      return actor.getChannel(principal);
    },
    enabled: !!actor && !isFetching && !!ownerPrincipal,
  });
}

export function useCreateChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ channelName, description }: { channelName: string; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createChannel(channelName, description);
    },
    onSuccess: () => {
      if (identity) {
        queryClient.invalidateQueries({ queryKey: ['channel', identity.getPrincipal().toString()] });
      }
      toast.success('Channel created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create channel: ${error.message}`);
    },
  });
}

export function useUpdateChannelAbout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ channelName, newAbout }: { channelName: string; newAbout: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateChannelAbout(channelName, newAbout);
    },
    onSuccess: () => {
      if (identity) {
        queryClient.invalidateQueries({ queryKey: ['channel', identity.getPrincipal().toString()] });
      }
      toast.success('Channel updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update channel: ${error.message}`);
    },
  });
}

// Playlist Management
export function useGetUserPlaylists(userPrincipal: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Playlist[]>({
    queryKey: ['userPlaylists', userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      return actor.getUserPlaylists(userPrincipal);
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
}

export function useGetPlaylist(playlistId: PlaylistId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Playlist | null>({
    queryKey: ['playlist', playlistId?.toString()],
    queryFn: async () => {
      if (!actor || !playlistId) return null;
      return actor.getPlaylist(playlistId);
    },
    enabled: !!actor && !isFetching && playlistId !== null,
  });
}

export function useCreatePlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ name, isPrivate }: { name: string; isPrivate: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPlaylist(name, isPrivate);
    },
    onSuccess: () => {
      if (identity) {
        queryClient.invalidateQueries({ queryKey: ['userPlaylists', identity.getPrincipal().toString()] });
      }
      toast.success('Playlist created!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create playlist: ${error.message}`);
    },
  });
}

export function useAddVideoToPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, videoId }: { playlistId: PlaylistId; videoId: VideoId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addVideoToPlaylist(playlistId, videoId);
    },
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId.toString()] });
      toast.success('Video added to playlist!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add video to playlist: ${error.message}`);
    },
  });
}

export function useRemoveVideoFromPlaylist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, videoId }: { playlistId: PlaylistId; videoId: VideoId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeVideoFromPlaylist(playlistId, videoId);
    },
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId.toString()] });
      toast.success('Video removed from playlist');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove video from playlist: ${error.message}`);
    },
  });
}

// Video Purchase
export function useCreateVideoPurchaseCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      videoId,
      successUrl,
      cancelUrl,
    }: {
      videoId: VideoId;
      successUrl: string;
      cancelUrl: string;
    }): Promise<{ id: string; url: string }> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createVideoPurchaseCheckoutSession(videoId, successUrl, cancelUrl);
      const session = JSON.parse(result) as { id: string; url: string };
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
    onError: (error: Error) => {
      toast.error(`Failed to create checkout session: ${error.message}`);
    },
  });
}

export function useVerifyAndGrantVideoPurchase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, videoId }: { sessionId: string; videoId: VideoId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.verifyAndGrantVideoPurchase(sessionId, videoId);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['videoPurchaseEntitlement', videoId.toString()] });
      toast.success('Purchase verified! You can now download the video.');
    },
    onError: (error: Error) => {
      toast.error(`Verification failed: ${error.message}`);
    },
  });
}

export function useHasVideoPurchaseEntitlement(videoId: VideoId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['videoPurchaseEntitlement', videoId?.toString()],
    queryFn: async () => {
      if (!actor || !videoId) return false;
      return actor.hasVideoPurchaseEntitlement(videoId);
    },
    enabled: !!actor && !isFetching && videoId !== null,
  });
}

// Video Metadata Editing
export function useUpdateVideoMetadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      newTitle,
      newDescription,
    }: {
      videoId: VideoId;
      newTitle: string;
      newDescription: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateVideoMetadata(videoId, newTitle, newDescription);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
      toast.success('Video metadata updated!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update video metadata: ${error.message}`);
    },
  });
}

export function useUpdateThumbnail() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, newThumbnail }: { videoId: VideoId; newThumbnail: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateThumbnail(videoId, newThumbnail);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
      toast.success('Thumbnail updated!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update thumbnail: ${error.message}`);
    },
  });
}

export function useUpdateTags() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, newTags }: { videoId: VideoId; newTags: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTags(videoId, newTags);
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
      toast.success('Tags updated!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update tags: ${error.message}`);
    },
  });
}

// Chat functionality
export function useGetLatestMessages() {
  const { actor, isFetching } = useActor();

  return useQuery<ChatMessage[]>({
    queryKey: ['latestMessages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLatestMessages(BigInt(100));
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000, // Poll every 3 seconds
  });
}

export function usePostMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sender, message }: { sender: string; message: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.postMessage(sender, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latestMessages'] });
    },
    onError: (error: Error) => {
      // Surface the backend error message to the user
      toast.error(error.message);
    },
  });
}
