import { useEffect, useState } from "react"
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
import { toast } from "sonner"

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
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  
  useEffect(() => {
    if (open) {
      // reset transient upload state when dialog opens
      setUploadedImageUrl("");
      setUploading(false);
    }
  }, [open]);

  const uploadImage = async (file: File) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, message: 'Upload failed' };
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const imageOption = formData.get('imageOption');
    
    let profileImage = '';
    if (imageOption === 'url') {
      profileImage = formData.get('profileImage') as string;
    } else {
      // Guard against submitting while upload in progress or missing URL
      if (uploading) {
        toast.info('Please wait for the image upload to finish');
        return;
      }
      if (!uploadedImageUrl && !initialData?.profileImage) {
        toast.error('Please upload an image or switch to URL option');
        return;
      }
      // Use uploaded URL or keep existing if editing and no new upload
      profileImage = uploadedImageUrl || initialData?.profileImage || '';
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
              maxLength={2000}
            />
            <p className="text-xs text-gray-500">Max 2000 characters</p>
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
                    // Clear uploaded preview state; rendering is controlled by state
                    setUploadedImageUrl('');
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
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) {
                      toast.error('Please select a valid image file');
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Image size must be less than 5MB');
                      return;
                    }
                    setUploading(true);
                    const result = await uploadImage(file);
                    if (result?.success) {
                      setUploadedImageUrl(result.data.url);
                      toast.success('Image uploaded');
                    } else {
                      toast.error(result?.message || 'Failed to upload image');
                    }
                    setUploading(false);
                  }}
                />
                {uploading && (
                  <p className="text-xs text-gray-500">Uploading image...</p>
                )}
                <div className="mt-4">
                  {(uploadedImageUrl || initialData?.profileImage) && (
                    <img
                      alt="Profile preview"
                      src={(uploadedImageUrl || initialData?.profileImage) as string}
                      className="max-w-[200px] max-h-[200px] object-contain rounded-full"
                    />
                  )}
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
              <Button type="submit" disabled={uploading}>
                {mode === 'add' ? 'Add Author' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
