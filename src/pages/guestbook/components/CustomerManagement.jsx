import { useState } from "react";
import { generateDummyCustomers } from "../data";
import { SearchAndFilters } from "./SearchAndFilter";
import { CustomerTable } from "./CustomerTable";
import { CustomerDetailsDialog } from "./CutomerDetailsDialog";

export function CustomerManagement() {
  const [customers] = useState(generateDummyCustomers(256));
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [lastVisitFilter, setLastVisitFilter] = useState("all");

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);

    const matchesClientType =
      clientTypeFilter === "all" || customer.customerType === clientTypeFilter;

    const matchesLastVisit =
      lastVisitFilter === "all" ||
      (lastVisitFilter === "recent" &&
        new Date(customer.lastVisited) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
      (lastVisitFilter === "old" &&
        new Date(customer.lastVisited) <=
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesClientType && matchesLastVisit;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-center grow">Guest Book</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Admin</span>
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <span className="text-sm">👤</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-background rounded-lg">
          <SearchAndFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            clientTypeFilter={clientTypeFilter}
            onClientTypeChange={setClientTypeFilter}
            lastVisitFilter={lastVisitFilter}
            onLastVisitChange={setLastVisitFilter}
          />

          <CustomerTable
            customers={filteredCustomers}
            onCustomerSelect={setSelectedCustomer}
            restartPagination={!!(searchTerm || clientTypeFilter !== "all" || lastVisitFilter !== "all")}
          />

          <CustomerDetailsDialog
            customer={selectedCustomer}
            open={!!selectedCustomer}
            onOpenChange={(open) => !open && setSelectedCustomer(null)}
          />
        </div>
      </div>
    </div>
  );
}
