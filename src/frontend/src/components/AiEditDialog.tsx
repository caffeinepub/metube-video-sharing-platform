import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, X } from 'lucide-react';
import type { AiEditSuggestions } from '../utils/aiEditHeuristics';

interface AiEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: AiEditSuggestions;
  currentTitle: string;
  currentDescription: string;
  currentTags: string[];
  onApply: (field: 'title' | 'description' | 'tags' | 'all', value: any) => void;
}

export default function AiEditDialog({
  open,
  onOpenChange,
  suggestions,
  currentTitle,
  currentDescription,
  currentTags,
  onApply,
}: AiEditDialogProps) {
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());

  const handleApplyField = (field: 'title' | 'description' | 'tags') => {
    const value = suggestions[field];
    onApply(field, value);
    setAppliedFields(prev => new Set(prev).add(field));
  };

  const handleApplyAll = () => {
    onApply('all', suggestions);
    setAppliedFields(new Set(['title', 'description', 'tags']));
  };

  const handleClose = () => {
    setAppliedFields(new Set());
    onOpenChange(false);
  };

  const titleChanged = suggestions.title !== currentTitle;
  const descriptionChanged = suggestions.description !== currentDescription;
  const tagsChanged = JSON.stringify(suggestions.tags.sort()) !== JSON.stringify(currentTags.sort());

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Edit Suggestions
          </DialogTitle>
          <DialogDescription>
            Review and apply suggested improvements to your video metadata
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title Suggestion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Title</Label>
              {titleChanged && !appliedFields.has('title') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApplyField('title')}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Apply
                </Button>
              )}
              {appliedFields.has('title') && (
                <Badge variant="secondary" className="text-xs">
                  <Check className="mr-1 h-3 w-3" />
                  Applied
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Current:</div>
              <Input value={currentTitle} disabled className="bg-muted" />
              {titleChanged && (
                <>
                  <div className="text-sm text-muted-foreground">Suggested:</div>
                  <Input value={suggestions.title} disabled className="bg-primary/10" />
                </>
              )}
              {!titleChanged && (
                <p className="text-sm text-muted-foreground italic">No changes suggested</p>
              )}
            </div>
          </div>

          {/* Description Suggestion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              {descriptionChanged && !appliedFields.has('description') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApplyField('description')}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Apply
                </Button>
              )}
              {appliedFields.has('description') && (
                <Badge variant="secondary" className="text-xs">
                  <Check className="mr-1 h-3 w-3" />
                  Applied
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Current:</div>
              <Textarea value={currentDescription} disabled rows={3} className="bg-muted" />
              {descriptionChanged && (
                <>
                  <div className="text-sm text-muted-foreground">Suggested:</div>
                  <Textarea value={suggestions.description} disabled rows={3} className="bg-primary/10" />
                </>
              )}
              {!descriptionChanged && (
                <p className="text-sm text-muted-foreground italic">No changes suggested</p>
              )}
            </div>
          </div>

          {/* Tags Suggestion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tags</Label>
              {tagsChanged && !appliedFields.has('tags') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApplyField('tags')}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Apply
                </Button>
              )}
              {appliedFields.has('tags') && (
                <Badge variant="secondary" className="text-xs">
                  <Check className="mr-1 h-3 w-3" />
                  Applied
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Current:</div>
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md min-h-[40px]">
                {currentTags.length > 0 ? (
                  currentTags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </div>
              {tagsChanged && (
                <>
                  <div className="text-sm text-muted-foreground">Suggested:</div>
                  <div className="flex flex-wrap gap-2 p-3 bg-primary/10 rounded-md min-h-[40px]">
                    {suggestions.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
              {!tagsChanged && (
                <p className="text-sm text-muted-foreground italic">No changes suggested</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          {(titleChanged || descriptionChanged || tagsChanged) && (
            <Button onClick={handleApplyAll}>
              <Check className="mr-2 h-4 w-4" />
              Apply All Suggestions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
