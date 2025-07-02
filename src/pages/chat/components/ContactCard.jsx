import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ContactCard = ({ contact, activeContact, handleContactSelect }) => (
  <div
    onClick={() => handleContactSelect(contact)}
    className={cn(
      "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 border-l-2 border-transparent transition-colors",
      activeContact?.id === contact.id &&
        "bg-secondary-100 border-secondary-300"
    )}
  >
    <div className="relative">
      <Avatar>
        <AvatarImage src={contact.avatar} />
        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
      </Avatar>
      {contact.online && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center">
        <p className="font-medium truncate">{contact.name}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">{contact.time}</span>
          {contact.unread > 0 && (
            <Badge
              variant="default"
              className="h-5 w-5 p-0 flex items-center justify-center text-xs aspect-square rounded-full bg-secondary-400"
            >
              {contact.unread > 0 ? contact.unread : ""}
            </Badge>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
    </div>
  </div>
);

export default ContactCard;
