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

interface AuthorDto { _id: string; name: string; slug: string }
interface CategoryDto { slug: string; name: string; subcategories?: { slug: string; name: string }[] }

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
  const [authors, setAuthors] = useState<AuthorDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | undefined>(initialData?.authorId);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.category || '');
  const [availableSubcategories, setAvailableSubcategories] = useState<Array<{ slug: string; name: string }>>([]);
  const [imageOption, setImageOption] = useState<'url' | 'file'>(initialData?.imageFile ? 'file' : 'url');
  const [previewUrl, setPreviewUrl] = useState<string>(initialData?.coverImage || '');
  const ageOptions = [
    { value: '0-2', label: '0-2' },
    { value: '3-5', label: '3-5' },
    { value: '6-8', label: '6-8' },
    { value: '9-12', label: '9-12' },
    { value: 'teen', label: 'Teen' },
    { value: 'young-adult', label: 'Young Adult' },
    { value: 'old-man', label: 'Old Man' },
  ];
  const genreOptions = [
    { value: 'biography-memoir', label: 'Biography & Memoir' },
    { value: 'business', label: 'Business' },
    { value: 'historic-fiction', label: 'Historic Fiction' },
    { value: 'mega-comic', label: 'Mega Comic' },
    { value: 'mystery-thriller', label: 'Mystery Thriller' },
    { value: 'occult-paranormal', label: 'Occult & Paranormal' },
    { value: 'romance', label: 'Romance' },
    { value: 'self', label: 'Self' },
  ];

  // Reset dialog-local state when opening or when initialData changes
  useEffect(() => {
    if (open) {
      setSelectedAuthorId(initialData?.authorId);
      setSelectedCategory(initialData?.category || '');
      setImageOption(initialData?.imageFile ? 'file' : 'url');
      setPreviewUrl(initialData?.coverImage || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData]);

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(cat => cat.slug === selectedCategory);
      setAvailableSubcategories(category?.subcategories || []);
    } else {
      setAvailableSubcategories([]);
    }
  }, [selectedCategory]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // authors
        const ares = await fetch('/api/authors?limit=100', { cache: 'no-store' });
        const aj = await ares.json();
        if (mounted && aj?.success && Array.isArray(aj.data)) {
          setAuthors(aj.data.map((a: any) => ({ _id: a._id, name: a.name, slug: a.slug })));
          if (!initialData?.authorId && initialData?.author) {
            const found = aj.data.find((a: any) => a.name === initialData.author);
            if (found) setSelectedAuthorId(found._id);
          }
        }
        // categories
        const cres = await fetch('/api/categories', { cache: 'no-store' });
        const cj = await cres.json();
        if (mounted && cj?.success && Array.isArray(cj.data)) {
          setCategories(cj.data);
        }
      } catch {}
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const imageOption = formData.get('imageOption');
    
    let coverImage: string | undefined = undefined;
    if (imageOption === 'url') {
      const url = (formData.get('coverImage') as string || '').trim();
      if (url) {
        coverImage = url;
      } else {
        coverImage = undefined; // don't overwrite existing image with empty string
      }
    } else {
      const imageFile = formData.get('imageFile') as File;
      if (imageFile && imageFile.size > 0) {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
          const fd = new FormData();
          fd.append('image', imageFile);
          fd.append('folder', 'books');
          fd.append('publicId', `book_${Date.now()}`);
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: fd,
          });
          const data = await res.json();
          if (data?.success && data?.data?.url) {
            coverImage = data.data.url as string;
            setPreviewUrl(coverImage);
          } else {
            throw new Error(data?.message || 'Upload failed');
          }
        } catch (err) {
          // Fallback: leave coverImage empty; server accepts optional coverImage
          console.error('Book image upload failed:', err);
          coverImage = undefined;
        }
      }
    }

  const originalPrice = Math.round(Number(formData.get('originalPrice')) || 0);
    const discount = Number(formData.get('discount'));
  const finalPrice = Math.round(Number(formData.get('finalPrice')) || 0);

    const authorId = selectedAuthorId || (formData.get('authorId') as string | null) || undefined;
    const authorName = authorId ? (authors.find(a => a._id === authorId)?.name || '') : (formData.get('author') as string);

    const data = {
      title: formData.get('title'),
      author: authorName,
      authorId: authorId,
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
  ageGroup: formData.get('ageGroup') || undefined,
  genre: formData.get('genre') || undefined,
      rating: 0,
      reviewCount: 0,
  featured: false,
  anticipated: formData.get('anticipated') === 'on',
  newRelease: formData.get('newRelease') === 'on'
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
            <Label htmlFor="genre">Genre (optional)</Label>
            <Select name="genre" defaultValue={initialData?.genre}>
              <SelectTrigger>
                <SelectValue placeholder="Select genre (optional)" />
              </SelectTrigger>
              <SelectContent>
                {genreOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Select
              name="authorId"
              value={selectedAuthorId}
              onValueChange={(v) => setSelectedAuthorId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an author" />
              </SelectTrigger>
              <SelectContent>
                {authors.map((a) => (
                  <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedAuthorId && (
              <Input id="author" name="author" defaultValue={initialData?.author} placeholder="Or type author name" />
            )}
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
                    finalPriceInput.value = String(Math.round(finalPrice));
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
                      finalPriceInput.value = String(Math.round(finalPrice));
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
                defaultValue={initialData?.discountedPrice ? Math.round(initialData.discountedPrice) : (initialData?.price ? Math.round(initialData.price) : undefined)}
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
                  <SelectItem key={category.slug} value={category.slug}>
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
                  <SelectItem key={subcategory.slug} value={subcategory.slug}>
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
          <div className="space-y-2">
            <Label htmlFor="anticipated">Most Anticipated (optional)</Label>
            <div className="flex items-center gap-2">
              <input id="anticipated" name="anticipated" type="checkbox" aria-label="Most Anticipated" defaultChecked={!!initialData?.anticipated} />
              <span className="text-sm text-gray-600">Mark as most anticipated</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newRelease">New Release (optional)</Label>
            <div className="flex items-center gap-2">
              <input id="newRelease" name="newRelease" type="checkbox" aria-label="New Release" defaultChecked={!!initialData?.newRelease} />
              <span className="text-sm text-gray-600">Mark as newly released</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ageGroup">Age Group (optional)</Label>
            <Select name="ageGroup" defaultValue={initialData?.ageGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Select age group (optional)" />
              </SelectTrigger>
              <SelectContent>
                {ageOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
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
                  onChange={(e) => setPreviewUrl(e.target.value)}
                />
                {previewUrl && (
                  <div className="mt-4">
                    <img
                      alt="Cover preview"
                      src={previewUrl}
                      className="max-w-[200px] max-h-[200px] object-contain rounded"
                    />
                  </div>
                )}
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
                          setPreviewUrl(e.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div id="imagePreviewContainer" className="mt-4">
                  {(previewUrl || initialData?.coverImage) && (
                    <img
                      id="imagePreview"
                      alt="Cover preview"
                      src={(previewUrl || initialData?.coverImage) as string}
                      className="max-w-[200px] max-h-[200px] object-contain"
                    />
                  )}
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
