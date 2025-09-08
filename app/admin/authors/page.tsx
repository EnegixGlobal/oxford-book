'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { AuthorFormDialog } from '@/components/ui/author-form-dialog';
import { AdminPagination } from '@/components/ui/admin-pagination';

const sampleAuthors = [
  { id: 1, name: 'James Clear', books: 15, nationality: 'American', featured: true },
  { id: 2, name: 'Matt Haig', books: 8, nationality: 'British', featured: true },
  { id: 3, name: 'Yuval Noah Harari', books: 5, nationality: 'Israeli', featured: true },
  { id: 4, name: 'J.K. Rowling', books: 12, nationality: 'British', featured: true },
];

export default function AuthorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [authors, setAuthors] = useState(sampleAuthors);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<any>(null);
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAuthors = authors.filter(author => 
    author.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredAuthors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAuthors = filteredAuthors.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAdd = () => {
    setMode('add');
    setSelectedAuthor(null);
    setDialogOpen(true);
  };

  const handleEdit = (author: any) => {
    setMode('edit');
    setSelectedAuthor(author);
    setDialogOpen(true);
  };

  const handleDelete = (author: any) => {
    setSelectedAuthor(author);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAuthor) {
      setAuthors(authors.filter(a => a.id !== selectedAuthor.id));
      toast.success("Author deleted successfully");
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = (data: any) => {
    if (mode === 'add') {
      setAuthors([...authors, data]);
      toast.success("Author added successfully");
    } else {
      setAuthors(authors.map(a => a.id === data.id ? data : a));
      toast.success("Author updated successfully");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Authors Management</h1>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Author
        </Button>

        {/* Author Form Dialog */}
        <AuthorFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={mode}
          initialData={selectedAuthor}
          onSubmit={handleSubmit}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedAuthor?.name} and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search authors..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Authors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Books</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nationality</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentAuthors.map((author) => (
              <tr key={author.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{author.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{author.books}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{author.nationality}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {author.featured ? 'Yes' : 'No'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(author)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(author)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}
