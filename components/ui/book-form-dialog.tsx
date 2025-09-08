import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { sampleBooks } from "@/lib/sampleData"

// Extract unique categories and subcategories from sample books
const categoriesMap = sampleBooks.reduce((acc, book) => {
  if (!acc[book.category]) {
    acc[book.category] = new Set();
  }
  if (book.subcategory) {
    acc[book.category].add(book.subcategory);
  }
  return acc;
}, {} as Record<string, Set<string>>);

// Convert to array structure
const categories = Object.entries(categoriesMap).map(([category, subcategories]) => ({
  id: category,
  name: category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
  subcategories: Array.from(subcategories).map(sub => ({
    id: sub,
    name: sub.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
  }))
}));

interface BookFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  initialData?: any
  onSubmit: (data: any) => void
}

export function BookFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit
}: BookFormDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.category || '');
  const [availableSubcategories, setAvailableSubcategories] = useState<Array<{ id: string; name: string }>>([]);
  const [imageOption, setImageOption] = useState<'url' | 'file'>(initialData?.imageFile ? 'file' : 'url');

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(cat => cat.id === selectedCategory);
      setAvailableSubcategories(category?.subcategories || []);
    } else {
      setAvailableSubcategories([]);
    }
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const imageOption = formData.get('imageOption');
    
    let coverImage = '';
    if (imageOption === 'url') {
      coverImage = formData.get('coverImage') as string;
    } else {
      const imageFile = formData.get('imageFile') as File;
      if (imageFile && imageFile.size > 0) {
        // Here you would typically upload the file to your storage service
        // For now, we'll create a temporary URL for demo purposes
        coverImage = URL.createObjectURL(imageFile);
        // In production, you would upload the file and get a URL back
        // const uploadedUrl = await uploadImage(imageFile);
        // coverImage = uploadedUrl;
      }
    }

    const originalPrice = Number(formData.get('originalPrice'));
    const discount = Number(formData.get('discount'));
    const finalPrice = Number(formData.get('finalPrice'));

    const data = {
      title: formData.get('title'),
      author: formData.get('author'),
      description: formData.get('description'),
      stock: formData.get('stock'),
      coverImage: coverImage,
      category: formData.get('category'),
      subcategory: formData.get('subcategory'),
      inStock: Number(formData.get('stock')) > 0,
      mrp: originalPrice,
      discountedPrice: finalPrice,
      discount: discount,
      isbn: formData.get('isbn'),
      publisher: formData.get('publisher'),
      binding: formData.get('binding'),
      language: formData.get('language'),
      rating: 0,
      reviewCount: 0,
      featured: false
    };
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] h-[90vh] max-h-[800px] flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Book' : 'Edit Book'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Add a new book to your inventory.' : 'Make changes to the book details.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-4 pb-20">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initialData?.title}
              placeholder="Enter book title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              name="author"
              defaultValue={initialData?.author}
              placeholder="Enter author name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN</Label>
            <Input
              id="isbn"
              name="isbn"
              defaultValue={initialData?.isbn}
              placeholder="Enter ISBN (e.g., 978-0-123456-47-2)"
              required
              pattern="^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$"
              title="Enter a valid ISBN-10 or ISBN-13 number"
              onChange={(e) => {
                // Remove all non-digit and non-X characters
                let value = e.target.value.replace(/[^0-9X]/g, '');
                // Format ISBN-13
                if (value.length <= 13) {
                  if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3);
                  if (value.length > 4) value = value.slice(0, 5) + '-' + value.slice(5);
                  if (value.length > 8) value = value.slice(0, 9) + '-' + value.slice(9);
                  if (value.length > 12) value = value.slice(0, 13) + '-' + value.slice(13);
                }
                e.target.value = value;
              }}
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter ISBN-10 or ISBN-13 without hyphens. Hyphens will be added automatically.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price (MRP)</Label>
              <Input
                id="originalPrice"
                name="originalPrice"
                type="number"
                step="0.01"
                defaultValue={initialData?.mrp || initialData?.price}
                placeholder="Enter original price"
                required
                onChange={(e) => {
                  const originalPrice = parseFloat(e.target.value);
                  const discountInput = document.getElementById('discount') as HTMLInputElement;
                  const finalPriceInput = document.getElementById('finalPrice') as HTMLInputElement;
                  if (discountInput && finalPriceInput && originalPrice) {
                    const discount = parseFloat(discountInput.value) || 0;
                    const finalPrice = originalPrice - (originalPrice * discount / 100);
                    finalPriceInput.value = finalPrice.toFixed(2);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                name="discount"
                type="number"
                min="0"
                max="100"
                step="0.1"
                defaultValue={initialData?.discount || ((initialData?.mrp && initialData?.discountedPrice) 
                  ? ((initialData.mrp - initialData.discountedPrice) / initialData.mrp * 100).toFixed(1)
                  : "0")}
                placeholder="Enter discount percentage"
                onChange={(e) => {
                  const discount = parseFloat(e.target.value);
                  const originalPriceInput = document.getElementById('originalPrice') as HTMLInputElement;
                  const finalPriceInput = document.getElementById('finalPrice') as HTMLInputElement;
                  if (originalPriceInput && finalPriceInput) {
                    const originalPrice = parseFloat(originalPriceInput.value);
                    if (originalPrice) {
                      const finalPrice = originalPrice - (originalPrice * discount / 100);
                      finalPriceInput.value = finalPrice.toFixed(2);
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="finalPrice">Final Price</Label>
              <Input
                id="finalPrice"
                name="finalPrice"
                type="number"
                step="0.01"
                defaultValue={initialData?.discountedPrice || initialData?.price}
                placeholder="Final price after discount"
                required
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                defaultValue={initialData?.stock}
                placeholder="Enter stock"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData?.description}
              placeholder="Enter book description"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              name="category"
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Select
              name="subcategory"
              disabled={!selectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subcategory" />
              </SelectTrigger>
              <SelectContent>
                {availableSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              name="publisher"
              defaultValue={initialData?.publisher}
              placeholder="Enter publisher name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="binding">Binding</Label>
            <Select name="binding" defaultValue={initialData?.binding}>
              <SelectTrigger>
                <SelectValue placeholder="Select binding type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hardcover">Hardcover</SelectItem>
                <SelectItem value="paperback">Paperback</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select name="language" defaultValue={initialData?.language}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="marathi">Marathi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            <Label>Cover Image</Label>
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
                    const urlInput = document.getElementById('coverImage') as HTMLInputElement;
                    if (urlInput) urlInput.value = '';
                  }}
                />
                <Label htmlFor="imageFileOption" className="ml-2">Upload File</Label>
              </div>
            </div>
            {imageOption === 'url' ? (
              <div className="space-y-2">
                <Input
                  id="coverImage"
                  name="coverImage"
                  defaultValue={initialData?.coverImage}
                  placeholder="Enter cover image URL"
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
                    alt="Cover preview"
                    className="max-w-[200px] max-h-[200px] object-contain hidden"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="sticky bottom-0 bg-white pt-4 dark:bg-gray-950">
            <DialogFooter>
              <Button type="submit">{mode === 'add' ? 'Add Book' : 'Save Changes'}</Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
