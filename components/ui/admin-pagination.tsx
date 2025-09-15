'use client';

import { useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: AdminPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="bg-white border-t border-gray-200">
      {/* Mobile Simple Pagination */}
      <div className="flex sm:hidden items-center justify-between px-3 py-2 gap-3 text-xs">
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          className={`px-2 h-7 rounded border text-[11px] font-medium ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          disabled={currentPage === 1}
        >Prev</button>
        <div className="flex flex-col items-center leading-tight">
          <span className="font-semibold">Page {currentPage} / {totalPages}</span>
          <span className="text-[10px] text-gray-500">{startItem}-{endItem} of {totalItems}</span>
        </div>
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          className={`px-2 h-7 rounded border text-[11px] font-medium ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          disabled={currentPage === totalPages}
        >Next</button>
      </div>

      {/* Desktop / Tablet Pagination */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 hidden sm:flex sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="text-sm text-gray-700 leading-4">Showing {startItem} to {endItem} of {totalItems} results</div>
        <div className="w-full sm:w-auto">
          <Pagination>
            <PaginationContent className="flex flex-nowrap gap-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50 min-w-[38px]' : 'cursor-pointer min-w-[38px]'}
                />
              </PaginationItem>
              {getVisiblePages().map((page, index) => (
                <PaginationItem key={index} className="flex-shrink-0">
                  {page === '...' ? (
                    <PaginationEllipsis className="px-2" />
                  ) : (
                    <PaginationLink
                      onClick={() => onPageChange(page as number)}
                      isActive={currentPage === page}
                      className="cursor-pointer min-w-[38px]"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50 min-w-[38px]' : 'cursor-pointer min-w-[38px]'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
