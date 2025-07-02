import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const ContactSearchBar = ({ searchQuery, setSearchQuery }) => (
  <div className="p-4 border-b">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder="Search ..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  </div>
);

export default ContactSearchBar;
