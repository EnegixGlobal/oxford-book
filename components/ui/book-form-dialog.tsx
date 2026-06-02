import { useState, useEffect, useMemo, useRef } from "react"
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
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { AuthorFormDialog } from "@/components/ui/author-form-dialog"

interface AuthorDto { _id: string; name: string; slug: string }
interface CategoryDto { slug: string; name: string; subcategories?: { slug: string; name: string }[] }

type Option = { value: string; label: string }

interface BookFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  initialData?: any
  onSubmit: (data: any) => void
  ageOptions?: Option[]
  genreOptions?: Option[]
}

export function BookFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
  ageOptions: customAgeOptions,
  genreOptions: customGenreOptions
}: BookFormDialogProps) {
  const [authors, setAuthors] = useState<AuthorDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | undefined>(initialData?.authorId);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.category || '');
  const [availableSubcategories, setAvailableSubcategories] = useState<Array<{ slug: string; name: string }>>([]);
  const [imageOption, setImageOption] = useState<'url' | 'file'>(initialData?.imageFile ? 'file' : 'url');
  const [previewUrl, setPreviewUrl] = useState<string>(initialData?.coverImage || '');
  const [authorDropdownOpen, setAuthorDropdownOpen] = useState(false);
  const [authorSearch, setAuthorSearch] = useState('');
  const [creatingAuthor, setCreatingAuthor] = useState(false);
  const [authorDialogOpen, setAuthorDialogOpen] = useState(false);
  const [authorDialogMode, setAuthorDialogMode] = useState<'add' | 'edit'>('add');
  
  // Dynamic binding states
  const [bindings, setBindings] = useState<Array<{ slug: string; name: string }>>([]);
  const [selectedBinding, setSelectedBinding] = useState<string>('paperback');
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false);
  const [newBindingName, setNewBindingName] = useState('');
  const [creatingBinding, setCreatingBinding] = useState(false);

  // Subcategory controlled state
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialData?.subcategory || '');

  // Controlled states for selects that don't bind to form data properly or are not reactive
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialData?.language || 'english');
  const [selectedGenre, setSelectedGenre] = useState<string>(initialData?.genre || '');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>(initialData?.ageGroup || '');
  const [selectedDiscountType, setSelectedDiscountType] = useState<string>(initialData?.discountType || 'percentage');

  // Dynamic language states
  const [languages, setLanguages] = useState<Array<{ slug: string; name: string }>>([]);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState('');
  const [creatingLanguage, setCreatingLanguage] = useState(false);

  const authorTriggerRef = useRef<HTMLButtonElement>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const resolvedAgeOptions = useMemo(() => {
    const base = (customAgeOptions || []).map(o => ({
      value: o.value,
      label: o.label
    }));
    if (initialData?.ageGroup && !base.some(o => o.value === initialData.ageGroup)) {
      return [...base, { value: initialData.ageGroup, label: initialData.ageGroup }];
    }
    return base;
  }, [customAgeOptions, initialData?.ageGroup]);

  const resolvedGenreOptions = useMemo(() => {
    const base = (customGenreOptions || []).map(o => ({
      value: o.value,
      label: o.label
    }));
    if (initialData?.genre && !base.some(o => o.value === initialData.genre)) {
      return [...base, { value: initialData.genre, label: initialData.genre }];
    }
    return base;
  }, [customGenreOptions, initialData?.genre]);

  // Reset dialog-local state when opening or when initialData changes
  useEffect(() => {
    if (open) {
      setSelectedAuthorId(initialData?.authorId);
      setSelectedCategory(initialData?.category || '');
      setSelectedSubcategory(initialData?.subcategory || '');
      setImageOption(initialData?.imageFile ? 'file' : 'url');
      setPreviewUrl(initialData?.coverImage || '');
      setSelectedBinding(initialData?.binding || 'paperback');
      setSelectedLanguage(initialData?.language || 'english');
      setSelectedGenre(initialData?.genre || '');
      setSelectedAgeGroup(initialData?.ageGroup || '');
      setSelectedDiscountType(initialData?.discountType || 'percentage');

      // Set initial discount type display
      setTimeout(() => {
        const discountType = initialData?.discountType || 'percentage';
        const discountTypeDiv = document.getElementById('discountTypeDiv');
        const discountAmountDiv = document.getElementById('discountAmountDiv');
        const discountInput = document.getElementById('discount') as HTMLInputElement;
        const discountAmountInput = document.getElementById('discountAmount') as HTMLInputElement;
        if (discountTypeDiv && discountAmountDiv) {
          if (discountType === 'percentage') {
            discountTypeDiv.style.display = 'block';
            discountAmountDiv.style.display = 'none';
            if (discountInput) discountInput.disabled = false;
            if (discountAmountInput) discountAmountInput.disabled = true;
          } else {
            discountTypeDiv.style.display = 'none';
            discountAmountDiv.style.display = 'block';
            if (discountInput) discountInput.disabled = true;
            if (discountAmountInput) discountAmountInput.disabled = false;
          }
        }
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData]);

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(cat => cat.slug === selectedCategory);
      const subcats = category?.subcategories || [];
      setAvailableSubcategories(subcats);
      
      // If the category was changed, reset subcategory unless it is in the new subcategories list
      if (!subcats.some(s => s.slug === selectedSubcategory)) {
        if (selectedCategory !== initialData?.category) {
          setSelectedSubcategory('');
        }
      }
    } else {
      setAvailableSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedCategory, categories]);

  // Focus the search input when the author popover opens
  useEffect(() => {
    if (authorDropdownOpen) {
      setTimeout(() => authorInputRef.current?.focus(), 0);
    }
  }, [authorDropdownOpen]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // authors
        const ares = await fetch('/api/authors?limit=all', { cache: 'no-store' });
        const aj = await ares.json();
        if (mounted && aj?.success && Array.isArray(aj.data)) {
          setAuthors(aj.data.map((a: any) => ({ _id: a._id, name: a.name, slug: a.slug })));
        }
        // categories
        const cres = await fetch('/api/categories', { cache: 'no-store' });
        const cj = await cres.json();
        if (mounted && cj?.success && Array.isArray(cj.data)) {
          setCategories(cj.data);
        }
        // bindings
        const bres = await fetch('/api/bindings', { cache: 'no-store' });
        const bj = await bres.json();
        if (mounted && bj?.success && Array.isArray(bj.data)) {
          setBindings(bj.data.map((b: any) => ({ slug: b.slug, name: b.name })));
        }
        // languages
        const lres = await fetch('/api/languages', { cache: 'no-store' });
        const lj = await lres.json();
        if (mounted && lj?.success && Array.isArray(lj.data)) {
          setLanguages(lj.data.map((l: any) => ({ slug: l.slug, name: l.name })));
        }
      } catch { }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Re-resolve selected author when initialData or authors change (for edit prefill)
  useEffect(() => {
    if (!initialData) return;
    if (initialData.authorId) {
      setSelectedAuthorId(String(initialData.authorId));
      return;
    }
    if (initialData.author && authors.length) {
      const target = String(initialData.author).trim().toLowerCase();
      const found = authors.find((a) => a.name.trim().toLowerCase() === target);
      if (found) {
        setSelectedAuthorId(found._id);
      }
    }
  }, [initialData, authors]);

  const selectedAuthor = useMemo(() => {
    const byId = selectedAuthorId ? authors.find((a) => a._id === selectedAuthorId) : undefined;
    if (byId) return byId;
    if (initialData?.author) return { _id: '', name: initialData.author, slug: '' };
    return undefined;
  }, [authors, initialData?.author, selectedAuthorId]);

  const handleQuickAddAuthor = () => {
    setAuthorDialogMode('add');
    setAuthorDialogOpen(true);
  };

  const handleAuthorDialogSubmit = async (data: any) => {
    setCreatingAuthor(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
      const res = await fetch('/api/admin/authors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: data.name,
          nationality: data.nationality || '',
          biography: data.biography || '',
          profileImage: data.profileImage || '',
          featured: !!data.featured,
        }),
      });
      const json = await res.json();
      if (!json?.success || !json?.data) {
        throw new Error(json?.message || 'Failed to create author');
      }
      const newAuthor = { _id: json.data._id, name: json.data.name, slug: json.data.slug };
      setAuthors((prev) => [newAuthor, ...prev]);
      setSelectedAuthorId(newAuthor._id);
      setAuthorDropdownOpen(false);
      setAuthorSearch('');
      toast.success('Author added');
      setAuthorDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add author');
    } finally {
      setCreatingAuthor(false);
    }
  };

  const handleQuickAddBindingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBindingName.trim()) {
      toast.error('Binding name is required');
      return;
    }
    setCreatingBinding(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
      const res = await fetch('/api/admin/bindings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: newBindingName.trim(),
        }),
      });
      const json = await res.json();
      if (!json?.success || !json?.data) {
        throw new Error(json?.message || 'Failed to create binding');
      }
      const newBinding = { slug: json.data.slug, name: json.data.name };
      setBindings((prev) => [...prev, newBinding]);
      setSelectedBinding(newBinding.slug);
      setNewBindingName('');
      toast.success('Binding added successfully');
      setBindingDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add binding');
    } finally {
      setCreatingBinding(false);
    }
  };

  const handleQuickAddLanguageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLanguageName.trim()) {
      toast.error('Language name is required');
      return;
    }
    setCreatingLanguage(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
      const res = await fetch('/api/admin/languages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: newLanguageName.trim(),
        }),
      });
      const json = await res.json();
      if (!json?.success || !json?.data) {
        throw new Error(json?.message || 'Failed to create language');
      }
      const newLang = { slug: json.data.slug, name: json.data.name };
      setLanguages((prev) => [...prev, newLang]);
      setSelectedLanguage(newLang.slug);
      setNewLanguageName('');
      toast.success('Language added successfully');
      setLanguageDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add language');
    } finally {
      setCreatingLanguage(false);
    }
  };

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
    const discountType = selectedDiscountType;
    const discount = Number(formData.get('discount')) || 0;
    const discountAmount = Number(formData.get('discountAmount')) || 0;
    const finalPrice = Math.round(Number(formData.get('finalPrice')) || 0);

    const authorId = selectedAuthorId || (formData.get('authorId') as string | null) || undefined;
    const authorName = authorId ? (authors.find(a => a._id === authorId)?.name || '') : (formData.get('author') as string || undefined);

    const data = {
      title: formData.get('title'),
      author: authorName || undefined,
      authorId: authorId,
      description: formData.get('description'),
      stock: formData.get('stock'),
      coverImage: coverImage,
      category: selectedCategory,
      subcategory: selectedSubcategory || undefined,
      inStock: Number(formData.get('stock')) > 0,
      mrp: originalPrice,
      discountedPrice: finalPrice,
      discount: discount,
      discountType: discountType,
      discountAmount: discountAmount,
      hsnCode: formData.get('hsnCode') || undefined,
      totalPages: formData.get('totalPages') ? Number(formData.get('totalPages')) : undefined,
      isbn: formData.get('isbn'),
      publisher: formData.get('publisher'),
      binding: selectedBinding,
      language: selectedLanguage,
      ageGroup: selectedAgeGroup || undefined,
      genre: selectedGenre || undefined,
      rating: 0,
      reviewCount: 0,
      featured: false,
      anticipated: formData.get('anticipated') === 'on',
      newRelease: formData.get('newRelease') === 'on',
      awardWinner: formData.get('awardWinner') === 'on',
      schoolLibrary: formData.get('schoolLibrary') === 'on'
    };
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1000px] md:max-w-[1200px] lg:max-w-[1400px] h-[90vh] max-h-[800px] flex flex-col">
          <DialogHeader>
            <DialogTitle>{mode === 'add' ? 'Add New Book' : 'Edit Book'}</DialogTitle>
            <DialogDescription>
              {mode === 'add' ? 'Add a new book to your inventory.' : 'Make changes to the book details.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-4 pl-2 pb-20">
            <div className="grid grid-cols-2 gap-4">
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
                <Select
                  name="genre"
                  value={selectedGenre}
                  onValueChange={setSelectedGenre}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {resolvedGenreOptions.length
                      ? resolvedGenreOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))
                      : (
                        <SelectItem disabled value="__no_genre__">No genres available</SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">

              {/* <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="author">Author</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleQuickAddAuthor}
                  disabled={creatingAuthor}
                >
                  <span className="mr-1">+</span>
                </Button>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Button
                    type="button"
                    ref={authorTriggerRef}
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !selectedAuthor && "text-muted-foreground"
                    )}
                    onClick={() => setAuthorDropdownOpen((prev) => !prev)}
                  >
                    {selectedAuthor ? selectedAuthor.name : "Select an author"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                  {authorDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                      <Command>
                        <CommandInput
                          ref={authorInputRef}
                          placeholder="Search author..."
                          autoFocus
                          value={authorSearch}
                          onValueChange={setAuthorSearch}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                        <CommandList className="max-h-64 overflow-auto">
                          <CommandEmpty>No author found.</CommandEmpty>
                          <CommandGroup>
                            {authors.map((author) => (
                              <CommandItem
                                key={author._id}
                                value={author.name}
                                keywords={[author.name, author.slug]}
                                onSelect={(value) => {
                                  const found = authors.find((a) => a.name === value);
                                  setSelectedAuthorId(found?._id);
                                  setAuthorDropdownOpen(false);
                                  setAuthorSearch('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedAuthorId === author._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {author.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>
                
              </div>
              <input
                type="hidden"
                name="authorId"
                value={selectedAuthorId || ""}
              /> */}
              {/* {!selectedAuthorId && (
                <Input id="author" name="author" defaultValue={initialData?.author} placeholder="Or type author name" className="mt-2" />
              )} */}
              {/* </div> */}
              <div className="space-y-2">
                <Label htmlFor="author">Author (optional)</Label>

                <div className="flex items-center gap-2">
                  {/* Searchable dropdown */}
                  <div className="relative flex-1">
                    <Button
                      type="button"
                      ref={authorTriggerRef}
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full h-9 justify-between text-sm",
                        !selectedAuthor && "text-muted-foreground"
                      )}
                      onClick={() => setAuthorDropdownOpen((prev) => !prev)}
                    >
                      {selectedAuthor ? selectedAuthor.name : "Select author"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>

                    {authorDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                        <Command>
                          <CommandInput
                            ref={authorInputRef}
                            placeholder="Search author..."
                            value={authorSearch}
                            onValueChange={setAuthorSearch}
                            className="h-9 text-sm"
                            autoFocus
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          <CommandList className="max-h-56 overflow-auto">
                            <CommandEmpty>No author found.</CommandEmpty>
                            <CommandGroup>
                              {authors.map((author) => (
                                <CommandItem
                                  key={author._id}
                                  value={author.name}
                                  keywords={[author.name, author.slug]}
                                  onSelect={(value) => {
                                    const found = authors.find((a) => a.name === value);
                                    setSelectedAuthorId(found?._id);
                                    setAuthorDropdownOpen(false);
                                    setAuthorSearch("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedAuthorId === author._id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {author.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </div>
                    )}
                  </div>

                  {/* Plus button */}
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleQuickAddAuthor}
                    disabled={creatingAuthor}
                    className="h-9 w-9"
                    title="Add new author"
                  >
                    +
                  </Button>
                </div>

                <input type="hidden" name="authorId" value={selectedAuthorId || ""} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  name="isbn"
                  defaultValue={initialData?.isbn}
                  placeholder="Enter ISBN (e.g., 9780123456472)"
                  required
                  maxLength={13}
                  pattern="^([0-9]{10}|[0-9]{13})$"
                  title="ISBN must be exactly 10 digits or 13 digits"
                  onChange={(e) => {
                    // Allow only digits
                    e.target.value = e.target.value.replace(/\D/g, "");
                  }}
                />

                <p className="text-sm text-gray-500 mt-1">
                  Enter a valid 10-digit or 13-digit ISBN (no hyphens).
                </p>
              </div>
            </div>
            {/* <div className="space-y-2">
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
          </div> */}


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
                    const discountTypeSelect = document.querySelector('[name="discountType"]') as HTMLSelectElement;
                    const discountInput = document.getElementById('discount') as HTMLInputElement;
                    const discountAmountInput = document.getElementById('discountAmount') as HTMLInputElement;
                    const finalPriceInput = document.getElementById('finalPrice') as HTMLInputElement;
                    if (finalPriceInput && originalPrice) {
                      const discountType = discountTypeSelect?.value || 'percentage';
                      let finalPrice = originalPrice;
                      if (discountType === 'percentage') {
                        const discount = parseFloat(discountInput?.value || '0') || 0;
                        finalPrice = originalPrice - (originalPrice * discount / 100);
                      } else {
                        const discountAmount = parseFloat(discountAmountInput?.value || '0') || 0;
                        finalPrice = originalPrice - discountAmount;
                      }
                      finalPriceInput.value = String(Math.round(Math.max(0, finalPrice)));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  name="discountType"
                  value={selectedDiscountType}
                  onValueChange={(value) => {
                    setSelectedDiscountType(value);
                    const originalPriceInput = document.getElementById('originalPrice') as HTMLInputElement;
                    const discountInput = document.getElementById('discount') as HTMLInputElement;
                    const discountAmountInput = document.getElementById('discountAmount') as HTMLInputElement;
                    const finalPriceInput = document.getElementById('finalPrice') as HTMLInputElement;
                    const discountTypeDiv = document.getElementById('discountTypeDiv');
                    const discountAmountDiv = document.getElementById('discountAmountDiv');

                    if (discountTypeDiv && discountAmountDiv) {
                      if (value === 'percentage') {
                        discountTypeDiv.style.display = 'block';
                        discountAmountDiv.style.display = 'none';
                        if (discountInput) discountInput.disabled = false;
                        if (discountAmountInput) discountAmountInput.disabled = true;
                      } else {
                        discountTypeDiv.style.display = 'none';
                        discountAmountDiv.style.display = 'block';
                        if (discountInput) discountInput.disabled = true;
                        if (discountAmountInput) discountAmountInput.disabled = false;
                      }
                    }

                    if (originalPriceInput && finalPriceInput) {
                      const originalPrice = parseFloat(originalPriceInput.value);
                      if (originalPrice) {
                        let finalPrice = originalPrice;
                        if (value === 'percentage') {
                          const discount = parseFloat(discountInput?.value || '0') || 0;
                          finalPrice = originalPrice - (originalPrice * discount / 100);
                        } else {
                          const discountAmount = parseFloat(discountAmountInput?.value || '0') || 0;
                          finalPrice = originalPrice - discountAmount;
                        }
                        finalPriceInput.value = String(Math.round(Math.max(0, finalPrice)));
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="amount">Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2" id="discountTypeDiv">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  defaultValue={initialData?.discount || (() => {
                    if (initialData?.mrp && initialData?.discountedPrice && initialData.mrp > 0) {
                      const pct = ((initialData.mrp - initialData.discountedPrice) / initialData.mrp * 100);
                      return Math.min(100, Math.max(0, pct)).toFixed(1);
                    }
                    return "0";
                  })()}
                  placeholder="Enter discount percentage"
                  onChange={(e) => {
                    const discount = parseFloat(e.target.value);
                    const originalPriceInput = document.getElementById('originalPrice') as HTMLInputElement;
                    const finalPriceInput = document.getElementById('finalPrice') as HTMLInputElement;
                    if (originalPriceInput && finalPriceInput) {
                      const originalPrice = parseFloat(originalPriceInput.value);
                      if (originalPrice) {
                        const finalPrice = originalPrice - (originalPrice * discount / 100);
                        finalPriceInput.value = String(Math.round(Math.max(0, finalPrice)));
                      }
                    }
                  }}
                />
              </div>
              <div className="space-y-2" id="discountAmountDiv" style={{ display: initialData?.discountType === 'amount' ? 'block' : 'none' }}>
                <Label htmlFor="discountAmount">Discount Amount (₹)</Label>
                <Input
                  id="discountAmount"
                  name="discountAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={initialData?.discountAmount || ((initialData?.mrp && initialData?.discountedPrice)
                    ? (initialData.mrp - initialData.discountedPrice).toFixed(2)
                    : "0")}
                  placeholder="Enter discount amount"
                  onChange={(e) => {
                    const discountAmount = parseFloat(e.target.value);
                    const originalPriceInput = document.getElementById('originalPrice') as HTMLInputElement;
                    const finalPriceInput = document.getElementById('finalPrice') as HTMLInputElement;
                    if (originalPriceInput && finalPriceInput) {
                      const originalPrice = parseFloat(originalPriceInput.value);
                      if (originalPrice) {
                        const finalPrice = originalPrice - discountAmount;
                        finalPriceInput.value = String(Math.round(Math.max(0, finalPrice)));
                      }
                    }
                  }}
                />
              </div>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                  value={selectedSubcategory}
                  onValueChange={setSelectedSubcategory}
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
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      name="binding"
                      value={selectedBinding}
                      onValueChange={setSelectedBinding}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select binding type" />
                      </SelectTrigger>
                      <SelectContent>
                        {bindings.length > 0 ? (
                          bindings.map((b) => (
                            <SelectItem key={b.slug} value={b.slug}>
                              {b.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem disabled value="__no_bindings__">
                            No bindings available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setBindingDialogOpen(true)}
                    className="h-9 w-9"
                    title="Add new binding"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hsnCode">HSN Code (optional)</Label>
                <Input
                  id="hsnCode"
                  name="hsnCode"
                  defaultValue={initialData?.hsnCode}
                  placeholder="Enter HSN code"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPages">Total Pages (optional)</Label>
                <Input
                  id="totalPages"
                  name="totalPages"
                  type="number"
                  min="0"
                  defaultValue={initialData?.totalPages}
                  placeholder="Enter total page count"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      name="language"
                      value={selectedLanguage}
                      onValueChange={setSelectedLanguage}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.length > 0 ? (
                          languages.map((l) => (
                            <SelectItem key={l.slug} value={l.slug}>
                              {l.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem disabled value="__no_languages__">
                            No languages available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setLanguageDialogOpen(true)}
                    className="h-9 w-9"
                    title="Add new language"
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ageGroup">Age Group (optional)</Label>
                <Select
                  name="ageGroup"
                  value={selectedAgeGroup}
                  onValueChange={setSelectedAgeGroup}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select age group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {resolvedAgeOptions.length
                      ? resolvedAgeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))
                      : (
                        <SelectItem disabled value="__no_age__">No age groups available</SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="awardWinner">Award Winner (optional)</Label>
                <div className="flex items-center gap-2">
                  <input id="awardWinner" name="awardWinner" type="checkbox" aria-label="Award Winner" defaultChecked={!!initialData?.awardWinner} />
                  <span className="text-sm text-gray-600">Mark as award winner</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolLibrary">School Library Book (optional)</Label>
                <div className="flex items-center gap-2">
                  <input id="schoolLibrary" name="schoolLibrary" type="checkbox" aria-label="School Library Book" defaultChecked={!!initialData?.schoolLibrary} />
                  <span className="text-sm text-gray-600">Mark as school library book</span>
                </div>
              </div>
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
            <div className=" bottom-0 bg-white pt-4 pr-12 dark:bg-gray-950">
              <DialogFooter>
                <Button type="submit">{mode === 'add' ? 'Add Book' : 'Save Changes'}</Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AuthorFormDialog
        open={authorDialogOpen}
        onOpenChange={setAuthorDialogOpen}
        mode={authorDialogMode}
        onSubmit={handleAuthorDialogSubmit}
      />
      <Dialog open={bindingDialogOpen} onOpenChange={setBindingDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick-Add Binding Type</DialogTitle>
            <DialogDescription>
              Create a new book binding option instantly. It will be added to the dropdown list.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickAddBindingSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newBindingName">Binding Name</Label>
              <Input
                id="newBindingName"
                value={newBindingName}
                onChange={(e) => setNewBindingName(e.target.value)}
                placeholder="e.g. Spiralbound, Board Book"
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBindingDialogOpen(false)}
                disabled={creatingBinding}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingBinding}>
                {creatingBinding ? 'Adding...' : 'Add Binding'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={languageDialogOpen} onOpenChange={setLanguageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick-Add Language</DialogTitle>
            <DialogDescription>
              Create a new book language option instantly. It will be added to the dropdown list.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickAddLanguageSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newLanguageName">Language Name</Label>
              <Input
                id="newLanguageName"
                value={newLanguageName}
                onChange={(e) => setNewLanguageName(e.target.value)}
                placeholder="e.g. Sanskrit, French, German"
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLanguageDialogOpen(false)}
                disabled={creatingLanguage}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingLanguage}>
                {creatingLanguage ? 'Adding...' : 'Add Language'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
