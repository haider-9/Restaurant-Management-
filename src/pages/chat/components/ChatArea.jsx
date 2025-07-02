import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Video,
  Smile,
  Send,
  CheckCircle,
  Circle,
  Plus,
  MessageCircle,
  MessageCircleDashed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const ChatArea = ({
  activeContact,
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  emojis,
  handleEmojiSelect,
  fileInputRef,
  handleImageUpload,
  messagesEndRef,
}) => {

    const isMobile = useIsMobile();

  if (!activeContact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Messages</h3>
          <p className="text-gray-500">Click on a contact to view messages.</p>
          <Button className="bg-[#6640FF] mt-6" size="lg">
            <MessageCircleDashed className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 flex flex-col h-full", isMobile && "h-4/5")}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={activeContact.avatar} />
            <AvatarFallback>{activeContact.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{activeContact.name}</h3>
            <p className="text-sm text-gray-500">
              {activeContact.online ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea
        className="flex-1 p-4 pt-3 bg-gray-50"
        style={{ height: isMobile ? "calc(100vh - 500px)" : "calc(100vh - 210px)" }}
      >
        <div className="space-y-4">
          {messages[activeContact.id]?.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.sender === "self" ? "justify-end" : "justify-start"
              )}
            >
              <div className="flex flex-col">
                <div
                  className={cn(
                    "max-w-xs lg:max-w-md px-4 py-2 rounded-lg  break-all",
                    message.sender === "self"
                      ? "bg-secondary-200 text-black rounded-br-none"
                      : "bg-primary-100 text-gray-50 rounded-bl-none"
                  )}
                >
                  {message.type === "image" ? (
                    <div>
                      <img
                        src={message.imageUrl}
                        alt="Shared image"
                        className="rounded max-w-full h-auto mb-1"
                      />
                    </div>
                  ) : (
                    <div>
                      <p>{message.text}</p>
                    </div>
                  )}
                </div>
                <div
                  className={cn("flex items-center gap-2", {
                    "justify-end": message.sender === "self",
                    "justify-start": message.sender !== "self",
                  })}
                >
                  <p className="text-xs mt-1 text-muted-foreground">
                    {message.time}{" "}
                  </p>
                  <div className="text-secondary-400">
                    {message.sender === "self" ? (
                      message.seen ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      {/* Message Input */}
      <div className="p-4 bg-white border-t">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-2 p-2 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {emojis.map((emoji, index) => (
                <Button
                  variant="icon"
                  key={index}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-xl hover:bg-gray-200 p-1 rounded"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 border p-2 rounded-lg">
          <Button
            variant="secondary"
            size="icon"
            className="bg-secondary-500 hover:bg-secondary-400 text-white cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border-none shadow-none focus:ring-red-500"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-secondary-300 text-black"
          >
            Send
            <Send className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
