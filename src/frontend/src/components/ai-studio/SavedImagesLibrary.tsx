import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Trash2, ExternalLink, Download } from 'lucide-react';
import { useGetSavedImages, useDeleteSavedImage } from '../../hooks/useQueries';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { downloadImageAsPNG, sanitizeFilename } from '../../utils/download';

interface SavedImagesLibraryProps {
  onReopen: (imageUrl: string) => void;
}

export default function SavedImagesLibrary({ onReopen }: SavedImagesLibraryProps) {
  const { data: savedImages, isLoading } = useGetSavedImages();
  const deleteImageMutation = useDeleteSavedImage();

  const handleDelete = async (imageUrl: string) => {
    try {
      await deleteImageMutation.mutateAsync(imageUrl);
    } catch (error: any) {
      // Error already handled by mutation
    }
  };

  const handleDownload = async (imageUrl: string, title: string) => {
    try {
      const filename = sanitizeFilename(title) || 'saved-image';
      await downloadImageAsPNG(imageUrl, filename);
      toast.success('Image downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to download image');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Images Library</CardTitle>
          <CardDescription>Loading your saved images...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!savedImages || savedImages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Images Library</CardTitle>
          <CardDescription>Your saved promo images will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No saved images yet</p>
            <p className="text-sm mt-2">Create and save images from the Promo Creator</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Images Library</CardTitle>
        <CardDescription>
          {savedImages.length} saved {savedImages.length === 1 ? 'image' : 'images'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedImages.map((image, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="aspect-square bg-muted relative">
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold truncate">{image.title}</h3>
                {image.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {image.description}
                  </p>
                )}
                {image.tags && image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {image.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-muted px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReopen(image.imageUrl)}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(image.imageUrl, image.title)}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{image.title}" from your library.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(image.imageUrl)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
