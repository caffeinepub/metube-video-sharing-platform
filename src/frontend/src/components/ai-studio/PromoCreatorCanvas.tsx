import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Download, Type, Eraser, Save } from 'lucide-react';
import { toast } from 'sonner';
import { exportCanvasAsPNG } from '../../utils/canvasExport';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface PromoCreatorCanvasProps {
  baseImage: string | null;
  onSave?: (imageUrl: string, title: string, description: string, tags: string[]) => void;
}

export default function PromoCreatorCanvas({ baseImage, onSave }: PromoCreatorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState([48]);
  const [isErasing, setIsErasing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveTags, setSaveTags] = useState('');

  useEffect(() => {
    renderCanvas();
  }, [baseImage, headline, subheadline, textColor, fontSize]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base image if available
    if (baseImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawText(ctx, canvas.width, canvas.height);
      };
      img.src = baseImage;
    } else {
      // Default background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawText(ctx, canvas.width, canvas.height);
    }
  };

  const drawText = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Headline
    if (headline) {
      ctx.font = `bold ${fontSize[0]}px sans-serif`;
      ctx.fillText(headline, width / 2, height * 0.4);
    }

    // Subheadline
    if (subheadline) {
      ctx.font = `${fontSize[0] * 0.6}px sans-serif`;
      ctx.fillText(subheadline, width / 2, height * 0.55);
    }
  };

  const handleErase = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple erase: clear a portion of the canvas
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.2);
    ctx.globalCompositeOperation = 'source-over';

    toast.success('Background area erased');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      exportCanvasAsPNG(canvas, 'promo.png');
      toast.success('Promo downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download promo');
    }
  };

  const handleSaveClick = () => {
    if (!baseImage && !headline && !subheadline) {
      toast.error('Please add content before saving');
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;

    const imageUrl = canvas.toDataURL('image/png');
    const tags = saveTags.split(',').map(t => t.trim()).filter(Boolean);

    onSave(imageUrl, saveTitle || 'Untitled Promo', saveDescription, tags);
    setShowSaveDialog(false);
    setSaveTitle('');
    setSaveDescription('');
    setSaveTags('');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Promo Creator</CardTitle>
          <CardDescription>
            Add text overlays and edit your image to create promotional content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-muted">
            <canvas
              ref={canvasRef}
              width={1024}
              height={1024}
              className="w-full h-auto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                placeholder="Enter headline..."
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subheadline">Subheadline</Label>
              <Input
                id="subheadline"
                placeholder="Enter subheadline..."
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size: {fontSize[0]}px</Label>
              <Slider
                id="fontSize"
                min={24}
                max={120}
                step={4}
                value={fontSize}
                onValueChange={setFontSize}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleErase} variant="outline">
              <Eraser className="mr-2 h-4 w-4" />
              Remove Background Area
            </Button>

            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>

            {onSave && (
              <Button onClick={handleSaveClick} variant="default">
                <Save className="mr-2 h-4 w-4" />
                Save to Library
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Library</DialogTitle>
            <DialogDescription>
              Add details about your promo image
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="saveTitle">Title</Label>
              <Input
                id="saveTitle"
                placeholder="My Promo"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saveDescription">Description</Label>
              <Textarea
                id="saveDescription"
                placeholder="Describe your promo..."
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saveTags">Tags (comma-separated)</Label>
              <Input
                id="saveTags"
                placeholder="promo, marketing, social"
                value={saveTags}
                onChange={(e) => setSaveTags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
