'use client';

import { useEffect, useState } from 'react';
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

type Author = {
  _id?: string;
  id?: string;
  name: string;
  nationality?: string;
  biography?: string;
  profileImage?: string;
  featured?: boolean;
  books?: number;
  booksCount?: number;
};

const fetchAuthors = async (page = 1, limit = 10, search = '') => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  const res = await fetch(`/api/admin/authors?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}` , {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
};

const createAuthor = async (data: any) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  const res = await fetch('/api/admin/authors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  return res.json();
};

const updateAuthor = async (id: string, data: any) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  const res = await fetch(`/api/admin/authors?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  return res.json();
};

const deleteAuthor = async (id: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  const res = await fetch(`/api/admin/authors?id=${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
};

export default function AuthorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [authors, setAuthors] = useState<Author[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<any>(null);
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const loadAuthors = async () => {
    try {
      const result = await fetchAuthors(currentPage, itemsPerPage, searchTerm);
      if (result.success) {
        setAuthors(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.totalItems);
      } else {
        toast.error(result.message || 'Failed to load authors');
      }
    } catch (e) {
      toast.error('Failed to load authors');
    }
  };

  useEffect(() => {
    loadAuthors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  const filteredAuthors = authors; // server-side filtering already

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleAdd = () => {
    setMode('add');
    setSelectedAuthor(null);
    setDialogOpen(true);
  };

  const handleEdit = (author: Author) => {
    setMode('edit');
    setSelectedAuthor({
      id: author._id || author.id,
      name: author.name,
      nationality: author.nationality,
      biography: author.biography,
      featured: author.featured,
      profileImage: author.profileImage,
      books: author.books ?? author.booksCount ?? 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = (author: Author) => {
    setSelectedAuthor(author);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAuthor) return;
    const id = selectedAuthor._id || selectedAuthor.id;
    const res = await deleteAuthor(id);
    if (res.success) {
      toast.success('Author deleted successfully');
      setDeleteDialogOpen(false);
      loadAuthors();
    } else {
      toast.error(res.message || 'Delete failed');
    }
  };

  const handleSubmit = async (data: any) => {
    // Map dialog data to API payload
    const payload = {
      name: data.name,
      nationality: data.nationality,
      biography: data.biography,
      featured: !!data.featured,
      profileImage: data.profileImage || '',
    };

    if (mode === 'add') {
      const res = await createAuthor(payload);
      if (res.success) {
        toast.success('Author added successfully');
        setDialogOpen(false);
        loadAuthors();
      } else {
        toast.error(res.message || 'Add failed');
      }
    } else {
      const id = selectedAuthor?.id;
      const res = await updateAuthor(id, payload);
      if (res.success) {
        toast.success('Author updated successfully');
        setDialogOpen(false);
        loadAuthors();
      } else {
        toast.error(res.message || 'Update failed');
      }
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
            {filteredAuthors.map((author) => (
              <tr key={(author as any)._id || author.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{author.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{author.books ?? author.booksCount ?? 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{author.nationality || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{author.featured ? 'Yes' : 'No'}</td>
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
