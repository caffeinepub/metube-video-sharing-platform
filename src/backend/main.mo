import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";

actor {
  type VideoId = Nat;
  type CommentId = Nat;
  type PlaylistId = Nat;

  // Chat functionality types
  public type ChatMessage = {
    sender : Text;
    message : Text;
    timestamp : Time.Time;
    isAI : Bool;
  };

  public type User = Principal;
  public type AiGenerationTier = {
    #freeTier : { usedDurationMillis : Nat };
    #paidTier : { usedDurationMillis : Nat };
  };
  public type SubscriptionStatus = { #active; #inactive };

  public type UserProfile = {
    name : Text;
    subscriptionStatus : SubscriptionStatus;
    aiGenerationTier : ?AiGenerationTier;
  };

  public type Channel = {
    owner : Principal;
    channelName : Text;
    description : Text;
    createdDate : Time.Time;
  };

  public type Video = {
    id : VideoId;
    title : Text;
    description : Text;
    uploader : User;
    uploadDate : Time.Time;
    videoBlob : Storage.ExternalBlob;
    thumbnail : ?Storage.ExternalBlob;
    likeCount : Nat;
    viewCount : Nat;
    tags : [Text];
  };

  public type VideoMetadata = {
    id : VideoId;
    title : Text;
    description : Text;
    uploader : User;
    uploadDate : Time.Time;
    likeCount : Nat;
    viewCount : Nat;
    thumbnail : ?Storage.ExternalBlob;
    tags : [Text];
  };

  public type Comment = {
    id : CommentId;
    videoId : VideoId;
    user : User;
    content : Text;
    timestamp : Time.Time;
    pinned : Bool;
    hidden : Bool;
  };

  public type Playlist = {
    id : PlaylistId;
    owner : User;
    name : Text;
    videoIds : [VideoId];
    isPrivate : Bool;
    createdDate : Time.Time;
  };

  public type AiGenerationStats = {
    incentiveLevel : { #free; #paid };
    remainingMillis : Nat;
    usedMillis : Nat;
    totalAllowanceMillis : Nat;
  };

  public type VideoGenerationRequest = {
    videoId : Nat;
    user : Principal;
    requestDate : Time.Time;
  };

  public type VideoPurchase = {
    videoId : Nat;
    user : Principal;
    purchaseDate : Time.Time;
  };

  var nextVideoId : Nat = 0;
  var nextCommentId : Nat = 0;
  var nextPlaylistId : Nat = 0;

  let userProfiles = Map.empty<Principal, UserProfile>();
  let videoPurchaseEntitlements = Map.empty<Nat, Set.Set<Principal>>();
  let videos = Map.empty<VideoId, Video>();
  let comments = Map.empty<CommentId, Comment>();
  let likes = Map.empty<VideoId, List.List<User>>();
  let channels = Map.empty<Principal, Channel>();
  let playlists = Map.empty<PlaylistId, Playlist>();

  // AI Studio: Saved Image Projects
  public type SavedImage = {
    imageUrl : Text;
    title : Text;
    description : Text;
    tags : [Text];
  };

  let savedImages = Map.empty<Principal, List.List<SavedImage>>();

  public shared ({ caller }) func saveImage(image : SavedImage) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save images");
    };

    let userImages = switch (savedImages.get(caller)) {
      case (null) { List.empty<SavedImage>() };
      case (?existing) { existing };
    };

    userImages.add(image);
    savedImages.add(caller, userImages);
  };

  public query ({ caller }) func getSavedImages() : async [SavedImage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view saved images");
    };

    switch (savedImages.get(caller)) {
      case (null) { [] };
      case (?images) { images.toArray() };
    };
  };

  public shared ({ caller }) func deleteSavedImage(imageUrl : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete saved images");
    };

    switch (savedImages.get(caller)) {
      case (null) { Runtime.trap("No saved images found for user") };
      case (?images) {
        let filteredImages = images.filter(
          func(img) {
            img.imageUrl != imageUrl;
          }
        );
        savedImages.add(caller, filteredImages);
      };
    };
  };

  // Chat functionality
  var chatMessages : List.List<ChatMessage> = List.empty<ChatMessage>();
  let maxChatMessages : Nat = 100;

  var stripeConfig : ?Stripe.StripeConfiguration = null;
  var payoutDestination : ?Text = null;

  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  module Video {
    public func compare(a : Video, b : Video) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  func _checkSubscriptionProfile(caller : Principal) : UserProfile {
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };

    // Prevent users from setting aiGenerationTier directly - must go through payment flow
    let existingProfile = userProfiles.get(caller);
    let protectedProfile = switch (existingProfile) {
      case (null) {
        // New profile - force aiGenerationTier to null (users cannot set tier on profile creation)
        {
          profile with
          aiGenerationTier = null;
        };
      };
      case (?existing) {
        // Existing profile - preserve aiGenerationTier, don't allow user to change it
        {
          profile with
          aiGenerationTier = existing.aiGenerationTier;
        };
      };
    };

    userProfiles.add(caller, protectedProfile);
  };

  // Stripe Configuration
  var isStripeConfiguredFlag : Bool = false;

  public query func isStripeConfigured() : async Bool {
    isStripeConfiguredFlag;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfig := ?config;
    isStripeConfiguredFlag := true;
  };

  public shared ({ caller }) func setPayoutDestination(destinationId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can configure payout destination");
    };
    payoutDestination := ?destinationId;
  };

  func getStripeConfig() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe not configured") };
      case (?config) { config };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Channel Management
  public shared ({ caller }) func createChannel(channelName : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create channels");
    };

    let newChannel : Channel = {
      owner = caller;
      channelName;
      description;
      createdDate = Time.now();
    };
    channels.add(caller, newChannel);
  };

  public query func getChannel(owner : Principal) : async ?Channel {
    channels.get(owner);
  };

  // Video Management
  public shared ({ caller }) func uploadVideo(
    title : Text,
    description : Text,
    videoBlob : Storage.ExternalBlob,
    thumbnail : ?Storage.ExternalBlob,
    tags : [Text],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can upload videos");
    };

    let video : Video = {
      id = nextVideoId;
      title;
      description;
      uploader = caller;
      uploadDate = Time.now();
      videoBlob;
      thumbnail;
      likeCount = 0;
      viewCount = 0;
      tags;
    };

    videos.add(nextVideoId, video);
    nextVideoId += 1;
  };

  public query func getVideo(videoId : VideoId) : async ?Video {
    videos.get(videoId);
  };

  public query func getAllVideos() : async [Video] {
    let videoArray = videos.values().toArray().sort();
    videoArray;
  };

  public shared ({ caller }) func likeVideo(videoId : VideoId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can like videos");
    };

    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        let currentLikes = switch (likes.get(videoId)) {
          case (null) { List.empty<User>() };
          case (?existingLikes) { existingLikes };
        };

        if (currentLikes.any(func(user) { user == caller })) {
          Runtime.trap("User has already liked this video");
        } else {
          currentLikes.add(caller);
          likes.add(videoId, currentLikes);
          let updatedVideo = {
            video with
            likeCount = video.likeCount + 1;
          };
          videos.add(videoId, updatedVideo);
        };
      };
    };
  };

  public shared ({ caller }) func addComment(videoId : VideoId, content : Text) : async CommentId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can comment on videos");
    };

    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?_) {
        let comment : Comment = {
          id = nextCommentId;
          videoId;
          user = caller;
          content;
          timestamp = Time.now();
          pinned = false;
          hidden = false;
        };

        comments.add(nextCommentId, comment);
        let commentId = nextCommentId;
        nextCommentId += 1;
        commentId;
      };
    };
  };

  public query func getComments(videoId : VideoId) : async [Comment] {
    let filteredComments = comments.values().toArray().filter(
      func(_comment) {
        _comment.videoId == videoId and not _comment.hidden;
      }
    );
    filteredComments;
  };

  public query func searchVideos(searchTerm : Text) : async [Video] {
    videos.values().toArray().filter(
      func(video) {
        video.title.contains(#text searchTerm) or
        video.description.contains(#text searchTerm) or
        video.tags.any(
          func(tag) {
            tag.contains(#text searchTerm);
          }
        );
      }
    );
  };

  public query func getUserVideos(user : User) : async [Video] {
    videos.values().toArray().filter(
      func(video) {
        video.uploader == user;
      }
    );
  };

  public query func getVideoMetadata(videoId : VideoId) : async ?VideoMetadata {
    switch (videos.get(videoId)) {
      case (null) { null };
      case (?video) {
        ?{
          id = video.id;
          title = video.title;
          description = video.description;
          uploader = video.uploader;
          uploadDate = video.uploadDate;
          likeCount = video.likeCount;
          viewCount = video.viewCount;
          thumbnail = video.thumbnail;
          tags = video.tags;
        };
      };
    };
  };

  // Playlist Management
  public shared ({ caller }) func createPlaylist(name : Text, isPrivate : Bool) : async PlaylistId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create playlists");
    };

    let playlist : Playlist = {
      id = nextPlaylistId;
      owner = caller;
      name;
      videoIds = [];
      isPrivate;
      createdDate = Time.now();
    };

    playlists.add(nextPlaylistId, playlist);
    let playlistId = nextPlaylistId;
    nextPlaylistId += 1;
    playlistId;
  };

  public shared ({ caller }) func addVideoToPlaylist(playlistId : PlaylistId, videoId : VideoId) : async () {
    switch (playlists.get(playlistId)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?playlist) {
        if (caller != playlist.owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the owner or admin can modify this playlist");
        };

        let updatedVideoIds = playlist.videoIds.concat([videoId]);
        let updatedPlaylist = {
          playlist with
          videoIds = updatedVideoIds;
        };
        playlists.add(playlistId, updatedPlaylist);
      };
    };
  };

  public shared ({ caller }) func removeVideoFromPlaylist(playlistId : PlaylistId, videoId : VideoId) : async () {
    switch (playlists.get(playlistId)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?playlist) {
        if (caller != playlist.owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the owner or admin can modify this playlist");
        };

        let updatedVideoIds = playlist.videoIds.filter(
          func(id) {
            id != videoId;
          }
        );
        let updatedPlaylist = {
          playlist with
          videoIds = updatedVideoIds;
        };
        playlists.add(playlistId, updatedPlaylist);
      };
    };
  };

  public query ({ caller }) func getPlaylist(playlistId : PlaylistId) : async ?Playlist {
    switch (playlists.get(playlistId)) {
      case (null) { null };
      case (?playlist) {
        if (playlist.isPrivate) {
          if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Authentication required to access private playlists");
          };
          if (caller != playlist.owner and not AccessControl.isAdmin(accessControlState, caller)) {
            Runtime.trap("Unauthorized: This playlist is private");
          };
        };
        ?playlist;
      };
    };
  };

  public query func getPublicPlaylists() : async [Playlist] {
    playlists.values().toArray().filter(
      func(playlist) {
        not playlist.isPrivate;
      }
    );
  };

  public query ({ caller }) func getUserPlaylists(user : User) : async [Playlist] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view user playlists");
    };

    playlists.values().toArray().filter(
      func(playlist) {
        playlist.owner == user and (not playlist.isPrivate or caller == playlist.owner or AccessControl.isAdmin(accessControlState, caller));
      }
    );
  };

  public query ({ caller }) func searchPlaylists(searchTerm : Text) : async [Playlist] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can search playlists");
    };

    playlists.values().toArray().filter(
      func(playlist) {
        playlist.name.contains(#text searchTerm) and (not playlist.isPrivate or caller == playlist.owner or AccessControl.isAdmin(accessControlState, caller));
      }
    );
  };

  func createShoppingItem(video : Video) : Stripe.ShoppingItem {
    {
      currency = "usd";
      productName = video.title;
      productDescription = video.description;
      priceInCents = 63;
      quantity = 1;
    };
  };

  public shared ({ caller }) func createVideoPurchaseCheckoutSession(videoId : VideoId, successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can purchase videos");
    };

    let video = switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) { video };
    };

    let item = createShoppingItem(video);
    await Stripe.createCheckoutSession(getStripeConfig(), caller, [item], successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func verifyAndGrantVideoPurchase(sessionId : Text, videoId : VideoId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can verify video purchases");
    };

    let status = await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);

    switch (status) {
      case (#failed { error }) { Runtime.trap("Payment failed. Please try again. " # error) };
      case (#completed { response }) {
        let _ = response;
        grantVideoPurchaseEntitlement(videoId, caller);
      };
    };
  };

  func grantVideoPurchaseEntitlement(videoId : Nat, user : Principal) {
    let currentSet = switch (videoPurchaseEntitlements.get(videoId)) {
      case (null) { Set.empty<Principal>() };
      case (?entitlementSet) { entitlementSet };
    };

    if (currentSet.contains(user)) {
      Runtime.trap("This video was already purchased. You should be already able to download it.");
    };

    currentSet.add(user);
    videoPurchaseEntitlements.add(videoId, currentSet);
  };

  public query ({ caller }) func hasVideoPurchaseEntitlement(videoId : Nat) : async Bool {
    switch (videoPurchaseEntitlements.get(videoId)) {
      case (null) { false };
      case (?currentSet) { currentSet.contains(caller) };
    };
  };

  // View Count Tracking (Analytics)
  // No authentication required - allows anonymous users to increment view counts
  public func incrementViewCount(videoId : VideoId) : async () {
    let video = switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) { video };
    };

    let updatedVideo = {
      video with
      viewCount = video.viewCount + 1;
    };
    videos.add(videoId, updatedVideo);
  };

  public query ({ caller }) func getViewCount(_videoId : VideoId) : async Nat {
    switch (videos.get(_videoId)) {
      case (null) { 0 };
      case (?video) { video.viewCount };
    };
  };

  // Video Metadata Editing
  public shared ({ caller }) func updateVideoMetadata(videoId : VideoId, newTitle : Text, newDescription : Text) : async () {
    let video = switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) { video };
    };

    if (caller != video.uploader and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only uploader or admin can update video metadata");
    };

    let updatedVideo = {
      video with
      title = newTitle;
      description = newDescription;
    };
    videos.add(videoId, updatedVideo);
  };

  // Thumbnail Management
  public shared ({ caller }) func updateThumbnail(videoId : VideoId, newThumbnail : Storage.ExternalBlob) : async () {
    let video = switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) { video };
    };

    if (caller != video.uploader and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only uploader or admin can update thumbnail");
    };

    let updatedVideo = {
      video with
      thumbnail = ?newThumbnail;
    };
    videos.add(videoId, updatedVideo);
  };

  // Tags Management
  public shared ({ caller }) func updateTags(videoId : VideoId, newTags : [Text]) : async () {
    let video = switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) { video };
    };

    if (caller != video.uploader and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only uploader or admin can update tags");
    };

    let updatedVideo = {
      video with
      tags = newTags;
    };
    videos.add(videoId, updatedVideo);
  };

  // Comment Moderation
  public shared ({ caller }) func deleteComment(commentId : CommentId) : async () {
    let comment = switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?comment) { comment };
    };

    if (not isVideoOwner(comment.videoId, caller)) {
      if (not AccessControl.isAdmin(accessControlState, caller)) {
        Runtime.trap("Unauthorized: Only video owner or admin can delete comment");
      };
    };

    comments.remove(commentId);
  };

  public shared ({ caller }) func pinComment(commentId : CommentId) : async () {
    let comment = switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?comment) { comment };
    };

    if (not isVideoOwner(comment.videoId, caller)) {
      if (not AccessControl.isAdmin(accessControlState, caller)) {
        Runtime.trap("Unauthorized: Only video owner or admin can pin comment");
      };
    };

    let updatedComment = {
      comment with
      pinned = true;
    };
    comments.add(commentId, updatedComment);
  };

  public shared ({ caller }) func unpinComment(commentId : CommentId) : async () {
    let comment = switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?comment) { comment };
    };

    if (not isVideoOwner(comment.videoId, caller)) {
      if (not AccessControl.isAdmin(accessControlState, caller)) {
        Runtime.trap("Unauthorized: Only video owner or admin can unpin comment");
      };
    };

    let updatedComment = {
      comment with
      pinned = false;
    };
    comments.add(commentId, updatedComment);
  };

  public shared ({ caller }) func hideComment(commentId : CommentId) : async () {
    let comment = switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?comment) { comment };
    };

    if (not isVideoOwner(comment.videoId, caller)) {
      if (not AccessControl.isAdmin(accessControlState, caller)) {
        Runtime.trap("Unauthorized: Only video owner or admin can hide comment");
      };
    };

    let updatedComment = {
      comment with
      hidden = true;
    };
    comments.add(commentId, updatedComment);
  };

  public shared ({ caller }) func unhideComment(commentId : CommentId) : async () {
    let comment = switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?comment) { comment };
    };

    if (not isVideoOwner(comment.videoId, caller)) {
      if (not AccessControl.isAdmin(accessControlState, caller)) {
        Runtime.trap("Unauthorized: Only video owner or admin can unhide comment");
      };
    };

    let updatedComment = {
      comment with
      hidden = false;
    };
    comments.add(commentId, updatedComment);
  };

  func isVideoOwner(videoId : VideoId, caller : User) : Bool {
    switch (videos.get(videoId)) {
      case (null) { false };
      case (?video) { video.uploader == caller };
    };
  };

  // Channel Customization
  public shared ({ caller }) func updateChannelAbout(
    channelName : Text,
    newAbout : Text,
  ) : async () {
    let channel = switch (channels.get(caller)) {
      case (null) { Runtime.trap("Channel not found") };
      case (?channel) { channel };
    };

    if (caller != channel.owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only channel owner or admin can update channel about");
    };

    let updatedChannel = {
      channel with
      channelName = channelName;
      description = newAbout;
    };
    channels.add(caller, updatedChannel);
  };

  // AI Video Generation Management
  public query ({ caller }) func getGenerationStats() : async AiGenerationStats {
    switch (userProfiles.get(caller)) {
      case (null) {
        // If no profile exists, create one with default values
        let defaultStats = {
          incentiveLevel = #free;
          remainingMillis = 3600 * 1000;
          usedMillis = 0;
          totalAllowanceMillis = 3600 * 1000;
        };
        defaultStats;
      };
      case (?profile) {
        switch (profile.aiGenerationTier) {
          case (null) {
            {
              incentiveLevel = #free;
              remainingMillis = 3600 * 1000;
              usedMillis = 0;
              totalAllowanceMillis = 3600 * 1000;
            };
          };
          case (?tier) {
            switch (tier) {
              case (#freeTier { usedDurationMillis }) {
                let stats = {
                  incentiveLevel = #free;
                  remainingMillis = 3600 * 1000 - usedDurationMillis;
                  usedMillis = usedDurationMillis;
                  totalAllowanceMillis = 3600 * 1000;
                };
                stats;
              };
              case (#paidTier { usedDurationMillis }) {
                let stats = {
                  incentiveLevel = #paid;
                  remainingMillis = 2 * 3600 * 1000 - usedDurationMillis;
                  usedMillis = usedDurationMillis;
                  totalAllowanceMillis = 2 * 3600 * 1000;
                };
                stats;
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateGenerationStats(durationMillis : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update generation stats");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        let updatedTier = switch (profile.aiGenerationTier) {
          case (null) {
            // If no tier exists, create a free tier with the used duration
            #freeTier { usedDurationMillis = durationMillis };
          };
          case (?tier) {
            switch (tier) {
              case (#freeTier { usedDurationMillis }) {
                #freeTier { usedDurationMillis = usedDurationMillis + durationMillis };
              };
              case (#paidTier { usedDurationMillis }) {
                #paidTier { usedDurationMillis = usedDurationMillis + durationMillis };
              };
            };
          };
        };

        let updatedProfile = {
          profile with
          aiGenerationTier = ?updatedTier;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func createAiStudioCheckoutSession(successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can purchase video generation features");
    };

    let item : Stripe.ShoppingItem = {
      currency = "usd";
      productName = "AI Video Generation";
      productDescription = "One-time purchase for AI video generation features";
      priceInCents = 3400;
      quantity = 1;
    };

    // Always use admin-configured payout destination for all payments
    await Stripe.createCheckoutSession(getStripeConfig(), caller, [item], successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func verifyAndGrantAiAccess(sessionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can verify AI access purchases");
    };

    let status = await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);

    switch (status) {
      case (#failed { error }) { Runtime.trap("Payment failed. Please try again. " # error) };
      case (#completed { response }) {
        let _ = response;
        enableAiStudioForUser(caller);
      };
    };
  };

  func enableAiStudioForUser(user : Principal) {
    let previousProfile = switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("No profile found for user. You need to be logged in to purchase AI access! (Most likely issue: You are logged out)") };
      case (?profile) { profile };
    };

    let newTier = #paidTier { usedDurationMillis = 0 };

    let updatedProfile = {
      previousProfile with
      aiGenerationTier = ?newTier;
    };

    userProfiles.add(user, updatedProfile);
  };

  public query ({ caller }) func isAiStudioPurchased() : async Bool {
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.aiGenerationTier) {
          case (null) { false };
          case (?tier) {
            switch (tier) {
              case (#paidTier _) { true };
              case (#freeTier _) { false };
            };
          };
        };
      };
    };
  };

  // Chat functionality

  // Public function to post user messages (authenticated users only)
  public shared ({ caller }) func postMessage(sender : Text, message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can post messages");
    };

    let newMessage : ChatMessage = {
      sender;
      message;
      timestamp = Time.now();
      isAI = false;
    };

    // Add new message to messages list
    chatMessages.add(newMessage);

    // Limit to max messages
    if (chatMessages.size() > maxChatMessages) {
      let tempList = List.empty<ChatMessage>();
      var count = 0;
      for (msg in chatMessages.reverse().values()) {
        if (count < maxChatMessages) {
          tempList.add(msg);
        };
        count += 1;
      };
      chatMessages := tempList.reverse();
    };

    // Generate AI response
    let aiResponse = generateAIResponse(message);
    chatMessages.add(aiResponse);

    // Again, limit to max messages
    if (chatMessages.size() > maxChatMessages) {
      let tempList = List.empty<ChatMessage>();
      var count = 0;
      for (msg in chatMessages.reverse().values()) {
        if (count < maxChatMessages) {
          tempList.add(msg);
        };
        count += 1;
      };
      chatMessages := tempList.reverse();
    };
  };

  // Get latest messages (no authentication required - public chat room)
  public query func getLatestMessages(count : Nat) : async [ChatMessage] {
    let totalCount = chatMessages.size();
    let takeCount = if (count > totalCount) { totalCount } else { count };
    let slice = chatMessages.reverse().values().take(takeCount);
    slice.toArray();
  };

  // Get Older Messages (pagination support, no authentication required)
  public query func getOlderMessages(offset : Nat, count : Nat) : async [ChatMessage] {
    let totalSize = chatMessages.size();

    if (offset >= totalSize) { return [] };

    let adjustedCount = if (offset + count > totalSize) {
      totalSize - offset;
    } else {
      count;
    };

    let slice = chatMessages.reverse().values().drop(offset).take(adjustedCount);
    slice.toArray();
  };

  // Helper function to generate AI responses (internal only)
  func generateAIResponse(userMessage : Text) : ChatMessage {
    {
      sender = "AI";
      message = "AI-Placeholder: Thank you for your message: " # userMessage;
      timestamp = Time.now();
      isAI = true;
    };
  };

  // Stripe integration functions
  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfig(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfig(), caller, items, successUrl, cancelUrl, transform);
  };
};
