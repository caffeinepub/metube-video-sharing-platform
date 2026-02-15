import { useState, useRef, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetVideo,
  useUpdateVideoMetadata,
  useUpdateThumbnail,
  useUpdateTags,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Upload, X, Loader2, Sparkles } from 'lucide-react';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import AiEditDialog from '../components/AiEditDialog';
import { generateAiEditSuggestions, type AiEditSuggestions } from '../utils/aiEditHeuristics';

interface VideoEditPageProps {
  videoId: bigint;
  onBackToStudio: () => void;
  onBackToHome: () => void;
}

export default function VideoEditPage({
  videoId,
  onBackToStudio,
  onBackToHome,
}: VideoEditPageProps) {
  const { identity } = useInternetIdentity();
  const { data: video, isLoading } = useGetVideo(videoId);
  const updateMetadata = useUpdateVideoMetadata();
  const updateThumbnail = useUpdateThumbnail();
  const updateTags = useUpdateTags();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiEditSuggestions | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description);
      setTags(video.tags || []);
      if (video.thumbnail) {
        setThumbnailPreview(video.thumbnail.getDirectURL());
      }
    }
  }, [video]);

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

  const handleAiEdit = () => {
    const suggestions = generateAiEditSuggestions(title, description, tags);
    setAiSuggestions(suggestions);
    setAiDialogOpen(true);
  };

  const handleApplySuggestion = (field: 'title' | 'description' | 'tags' | 'all', value: any) => {
    if (field === 'all' && aiSuggestions) {
      setTitle(aiSuggestions.title);
      setDescription(aiSuggestions.description);
      setTags(aiSuggestions.tags);
    } else if (field === 'title') {
      setTitle(value);
    } else if (field === 'description') {
      setDescription(value);
    } else if (field === 'tags') {
      setTags(value);
    }
  };

  const handleSaveMetadata = async () => {
    if (!title.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    try {
      await updateMetadata.mutateAsync({
        videoId,
        newTitle: title,
        newDescription: description,
      });
    } catch (error: any) {
      // Error already handled by mutation
    }
  };

  const handleSaveThumbnail = async () => {
    if (!thumbnailFile) {
      toast.error('Please select a thumbnail image');
      return;
    }

    try {
      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      await updateThumbnail.mutateAsync({
        videoId,
        newThumbnail: blob,
      });

      setThumbnailFile(null);
      setUploadProgress(0);
    } catch (error: any) {
      setUploadProgress(0);
    }
  };

  const handleSaveTags = async () => {
    try {
      await updateTags.mutateAsync({
        videoId,
        newTags: tags,
      });
    } catch (error: any) {
      // Error already handled by mutation
    }
  };

  if (!identity) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBackToHome}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Video</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please log in to edit videos</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBackToStudio}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Video</h1>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBackToStudio}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Video</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Video not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBackToStudio}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Video</h1>
      </div>

      <div className="space-y-6">
        {/* Title and Description */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Video Details</CardTitle>
              <Button variant="outline" onClick={handleAiEdit}>
                <Sparkles className="mr-2 h-4 w-4" />
                AI Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                className="mt-1"
              />
            </div>
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
            <Button
              onClick={handleSaveMetadata}
              disabled={updateMetadata.isPending || !title.trim()}
            >
              {updateMetadata.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Details
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Thumbnail */}
        <Card>
          <CardHeader>
            <CardTitle>Thumbnail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-64 h-36 bg-muted rounded overflow-hidden flex-shrink-0">
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
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
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Thumbnail
                </Button>
                {thumbnailFile && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Selected: {thumbnailFile.name}
                    </p>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                    <Button
                      onClick={handleSaveThumbnail}
                      disabled={updateThumbnail.isPending}
                    >
                      {updateThumbnail.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Thumbnail
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
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
            <Button onClick={handleSaveTags} disabled={updateTags.isPending}>
              {updateTags.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Tags
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {aiSuggestions && (
        <AiEditDialog
          open={aiDialogOpen}
          onOpenChange={setAiDialogOpen}
          suggestions={aiSuggestions}
          currentTitle={title}
          currentDescription={description}
          currentTags={tags}
          onApply={handleApplySuggestion}
        />
      )}
    </div>
  );
}
