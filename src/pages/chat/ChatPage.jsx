import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { emojis, mockContacts, mockMessages } from "@/data";
import ChatArea from "./components/ChatArea";
import ContactsList from "./components/ContactsList";



const ChatPage = () => {
  const [contacts] = useState(mockContacts);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [role, setRole] = useState("admin");

  const isMobile = useIsMobile();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto scroll to most recent message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeContact]);

  const handleContactSelect = (contact) => {
    setActiveContact(contact);
    if (isMobile) setIsSheetOpen(false);
  };

  const handleSendMessage = () => {
    if (!activeContact || !newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: "self",
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), message],
    }));

    setNewMessage("");
    setShowEmojiPicker(false);
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file || !activeContact) return;

    // Create image message
    const imageMessage = {
      id: Date.now(),
      sender: "self",
      text: "📷 Image",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "image",
      imageUrl: URL.createObjectURL(file),
    };

    setMessages((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), imageMessage],
    }));
  };

  return (
    <div className="flex h-screen bg-white">
      <title>Deniiz - Messaging</title>

      {/* Mobile Layout */}
      {isMobile ? (
        <>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <div className="flex-1 flex flex-col">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <h1 className="font-semibold">Chat</h1>
                <div className="w-10" /> {/* Spacer */}
              </div>

              <ChatArea
                activeContact={activeContact}
                messages={messages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSendMessage={handleSendMessage}
                showEmojiPicker={showEmojiPicker}
                setShowEmojiPicker={setShowEmojiPicker}
                emojis={emojis}
                handleEmojiSelect={handleEmojiSelect}
                fileInputRef={fileInputRef}
                handleImageUpload={handleImageUpload}
                messagesEndRef={messagesEndRef}
              />
            </div>

            <SheetContent side="left" className="w-80 p-0">
              <ContactsList
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredContacts={filteredContacts}
                activeContact={activeContact}
                handleContactSelect={handleContactSelect}
                handleRoleChange={setRole}
                role={role}
              />
            </SheetContent>
          </Sheet>
        </>
      ) : (
        /* Desktop Layout */
        <>
          <div className="w-80 border-r ">
            <ContactsList
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredContacts={filteredContacts}
              activeContact={activeContact}
              handleContactSelect={handleContactSelect}
            />
          </div>
          <ChatArea
            activeContact={activeContact}
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            emojis={emojis}
            handleEmojiSelect={handleEmojiSelect}
            fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload}
            messagesEndRef={messagesEndRef}
          />
        </>
      )}
    </div>
  );
};

export default ChatPage;
