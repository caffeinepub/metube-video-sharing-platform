import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Sparkles, Upload, Save, Palette, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateImage, type ImageStyle, type SubjectGender } from '../../utils/aiImageGenerator';
import { ensureLocalOnly } from '../../utils/networkGuards';
import PromoCreatorCanvas from './PromoCreatorCanvas';
import SavedImagesLibrary from './SavedImagesLibrary';
import { useSaveImage } from '../../hooks/useQueries';
import { downloadDataUrlAsPNG, generateFilenameWithTimestamp } from '../../utils/download';
import { validateUploadMetadata } from '../../utils/uploadModeration';

export default function ImagesPicturesSection() {
  const [activeTab, setActiveTab] = useState<'generate' | 'promo' | 'library'>('generate');
  
  // Generation state
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<ImageStyle>('poster');
  const [subjectGender, setSubjectGender] = useState<SubjectGender>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Promo creator state
  const [promoImage, setPromoImage] = useState<string | null>(null);

  const saveImageMutation = useSaveImage();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImage(dataUrl);
      setPromoImage(dataUrl);
      toast.success('Image uploaded successfully');
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    ensureLocalOnly('Image Generation');
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const imageUrl = await generateImage({
        prompt: prompt.trim(),
        style,
        subjectGender,
        width: 1024,
        height: 1024,
        onProgress: setGenerationProgress,
      });

      setGeneratedImage(imageUrl);
      setPromoImage(imageUrl);
      toast.success('Image generated successfully!');
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleDownloadGeneratedImage = () => {
    if (!generatedImage) return;

    try {
      const filename = generateFilenameWithTimestamp('metube-ai-image', 'png');
      downloadDataUrlAsPNG(generatedImage, filename);
      toast.success('Image downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to download image');
    }
  };

  const handleDeleteGeneratedImage = () => {
    setGeneratedImage(null);
    setPromoImage(null);
    toast.success('Generated image cleared');
  };

  const handleSaveToLibrary = async (imageUrl: string, title: string, description: string, tags: string[]) => {
    // Validate metadata before saving
    const validation = validateUploadMetadata({ title, description, tags });
    if (!validation.allowed) {
      toast.error(validation.error || 'Content not allowed');
      throw new Error(validation.error);
    }

    try {
      await saveImageMutation.mutateAsync({
        imageUrl,
        title,
        description,
        tags,
      });
      toast.success('Image saved to library');
    } catch (error: any) {
      // Error already shown by mutation or validation
      throw error;
    }
  };

  const handleReopenFromLibrary = (imageUrl: string) => {
    setPromoImage(imageUrl);
    setActiveTab('promo');
    toast.success('Image loaded into promo creator');
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="promo">
            <Palette className="mr-2 h-4 w-4" />
            Promo Creator
          </TabsTrigger>
          <TabsTrigger value="library">
            <Image className="mr-2 h-4 w-4" />
            Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Image</CardTitle>
              <CardDescription>
                Create AI-generated images for free using prompts and style variants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt *</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the image you want to create..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={(val) => setStyle(val as ImageStyle)}>
                  <SelectTrigger id="style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="poster">Poster</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="vibrant">Vibrant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectGender">Subject Gender</Label>
                <Select value={subjectGender} onValueChange={(val) => setSubjectGender(val as SubjectGender)}>
                  <SelectTrigger id="subjectGender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (detect from prompt)</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="woman">Woman</SelectItem>
                    <SelectItem value="man">Man</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Controls subject representation in portrait style. Auto mode detects gender from prompt terms like "woman" or "man" (ignoring explicit keywords).
                </p>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating...</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate Image'}
              </Button>
            </CardContent>
          </Card>

          {generatedImage && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Image</CardTitle>
                <CardDescription>
                  Your image is ready! Download it or edit in Promo Creator.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-auto"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleDownloadGeneratedImage} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG
                  </Button>
                  <Button onClick={handleDeleteGeneratedImage} variant="outline">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <Button onClick={() => setActiveTab('promo')} variant="default">
                    <Palette className="mr-2 h-4 w-4" />
                    Edit in Promo Creator
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>
                Upload your own image to edit in Promo Creator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fileUpload">Select Image File</Label>
                <Input
                  id="fileUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>

              {uploadedImage && (
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promo">
          <PromoCreatorCanvas
            baseImage={promoImage}
            onSave={handleSaveToLibrary}
          />
        </TabsContent>

        <TabsContent value="library">
          <SavedImagesLibrary onReopen={handleReopenFromLibrary} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
