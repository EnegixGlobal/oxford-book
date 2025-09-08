import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "./textarea"
import { Switch } from "./switch"

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  initialData?: any
  onSubmit: (data: any) => void
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit
}: CategoryFormDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      featured: formData.get('featured') === 'true',
    };
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Category' : 'Edit Category'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Add a new category to organize books.' : 'Make changes to the category.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData?.name}
              placeholder="Enter category name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData?.description}
              placeholder="Enter category description"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="featured">Featured Category</Label>
            <Switch
              id="featured"
              name="featured"
              defaultChecked={initialData?.featured}
              onCheckedChange={(checked) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'featured';
                input.value = checked.toString();
                const form = document.querySelector('form');
                form?.appendChild(input);
              }}
            />
          </div>
          <DialogFooter>
            <Button type="submit">{mode === 'add' ? 'Add Category' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
