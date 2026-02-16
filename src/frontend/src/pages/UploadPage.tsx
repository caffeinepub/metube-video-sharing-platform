import { useState, useRef, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useUploadVideo } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle, Crown, X, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import { Slider } from '@/components/ui/slider';
import { validateUploadMetadata } from '../utils/uploadModeration';

interface UploadPageProps {
  prefilledVideo?: { blob: Blob; url: string };
  prefilledMetadata?: { title: string; description: string; tags: string[] };
  onUploadComplete?: () => void;
}

export default function UploadPage({ prefilledVideo, prefilledMetadata, onUploadComplete }: UploadPageProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const uploadMutation = useUploadVideo();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(prefilledVideo?.url || null);
  const [title, setTitle] = useState(prefilledMetadata?.title || '');
  const [description, setDescription] = useState(prefilledMetadata?.description || '');
  const [tags, setTags] = useState<string[]>(prefilledMetadata?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState<number | null>(null);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Trimming state
  const [enableTrim, setEnableTrim] = useState(false);
  const [trimStart, setTrimStart] = useState([0]);
  const [trimEnd, setTrimEnd] = useState([10]);
  const [videoDuration, setVideoDuration] = useState(10);
  const [isTrimming, setIsTrimming] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = !!identity;
  const isPremium = userProfile?.subscriptionStatus === 'active';

  useEffect(() => {
    if (prefilledVideo) {
      setVideoFile(new File([prefilledVideo.blob], 'generated-video.webm', { type: 'video/webm' }));
    }
  }, [prefilledVideo]);

  useEffect(() => {
    if (videoFile && videoRef.current) {
      const video = videoRef.current;
      video.onloadedmetadata = () => {
        const duration = video.duration;
        setVideoDuration(duration);
        setTrimEnd([duration]);
      };
    }
  }, [videoFile, videoPreviewUrl]);

  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
            <CardDescription>Please log in to upload videos</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              Premium Feature
            </CardTitle>
            <CardDescription>
              Video uploads are available for premium subscribers only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Upgrade to premium to upload your videos and share them with the community.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    generateThumbnails(file);
  };

  const generateThumbnails = async (file: File) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;

    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    const thumbnails: string[] = [];
    const duration = video.duration;
    const positions = [0.1, 0.3, 0.5, 0.7, 0.9];

    for (const pos of positions) {
      video.currentTime = duration * pos;
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });

      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      thumbnails.push(canvas.toDataURL('image/jpeg', 0.8));
    }

    setGeneratedThumbnails(thumbnails);
    URL.revokeObjectURL(video.src);
  };

  const handleThumbnailSelect = (index: number) => {
    setSelectedThumbnailIndex(index);
    setThumbnailPreviewUrl(generatedThumbnails[index]);
    setThumbnailFile(null);
  };

  const handleCustomThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setThumbnailFile(file);
    const url = URL.createObjectURL(file);
    setThumbnailPreviewUrl(url);
    setSelectedThumbnailIndex(null);
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const trimVideo = async (file: File, start: number, end: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;

      video.onloadedmetadata = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8',
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          URL.revokeObjectURL(video.src);
          resolve(blob);
        };

        video.currentTime = start;
        video.onseeked = () => {
          mediaRecorder.start();
          video.play();
        };

        video.ontimeupdate = () => {
          if (video.currentTime >= end) {
            video.pause();
            mediaRecorder.stop();
          } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        };
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };
    });
  };

  const handleUpload = async () => {
    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    // Validate metadata for sexually explicit content
    const validation = validateUploadMetadata({
      title: title.trim(),
      description: description.trim(),
      tags,
    });

    if (!validation.allowed) {
      toast.error(validation.error || 'Content not allowed');
      return;
    }

    try {
      setIsTrimming(true);
      let finalVideoBlob: Blob = videoFile;

      if (enableTrim && trimStart[0] > 0 || trimEnd[0] < videoDuration) {
        toast.info('Trimming video...');
        finalVideoBlob = await trimVideo(videoFile, trimStart[0], trimEnd[0]);
      }

      setIsTrimming(false);

      const videoBytes = new Uint8Array(await finalVideoBlob.arrayBuffer());
      const videoBlob = ExternalBlob.fromBytes(videoBytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      let thumbnailBlob: ExternalBlob | null = null;
      if (thumbnailFile) {
        const thumbnailBytes = new Uint8Array(await thumbnailFile.arrayBuffer());
        thumbnailBlob = ExternalBlob.fromBytes(thumbnailBytes);
      } else if (selectedThumbnailIndex !== null) {
        const response = await fetch(generatedThumbnails[selectedThumbnailIndex]);
        const blob = await response.blob();
        const thumbnailBytes = new Uint8Array(await blob.arrayBuffer());
        thumbnailBlob = ExternalBlob.fromBytes(thumbnailBytes);
      }

      await uploadMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        videoBlob,
        thumbnail: thumbnailBlob,
        tags,
      });

      setVideoFile(null);
      setVideoPreviewUrl(null);
      setTitle('');
      setDescription('');
      setTags([]);
      setThumbnailFile(null);
      setThumbnailPreviewUrl(null);
      setSelectedThumbnailIndex(null);
      setGeneratedThumbnails([]);
      setUploadProgress(0);
      setEnableTrim(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      // Error already shown by mutation or validation
    } finally {
      setIsTrimming(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Upload className="h-8 w-8 text-primary" />
            Upload Video
          </h1>
          <p className="text-muted-foreground mt-1">
            Share your content with the community
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Crown className="h-4 w-4" />
          Premium
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Video File</CardTitle>
          <CardDescription>Select a video file to upload</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="videoFile">Video File *</Label>
            <Input
              ref={fileInputRef}
              id="videoFile"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={!!prefilledVideo}
            />
          </div>

          {videoPreviewUrl && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  src={videoPreviewUrl}
                  controls
                  className="w-full"
                  style={{ maxHeight: '400px' }}
                />
              </div>

              {!prefilledVideo && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableTrim"
                      checked={enableTrim}
                      onChange={(e) => setEnableTrim(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="enableTrim" className="flex items-center gap-2 cursor-pointer">
                      <Scissors className="h-4 w-4" />
                      Enable video trimming
                    </Label>
                  </div>

                  {enableTrim && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label>
                          Start Time: {trimStart[0].toFixed(1)}s
                        </Label>
                        <Slider
                          value={trimStart}
                          onValueChange={setTrimStart}
                          min={0}
                          max={videoDuration}
                          step={0.1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          End Time: {trimEnd[0].toFixed(1)}s
                        </Label>
                        <Slider
                          value={trimEnd}
                          onValueChange={setTrimEnd}
                          min={0}
                          max={videoDuration}
                          step={0.1}
                        />
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Trimmed duration: {(trimEnd[0] - trimStart[0]).toFixed(1)}s
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video Details</CardTitle>
          <CardDescription>Add information about your video</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Content Policy:</strong> Sexually explicit content is not permitted. Please ensure your video metadata (title, description, tags) complies with our community guidelines.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter video title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {generatedThumbnails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Thumbnail</CardTitle>
            <CardDescription>Select or upload a thumbnail for your video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {generatedThumbnails.map((thumb, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailSelect(index)}
                  className={`border-2 rounded-lg overflow-hidden transition-all ${
                    selectedThumbnailIndex === index
                      ? 'border-primary ring-2 ring-primary'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <img src={thumb} alt={`Thumbnail ${index + 1}`} className="w-full h-auto" />
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customThumbnail">Or upload custom thumbnail</Label>
              <Input
                id="customThumbnail"
                type="file"
                accept="image/*"
                onChange={handleCustomThumbnail}
              />
            </div>

            {thumbnailPreviewUrl && (
              <div className="border rounded-lg overflow-hidden max-w-xs">
                <img src={thumbnailPreviewUrl} alt="Selected thumbnail" className="w-full h-auto" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleUpload}
        disabled={!videoFile || !title.trim() || uploadMutation.isPending || isTrimming}
        className="w-full"
        size="lg"
      >
        <Upload className="mr-2 h-5 w-5" />
        {isTrimming ? 'Trimming Video...' : uploadMutation.isPending ? 'Uploading...' : 'Upload Video'}
      </Button>
    </div>
  );
}
