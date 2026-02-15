import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Eye, Image as ImageIcon } from 'lucide-react';
import { useGetSavedImages, useDeleteSavedImage } from '../../hooks/useQueries';
import { Badge } from '@/components/ui/badge';

interface SavedImagesLibraryProps {
  onReopen: (imageUrl: string) => void;
}

export default function SavedImagesLibrary({ onReopen }: SavedImagesLibraryProps) {
  const { data: savedImages, isLoading } = useGetSavedImages();
  const deleteImageMutation = useDeleteSavedImage();

  const handleDelete = async (imageUrl: string) => {
    try {
      await deleteImageMutation.mutateAsync(imageUrl);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading library...</p>
        </CardContent>
      </Card>
    );
  }

  if (!savedImages || savedImages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Images Library</CardTitle>
          <CardDescription>
            Your saved promo images will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No saved images yet</p>
            <p className="text-sm">Create and save images to build your library</p>
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
                {image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {image.tags.slice(0, 3).map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReopen(image.imageUrl)}
                    className="flex-1"
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    Open
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deleteImageMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Image</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{image.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(image.imageUrl)}>
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
