'use client';

import { useState } from 'react';
import { Search, Star, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AdminPagination } from '@/components/ui/admin-pagination';
import { toast } from 'sonner';

const sampleReviews = [
  {
    id: 1,
    user: 'John Doe',
    book: 'Atomic Habits',
    rating: 5,
    comment: 'Excellent book that changed my life! Highly recommended for everyone.',
    date: '2025-09-07',
    status: 'Approved'
  },
  {
    id: 2,
    user: 'Jane Smith',
    book: 'The Midnight Library',
    rating: 4,
    comment: 'Very interesting concept and well written. Enjoyed reading it.',
    date: '2025-09-06',
    status: 'Pending'
  },
  {
    id: 3,
    user: 'Mike Johnson',
    book: 'Sapiens',
    rating: 5,
    comment: 'Fascinating journey through human history. Mind-blowing insights.',
    date: '2025-09-06',
    status: 'Approved'
  },
  {
    id: 4,
    user: 'Sarah Williams',
    book: 'Harry Potter',
    rating: 3,
    comment: 'Good but not as magical as the previous books in the series.',
    date: '2025-09-05',
    status: 'Flagged'
  },
];

export default function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [reviews, setReviews] = useState(sampleReviews);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editComment, setEditComment] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const openReview = (review: any) => {
    setSelectedReview(review);
    setEditComment(review.comment);
    setEditStatus(review.status);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedReview) return;
    setReviews(prev => prev.map(r => r.id === selectedReview.id ? { ...r, comment: editComment, status: editStatus } : r));
  setSelectedReview((prev: any) => ({ ...prev, comment: editComment, status: editStatus }));
    toast.success('Review updated');
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    if (selectedReview?.id === id) setDialogOpen(false);
    toast.success('Review deleted');
  };

  const filteredReviews = reviews.filter(review => 
    review.book.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.comment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredReviews.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReviews = filteredReviews.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'Flagged':
        return <Badge className="bg-red-500">Flagged</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${
              index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Reviews Management</h1>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search reviews..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Reviews Table (Column-wise) */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentReviews.map((review) => (
              <tr
                key={review.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => openReview(review)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{review.book}</div>
                    <div className="text-xs text-gray-500 line-clamp-1 max-w-[520px]">{review.comment}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.user}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">({review.rating}/5)</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(review.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => openReview(review)}>
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(review.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />

      {/* Review Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[700px] h-[90vh] max-h-[800px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>View and manage the selected review.</DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-500">Book</p>
                  <p className="font-semibold">{selectedReview.book}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">User</p>
                  <p className="font-semibold">{selectedReview.user}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Date</p>
                  <p className="font-semibold">{selectedReview.date}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Rating</p>
                  <div className="flex items-center space-x-2">
                    {renderStars(selectedReview.rating)}
                    <span className="text-sm text-gray-600">({selectedReview.rating}/5)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase text-gray-500">Status</p>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase text-gray-500">Comment</p>
                <Textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => selectedReview && handleDelete(selectedReview.id)}
                >
                  Delete Review
                </Button>
                <div className="space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
                  <Button type="button" onClick={handleSave}>Save Changes</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
