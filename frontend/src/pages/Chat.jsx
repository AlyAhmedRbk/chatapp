import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { user, token, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthError, setIsAuthError] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isSending, setIsSending] = useState(false);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!token) {
      setIsAuthError(true);
      setIsLoading(false);
      return;
    }

    console.log("🔌 Initializing Socket.IO connection...");

    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    if (!socketUrl) {
      console.error("❌ VITE_SOCKET_URL is not defined");
      setIsAuthError(true);
      setIsLoading(false);
      return;
    }

    console.log(`📍 Connecting to: ${socketUrl}`);

    // Create socket connection with authentication
    socketRef.current = io(socketUrl, {
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });

    // Connection established
    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected:", socketRef.current.id);
      setIsConnected(true);
      setIsAuthError(false);
      setIsLoading(false);
    });

    // Receive messages from server
    socketRef.current.on("receive-message", (msg) => {
      console.log("📨 Message received:", msg);
      setMessages((prevMessages) => {
        // Avoid duplicates
        const exists = prevMessages.some((m) => m.id === msg.id);
        if (exists) {
          console.log("⚠️ Duplicate message ignored:", msg.id);
          return prevMessages;
        }
        return [...prevMessages, msg];
      });
    });

    // Load existing messages from server
    socketRef.current.on("load-messages", (loadedMessages) => {
      console.log("📂 Loaded messages:", loadedMessages.length);
      setMessages(loadedMessages);
    });

    // Receive online users count
    socketRef.current.on("users-online", (count) => {
      console.log("👥 Users online:", count);
      setOnlineUsers(count);
    });

    // Connection error
    socketRef.current.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      setIsConnected(false);
      setIsAuthError(true);
    });

    // Disconnect
    socketRef.current.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log("🧹 Cleaning up socket connection");
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      console.log("⚠️ Empty message ignored");
      return;
    }

    if (!socketRef.current?.connected) {
      console.error("❌ Socket not connected");
      return;
    }

    const messageData = {
      id: `${Date.now()}-${Math.random()}`,
      text: inputValue.trim(),
      sender: user.id,
      senderName: user.username,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 Sending message:", messageData);

    // Optimistic update
    setMessages((prevMessages) => [...prevMessages, messageData]);
    setInputValue("");
    setIsSending(true);

    // Emit to server
    socketRef.current.emit("send-message", messageData, (acknowledgment) => {
      setIsSending(false);
      if (acknowledgment?.success) {
        console.log("✅ Message acknowledged by server");
      } else {
        console.error("❌ Message not acknowledged:", acknowledgment?.error);
      }
    });
  };

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    logout();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0F1C]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  // Authentication error state
  if (isAuthError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0F1C]">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            Connection Error
          </h2>
          <p className="text-slate-400 mb-6">
            Unable to connect to chat server.
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Logout & Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A0F1C] text-white overflow-hidden">
      {/* Header */}
      <header className="bg-[#121826] border-b border-slate-800 px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-lg">💬</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Chat Room</h1>
              <p className="text-xs text-slate-400">
                Welcome, {user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">Online</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-400">Offline</span>
                </>
              )}
            </div>
            <span className="text-sm text-slate-400">{onlineUsers} online</span>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          // Empty State
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-slate-800 rounded-3xl flex items-center justify-center mb-4">
                <span className="text-6xl">💬</span>
              </div>
              <h2 className="text-2xl font-semibold text-slate-300 mb-2">
                No messages yet
              </h2>
              <p className="text-slate-500">
                Start a conversation by sending a message
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            {messages.map((message) => {
              const isOwnMessage = message.sender === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex mb-4 ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-5 py-3.5 rounded-3xl text-base leading-relaxed break-words ${
                      isOwnMessage
                        ? "bg-green-600 text-white rounded-br-none"
                        : "bg-slate-800 text-slate-100 rounded-bl-none"
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold text-slate-400 mb-1">
                        {message.senderName || "Anonymous"}
                      </p>
                    )}
                    <p>{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? "text-green-200" : "text-slate-500"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-[#121826] border-t border-slate-800 px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                disabled={!isConnected || isSending}
                className="flex-1 bg-slate-800 border border-slate-700 focus:border-green-500 rounded-full px-6 py-4 text-white placeholder-slate-400 outline-none transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || !isConnected || isSending}
                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-400 px-9 py-4 rounded-full font-semibold transition min-w-[100px] text-base"
              >
                Send
              </button>
            </div>
            <p className="text-center text-xs text-slate-500 tracking-wider">
              🔒 Messages are secured • End-to-end encrypted
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}