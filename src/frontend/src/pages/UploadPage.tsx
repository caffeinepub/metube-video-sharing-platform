import { useState, useRef, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useUploadVideo, useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, Loader2, X, Scissors } from 'lucide-react';
import { ExternalBlob, SubscriptionStatus } from '../backend';
import { toast } from 'sonner';
import type { GeneratedVideo } from '../utils/aiVideoGenerator';

interface UploadPageProps {
  onUploadSuccess: () => void;
  preselectedVideo?: GeneratedVideo | null;
  initialMetadata?: { title: string; description: string; tags: string[] } | null;
}

export default function UploadPage({ onUploadSuccess, preselectedVideo, initialMetadata }: UploadPageProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const uploadVideo = useUploadVideo();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [enableTrim, setEnableTrim] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const isAuthenticated = !!identity;
  const hasActiveSubscription = userProfile?.subscriptionStatus === SubscriptionStatus.active;

  // Handle preselected video from AI Studio
  useEffect(() => {
    if (preselectedVideo) {
      setVideoFile(preselectedVideo.file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        setTrimEnd(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.src = preselectedVideo.previewUrl;
    }
  }, [preselectedVideo]);

  // Handle initial metadata from AI Studio
  useEffect(() => {
    if (initialMetadata) {
      setTitle(initialMetadata.title);
      setDescription(initialMetadata.description);
      setTags(initialMetadata.tags);
    }
  }, [initialMetadata]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }
      setVideoFile(file);
      
      // Load video to get duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        setTrimEnd(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const trimVideo = async (file: File, start: number, end: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // For simplicity, we'll just use the original file
        // Real trimming would require MediaRecorder API or server-side processing
        toast.info('Video trimming is simulated. Full video will be uploaded.');
        resolve(file);
      };
      
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    try {
      setIsTrimming(enableTrim);
      
      let finalVideoFile = videoFile;
      if (enableTrim && trimStart > 0 || trimEnd < videoDuration) {
        toast.info('Processing video trim...');
        finalVideoFile = await trimVideo(videoFile, trimStart, trimEnd) as File;
      }
      
      setIsTrimming(false);

      const videoArrayBuffer = await finalVideoFile.arrayBuffer();
      const videoBytes = new Uint8Array(videoArrayBuffer);
      const videoBlob = ExternalBlob.fromBytes(videoBytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      let thumbnailBlob: ExternalBlob | null = null;
      if (thumbnailFile) {
        const thumbnailArrayBuffer = await thumbnailFile.arrayBuffer();
        const thumbnailBytes = new Uint8Array(thumbnailArrayBuffer);
        thumbnailBlob = ExternalBlob.fromBytes(thumbnailBytes);
      }

      await uploadVideo.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        videoBlob,
        thumbnail: thumbnailBlob,
        tags,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setThumbnailFile(null);
      setTags([]);
      setUploadProgress(0);
      setThumbnailPreview(null);
      setEnableTrim(false);
      setTrimStart(0);
      setTrimEnd(0);
      setVideoDuration(0);

      onUploadSuccess();
    } catch (error: any) {
      setUploadProgress(0);
      setIsTrimming(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please log in to upload videos</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You need an active subscription to upload videos
            </p>
            <p className="text-sm text-muted-foreground">
              Subscribe to unlock video uploads and other premium features
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video File Selection */}
          <div>
            <Label htmlFor="video">Video File *</Label>
            <div className="mt-2 space-y-2">
              {!preselectedVideo && (
                <>
                  <input
                    ref={videoInputRef}
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Video File
                  </Button>
                </>
              )}
              {videoFile && (
                <div className="text-sm text-muted-foreground">
                  Selected: {videoFile.name}
                  {preselectedVideo && (
                    <Badge variant="secondary" className="ml-2">AI Generated</Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Video Trim (optional) */}
          {videoFile && videoDuration > 0 && !preselectedVideo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableTrim"
                  checked={enableTrim}
                  onChange={(e) => setEnableTrim(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="enableTrim" className="cursor-pointer">
                  <Scissors className="inline mr-1 h-4 w-4" />
                  Enable video trimming
                </Label>
              </div>
              {enableTrim && (
                <div className="space-y-2 pl-6">
                  <div>
                    <Label htmlFor="trimStart">Start time (seconds)</Label>
                    <Input
                      id="trimStart"
                      type="number"
                      min={0}
                      max={videoDuration}
                      value={trimStart}
                      onChange={(e) => setTrimStart(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="trimEnd">End time (seconds)</Label>
                    <Input
                      id="trimEnd"
                      type="number"
                      min={trimStart}
                      max={videoDuration}
                      value={trimEnd}
                      onChange={(e) => setTrimEnd(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Duration: {videoDuration.toFixed(1)}s | Trim: {trimStart.toFixed(1)}s - {trimEnd.toFixed(1)}s
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter video description"
              rows={5}
              className="mt-1"
            />
          </div>

          {/* Thumbnail */}
          <div>
            <Label htmlFor="thumbnail">Thumbnail (optional)</Label>
            <div className="mt-2 space-y-2">
              <input
                ref={thumbnailInputRef}
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => thumbnailInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Thumbnail
              </Button>
              {thumbnailPreview && (
                <div className="w-64 h-36 bg-muted rounded overflow-hidden">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag"
                  className="flex-1"
                />
                <Button onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={
              !title.trim() ||
              !videoFile ||
              uploadVideo.isPending ||
              isTrimming
            }
            className="w-full"
            size="lg"
          >
            {uploadVideo.isPending || isTrimming ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isTrimming ? 'Processing...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
