import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Sparkles, Upload, Save, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { generateImage, type ImageStyle } from '../../utils/aiImageGenerator';
import { ensureLocalOnly } from '../../utils/networkGuards';
import PromoCreatorCanvas from './PromoCreatorCanvas';
import SavedImagesLibrary from './SavedImagesLibrary';
import { useSaveImage } from '../../hooks/useQueries';

export default function ImagesPicturesSection() {
  const [activeTab, setActiveTab] = useState<'generate' | 'promo' | 'library'>('generate');
  
  // Generation state
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<ImageStyle>('poster');
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

  const handleSaveToLibrary = async (imageUrl: string, title: string, description: string, tags: string[]) => {
    try {
      await saveImageMutation.mutateAsync({
        imageUrl,
        title,
        description,
        tags,
      });
      toast.success('Image saved to library');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save image');
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
                    <SelectItem value="poster">Poster</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="vibrant">Vibrant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? `Generating... ${generationProgress}%` : 'Generate Image'}
              </Button>

              {generatedImage && (
                <div className="space-y-2">
                  <Label>Generated Image</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={generatedImage}
                      alt="Generated"
                      className="w-full h-auto"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setPromoImage(generatedImage);
                      setActiveTab('promo');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    Edit in Promo Creator
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>
                Upload your own image to use in the promo creator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upload">Select Image</Label>
                <Input
                  id="upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>

              {uploadedImage && (
                <div className="space-y-2">
                  <Label>Uploaded Image</Label>
                  <div className="border rounded-lg overflow-hidden max-h-64">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-auto"
                    />
                  </div>
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
