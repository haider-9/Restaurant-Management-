import React, { useEffect, useState, useRef } from "react";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatLoaded, setIsChatLoaded] = useState(false);
  const [isAgentOnline, setIsAgentOnline] = useState(false);
  const [chatStatus, setChatStatus] = useState("Loading...");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Tawk.to configuration - but hidden widget
    const tawkToPropertyId = "685fb9ee0fa35a190e03d61b";
    const tawkToWidgetId = "1iuqusja9";

    // Set up Tawk_API before loading the script
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Hide the default widget
    window.Tawk_API.customStyle = {
      visibility: {
        desktop: {
          position: "br",
          xOffset: "-1000px", // Hide off-screen
          yOffset: "20px",
        },
        mobile: {
          position: "br",
          xOffset: "-1000px", // Hide off-screen
          yOffset: "20px",
        },
      },
    };

    window.Tawk_API.onLoad = function () {
      console.log("Tawk.to chat loaded successfully");

      // Hide the widget completely
      window.Tawk_API.hideWidget();

      // Set visitor attributes
      window.Tawk_API.setAttributes(
        {
          name: "Test User",
          email: "test@example.com",
          tenant: "Test Restaurant",
          role: "tenant-admin",
        },
        function (error) {
          if (error) {
            console.error("Error setting Tawk.to attributes:", error);
          } else {
            console.log("Tawk.to attributes set successfully");
          }
        }
      );

      setIsChatLoaded(true);
      setChatStatus("Chat Ready");
    };

    // Handle agent status changes
    window.Tawk_API.onStatusChange = function (status) {
      console.log("Agent status changed:", status);
      setIsAgentOnline(status === "online");
      setChatStatus(status === "online" ? "Agent Online" : "Agent Offline");
    };

    // Handle when chat is started
    window.Tawk_API.onChatStarted = function () {
      console.log("Chat conversation started");
      setChatStatus("Chat Active");
    };

    // Handle when agent joins the chat
    window.Tawk_API.onAgentJoinChat = function (data) {
      console.log("Agent joined chat:", data);
      setChatStatus(`Chatting with ${data.name}`);

      // Add system message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "system",
          message: `${data.name} joined the chat`,
          timestamp: new Date(),
        },
      ]);
    };

    // Handle incoming messages from agent - THIS IS KEY!
    window.Tawk_API.onChatMessageAgent = function (message) {
      console.log("New message from agent:", message);

      // Add agent message to your custom chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "agent",
          message: message.text || message,
          timestamp: new Date(),
          sender: message.author || "Support Agent",
        },
      ]);

      // Show notification
      showNotification("New message from support");
      setIsTyping(false);
    };

    // Handle when visitor sends a message
    window.Tawk_API.onChatMessageVisitor = function (message) {
      console.log("Message sent:", message);
    };

    // Handle agent typing
    window.Tawk_API.onAgentTyping = function () {
      setIsTyping(true);
    };

    // Handle when agent stops typing
    window.Tawk_API.onAgentStopTyping = function () {
      setIsTyping(false);
    };

    // Create and append the Tawk.to script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://embed.tawk.to/${tawkToPropertyId}/${tawkToWidgetId}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    script.onerror = function () {
      console.error("Failed to load Tawk.to chat widget");
      setIsChatLoaded(false);
      setChatStatus("Failed to Load");
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const existingScript = document.querySelector(
        `script[src*="embed.tawk.to"]`
      );
      if (existingScript) {
        existingScript.remove();
      }

      if (window.Tawk_API) {
        delete window.Tawk_API;
        delete window.Tawk_LoadStart;
      }
    };
  }, []);

  // Function to send message through Tawk.to API
  const sendMessage = async () => {
    if (!newMessage.trim() || !window.Tawk_API) return;

    const messageText = newMessage.trim();
    const messageObj = {
      id: Date.now(),
      type: "visitor",
      message: messageText,
      timestamp: new Date(),
      sender: "You",
    };

    // Add message to local state immediately
    setMessages((prev) => [...prev, messageObj]);
    setNewMessage("");

    try {
      // Send message through Tawk.to API
      window.Tawk_API.sendChatMessage(messageText);

      // If this is the first message, start the chat
      if (messages.length === 0) {
        window.Tawk_API.maximize();
        setTimeout(() => {
          window.Tawk_API.minimize();
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Update message status to show error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageObj.id ? { ...msg, error: true } : msg
        )
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Function to show notifications
  const showNotification = (message) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Diniiz Support", {
        body: message,
        icon: "/favicon.ico",
      });
    }
  };

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Function to send predefined messages
  const sendQuickMessage = (message) => {
    setNewMessage(message);
    setIsChatOpen(true);
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Support Chat</h1>
              <p className="text-sm text-gray-600">
                Real-time chat with support team
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isChatLoaded
                      ? isAgentOnline
                        ? "bg-green-500"
                        : "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-600">{chatStatus}</span>
              </div>
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isChatOpen ? "Close Chat" : "Open Chat"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            {isChatOpen ? (
              <div className="bg-white rounded-lg shadow-sm h-96 flex flex-col">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold">Support Chat</h3>
                        <p className="text-sm text-blue-100">
                          {isAgentOnline ? "Agent Online" : "Leave a message"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="text-white hover:text-blue-200"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <svg
                        className="w-12 h-12 mx-auto mb-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                        />
                      </svg>
                      <p>Start a conversation with our support team!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.type === "visitor"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === "visitor"
                              ? "bg-blue-600 text-white"
                              : message.type === "agent"
                              ? "bg-gray-200 text-gray-900"
                              : "bg-yellow-100 text-yellow-800 text-center text-sm"
                          } ${message.error ? "bg-red-500" : ""}`}
                        >
                          {message.type !== "system" && (
                            <p className="text-xs opacity-75 mb-1">
                              {message.sender}
                            </p>
                          )}
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <input
                      ref={chatInputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={!isChatLoaded}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!isChatLoaded || !newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Chat Status Card when closed */
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                    <svg
                      className="h-8 w-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                      ></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Live Support Chat
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Chat with our support team directly on this page!
                  </p>

                  {/* Status Indicator */}
                  <div
                    className={`rounded-lg p-4 mb-6 ${
                      isChatLoaded
                        ? isAgentOnline
                          ? "bg-green-50"
                          : "bg-yellow-50"
                        : "bg-red-50"
                    }`}
                  >
                    <h3
                      className={`font-medium mb-2 ${
                        isChatLoaded
                          ? isAgentOnline
                            ? "text-green-900"
                            : "text-yellow-900"
                          : "text-red-900"
                      }`}
                    >
                      Status: {chatStatus}
                    </h3>
                    <p
                      className={`text-sm ${
                        isChatLoaded
                          ? isAgentOnline
                            ? "text-green-800"
                            : "text-yellow-800"
                          : "text-red-800"
                      }`}
                    >
                      {isChatLoaded
                        ? isAgentOnline
                          ? "Support agents are online and ready to help!"
                          : "Support agents are currently offline. Leave a message and we'll get back to you."
                        : "Loading chat system..."}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsChatOpen(true)}
                    disabled={!isChatLoaded}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {isChatLoaded ? "Start Chatting" : "Loading..."}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Help */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Help
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() =>
                    sendQuickMessage("I need help with table management")
                  }
                  disabled={!isChatLoaded}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">
                    Table Management
                  </div>
                  <div className="text-xs text-gray-600">
                    Get help with floor layout
                  </div>
                </button>

                <button
                  onClick={() => sendQuickMessage("I have a technical issue")}
                  disabled={!isChatLoaded}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">
                    Technical Support
                  </div>
                  <div className="text-xs text-gray-600">
                    Report bugs or problems
                  </div>
                </button>

                <button
                  onClick={() =>
                    sendQuickMessage("I need help with my account settings")
                  }
                  disabled={!isChatLoaded}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">
                    Account Settings
                  </div>
                  <div className="text-xs text-gray-600">
                    Manage your profile
                  </div>
                </button>

                <button
                  onClick={() => sendQuickMessage("I want to provide feedback")}
                  disabled={!isChatLoaded}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">
                    Feedback
                  </div>
                  <div className="text-xs text-gray-600">
                    Share your thoughts
                  </div>
                </button>
              </div>
            </div>

            {/* Chat Statistics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Chat Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Messages</span>
                  <span className="text-sm font-medium text-gray-900">
                    {messages.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span
                    className={`text-sm font-medium ${
                      isAgentOnline ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {isAgentOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-medium text-gray-900">
                    {isAgentOnline ? "< 2 min" : "< 24 hrs"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Info */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Chat Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <h4 className="font-medium text-gray-900">Real-time</h4>
              <p className="text-sm text-gray-600">Instant messaging</p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                  ></path>
                </svg>
              </div>
              <h4 className="font-medium text-gray-900">Two-way Chat</h4>
              <p className="text-sm text-gray-600">On your website</p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-5 5v-5z"
                  ></path>
                </svg>
              </div>
              <h4 className="font-medium text-gray-900">Notifications</h4>
              <p className="text-sm text-gray-600">Desktop alerts</p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <h4 className="font-medium text-gray-900">24/7 Available</h4>
              <p className="text-sm text-gray-600">Always accessible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button (when chat is closed) */}
      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
              />
            </svg>
          </button>
          {messages.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {messages.filter((m) => m.type === "agent").length}
            </div>
          )}
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        /* Hide Tawk.to widget completely */
        div[id*="tawk"] {
          display: none !important;
        }

        /* Custom scrollbar for chat messages */
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 2px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        /* Animation for typing indicator */
        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        .animate-bounce {
          animation: bounce 1.4s infinite ease-in-out both;
        }
      `}</style>
    </div>
  );
};

export default Chat;
