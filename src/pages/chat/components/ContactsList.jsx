import React from "react";
import ContactSearchBar from "./ContactSearchBar";
import ContactCard from "./ContactCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ContactsList = ({
  searchQuery,
  setSearchQuery,
  filteredContacts,
  activeContact,
  handleContactSelect,
  handleRoleChange,
  role = "admin",
}) => {
  if (role == "tenant")
    filteredContacts = filteredContacts.filter(
      (contact) => contact.role === "admin"
    );

  if (role == "admin")
    filteredContacts = filteredContacts.filter(
      (contact) => contact.role === "tenant"
    );

  return (
    <div className="flex flex-col h-full">
      <ContactSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredContacts.length === 0 && (
            <p className="text-center text-muted-foreground align-middle">
              No Contacts
            </p>
          )}
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              activeContact={activeContact}
              handleContactSelect={handleContactSelect}
            />
          ))}
        </div>
      </ScrollArea>
      <div className="w-full p-2 border-t flex items-center gap-2">
        <div>Role: </div>
        <Select
          className="flex-1"
          value={role}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">
              <div className="size-4 rounded-full bg-linear-60 from-red-500 to-primary-400" />
              Admin
            </SelectItem>
            <SelectItem value="tenant">
              <div className="size-4 rounded-full bg-linear-60 from-violet-500 to-secondary-400" />
              Tenant
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ContactsList;
