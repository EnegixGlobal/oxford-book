import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "./textarea"

interface AuthorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  initialData?: any
  onSubmit: (data: any) => void
}

export function AuthorFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit
}: AuthorFormDialogProps) {
  const [imageOption, setImageOption] = useState<'url' | 'file'>(initialData?.imageFile ? 'file' : 'url');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const imageOption = formData.get('imageOption');
    
    let profileImage = '';
    if (imageOption === 'url') {
      profileImage = formData.get('profileImage') as string;
    } else {
      const imageFile = formData.get('imageFile') as File;
      if (imageFile && imageFile.size > 0) {
        // Here you would typically upload the file to your storage service
        // For now, we'll create a temporary URL for demo purposes
        profileImage = URL.createObjectURL(imageFile);
        // In production, you would upload the file and get a URL back
        // const uploadedUrl = await uploadImage(imageFile);
        // profileImage = uploadedUrl;
      }
    }

    const data = {
      id: initialData?.id || Date.now(),
      name: formData.get('name'),
      nationality: formData.get('nationality'),
      biography: formData.get('biography'),
      featured: formData.get('featured') === 'on',
      books: initialData?.books || 0,
      profileImage: profileImage
    };
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] h-[90vh] max-h-[800px] flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Author' : 'Edit Author'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Add a new author to your catalog.' : 'Make changes to author details.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-4">
          <div className="space-y-2">
            <Label htmlFor="name">Author Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData?.name}
              placeholder="Enter author name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              name="nationality"
              defaultValue={initialData?.nationality}
              placeholder="Enter nationality"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="biography">Biography</Label>
            <Textarea
              id="biography"
              name="biography"
              defaultValue={initialData?.biography}
              placeholder="Enter author biography"
              className="h-32"
            />
          </div>

          <div className="space-y-4">
            <Label>Profile Image</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Input
                  type="radio"
                  id="imageUrlOption"
                  name="imageOption"
                  value="url"
                  className="h-4 w-4"
                  checked={imageOption === 'url'}
                  onChange={() => {
                    setImageOption('url');
                    const fileInput = document.getElementById('imageFile') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                    const preview = document.getElementById('imagePreview') as HTMLImageElement;
                    if (preview) preview.style.display = 'none';
                  }}
                />
                <Label htmlFor="imageUrlOption" className="ml-2">URL</Label>
              </div>
              <div className="flex items-center">
                <Input
                  type="radio"
                  id="imageFileOption"
                  name="imageOption"
                  value="file"
                  className="h-4 w-4"
                  checked={imageOption === 'file'}
                  onChange={() => {
                    setImageOption('file');
                    const urlInput = document.getElementById('profileImage') as HTMLInputElement;
                    if (urlInput) urlInput.value = '';
                  }}
                />
                <Label htmlFor="imageFileOption" className="ml-2">Upload File</Label>
              </div>
            </div>
            
            {imageOption === 'url' ? (
              <div className="space-y-2">
                <Input
                  id="profileImage"
                  name="profileImage"
                  defaultValue={initialData?.profileImage}
                  placeholder="Enter profile image URL"
                  className="mt-2"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  id="imageFile"
                  name="imageFile"
                  type="file"
                  accept="image/*"
                  className="mt-2"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const preview = document.getElementById('imagePreview') as HTMLImageElement;
                        if (preview && e.target?.result) {
                          preview.src = e.target.result as string;
                          preview.style.display = 'block';
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div id="imagePreviewContainer" className="mt-4">
                  <img
                    id="imagePreview"
                    alt="Profile preview"
                    className="max-w-[200px] max-h-[200px] object-contain hidden rounded-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              name="featured"
              defaultChecked={initialData?.featured}
            />
            <Label htmlFor="featured">Featured Author</Label>
          </div>

          <div className="sticky bottom-0 bg-white pt-4 dark:bg-gray-950">
            <DialogFooter>
              <Button type="submit">
                {mode === 'add' ? 'Add Author' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
