'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, BookOpen, ChevronRight, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AdminPagination } from '@/components/ui/admin-pagination';

// API functions
const fetchCategories = async (page = 1, limit = 5, search = '') => {
  const token = localStorage.getItem('bookhaven-token');
  const response = await fetch(`/api/admin/categories?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

const createCategory = async (data: any) => {
  const token = localStorage.getItem('bookhaven-token');
  const response = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

const updateCategory = async (id: string, data: any) => {
  const token = localStorage.getItem('bookhaven-token');
  const response = await fetch(`/api/admin/categories?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

const deleteCategory = async (id: string, subcategoryId?: string) => {
  const token = localStorage.getItem('bookhaven-token');
  const url = subcategoryId
    ? `/api/admin/categories?id=${id}&subcategoryId=${subcategoryId}`
    : `/api/admin/categories?id=${id}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

const uploadImage = async (file: File) => {
  const token = localStorage.getItem('bookhaven-token');
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};

interface SubCategory {
  _id?: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  booksCount: number;
}

interface Category {
  _id?: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  booksCount: number;
  featured: boolean;
  image?: string;
  subcategories: SubCategory[];
}

interface CategoryFormData {
  id?: string;
  name: string;
  description: string;
  image?: string;
  featured: boolean;
  parentCategory?: string;
}

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFormData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubcategory, setIsSubcategory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const itemsPerPage = 5;

  // Fetch categories on mount and when dependencies change
  useEffect(() => {
    loadCategories();
  }, [currentPage, searchTerm]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const result = await fetchCategories(currentPage, itemsPerPage, searchTerm);
      if (result.success) {
        setCategories(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.totalItems);
      } else {
        toast.error(result.message || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Load categories error:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const result = await uploadImage(file);
      if (result.success) {
        setUploadedImageUrl(result.data.url);
        toast.success('Image uploaded successfully');
      } else {
        toast.error(result.message || 'Failed to upload image');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenDialog = (mode: 'add' | 'edit', category?: CategoryFormData | null, subcategory: boolean = false) => {
    setDialogMode(mode);
    setSelectedCategory(category || null);
    setIsSubcategory(subcategory);
    setUploadedImageUrl(category?.image || '');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const categoryData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: uploadedImageUrl || (formData.get('image') as string) || selectedCategory?.image || '',
      featured: formData.get('featured') === 'true',
      parentCategoryId: formData.get('parentCategory') as string,
      isSubcategory,
    };

    // Ensure image is always a string
    if (typeof categoryData.image !== 'string' || categoryData.image === '{}') {
      categoryData.image = '';
    }

    try {
      let result;
      if (dialogMode === 'add') {
        result = await createCategory(categoryData);
      } else {
        const categoryId = isSubcategory && categoryData.parentCategoryId
          ? categoryData.parentCategoryId
          : selectedCategory?.id;
        result = await updateCategory(categoryId!, {
          ...categoryData,
          subcategoryId: isSubcategory ? selectedCategory?.id : undefined
        });
      }

      if (result.success) {
        toast.success(dialogMode === 'add' ? 'Category created successfully!' : 'Category updated successfully!');
        setIsDialogOpen(false);
        setUploadedImageUrl(''); // Reset uploaded image URL
        loadCategories(); // Reload categories
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (categoryId: string, parentCategoryId?: string) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        const result = await deleteCategory(categoryId, parentCategoryId);
        if (result.success) {
          toast.success('Category deleted successfully!');
          loadCategories(); // Reload categories
        } else {
          toast.error(result.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Delete failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Categories Management</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => {
              setDialogMode('add');
              setSelectedCategory(null);
              setIsSubcategory(true);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subcategory
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              setDialogMode('add');
              setSelectedCategory(null);
              setIsSubcategory(false);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search categories and subcategories..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Display - Column Wise */}
      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'No categories match your search.' : 'Start by adding your first category.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => {
                setDialogMode('add');
                setSelectedCategory(null);
                setIsSubcategory(false);
                setIsDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Category
              </Button>
            )}
          </div>
        ) : (
          categories.map((category) => (
            <motion.div
              key={category._id || category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
            {/* Category Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{category.name}</h2>
                    <p className="text-purple-100 text-sm">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{category.booksCount}</div>
                    <div className="text-sm text-purple-100">Books</div>
                  </div>
                  {category.featured && (
                    <Badge className="bg-yellow-500 text-black">
                      Featured
                    </Badge>
                  )}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:bg-opacity-30"
                      onClick={() => {
                        setDialogMode('edit');
                        setSelectedCategory({
                          id: category._id || category.id,
                          name: category.name,
                          description: category.description,
                          image: category.image,
                          featured: category.featured
                        });
                        setIsSubcategory(false);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-500 border-red-500 text-white hover:bg-red-600"
                      onClick={() => handleDelete(category._id || category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Subcategories Grid */}
            {category.subcategories.length > 0 && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ChevronRight className="w-5 h-5 mr-2 text-purple-600" />
                  Subcategories ({category.subcategories.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.subcategories.map((sub) => (
                    <div
                      key={sub._id || sub.id || sub.slug}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{sub.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {sub.booksCount} books
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{sub.description}</p>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDialogMode('edit');
                            setSelectedCategory({
                              id: sub._id || sub.id,
                              name: sub.name,
                              description: sub.description,
                              image: sub.image || '',
                              featured: false,
                              parentCategory: category._id || category.id
                            });
                            setIsSubcategory(true);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(sub._id || sub.id, category._id || category.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State for Categories without Subcategories */}
            {category.subcategories.length === 0 && (
              <div className="p-6 text-center">
                <div className="text-gray-400 mb-4">
                  <BookOpen className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">No subcategories yet</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDialogMode('add');
                    setSelectedCategory(null);
                    setIsSubcategory(true);
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Subcategory
                </Button>
              </div>
            )}
          </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />

      {/* Category Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' 
                ? isSubcategory ? 'Add New Subcategory' : 'Add New Category'
                : isSubcategory ? 'Edit Subcategory' : 'Edit Category'
              }
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'add'
                ? isSubcategory 
                  ? 'Add a new subcategory to organize books within a category.'
                  : 'Add a new category to organize your books.'
                : 'Make changes to the existing category.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSubcategory && (
              <div className="space-y-2">
                <Label htmlFor="parentCategory">Parent Category</Label>
                <Select
                  name="parentCategory"
                  defaultValue={selectedCategory?.parentCategory}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id || cat.id} value={cat._id || cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">
                {isSubcategory ? 'Subcategory Name' : 'Category Name'}
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={selectedCategory?.name}
                placeholder={`Enter ${isSubcategory ? 'subcategory' : 'category'} name`}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={selectedCategory?.description}
                placeholder={`Enter ${isSubcategory ? 'subcategory' : 'category'} description`}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">{isSubcategory ? 'Subcategory Image' : 'Category Image'}</Label>
              <div className="space-y-2">
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="cursor-pointer"
                />
                {uploadingImage && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Uploading image...</span>
                  </div>
                )}
                {(uploadedImageUrl || selectedCategory?.image) && (
                  <div className="space-y-2">
                    <div className="relative inline-block">
                      <img
                        src={uploadedImageUrl || selectedCategory?.image}
                        alt={`${isSubcategory ? 'Subcategory' : 'Category'} preview`}
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => {
                          setUploadedImageUrl('');
                          const input = document.getElementById('image') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      type="hidden"
                      name="image"
                      value={uploadedImageUrl || selectedCategory?.image || ''}
                    />
                  </div>
                )}
              </div>
            </div>
            {!isSubcategory && (
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured Category</Label>
                <Switch
                  id="featured"
                  name="featured"
                  defaultChecked={selectedCategory?.featured}
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
            )}
            <DialogFooter>
              <Button type="submit">
                {dialogMode === 'add' 
                  ? isSubcategory ? 'Add Subcategory' : 'Add Category'
                  : 'Save Changes'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
