import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Video {
    id: VideoId;
    title: string;
    likeCount: bigint;
    thumbnail?: ExternalBlob;
    tags: Array<string>;
    description: string;
    videoBlob: ExternalBlob;
    viewCount: bigint;
    uploader: User;
    uploadDate: Time;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface AiGenerationStats {
    incentiveLevel: Variant_free_paid;
    remainingMillis: bigint;
    totalAllowanceMillis: bigint;
    usedMillis: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type PlaylistId = bigint;
export type VideoId = bigint;
export interface ChatMessage {
    isAI: boolean;
    sender: string;
    message: string;
    timestamp: Time;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export type CommentId = bigint;
export interface Comment {
    id: CommentId;
    content: string;
    hidden: boolean;
    user: User;
    pinned: boolean;
    timestamp: Time;
    videoId: VideoId;
}
export type User = Principal;
export interface Playlist {
    id: PlaylistId;
    owner: User;
    name: string;
    createdDate: Time;
    isPrivate: boolean;
    videoIds: Array<VideoId>;
}
export interface Channel {
    channelName: string;
    owner: Principal;
    createdDate: Time;
    description: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export type AiGenerationTier = {
    __kind__: "freeTier";
    freeTier: {
        usedDurationMillis: bigint;
    };
} | {
    __kind__: "paidTier";
    paidTier: {
        usedDurationMillis: bigint;
    };
};
export interface SavedImage {
    title: string;
    tags: Array<string>;
    description: string;
    imageUrl: string;
}
export interface VideoMetadata {
    id: VideoId;
    title: string;
    likeCount: bigint;
    thumbnail?: ExternalBlob;
    tags: Array<string>;
    description: string;
    viewCount: bigint;
    uploader: User;
    uploadDate: Time;
}
export interface UserProfile {
    name: string;
    subscriptionStatus: SubscriptionStatus;
    aiGenerationTier?: AiGenerationTier;
}
export enum SubscriptionStatus {
    active = "active",
    inactive = "inactive"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_free_paid {
    free = "free",
    paid = "paid"
}
export interface backendInterface {
    addComment(videoId: VideoId, content: string): Promise<CommentId>;
    addVideoToPlaylist(playlistId: PlaylistId, videoId: VideoId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAiStudioCheckoutSession(successUrl: string, cancelUrl: string): Promise<string>;
    createChannel(channelName: string, description: string): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createPlaylist(name: string, isPrivate: boolean): Promise<PlaylistId>;
    createVideoPurchaseCheckoutSession(videoId: VideoId, successUrl: string, cancelUrl: string): Promise<string>;
    deleteComment(commentId: CommentId): Promise<void>;
    deleteSavedImage(imageUrl: string): Promise<void>;
    getAllVideos(): Promise<Array<Video>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChannel(owner: Principal): Promise<Channel | null>;
    getComments(videoId: VideoId): Promise<Array<Comment>>;
    getGenerationStats(): Promise<AiGenerationStats>;
    getLatestMessages(count: bigint): Promise<Array<ChatMessage>>;
    getOlderMessages(offset: bigint, count: bigint): Promise<Array<ChatMessage>>;
    getPlaylist(playlistId: PlaylistId): Promise<Playlist | null>;
    getPublicPlaylists(): Promise<Array<Playlist>>;
    getSavedImages(): Promise<Array<SavedImage>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserPlaylists(user: User): Promise<Array<Playlist>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserVideos(user: User): Promise<Array<Video>>;
    getVideo(videoId: VideoId): Promise<Video | null>;
    getVideoMetadata(videoId: VideoId): Promise<VideoMetadata | null>;
    getViewCount(_videoId: VideoId): Promise<bigint>;
    hasVideoPurchaseEntitlement(videoId: bigint): Promise<boolean>;
    hideComment(commentId: CommentId): Promise<void>;
    incrementViewCount(videoId: VideoId): Promise<void>;
    isAiStudioPurchased(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    likeVideo(videoId: VideoId): Promise<void>;
    pinComment(commentId: CommentId): Promise<void>;
    postMessage(sender: string, message: string): Promise<void>;
    removeVideoFromPlaylist(playlistId: PlaylistId, videoId: VideoId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveImage(image: SavedImage): Promise<void>;
    searchPlaylists(searchTerm: string): Promise<Array<Playlist>>;
    searchVideos(searchTerm: string): Promise<Array<Video>>;
    setPayoutDestination(destinationId: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unhideComment(commentId: CommentId): Promise<void>;
    unpinComment(commentId: CommentId): Promise<void>;
    updateChannelAbout(channelName: string, newAbout: string): Promise<void>;
    updateGenerationStats(durationMillis: bigint): Promise<void>;
    updateTags(videoId: VideoId, newTags: Array<string>): Promise<void>;
    updateThumbnail(videoId: VideoId, newThumbnail: ExternalBlob): Promise<void>;
    updateVideoMetadata(videoId: VideoId, newTitle: string, newDescription: string): Promise<void>;
    uploadVideo(title: string, description: string, videoBlob: ExternalBlob, thumbnail: ExternalBlob | null, tags: Array<string>): Promise<void>;
    verifyAndGrantAiAccess(sessionId: string): Promise<void>;
    verifyAndGrantVideoPurchase(sessionId: string, videoId: VideoId): Promise<void>;
}
