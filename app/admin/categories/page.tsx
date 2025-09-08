'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, BookOpen, ChevronRight } from 'lucide-react';
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
import { sampleBooks } from '@/lib/sampleData';

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
const initialCategories = Object.entries(categoriesMap).map(([category, subcategories]) => ({
  id: category,
  name: category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
  slug: category,
  description: `Collection of ${category.replace('-', ' ')} books`,
  booksCount: sampleBooks.filter(book => book.category === category).length,
  featured: true,
  image: `/genre/${category}.jpg`,
  subcategories: Array.from(subcategories).map(sub => ({
    id: sub,
    name: sub.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    slug: sub,
    description: `${sub.replace('-', ' ')} books`,
    booksCount: sampleBooks.filter(book => book.subcategory === sub).length,
  }))
}));

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  booksCount: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  booksCount: number;
  featured: boolean;
  image: string;
  subcategories: SubCategory[];
}

interface CategoryFormData {
  name: string;
  description: string;
  image: string;
  featured: boolean;
  parentCategory?: string;
}

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFormData | null>(null);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isSubcategory, setIsSubcategory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.subcategories.some(sub => 
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination logic
  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const categoryData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image') as string,
      featured: formData.get('featured') === 'true',
      parentCategory: formData.get('parentCategory') as string,
    };

    if (dialogMode === 'add') {
      if (isSubcategory && categoryData.parentCategory) {
        const newSubcategory: SubCategory = {
          id: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
          name: categoryData.name,
          slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
          description: categoryData.description,
          booksCount: 0,
        };

        setCategories(categories.map(cat => 
          cat.id === categoryData.parentCategory
            ? { ...cat, subcategories: [...cat.subcategories, newSubcategory] }
            : cat
        ));
        toast.success('Subcategory added successfully!');
      } else {
        const newCategory: Category = {
          id: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
          name: categoryData.name,
          slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
          description: categoryData.description,
          booksCount: 0,
          featured: categoryData.featured,
          image: categoryData.image,
          subcategories: [],
        };
        setCategories([...categories, newCategory]);
        toast.success('Category added successfully!');
      }
    } else if (selectedCategory) {
      // Handle edit mode
      if (isSubcategory && categoryData.parentCategory) {
        setCategories(categories.map(cat => {
          if (cat.id === categoryData.parentCategory) {
            return {
              ...cat,
              subcategories: cat.subcategories.map(sub =>
                sub.id === selectedCategory.name.toLowerCase().replace(/\s+/g, '-')
                  ? {
                      ...sub,
                      name: categoryData.name,
                      slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
                      description: categoryData.description,
                    }
                  : sub
              ),
            };
          }
          return cat;
        }));
      } else {
        setCategories(categories.map(cat =>
          cat.id === selectedCategory.name.toLowerCase().replace(/\s+/g, '-')
            ? {
                ...cat,
                name: categoryData.name,
                description: categoryData.description,
                image: categoryData.image,
                featured: categoryData.featured,
              }
            : cat
        ));
      }
      toast.success('Category updated successfully!');
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (categoryId: string, parentCategoryId?: string) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      if (parentCategoryId) {
        // Delete subcategory
        setCategories(categories.map(cat =>
          cat.id === parentCategoryId
            ? { ...cat, subcategories: cat.subcategories.filter(sub => sub.id !== categoryId) }
            : cat
        ));
      } else {
        // Delete main category
        setCategories(categories.filter(cat => cat.id !== categoryId));
      }
      toast.success('Category deleted successfully!');
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
        {currentCategories.map((category) => (
          <motion.div
            key={category.id}
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
                      onClick={() => handleDelete(category.id)}
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
                      key={sub.id}
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
                              name: sub.name,
                              description: sub.description,
                              image: '',
                              featured: false,
                              parentCategory: category.id
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
                          onClick={() => handleDelete(sub.id, category.id)}
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
        ))}
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
                      <SelectItem key={cat.id} value={cat.id}>
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
            {!isSubcategory && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    name="image"
                    defaultValue={selectedCategory?.image}
                    placeholder="Enter category image URL"
                    required
                  />
                </div>
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
              </>
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
