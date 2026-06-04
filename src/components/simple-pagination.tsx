import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext
} from "@/components/ui/pagination";

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange
}: SimplePaginationProps) {
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const pageNumbers = [];
  const maxPageLinks = 5; // Show max 5 page links around current page
  
  let startPage = Math.max(1, currentPage - Math.floor(maxPageLinks / 2));
  let endPage = Math.min(totalPages, startPage + maxPageLinks - 1);
  
  if (endPage - startPage + 1 < maxPageLinks) {
    startPage = Math.max(1, endPage - maxPageLinks + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            className={currentPage === 1 ? "pointer-events-none opacity-50 select-none" : "cursor-pointer"}
          />
        </PaginationItem>
        
        {startPage > 1 && (
          <>
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive={currentPage === 1}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(1);
                }}
                className="cursor-pointer"
              >
                1
              </PaginationLink>
            </PaginationItem>
            {startPage > 2 && (
              <PaginationItem>
                <span className="px-2 text-muted-foreground select-none">...</span>
              </PaginationItem>
            )}
          </>
        )}

        {pageNumbers.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href="#"
              isActive={currentPage === page}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page);
              }}
              className="cursor-pointer"
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <PaginationItem>
                <span className="px-2 text-muted-foreground select-none">...</span>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive={currentPage === totalPages}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(totalPages);
                }}
                className="cursor-pointer"
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
            className={currentPage === totalPages ? "pointer-events-none opacity-50 select-none" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
