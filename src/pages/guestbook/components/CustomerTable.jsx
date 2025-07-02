import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export function CustomerTable({
  customers,
  onCustomerSelect,
  restartPagination = false,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (restartPagination) {
      setCurrentPage(1);
    }
  }, [restartPagination]);

  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = customers.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 3;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(currentPage - halfVisible, 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }

    if (totalPages > maxVisiblePages) {
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push("ellipsis");
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push("ellipsis");
        }
        pageNumbers.push(totalPages);
      }
    } else {
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="bg-white rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="*:text-muted-foreground">
            <TableHead>Customer Name</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Last Visited</TableHead>
            <TableHead>Customer Type</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentCustomers.map((customer) => (
            <TableRow
              key={customer.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onCustomerSelect(customer)}
            >
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{formatDate(customer.lastVisited)}</TableCell>
              <TableCell>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {customer.customerType}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
        <div className="text-sm text-muted-foreground w-full text-center sm:text-left">
          Showing data {startIndex + 1} to{" "}
          {startIndex + currentCustomers.length} of {customers.length} entries
        </div>
        <Pagination className="justify-center sm:justify-end">
          <PaginationContent className="gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePrevious}
                disabled={currentPage === 1}
                label=""
                className="bg-muted hover:bg-gray-200 cursor-pointer"
              />
            </PaginationItem>
            {getPageNumbers().map((pageNum, index) => (
              <PaginationItem key={index}>
                {pageNum === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                    className={cn(
                      "cursor-pointer bg-muted hover:bg-white",
                      currentPage === pageNum &&
                        "bg-violet text-white hover:bg-violet"
                    )}
                  >
                    {pageNum}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={handleNext}
                disabled={currentPage === totalPages}
                label=""
                className={cn("bg-muted hover:bg-gray-200 cursor-pointer")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
